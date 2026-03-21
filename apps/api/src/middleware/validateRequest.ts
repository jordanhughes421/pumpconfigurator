import type { Request, Response, NextFunction } from 'express';
import { CERTIFICATION_CODES, type CertificationCode } from '@magnum-opus/shared';

interface ValidationError {
  field: string;
  message: string;
}

const VALID_CERT_CODES = new Set<string>(CERTIFICATION_CODES);
const VALID_INSTALLATION_TYPES = new Set([
  'horizontal', 'vertical', 'inline', 'wet_pit', 'submersible', 'deep_well',
]);

export function validateSearchRequest(req: Request, res: Response, next: NextFunction): void {
  const errors: ValidationError[] = [];
  const body = req.body;

  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Request body is required' });
    return;
  }

  const { duty, constraints } = body;

  // --- Duty validation ---
  if (!duty || typeof duty !== 'object') {
    res.status(400).json({ error: 'duty object is required' });
    return;
  }

  if (typeof duty.flow_m3h !== 'number' || duty.flow_m3h <= 0) {
    errors.push({ field: 'duty.flow_m3h', message: 'Must be a positive number' });
  }
  if (typeof duty.head_m !== 'number' || duty.head_m <= 0) {
    errors.push({ field: 'duty.head_m', message: 'Must be a positive number' });
  }
  if (typeof duty.npsha_m !== 'number' || duty.npsha_m < 0) {
    errors.push({ field: 'duty.npsha_m', message: 'Must be a non-negative number' });
  }
  if (duty.fluid_sg !== undefined && (typeof duty.fluid_sg !== 'number' || duty.fluid_sg <= 0)) {
    errors.push({ field: 'duty.fluid_sg', message: 'Must be a positive number' });
  }
  if (duty.fluid_viscosity_cst !== undefined && (typeof duty.fluid_viscosity_cst !== 'number' || duty.fluid_viscosity_cst < 0)) {
    errors.push({ field: 'duty.fluid_viscosity_cst', message: 'Must be a non-negative number' });
  }
  if (duty.fluid_temperature_c !== undefined && typeof duty.fluid_temperature_c !== 'number') {
    errors.push({ field: 'duty.fluid_temperature_c', message: 'Must be a number' });
  }

  // --- Constraints validation ---
  if (!constraints || typeof constraints !== 'object') {
    res.status(400).json({ error: 'constraints object is required' });
    return;
  }

  if (constraints.installation_type !== undefined && !VALID_INSTALLATION_TYPES.has(constraints.installation_type)) {
    errors.push({
      field: 'constraints.installation_type',
      message: `Must be one of: ${[...VALID_INSTALLATION_TYPES].join(', ')}`,
    });
  }

  if (constraints.certifications !== undefined) {
    if (!Array.isArray(constraints.certifications)) {
      errors.push({ field: 'constraints.certifications', message: 'Must be an array' });
    } else {
      const invalid = constraints.certifications.filter((c: string) => !VALID_CERT_CODES.has(c));
      if (invalid.length > 0) {
        errors.push({
          field: 'constraints.certifications',
          message: `Invalid certification codes: ${invalid.join(', ')}`,
        });
      }
    }
  }

  if (errors.length > 0) {
    res.status(400).json({ error: 'Validation failed', details: errors });
    return;
  }

  // Apply defaults
  duty.fluid_sg ??= 1.0;
  duty.fluid_viscosity_cst ??= 1.0;
  duty.fluid_temperature_c ??= 20;
  duty.fluid_type ??= 'water';
  constraints.certifications ??= [];
  constraints.vfd ??= false;
  constraints.cmtr_level ??= 'none';

  next();
}
