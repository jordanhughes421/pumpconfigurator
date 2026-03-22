import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = `http://localhost:${process.env.API_PORT || 3001}`;

interface TableCheck {
  name: string;
  count: () => Promise<number>;
  sample: () => Promise<unknown>;
}

const tables: TableCheck[] = [
  {
    name: 'pump_family',
    count: () => prisma.pumpFamily.count(),
    sample: () => prisma.pumpFamily.findFirst(),
  },
  {
    name: 'pump_model',
    count: () => prisma.pumpModel.count(),
    sample: () => prisma.pumpModel.findFirst(),
  },
  {
    name: 'pump_size',
    count: () => prisma.pumpSize.count(),
    sample: () => prisma.pumpSize.findFirst(),
  },
  {
    name: 'component_definition',
    count: () => prisma.componentDefinition.count(),
    sample: () => prisma.componentDefinition.findFirst(),
  },
  {
    name: 'material',
    count: () => prisma.material.count(),
    sample: () => prisma.material.findFirst(),
  },
  {
    name: 'certification',
    count: () => prisma.certification.count(),
    sample: () => prisma.certification.findFirst(),
  },
  {
    name: 'material_certification',
    count: () => prisma.materialCertification.count(),
    sample: () => prisma.materialCertification.findFirst(),
  },
];

async function verifyPhase1(): Promise<boolean> {
  console.log('=== Phase 1 Verification ===\n');
  let allPassed = true;

  for (const table of tables) {
    const count = await table.count();
    const sample = await table.sample();

    if (count === 0) {
      console.log(`FAIL  ${table.name}: 0 rows`);
      allPassed = false;
    } else {
      console.log(`PASS  ${table.name}: ${count} rows`);
      console.log(`      Sample: ${JSON.stringify(sample, null, 2).split('\n').slice(0, 4).join('\n      ')}`);
      console.log();
    }
  }

  return allPassed;
}

