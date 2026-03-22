import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/motors/options — Filtered motor options
router.get('/options', async (req, res, next) => {
  try {
    const { modelId, minPowerKw, certs, vfd } = req.query;

    const where: any = {};

    if (minPowerKw !== undefined) {
      where.powerKw = { gte: Number(minPowerKw) };
    }

    // Certification filters
    if (certs) {
      const certList = (certs as string).split(',').map(s => s.trim());
      if (certList.includes('FM')) where.fmApproved = true;
      if (certList.includes('UL448')) where.ulListed = true;
      if (certList.includes('BABA')) where.domesticManufactured = true;
      if (certList.includes('ATEX')) where.hazardousClass = { not: null };
    }

    if (vfd === 'true') {
      where.isInverterDuty = true;
    }

    let motors;
    if (modelId) {
      // Only motors linked to this model
      const linked = await prisma.pumpModelMotor.findMany({
        where: { modelId: modelId as string },
        include: { motor: true },
      });
      motors = linked
        .map(l => l.motor)
        .filter(m => {
          if (where.powerKw?.gte && Number(m.powerKw) < where.powerKw.gte) return false;
          if (where.fmApproved && !m.fmApproved) return false;
          if (where.ulListed && !m.ulListed) return false;
          if (where.domesticManufactured && !m.domesticManufactured) return false;
          if (where.isInverterDuty && !m.isInverterDuty) return false;
          if (where.hazardousClass && !m.hazardousClass) return false;
          return true;
        });
    } else {
      motors = await prisma.motorOption.findMany({ where, orderBy: { powerKw: 'asc' } });
    }

    res.json(motors);
  } catch (err) { next(err); }
});

// GET /api/motors — All motors (unfiltered, for catalog view)
router.get('/', async (_req, res, next) => {
  try {
    const motors = await prisma.motorOption.findMany({ orderBy: { powerKw: 'asc' } });
    res.json(motors);
  } catch (err) { next(err); }
});

// POST /api/motors — Create a motor
router.post('/', async (req, res, next) => {
  try {
    const b = req.body;
    if (b.power_kw == null || b.speed_rpm == null || !b.voltage || !b.enclosure || !b.frame) {
      res.status(400).json({ error: 'power_kw, speed_rpm, voltage, enclosure, frame are required' });
      return;
    }
    const motor = await prisma.motorOption.create({
      data: {
        manufacturer: b.manufacturer ?? null,
        modelNumber: b.model_number ?? null,
        powerKw: b.power_kw,
        powerHp: b.power_hp ?? null,
        speedRpm: b.speed_rpm,
        poles: b.poles ?? Math.round(120 * (b.frequency_hz ?? 60) / b.speed_rpm),
        voltage: b.voltage,
        phase: b.phase ?? 3,
        frequencyHz: b.frequency_hz ?? 60,
        enclosure: b.enclosure,
        frame: b.frame,
        efficiencyClass: b.efficiency_class ?? null,
        fullLoadEfficiency: b.full_load_efficiency ?? null,
        serviceFactor: b.service_factor ?? 1.15,
        insulationClass: b.insulation_class ?? 'F',
        isInverterDuty: b.is_inverter_duty ?? false,
        mounting: b.mounting ?? null,
        weightKg: b.weight_kg ?? null,
        isVertical: b.is_vertical ?? false,
        isHollowShaft: b.is_hollow_shaft ?? false,
        isSubmersible: b.is_submersible ?? false,
        hazardousClass: b.hazardous_class ?? null,
        ulListed: b.ul_listed ?? false,
        fmApproved: b.fm_approved ?? false,
        domesticManufactured: b.domestic_manufactured ?? false,
      },
    });
    res.status(201).json(motor);
  } catch (err) { next(err); }
});

// PUT /api/motors/:id — Update a motor
router.put('/:id', async (req, res, next) => {
  try {
    const b = req.body;
    const data: any = {};
    if (b.manufacturer !== undefined) data.manufacturer = b.manufacturer;
    if (b.model_number !== undefined) data.modelNumber = b.model_number;
    if (b.power_kw !== undefined) data.powerKw = b.power_kw;
    if (b.power_hp !== undefined) data.powerHp = b.power_hp;
    if (b.speed_rpm !== undefined) data.speedRpm = b.speed_rpm;
    if (b.poles !== undefined) data.poles = b.poles;
    if (b.voltage !== undefined) data.voltage = b.voltage;
    if (b.phase !== undefined) data.phase = b.phase;
    if (b.frequency_hz !== undefined) data.frequencyHz = b.frequency_hz;
    if (b.enclosure !== undefined) data.enclosure = b.enclosure;
    if (b.frame !== undefined) data.frame = b.frame;
    if (b.efficiency_class !== undefined) data.efficiencyClass = b.efficiency_class;
    if (b.full_load_efficiency !== undefined) data.fullLoadEfficiency = b.full_load_efficiency;
    if (b.service_factor !== undefined) data.serviceFactor = b.service_factor;
    if (b.insulation_class !== undefined) data.insulationClass = b.insulation_class;
    if (b.is_inverter_duty !== undefined) data.isInverterDuty = b.is_inverter_duty;
    if (b.mounting !== undefined) data.mounting = b.mounting;
    if (b.weight_kg !== undefined) data.weightKg = b.weight_kg;
    if (b.is_vertical !== undefined) data.isVertical = b.is_vertical;
    if (b.is_hollow_shaft !== undefined) data.isHollowShaft = b.is_hollow_shaft;
    if (b.is_submersible !== undefined) data.isSubmersible = b.is_submersible;
    if (b.hazardous_class !== undefined) data.hazardousClass = b.hazardous_class;
    if (b.ul_listed !== undefined) data.ulListed = b.ul_listed;
    if (b.fm_approved !== undefined) data.fmApproved = b.fm_approved;
    if (b.domestic_manufactured !== undefined) data.domesticManufactured = b.domestic_manufactured;

    const motor = await prisma.motorOption.update({
      where: { id: req.params.id },
      data,
    });
    res.json(motor);
  } catch (err) { next(err); }
});

// DELETE /api/motors/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.motorOption.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
