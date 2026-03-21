// This service fetches curve data from the DB and delegates math to @magnum-opus/shared.
// It does NOT duplicate the math — it imports from shared.

import { PrismaClient } from '@prisma/client';
import type { CurveCoefficients, CurveSet, OperatingPoint } from '@magnum-opus/shared';
import { scaleCurveBySpeed, scaleCurveByTrim, computeFullOperatingPoint } from '@magnum-opus/shared';

const prisma = new PrismaClient();

/** Map a Prisma CurveData row to the shared CurveCoefficients interface */
function mapCurveData(row: {
  curveType: string;
  representation: string;
  coefficients: unknown;
  degree: number | null;
  knotsX: unknown;
  knotsY: unknown;
  dataPoints: unknown;
  validQMin: unknown;
  validQMax: unknown;
}): CurveCoefficients {
  return {
    curve_type: row.curveType as CurveCoefficients['curve_type'],
    representation: row.representation as CurveCoefficients['representation'],
    coefficients: row.coefficients as number[] | undefined,
    degree: row.degree ?? undefined,
    knots_x: row.knotsX as number[] | undefined,
    knots_y: row.knotsY as number[] | undefined,
    data_points: row.dataPoints as Array<{ Q: number; value: number }> | undefined,
    valid_q_min: Number(row.validQMin ?? 0),
    valid_q_max: Number(row.validQMax ?? 0),
  };
}

/** Fetch the reference curve set for a pump size, mapped to the shared CurveSet interface */
export async function getReferenceCurveSet(sizeId: string): Promise<CurveSet | null> {
  const curveSet = await prisma.performanceCurveSet.findFirst({
    where: { sizeId, isReference: true },
    include: { curves: true },
  });

  if (!curveSet || curveSet.curves.length === 0) return null;

  const curveMap = new Map<string, CurveCoefficients>();
  for (const row of curveSet.curves) {
    curveMap.set(row.curveType, mapCurveData(row));
  }

  const HQ = curveMap.get('HQ');
  const EQ = curveMap.get('EQ');
  const PQ = curveMap.get('PQ');
  const NPSHR = curveMap.get('NPSHR');

  if (!HQ || !EQ || !PQ || !NPSHR) return null;

  return {
    speed_rpm: curveSet.speedRpm,
    impeller_diameter_mm: Number(curveSet.impellerDiameterMm),
    HQ,
    EQ,
    PQ,
    NPSHR,
  };
}

/** Fetch reference curves and optionally scale by speed and/or diameter */
export async function getScaledCurveSet(
  sizeId: string,
  speed?: number,
  diameter?: number
): Promise<CurveSet | null> {
  let curveSet = await getReferenceCurveSet(sizeId);
  if (!curveSet) return null;

  if (speed !== undefined) {
    curveSet = scaleCurveBySpeed(curveSet, speed);
  }
  if (diameter !== undefined) {
    curveSet = scaleCurveByTrim(curveSet, diameter);
  }

  return curveSet;
}

/** Fetch curve set by curve set ID and solve the operating point */
export async function solveOperatingPoint(
  curveSetId: string,
  systemHStatic: number,
  systemK: number,
  speed?: number,
  diameter?: number
): Promise<{ operatingPoint: OperatingPoint | null; curveSet: CurveSet | null }> {
  const dbCurveSet = await prisma.performanceCurveSet.findUnique({
    where: { id: curveSetId },
    include: {
      curves: true,
      size: true,
    },
  });

  if (!dbCurveSet || dbCurveSet.curves.length === 0) {
    return { operatingPoint: null, curveSet: null };
  }

  const curveMap = new Map<string, CurveCoefficients>();
  for (const row of dbCurveSet.curves) {
    curveMap.set(row.curveType, mapCurveData(row));
  }

  const HQ = curveMap.get('HQ');
  const EQ = curveMap.get('EQ');
  const PQ = curveMap.get('PQ');
  const NPSHR = curveMap.get('NPSHR');

  if (!HQ || !EQ || !PQ || !NPSHR) {
    return { operatingPoint: null, curveSet: null };
  }

  let curveSet: CurveSet = {
    speed_rpm: dbCurveSet.speedRpm,
    impeller_diameter_mm: Number(dbCurveSet.impellerDiameterMm),
    HQ, EQ, PQ, NPSHR,
  };

  if (speed !== undefined) {
    curveSet = scaleCurveBySpeed(curveSet, speed);
  }
  if (diameter !== undefined) {
    curveSet = scaleCurveByTrim(curveSet, diameter);
  }

  const ratedFlow = dbCurveSet.size
    ? Number(dbCurveSet.size.ratedFlowM3h ?? 0)
    : undefined;

  const operatingPoint = computeFullOperatingPoint(
    curveSet,
    systemHStatic,
    systemK,
    ratedFlow || undefined
  );

  return { operatingPoint, curveSet };
}
