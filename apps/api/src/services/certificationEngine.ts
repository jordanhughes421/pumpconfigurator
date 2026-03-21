// Certification Engine — Phase 4
// Handles certification metadata queries and mutual requirement expansion.

import { PrismaClient } from '@prisma/client';
import type { CertificationCode } from '@magnum-opus/shared';
import { CERTIFICATION_CODES } from '@magnum-opus/shared';

const prisma = new PrismaClient();

export interface CertificationDetail {
  code: string;
  full_name: string;
  category: string | null;
  description: string | null;
  is_material_constraining: boolean;
  is_sourcing_constraining: boolean;
  is_documentation_only: boolean;
  mutual_requirements: string | null;
}

export interface MotorConstraint {
  id: string;
  constraint_type: string;
  parameter: string;
  operator: string;
  value: unknown;
  description: string | null;
}

export interface BaseplateConstraint {
  id: string;
  constraint_type: string;
  parameter: string;
  operator: string;
  value: unknown;
  description: string | null;
}

/**
 * Get certification details + motor/baseplate constraints for a given cert code.
 */
export async function getCertificationConstraints(certCode: string): Promise<{
  certification: CertificationDetail;
  motor_constraints: MotorConstraint[];
  baseplate_constraints: BaseplateConstraint[];
} | null> {
  const cert = await prisma.certification.findUnique({
    where: { code: certCode },
    include: {
      motorConstraints: true,
      baseplateConstraints: true,
    },
  });

  if (!cert) return null;

  return {
    certification: {
      code: cert.code,
      full_name: cert.fullName,
      category: cert.category,
      description: cert.description,
      is_material_constraining: cert.isMaterialConstraining,
      is_sourcing_constraining: cert.isSourcingConstraining,
      is_documentation_only: cert.isDocumentationOnly,
      mutual_requirements: cert.mutualRequirements,
    },
    motor_constraints: cert.motorConstraints.map(mc => ({
      id: mc.id,
      constraint_type: mc.constraintType,
      parameter: mc.parameter,
      operator: mc.operator,
      value: mc.value,
      description: mc.description,
    })),
    baseplate_constraints: cert.baseplateConstraints.map(bc => ({
      id: bc.id,
      constraint_type: bc.constraintType,
      parameter: bc.parameter,
      operator: bc.operator,
      value: bc.value,
      description: bc.description,
    })),
  };
}

/**
 * Expand mutual requirements. E.g., NSF372 implies NSF61.
 * Returns a deduplicated list with all implied certs included.
 */
export async function getMutualRequirements(certCodes: CertificationCode[]): Promise<CertificationCode[]> {
  const expanded = new Set<CertificationCode>(certCodes);

  // Fetch mutual_requirements from DB for all requested certs
  const certs = await prisma.certification.findMany({
    where: { code: { in: certCodes } },
    select: { code: true, mutualRequirements: true },
  });

  for (const cert of certs) {
    if (cert.mutualRequirements) {
      // mutual_requirements is a comma-separated string of cert codes
      const reqs = cert.mutualRequirements.split(',').map(s => s.trim());
      for (const req of reqs) {
        if ((CERTIFICATION_CODES as readonly string[]).includes(req)) {
          expanded.add(req as CertificationCode);
        }
      }
    }
  }

  return Array.from(expanded);
}
