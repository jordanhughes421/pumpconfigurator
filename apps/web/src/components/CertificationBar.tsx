import { CERTIFICATION_CODES, type CertificationCode } from '@magnum-opus/shared';
import { useProjectStore } from '../stores/projectStore';

const CERT_COLORS: Record<string, string> = {
  NSF61: 'blue', NSF372: 'blue', WRAS: 'blue',
  FM: 'red', UL448: 'red', NFPA20: 'red',
  ATEX: 'amber',
  BABA: 'green',
  API610: 'zinc', CRN: 'zinc', CE_PED: 'zinc',
  CMTR_31: 'slate', CMTR_32: 'slate', PMI: 'slate',
};

const CERT_NAMES: Record<string, string> = {
  NSF61: 'NSF/ANSI 61 — Drinking Water',
  NSF372: 'NSF/ANSI 372 — Lead Free',
  BABA: 'Build America, Buy America',
  FM: 'FM 1319 — Fire Pump',
  UL448: 'UL 448 — Fire Pump',
  API610: 'API 610 — Process Pump',
  ATEX: 'ATEX — Explosive Atmospheres',
  NFPA20: 'NFPA 20 — Fire Pump',
  CRN: 'CRN — Canada Registration',
  CE_PED: 'CE/PED — Pressure Equipment',
  WRAS: 'WRAS — Water Regulations',
  CMTR_31: 'CMTR 3.1 — Inspection Cert',
  CMTR_32: 'CMTR 3.2 — Test Cert',
  PMI: 'PMI — Material Identification',
};

function chipClasses(color: string, active: boolean): string {
  if (!active) return 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-500';
  switch (color) {
    case 'blue': return 'bg-blue-900/60 border-blue-700 text-blue-300';
    case 'red': return 'bg-red-900/60 border-red-700 text-red-300';
    case 'amber': return 'bg-amber-900/60 border-amber-700 text-amber-300';
    case 'green': return 'bg-green-900/60 border-green-700 text-green-300';
    default: return 'bg-zinc-700 border-zinc-600 text-zinc-300';
  }
}

interface Props {
  projectId: string;
  activeCerts: CertificationCode[];
}

export function CertificationBar({ projectId, activeCerts }: Props) {
  const updateProject = useProjectStore(s => s.updateProject);

  const toggle = (code: CertificationCode) => {
    const next = activeCerts.includes(code)
      ? activeCerts.filter(c => c !== code)
      : [...activeCerts, code];
    updateProject(projectId, { certifications: next });
  };

  return (
    <div className="flex flex-wrap gap-1.5 py-2">
      {CERTIFICATION_CODES.map(code => {
        const active = activeCerts.includes(code);
        const color = CERT_COLORS[code] || 'zinc';
        return (
          <button
            key={code}
            onClick={() => toggle(code)}
            title={CERT_NAMES[code] || code}
            className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${chipClasses(color, active)}`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