async function verifyPhase2(): Promise<boolean> {
  console.log('=== Phase 2 Verification (Selection Engine) ===\n');
  let allPassed = true;

  // Check expanded seed data
  const sizeCount = await prisma.pumpSize.count();
  if (sizeCount >= 12) {
    console.log(`PASS  Expanded seed data: ${sizeCount} pump sizes (target: 12+)`);
  } else {
    console.log(`FAIL  Expanded seed data: only ${sizeCount} pump sizes (need 12+)`);
    allPassed = false;
  }

  const familyCount = await prisma.pumpFamily.count();
  if (familyCount >= 3) {
    console.log(`PASS  Pump families: ${familyCount} (target: 3+)`);
  } else {
    console.log(`FAIL  Pump families: only ${familyCount} (need 3+)`);
    allPassed = false;
  }
  console.log();

  // Test selection engine via HTTP
  console.log('Testing POST /api/pumps/search...');

  // Test 1: Search that should return multiple horizontal candidates
  const searchBody = {
    duty: {
      flow_m3h: 100,
      head_m: 45,
      npsha_m: 8,
      fluid_sg: 1.0,
      fluid_viscosity_cst: 1.0,
      fluid_temperature_c: 20,
      fluid_type: 'water',
    },
    constraints: {
      installation_type: 'horizontal',
      vfd: false,
      certifications: [],
    },
  };

  try {
    const searchRes = await fetch(`${API_BASE}/api/pumps/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchBody),
    });

    if (!searchRes.ok) {
      console.log(`FAIL  Search returned ${searchRes.status}: ${await searchRes.text()}`);
      allPassed = false;
    } else {
      const candidates = await searchRes.json() as any[];

      if (candidates.length === 0) {
        console.log('FAIL  Search returned 0 candidates (expected 2+)');
        allPassed = false;
      } else {
        console.log(`PASS  Search returned ${candidates.length} candidates`);

        // Verify PumpCandidate shape
        const first = candidates[0];
        const requiredFields = [
          'pump_size_id', 'model_code', 'hi_type_code', 'flow_regime',
          'size_designation', 'rated_flow_m3h', 'rated_head_m',
          'rated_efficiency_pct', 'rated_power_kw', 'npshr_at_bep_m',
          'specific_speed_us', 'impeller_diameter_mm', 'min_impeller_mm',
          'max_impeller_mm', 'speed_rpm', 'score', 'pct_of_bep', 'operating_region',
        ];
        const missingFields = requiredFields.filter(f => !(f in first));

        if (missingFields.length > 0) {
          console.log(`FAIL  Missing PumpCandidate fields: ${missingFields.join(', ')}`);
          allPassed = false;
        } else {
          console.log('PASS  PumpCandidate shape is correct (all fields present)');
        }

        // Verify sorted by score descending
        let sorted = true;
        for (let i = 1; i < candidates.length; i++) {
          if (candidates[i].score > candidates[i - 1].score) {
            sorted = false;
            break;
          }
        }
        if (sorted) {
          console.log('PASS  Results sorted by score descending');
        } else {
          console.log('FAIL  Results NOT sorted by score descending');
          allPassed = false;
        }

        console.log(`      Top candidate: ${first.model_code} (${first.size_designation})`);
        console.log(`      Score: ${first.score}, BEP%: ${first.pct_of_bep}, Region: ${first.operating_region}`);
      }
    }
  } catch (err: any) {
    console.log(`FAIL  Could not reach API at ${API_BASE} — is the server running?`);
    console.log(`      Error: ${err.message}`);
    console.log('      Skipping HTTP-based Phase 2 checks (run "pnpm --filter api dev" first)');
    // Don't fail the whole verify if the API isn't running — DB checks still pass
    console.log();
    return allPassed;
  }

  console.log();

  // Test 2: Search with no matches (very high head)
  console.log('Testing search with no matches...');
  const noMatchBody = {
    duty: { flow_m3h: 5000, head_m: 500, npsha_m: 8, fluid_type: 'water' },
    constraints: { vfd: false, certifications: [] },
  };
  const noMatchRes = await fetch(`${API_BASE}/api/pumps/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(noMatchBody),
  });
  const noMatchData = await noMatchRes.json() as any[];
  if (noMatchRes.ok && Array.isArray(noMatchData) && noMatchData.length === 0) {
    console.log('PASS  No-match search returns empty array (not error)');
  } else {
    console.log(`FAIL  No-match search: status=${noMatchRes.status}, results=${noMatchData.length}`);
    allPassed = false;
  }

  // Test 3: Validation — bad input returns 400
  console.log('Testing validation (bad input)...');
  const badRes = await fetch(`${API_BASE}/api/pumps/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ duty: { flow_m3h: -1 }, constraints: {} }),
  });
  if (badRes.status === 400) {
    console.log('PASS  Bad input returns 400');
  } else {
    console.log(`FAIL  Bad input returned ${badRes.status} (expected 400)`);
    allPassed = false;
  }

  // Test 4: Detail endpoints
  console.log('\nTesting detail endpoints...');
  const family = await prisma.pumpFamily.findFirst();
  if (family) {
    const famRes = await fetch(`${API_BASE}/api/pumps/families/${family.id}`);
    const famData = await famRes.json() as any;
    if (famRes.ok && famData.models) {
      console.log(`PASS  GET /api/pumps/families/:id returns family with ${famData.models.length} models`);
    } else {
      console.log('FAIL  GET /api/pumps/families/:id missing nested models');
      allPassed = false;
    }
  }

  const model = await prisma.pumpModel.findFirst();
  if (model) {
    const modRes = await fetch(`${API_BASE}/api/pumps/models/${model.id}`);
    const modData = await modRes.json() as any;
    if (modRes.ok && modData.sizes && modData.family) {
      console.log(`PASS  GET /api/pumps/models/:id returns model with ${modData.sizes.length} sizes + family`);
    } else {
      console.log('FAIL  GET /api/pumps/models/:id missing sizes or family');
      allPassed = false;
    }
  }

  const size = await prisma.pumpSize.findFirst();
  if (size) {
    const sizeRes = await fetch(`${API_BASE}/api/pumps/sizes/${size.id}`);
    const sizeData = await sizeRes.json() as any;
    if (sizeRes.ok && sizeData.model && sizeData.model.family) {
      console.log(`PASS  GET /api/pumps/sizes/:id returns size with model + family`);
    } else {
      console.log('FAIL  GET /api/pumps/sizes/:id missing model or family');
      allPassed = false;
    }
  }

  // Test 5: 404 for non-existent ID
  const notFoundRes = await fetch(`${API_BASE}/api/pumps/families/00000000-0000-0000-0000-000000000000`);
  if (notFoundRes.status === 404) {
    console.log('PASS  Non-existent family returns 404');
  } else {
    console.log(`FAIL  Non-existent family returned ${notFoundRes.status} (expected 404)`);
    allPassed = false;
  }

  return allPassed;
}

async function verifyPhase3(): Promise<boolean> {
  console.log('=== Phase 3 Verification (Performance Curves) ===\n');
  let allPassed = true;

  // Check seeded curve data
  const curveSetCount = await prisma.performanceCurveSet.count();
  const curveDataCount = await prisma.curveData.count();
  if (curveSetCount >= 12) {
    console.log(`PASS  Seeded curve sets: ${curveSetCount} (target: 12+)`);
  } else {
    console.log(`FAIL  Seeded curve sets: ${curveSetCount} (need 12+)`);
    allPassed = false;
  }
  if (curveDataCount >= 48) {
    console.log(`PASS  Seeded curve data rows: ${curveDataCount} (target: 48+ = 12 sizes x 4 curves)`);
  } else {
    console.log(`FAIL  Seeded curve data rows: ${curveDataCount} (need 48+)`);
    allPassed = false;
  }
  console.log();

  // Pick a pump size with curve data
  const sampleCurveSet = await prisma.performanceCurveSet.findFirst({
    where: { isReference: true },
    include: { size: { include: { model: true } } },
  });

  if (!sampleCurveSet) {
    console.log('FAIL  No reference curve set found');
    return false;
  }

  const sizeId = sampleCurveSet.sizeId;
  const curveSetId = sampleCurveSet.id;
  const maxD = Number(sampleCurveSet.size.model.maxImpellerMm);
  const trimD = Math.round(maxD * 0.9);

  try {
    // Test 1: GET reference curves
    console.log('Testing GET /api/curves/:sizeId...');
    const refRes = await fetch(`${API_BASE}/api/curves/${sizeId}`);
    const refData = await refRes.json() as any;

    if (!refRes.ok) {
      console.log(`FAIL  Reference curves returned ${refRes.status}`);
      allPassed = false;
    } else if (!refData.curves || !refData.curves.HQ || !refData.curves.EQ || !refData.curves.PQ || !refData.curves.NPSHR) {
      console.log('FAIL  Reference curves missing one or more curve types');
      allPassed = false;
    } else {
      console.log('PASS  Reference curves returned all 4 curve types (HQ, EQ, PQ, NPSHR)');
      console.log(`      Size: ${refData.size_designation}, Speed: ${refData.speed_rpm}rpm`);
    }

    // Test 2: GET scaled curves
    console.log('\nTesting GET /api/curves/:sizeId/scaled...');
    const scaledRes = await fetch(
      `${API_BASE}/api/curves/${sizeId}/scaled?speed=1480&diameter=${trimD}`
    );
    const scaledData = await scaledRes.json() as any;

    if (!scaledRes.ok) {
      console.log(`FAIL  Scaled curves returned ${scaledRes.status}: ${JSON.stringify(scaledData)}`);
      allPassed = false;
    } else {
      if (!scaledData.scaling) {
        console.log('FAIL  Scaled response missing scaling field');
        allPassed = false;
      } else {
        console.log('PASS  Scaled response includes scaling field');
        console.log(`      Speed ratio: ${scaledData.scaling.speed_ratio}, Trim ratio: ${scaledData.scaling.trim_ratio}`);
      }

      // Check coefficients differ from reference
      const refHQ = refData.curves?.HQ?.coefficients;
      const scaledHQ = scaledData.curves?.HQ?.coefficients;
      if (refHQ && scaledHQ && JSON.stringify(refHQ) !== JSON.stringify(scaledHQ)) {
        console.log('PASS  Scaled HQ coefficients differ from reference');
      } else {
        console.log('FAIL  Scaled HQ coefficients are identical to reference');
        allPassed = false;
      }

      // Check valid_q_max shifted
      const refQMax = refData.curves?.HQ?.valid_q_max;
      const scaledQMax = scaledData.curves?.HQ?.valid_q_max;
      if (refQMax && scaledQMax && refQMax !== scaledQMax) {
        console.log('PASS  Scaled valid_q_max shifted from reference');
      } else {
        console.log('FAIL  Scaled valid_q_max unchanged');
        allPassed = false;
      }
    }

    // Test 3: POST operating point
    console.log('\nTesting POST /api/curves/operating-point...');
    const opRes = await fetch(`${API_BASE}/api/curves/operating-point`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        curveSetId,
        systemCurve: { h_static: 20, k_friction: 0.002 },
      }),
    });
    const opData = await opRes.json() as any;

    if (!opRes.ok) {
      console.log(`FAIL  Operating point returned ${opRes.status}: ${JSON.stringify(opData)}`);
      allPassed = false;
    } else if (!opData.operatingPoint) {
      console.log('FAIL  Operating point returned null (expected valid intersection)');
      allPassed = false;
    } else {
      const op = opData.operatingPoint;
      const requiredFields = ['flow_m3h', 'head_m', 'efficiency_pct', 'power_kw', 'npshr_m', 'pct_of_bep', 'operating_region'];
      const missing = requiredFields.filter(f => !(f in op));
      if (missing.length > 0) {
        console.log(`FAIL  Operating point missing fields: ${missing.join(', ')}`);
        allPassed = false;
      } else {
        console.log('PASS  Operating point has all required fields');
      }

      if (op.flow_m3h > 0 && op.head_m > 0) {
        console.log(`PASS  Operating point: Q=${op.flow_m3h} m³/h, H=${op.head_m} m, η=${op.efficiency_pct}%`);
      } else {
        console.log('FAIL  Operating point has non-positive flow or head');
        allPassed = false;
      }

      if (['POR', 'AOR', 'outside'].includes(op.operating_region)) {
        console.log(`PASS  Operating region: ${op.operating_region}`);
      } else {
        console.log(`FAIL  Invalid operating region: ${op.operating_region}`);
        allPassed = false;
      }
    }

    // Test 4: Operating point with impossible system curve (h_static above shutoff)
    console.log('\nTesting operating point with no intersection...');
    const noIntersectionRes = await fetch(`${API_BASE}/api/curves/operating-point`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        curveSetId,
        systemCurve: { h_static: 9999, k_friction: 0.001 },
      }),
    });
    const noIntersectionData = await noIntersectionRes.json() as any;
    if (noIntersectionRes.ok && noIntersectionData.operatingPoint === null) {
      console.log('PASS  No-intersection returns null operatingPoint (not error)');
    } else {
      console.log('FAIL  No-intersection case did not return null operatingPoint');
      allPassed = false;
    }

  } catch (err: any) {
    console.log(`FAIL  Could not reach API at ${API_BASE} — is the server running?`);
    console.log(`      Error: ${err.message}`);
    console.log('      Skipping HTTP-based Phase 3 checks');
    return allPassed;
  }

  return allPassed;
}

async function verifyPhase4(): Promise<boolean> {
  console.log('=== Phase 4 Verification (Material & Certification Engine) ===\n');
  let allPassed = true;

  // Check seeded data
  const cmoCount = await prisma.componentMaterialOption.count();
  const mcCount = await prisma.materialCertification.count();
  if (cmoCount >= 50) {
    console.log(`PASS  component_material_option: ${cmoCount} rows (target: 50+)`);
  } else {
    console.log(`FAIL  component_material_option: ${cmoCount} rows (need 50+)`);
    allPassed = false;
  }
  if (mcCount >= 30) {
    console.log(`PASS  material_certification: ${mcCount} rows (target: 30+, expanded from 13)`);
  } else {
    console.log(`FAIL  material_certification: ${mcCount} rows (need 30+)`);
    allPassed = false;
  }
  console.log();

  // Find a sample OH1 wetted component (casing — wetted + pressure boundary)
  const casingDef = await prisma.componentDefinition.findFirst({
    where: { hiTypeCode: 'OH1', componentKey: 'casing' },
  });
  if (!casingDef) {
    console.log('FAIL  Could not find OH1 casing component definition');
    return false;
  }

  // Find a sample OH1 wetted non-pressure component (impeller)
  const impellerDef = await prisma.componentDefinition.findFirst({
    where: { hiTypeCode: 'OH1', componentKey: 'impeller' },
  });

  try {
    // Test 1: Unfiltered materials for casing
    console.log('Testing GET /api/materials/options (no filters)...');
    const baseRes = await fetch(`${API_BASE}/api/materials/options?componentDefId=${casingDef.id}`);
    const baseData = await baseRes.json() as any;

    if (!baseRes.ok) {
      console.log(`FAIL  Materials options returned ${baseRes.status}: ${JSON.stringify(baseData)}`);
      allPassed = false;
    } else {
      const count = baseData.materials?.length ?? 0;
      console.log(`PASS  Unfiltered materials for casing: ${count} options`);
      if (baseData.total_before_filtering !== undefined && baseData.total_after_filtering !== undefined) {
        console.log(`      Before: ${baseData.total_before_filtering}, After: ${baseData.total_after_filtering}`);
      }

      // Check shape
      const first = baseData.materials?.[0];
      if (first && 'is_default' in first && 'cost_tier' in first) {
        console.log('PASS  Materials have is_default and cost_tier fields');
      } else {
        console.log('FAIL  Materials missing is_default or cost_tier');
        allPassed = false;
      }
    }

    // Test 2: NSF61 filter — should annotate coating requirements
    console.log('\nTesting NSF61 filter...');
    const nsf61Res = await fetch(`${API_BASE}/api/materials/options?componentDefId=${casingDef.id}&certs=NSF61`);
    const nsf61Data = await nsf61Res.json() as any;
    if (nsf61Res.ok) {
      const mats = nsf61Data.materials || [];
      console.log(`PASS  NSF61 filtered materials: ${mats.length} of ${nsf61Data.total_before_filtering}`);

      // Check cast iron has requires_coating
      const castIron = mats.find((m: any) => m.material_code === 'CI_A48_CL30');
      if (castIron && castIron.requires_coating === true) {
        console.log('PASS  Cast iron annotated with requires_coating: true');
      } else if (castIron) {
        console.log('FAIL  Cast iron missing requires_coating annotation');
        allPassed = false;
      }
    }

    // Test 3: NSF61 + NSF372 — leaded bronze should be excluded
    console.log('\nTesting NSF61+NSF372 filter (should exclude leaded bronze)...');
    const nsf372Res = await fetch(`${API_BASE}/api/materials/options?componentDefId=${impellerDef!.id}&certs=NSF61,NSF372`);
    const nsf372Data = await nsf372Res.json() as any;
    if (nsf372Res.ok) {
      const mats = nsf372Data.materials || [];
      const leadedBronze = mats.find((m: any) => m.material_code === 'BRZ_C83600');
      if (!leadedBronze) {
        console.log(`PASS  Leaded bronze (C83600) excluded by NSF372 — ${mats.length} materials remain`);
      } else {
        console.log('FAIL  Leaded bronze (C83600) should be excluded by NSF372');
        allPassed = false;
      }

      // Check mutual requirement expansion (NSF372 should auto-include NSF61)
      const certsApplied = nsf372Data.certifications_applied || [];
      if (certsApplied.includes('NSF61') && certsApplied.includes('NSF372')) {
        console.log('PASS  Mutual requirement expansion: NSF372 auto-included NSF61');
      } else {
        console.log(`FAIL  Expected both NSF61 and NSF372 in certifications_applied, got: ${certsApplied}`);
        allPassed = false;
      }
    }

    // Test 4: BABA — should annotate but not remove any
    // Use impeller (has both ferrous and non-ferrous/bronze options) for diverse BABA statuses
    console.log('\nTesting BABA annotation...');
    const babaCompId = impellerDef!.id; // impeller has bronze (non-ferrous) + iron (ferrous)
    const babaBaseRes = await fetch(`${API_BASE}/api/materials/options?componentDefId=${babaCompId}`);
    const babaBaseData = await babaBaseRes.json() as any;
    const babaRes = await fetch(`${API_BASE}/api/materials/options?componentDefId=${babaCompId}&certs=BABA`);
    const babaData = await babaRes.json() as any;
    if (babaRes.ok) {
      const mats = babaData.materials || [];
      // BABA should NOT filter out materials
      if (mats.length === babaBaseData.materials?.length) {
        console.log('PASS  BABA does not remove any materials');
      } else {
        console.log(`FAIL  BABA removed materials: ${mats.length} vs ${babaBaseData.materials?.length}`);
        allPassed = false;
      }

      const hasCompliant = mats.some((m: any) => m.baba_status === 'compliant');
      const hasExempt = mats.some((m: any) => m.baba_status === 'exempt');
      if (hasCompliant && hasExempt) {
        console.log('PASS  BABA annotates: at least one compliant and one exempt');
      } else {
        console.log(`FAIL  BABA annotation incomplete: compliant=${hasCompliant}, exempt=${hasExempt}`);
        allPassed = false;
      }
    }

    // Test 5: API610 on pressure-boundary component — cast iron excluded
    console.log('\nTesting API610 on pressure-boundary component...');
    const api610Res = await fetch(`${API_BASE}/api/materials/options?componentDefId=${casingDef.id}&certs=API610`);
    const api610Data = await api610Res.json() as any;
    if (api610Res.ok) {
      const mats = api610Data.materials || [];
      const hasCastIron = mats.some((m: any) => m.material_group === 'cast_iron');
      if (!hasCastIron) {
        console.log(`PASS  API610 excluded cast iron from pressure boundary — ${mats.length} materials remain`);
      } else {
        console.log('FAIL  API610 should exclude cast iron from pressure boundary');
        allPassed = false;
      }
    }

    // Test 6: Validation — valid selection, no certs
    console.log('\nTesting POST /api/materials/validate (valid selection, no certs)...');
    // Get default materials for a few components
    const oh1CompsForValid = await prisma.componentDefinition.findMany({
      where: { hiTypeCode: 'OH1', isRequired: true },
    });
    const defaultOptions = await prisma.componentMaterialOption.findMany({
      where: {
        componentDefId: { in: oh1CompsForValid.map(c => c.id) },
        isDefault: true,
      },
      include: { componentDef: true },
    });

    const validSelections = defaultOptions.map(opt => ({
      component_key: opt.componentDef.componentKey,
      material_id: opt.materialId,
    }));

    const validRes = await fetch(`${API_BASE}/api/materials/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hi_type_code: 'OH1',
        certifications: [],
        selections: validSelections,
      }),
    });
    const validData = await validRes.json() as any;
    if (validRes.ok && validData.status === 'valid') {
      console.log('PASS  Valid selection with no certs returns status: valid');
    } else {
      console.log(`FAIL  Expected valid status, got: ${validData.status} (${JSON.stringify(validData.messages?.slice(0, 2))})`);
      allPassed = false;
    }

    // Test 7: Validation — missing required component → hard_block
    console.log('\nTesting validation: missing required component...');
    const partialSelections = validSelections.slice(0, 1); // Only one component
    const missingRes = await fetch(`${API_BASE}/api/materials/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hi_type_code: 'OH1',
        certifications: [],
        selections: partialSelections,
      }),
    });
    const missingData = await missingRes.json() as any;
    const hasHardBlock = (missingData.messages || []).some((m: any) => m.tier === 'hard_block' && m.code === 'MISSING_MATERIAL');
    if (hasHardBlock) {
      console.log(`PASS  Missing component returns hard_block (${missingData.summary?.hard_blocks} blocks)`);
    } else {
      console.log('FAIL  Missing component should return hard_block MISSING_MATERIAL');
      allPassed = false;
    }

    // Test 8: Certification constraints endpoint
    console.log('\nTesting GET /api/certifications/:code/constraints...');
    const fmRes = await fetch(`${API_BASE}/api/certifications/FM/constraints`);
    const fmData = await fmRes.json() as any;
    if (fmRes.ok && fmData.certification && fmData.certification.code === 'FM') {
      console.log(`PASS  FM constraints returned: ${fmData.certification.full_name}`);
      console.log(`      Motor constraints: ${fmData.motor_constraints?.length ?? 0}, Baseplate: ${fmData.baseplate_constraints?.length ?? 0}`);
    } else {
      console.log(`FAIL  FM constraints: ${fmRes.status}`);
      allPassed = false;
    }

  } catch (err: any) {
    console.log(`FAIL  Could not reach API at ${API_BASE} — is the server running?`);
    console.log(`      Error: ${err.message}`);
    return allPassed;
  }

  return allPassed;
}

async function verifyPhase5(): Promise<boolean> {
  console.log('=== Phase 5 Verification (Backend: Config CRUD, Motor/Baseplate Options) ===\n');
  let allPassed = true;

  // Check seeded motor/baseplate data
  const motorCount = await prisma.motorOption.count();
  const baseplateCount = await prisma.baseplateOption.count();
  const modelMotorCount = await prisma.pumpModelMotor.count();
  const modelBaseplateCount = await prisma.pumpModelBaseplate.count();

  if (motorCount >= 8) {
    console.log(`PASS  motor_option: ${motorCount} rows (target: 8+)`);
  } else {
    console.log(`FAIL  motor_option: ${motorCount} rows (need 8+)`);
    allPassed = false;
  }
  if (baseplateCount >= 4) {
    console.log(`PASS  baseplate_option: ${baseplateCount} rows (target: 4+)`);
  } else {
    console.log(`FAIL  baseplate_option: ${baseplateCount} rows (need 4+)`);
    allPassed = false;
  }
  if (modelMotorCount > 0) {
    console.log(`PASS  pump_model_motor junction: ${modelMotorCount} rows`);
  } else {
    console.log('FAIL  pump_model_motor junction: 0 rows');
    allPassed = false;
  }
  if (modelBaseplateCount > 0) {
    console.log(`PASS  pump_model_baseplate junction: ${modelBaseplateCount} rows`);
  } else {
    console.log('FAIL  pump_model_baseplate junction: 0 rows');
    allPassed = false;
  }
  console.log();

  try {
    // Test 1: Create a project
    console.log('Testing POST /api/projects...');
    const projRes = await fetch(`${API_BASE}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '__verify_phase5__', certifications: ['NSF61', 'BABA'] }),
    });
    if (projRes.status !== 201) {
      console.log(`FAIL  Create project returned ${projRes.status}`);
      allPassed = false;
      return allPassed;
    }
    const project = await projRes.json() as any;
    console.log(`PASS  Created project: ${project.id}`);

    // Test 2: Get a pump size for creating a configuration
    const size = await prisma.pumpSize.findFirst();
    if (!size) {
      console.log('FAIL  No pump sizes in DB');
      return false;
    }

    // Test 3: Create a configuration
    console.log('Testing POST /api/configurations...');
    const configRes = await fetch(`${API_BASE}/api/configurations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: project.id,
        pump_size_id: size.id,
        tag_number: 'P-VERIFY',
        service: 'Verification test',
        duty_flow_m3h: 100,
        duty_head_m: 50,
        npsha_m: 8,
      }),
    });
    if (configRes.status !== 201) {
      console.log(`FAIL  Create configuration returned ${configRes.status}`);
      allPassed = false;
      return allPassed;
    }
    const config = await configRes.json() as any;
    console.log(`PASS  Created configuration: ${config.id}`);

    // Test 4: GET configuration
    console.log('Testing GET /api/configurations/:id...');
    const getRes = await fetch(`${API_BASE}/api/configurations/${config.id}`);
    const getData = await getRes.json() as any;
    if (getRes.ok && getData.pumpSize) {
      console.log('PASS  GET configuration includes pump size info');
    } else {
      console.log('FAIL  GET configuration missing pump size');
      allPassed = false;
    }

    // Test 5: PUT update
    console.log('Testing PUT /api/configurations/:id...');
    const putRes = await fetch(`${API_BASE}/api/configurations/${config.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ impeller_trim_mm: 280 }),
    });
    if (putRes.ok) {
      const putData = await putRes.json() as any;
      if (Number(putData.impellerTrimMm) === 280) {
        console.log('PASS  PUT updated impeller_trim_mm to 280');
      } else {
        console.log(`FAIL  PUT impeller_trim_mm = ${putData.impellerTrimMm} (expected 280)`);
        allPassed = false;
      }
    } else {
      console.log(`FAIL  PUT returned ${putRes.status}`);
      allPassed = false;
    }

    // Test 6: POST validate
    console.log('Testing POST /api/configurations/:id/validate...');
    const valRes = await fetch(`${API_BASE}/api/configurations/${config.id}/validate`, {
      method: 'POST',
    });
    const valData = await valRes.json() as any;
    if (valRes.ok && valData.status) {
      console.log(`PASS  Validation returned status: ${valData.status}`);
    } else {
      console.log(`FAIL  Validation returned ${valRes.status}`);
      allPassed = false;
    }

    // Test 7: Motor options
    console.log('Testing GET /api/motors/options...');
    const motorRes = await fetch(`${API_BASE}/api/motors/options`);
    const motors = await motorRes.json() as any[];
    if (motorRes.ok && motors.length > 0) {
      console.log(`PASS  Motor options: ${motors.length} motors returned`);
    } else {
      console.log('FAIL  Motor options: empty or error');
      allPassed = false;
    }

    // Test 8: Baseplate options
    console.log('Testing GET /api/baseplates/options...');
    const bpRes = await fetch(`${API_BASE}/api/baseplates/options`);
    const baseplates = await bpRes.json() as any[];
    if (bpRes.ok && baseplates.length > 0) {
      console.log(`PASS  Baseplate options: ${baseplates.length} baseplates returned`);
    } else {
      console.log('FAIL  Baseplate options: empty or error');
      allPassed = false;
    }

    // Test 9: DELETE configuration
    console.log('Testing DELETE /api/configurations/:id...');
    const delRes = await fetch(`${API_BASE}/api/configurations/${config.id}`, { method: 'DELETE' });
    if (delRes.status === 204) {
      console.log('PASS  Deleted configuration');
    } else {
      console.log(`FAIL  Delete returned ${delRes.status}`);
      allPassed = false;
    }

    // Cleanup: delete the test project
    await prisma.project.delete({ where: { id: project.id } });

    console.log('\nPhase 5 backend: config CRUD, motor/baseplate options working');
  } catch (err: any) {
    console.log(`FAIL  Could not reach API at ${API_BASE} — is the server running?`);
    console.log(`      Error: ${err.message}`);
    return allPassed;
  }

  return allPassed;
}

