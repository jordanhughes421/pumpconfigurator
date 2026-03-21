import { PrismaClient, Prisma } from '@prisma/client';
import type { DutyPoint, SiteConstraints, PumpCandidate, HITypeCode, FlowRegime } from '@magnum-opus/shared';

const prisma = new PrismaClient();

const INSTALLATION_TO_ORIENTATION: Record<string, string> = {
  horizontal: 'horizontal',
  vertical: 'vertical',
  inline: 'inline',
  wet_pit: 'vertical',
  submersible: 'vertical',
  deep_well: 'vertical',
};

export async function findCandidates(
  duty: DutyPoint,
  constraints: SiteConstraints
): Promise<PumpCandidate[]> {
  // Step 1 — Query pump sizes within the operating envelope
  // Using $queryRaw because the compound join + range filter on both flow AND head
  // with multipliers is cleaner in SQL than chained Prisma where clauses across 3 relations.
  const dutyFlow = new Prisma.Decimal(duty.flow_m3h);
  const dutyHeadLow = new Prisma.Decimal(duty.head_m * 0.7);
  const dutyHeadHigh = new Prisma.Decimal(duty.head_m * 1.3);

  interface RawCandidate {
    size_id: string;
    model_code: string;
    hi_type_code: string;
    flow_regime: string;
    orientation: string;
    size_designation: string;
    rated_flow_m3h: Prisma.Decimal;
    rated_head_m: Prisma.Decimal;
    rated_efficiency: Prisma.Decimal | null;
    rated_power_kw: Prisma.Decimal | null;
    rated_npshr_m: Prisma.Decimal | null;
    specific_speed_us: Prisma.Decimal | null;
    impeller_diameter_mm: Prisma.Decimal;
    min_impeller_mm: Prisma.Decimal;
    max_impeller_mm: Prisma.Decimal;
    speed_rpm: number;
  }

  const raw = await prisma.$queryRaw<RawCandidate[]>`
    SELECT
      ps.id AS size_id,
      pm.model_code,
      pf.hi_type_code,
      pf.flow_regime,
      pf.orientation,
      ps.size_designation,
      ps.rated_flow_m3h,
      ps.rated_head_m,
      ps.rated_efficiency,
      ps.rated_power_kw,
      ps.rated_npshr_m,
      ps.specific_speed_us,
      ps.impeller_diameter_mm,
      pm.min_impeller_mm,
      pm.max_impeller_mm,
      ps.speed_rpm
    FROM pump_size ps
    JOIN pump_model pm ON ps.model_id = pm.id
    JOIN pump_family pf ON pm.family_id = pf.id
    WHERE ps.min_flow_m3h <= ${dutyFlow}
      AND ps.max_flow_m3h >= ${dutyFlow}
      AND ps.rated_head_m * 0.7 <= ${new Prisma.Decimal(duty.head_m)}
      AND ps.rated_head_m * 1.3 >= ${new Prisma.Decimal(duty.head_m)}
  `;

  // Step 2 — Filter by constraints
  let candidates = raw;

  if (constraints.installation_type) {
    const requiredOrientation = INSTALLATION_TO_ORIENTATION[constraints.installation_type];
    if (requiredOrientation) {
      candidates = candidates.filter(c => c.orientation === requiredOrientation);
    }
  }

  if (constraints.driver_speed_rpm) {
    candidates = candidates.filter(c => c.speed_rpm === constraints.driver_speed_rpm);
  }

  // Step 3 — Score and rank
  const scored: PumpCandidate[] = candidates.map(c => {
    const ratedFlow = Number(c.rated_flow_m3h);
    const ratedHead = Number(c.rated_head_m);
    const ratedEfficiency = Number(c.rated_efficiency ?? 0);
    const ratedPower = Number(c.rated_power_kw ?? 0);
    const ratedNpshr = Number(c.rated_npshr_m ?? 0);

    const pctOfBep = (duty.flow_m3h / ratedFlow) * 100;

    let operatingRegion: 'POR' | 'AOR' | 'outside';
    if (pctOfBep >= 80 && pctOfBep <= 110) {
      operatingRegion = 'POR';
    } else if (pctOfBep >= 70 && pctOfBep <= 120) {
      operatingRegion = 'AOR';
    } else {
      operatingRegion = 'outside';
    }

    let score = 100;
    if (operatingRegion === 'POR') score += 20;
    else if (operatingRegion === 'AOR') score += 5;
    else score -= 30;

    score += ratedEfficiency * 0.5;

    if (duty.npsha_m - ratedNpshr < 1.0) score -= 20;

    return {
      pump_size_id: c.size_id,
      model_code: c.model_code,
      hi_type_code: c.hi_type_code as HITypeCode,
      flow_regime: c.flow_regime as FlowRegime,
      size_designation: c.size_designation,
      rated_flow_m3h: ratedFlow,
      rated_head_m: ratedHead,
      rated_efficiency_pct: ratedEfficiency,
      rated_power_kw: ratedPower,
      npshr_at_bep_m: ratedNpshr,
      specific_speed_us: Number(c.specific_speed_us ?? 0),
      impeller_diameter_mm: Number(c.impeller_diameter_mm),
      min_impeller_mm: Number(c.min_impeller_mm),
      max_impeller_mm: Number(c.max_impeller_mm),
      speed_rpm: c.speed_rpm,
      score: Math.round(score * 100) / 100,
      pct_of_bep: Math.round(pctOfBep * 100) / 100,
      operating_region: operatingRegion,
    };
  });

  // Step 4 — Filter out score ≤ 0, sort descending
  return scored
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score);
}
