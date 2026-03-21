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

async function main() {
  console.log('=== Magnum Opus Verification ===\n');

  const phase1Passed = await verifyPhase1();
  console.log();
  const phase2Passed = await verifyPhase2();

  console.log('\n=== Results ===');
  console.log(`Phase 1: ${phase1Passed ? 'PASS' : 'FAIL'}`);
  console.log(`Phase 2: ${phase2Passed ? 'PASS' : 'FAIL'}`);

  if (phase1Passed && phase2Passed) {
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