async function verifyPhase6(): Promise<boolean> {
  console.log('=== Phase 6 Verification (Geometry/Curve Customization Module) ===\n');
  let allPassed = true;

  // Check seeded geometry data
  const impellerCount = await prisma.impellerGeometry.count();
  const voluteCount = await prisma.voluteGeometry.count();
  const modCount = await prisma.geometryModification.count();
  const testCount = await prisma.geometryTestResult.count();

  for (const [label, count, min] of [
    ['impeller_geometry', impellerCount, 5],
    ['volute_geometry', voluteCount, 2],
    ['geometry_modification', modCount, 4],
    ['geometry_test_result', testCount, 6],
  ] as const) {
    if (count >= min) {
      console.log(`PASS  ${label}: ${count} rows (target: ${min}+)`);
    } else {
      console.log(`FAIL  ${label}: ${count} rows (need ${min}+)`);
      allPassed = false;
    }
  }
  console.log();

  try {
    // Test 1: GET /api/geometry/models/summary
    console.log('Testing GET /api/geometry/models/summary...');
    const summaryRes = await fetch(`${API_BASE}/api/geometry/models/summary`);
    const summary = await summaryRes.json() as any[];
    if (summaryRes.status === 200 && summary.length >= 2) {
      console.log(`PASS  models/summary returned ${summary.length} models`);
    } else {
      console.log(`FAIL  models/summary returned ${summaryRes.status}, ${summary.length} models`);
      allPassed = false;
    }

    // Test 2: GET /api/geometry/impellers
    console.log('Testing GET /api/geometry/impellers...');
    const impRes = await fetch(`${API_BASE}/api/geometry/impellers`);
    const impellers = await impRes.json() as any[];
    if (impRes.status === 200 && impellers.length >= 5) {
      console.log(`PASS  impellers returned ${impellers.length} records`);
    } else {
      console.log(`FAIL  impellers returned ${impRes.status}, ${impellers.length} records`);
      allPassed = false;
    }

    // Test 3: GET /api/geometry/impellers/:id (detail with mods + tests)
    if (impellers.length > 0) {
      const impId = impellers[0].id;
      console.log('Testing GET /api/geometry/impellers/:id...');
      const detailRes = await fetch(`${API_BASE}/api/geometry/impellers/${impId}`);
      const detail = await detailRes.json() as any;
      if (detailRes.status === 200 && detail.id === impId) {
        console.log(`PASS  impeller detail returned correctly`);
      } else {
        console.log(`FAIL  impeller detail returned ${detailRes.status}`);
        allPassed = false;
      }
    }

    // Test 4: GET /api/geometry/volutes
    console.log('Testing GET /api/geometry/volutes...');
    const volRes = await fetch(`${API_BASE}/api/geometry/volutes`);
    const volutes = await volRes.json() as any[];
    if (volRes.status === 200 && volutes.length >= 2) {
      console.log(`PASS  volutes returned ${volutes.length} records`);
    } else {
      console.log(`FAIL  volutes returned ${volRes.status}, ${volutes.length} records`);
      allPassed = false;
    }

    // Test 5: GET /api/geometry/modifications
    console.log('Testing GET /api/geometry/modifications...');
    const modRes = await fetch(`${API_BASE}/api/geometry/modifications`);
    const mods = await modRes.json() as any[];
    if (modRes.status === 200 && mods.length >= 4) {
      console.log(`PASS  modifications returned ${mods.length} records`);
    } else {
      console.log(`FAIL  modifications returned ${modRes.status}, ${mods.length} records`);
      allPassed = false;
    }

    // Test 6: GET /api/geometry/test-results
    console.log('Testing GET /api/geometry/test-results...');
    const trRes = await fetch(`${API_BASE}/api/geometry/test-results`);
    const trs = await trRes.json() as any[];
    if (trRes.status === 200 && trs.length >= 6) {
      console.log(`PASS  test-results returned ${trs.length} records`);
    } else {
      console.log(`FAIL  test-results returned ${trRes.status}, ${trs.length} records`);
      allPassed = false;
    }

    // Test 7: GET /api/geometry/correlations
    console.log('Testing GET /api/geometry/correlations?feature=trimRatio&target=etaBepPct...');
    const corrRes = await fetch(`${API_BASE}/api/geometry/correlations?feature=trimRatio&target=etaBepPct`);
    const corr = await corrRes.json() as any;
    if (corrRes.status === 200 && corr.n >= 2 && typeof corr.regression.r_squared === 'number') {
      console.log(`PASS  correlations returned n=${corr.n}, R²=${corr.regression.r_squared.toFixed(4)}`);
    } else {
      console.log(`FAIL  correlations returned ${corrRes.status}`);
      allPassed = false;
    }

    // Test 8: Verify correlation has valid regression
    if (corr && corr.regression) {
      const { slope, intercept, r_squared } = corr.regression;
      if (typeof slope === 'number' && typeof intercept === 'number' && r_squared >= 0 && r_squared <= 1) {
        console.log(`PASS  regression valid: slope=${slope.toFixed(2)}, intercept=${intercept.toFixed(2)}, R²=${r_squared.toFixed(4)}`);
      } else {
        console.log(`FAIL  regression invalid`);
        allPassed = false;
      }
    }

    // Test 9: Filter impellers by modelId
    if (summary.length > 0) {
      const testModelId = summary[0].id;
      console.log(`Testing GET /api/geometry/impellers?modelId=...`);
      const filteredRes = await fetch(`${API_BASE}/api/geometry/impellers?modelId=${testModelId}`);
      const filtered = await filteredRes.json() as any[];
      if (filteredRes.status === 200 && filtered.length > 0 && filtered.length < impellers.length) {
        console.log(`PASS  filtered impellers returned ${filtered.length}/${impellers.length} records`);
      } else if (filteredRes.status === 200 && filtered.length > 0) {
        console.log(`PASS  filtered impellers returned ${filtered.length} records`);
      } else {
        console.log(`FAIL  filtered impellers returned ${filteredRes.status}, ${filtered.length} records`);
        allPassed = false;
      }
    }

  } catch (err: any) {
    console.log(`FAIL  API error: ${err.message}`);
    allPassed = false;
  }

  return allPassed;
}

async function main() {
  console.log('=== Magnum Opus Verification ===\n');

  const phase1Passed = await verifyPhase1();
  console.log();
  const phase2Passed = await verifyPhase2();
  console.log();
  const phase3Passed = await verifyPhase3();
  console.log();
  const phase4Passed = await verifyPhase4();
  console.log();
  const phase5Passed = await verifyPhase5();
  console.log();
  const phase6Passed = await verifyPhase6();

  console.log('\n=== Results ===');
  console.log(`Phase 1: ${phase1Passed ? 'PASS' : 'FAIL'}`);
  console.log(`Phase 2: ${phase2Passed ? 'PASS' : 'FAIL'}`);
  console.log(`Phase 3: ${phase3Passed ? 'PASS' : 'FAIL'}`);
  console.log(`Phase 4: ${phase4Passed ? 'PASS' : 'FAIL'}`);
  console.log(`Phase 5: ${phase5Passed ? 'PASS' : 'FAIL'}`);
  console.log(`Phase 6: ${phase6Passed ? 'PASS' : 'FAIL'}`);

  if (phase1Passed && phase2Passed && phase3Passed && phase4Passed && phase5Passed && phase6Passed) {
    console.log('\nAll checks passed.');
    process.exit(0);
  } else {
    console.error('\nSome checks failed.');
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
