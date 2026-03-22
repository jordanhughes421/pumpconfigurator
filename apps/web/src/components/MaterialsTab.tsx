import { useEffect, useState, useCallback } from 'react';
import { apiGet, apiPost } from '../lib/api';
import { useConfigurationStore, type ConfigurationData } from '../stores/configurationStore';
import type { CertificationCode } from '@magnum-opus/shared';

interface ComponentDef {
  id: string;
  componentKey: string;
  displayName: string;
  displayOrder: number;
  isWetted: boolean;
  isPressureBoundary: boolean;
  isRequired: boolean;
}

interface MaterialOpt {
  id: string;
  material_code: string;
  common_name: string;
  specification: string | null;
  material_group: string;
  is_default: boolean;
  cost_tier: number;
  requires_coating?: boolean;
  baba_status?: string;
  galvanic_warning?: string;
}

interface MaterialOptionsResponse {
  materials: MaterialOpt[];
  total_before_filtering: number;
  total_after_filtering: number;
}

interface ValidationResult {
  status: string;
  messages: Array<{ tier: string; code: string; message: string; component_key?: string; suggestion?: string }>;
  summary: { hard_blocks: number; cert_blocks: number; warnings: number; advisories: number };
}

interface Props {
  config: ConfigurationData;
  certs: CertificationCode[];
}

export function MaterialsTab({ config, certs }: Props) {
  const hiType = config.pumpSize.model.family.hiTypeCode;
  const [components, setComponents] = useState<ComponentDef[]>([]);
  const [optionsMap, setOptionsMap] = useState<Record<string, MaterialOpt[]>>({});
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [invalidKeys, setInvalidKeys] = useState<Set<string>>(new Set());
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const { updateConfiguration } = useConfigurationStore();

  // Load component definitions
  useEffect(() => {
    apiGet<ComponentDef[]>(`/api/components?hiTypeCode=${hiType}`)
      .then(comps => {
        const sorted = comps.sort((a, b) => a.displayOrder - b.displayOrder);
        setComponents(sorted);
      });
  }, [hiType]);

  // Initialize selections from config
  useEffect(() => {
    const sel: Record<string, string> = {};
    for (const ms of config.materialSelections) {
      sel[ms.componentKey] = ms.materialId;
    }
    setSelections(sel);
  }, [config.materialSelections]);

  // Fetch material options for all components
  const fetchAllOptions = useCallback(async () => {
    if (components.length === 0) return;
    const certParam = certs.length > 0 ? `&certs=${certs.join(',')}` : '';
    const tempParam = config.fluidTempC ? `&tempC=${config.fluidTempC}` : '';
    const map: Record<string, MaterialOpt[]> = {};
    const newInvalid = new Set<string>();

    await Promise.all(components.map(async (comp) => {
      try {
        const data = await apiGet<MaterialOptionsResponse>(
          `/api/materials/options?componentDefId=${comp.id}${certParam}${tempParam}`
        );
        map[comp.componentKey] = data.materials;

        // Check if current selection is still valid
        const currentSel = selections[comp.componentKey];
        if (currentSel && !data.materials.some(m => m.id === currentSel)) {
          newInvalid.add(comp.componentKey);
        }
      } catch {
        map[comp.componentKey] = [];
      }
    }));

    setOptionsMap(map);
    setInvalidKeys(newInvalid);
  }, [components, certs, config.fluidTempC, selections]);

  useEffect(() => { fetchAllOptions(); }, [fetchAllOptions]);

  // Auto-select defaults for unset components
  useEffect(() => {
    if (Object.keys(optionsMap).length === 0) return;
    const newSel = { ...selections };
    let changed = false;
    for (const comp of components) {
      if (!newSel[comp.componentKey]) {
        const opts = optionsMap[comp.componentKey] || [];
        const def = opts.find(m => m.is_default) || opts[0];
        if (def) {
          newSel[comp.componentKey] = def.id;
          changed = true;
        }
      }
    }
    if (changed) setSelections(newSel);
  }, [optionsMap, components, selections]);

  const handleSelect = (componentKey: string, materialId: string) => {
    const newSel = { ...selections, [componentKey]: materialId };
    setSelections(newSel);
    setInvalidKeys(prev => { const s = new Set(prev); s.delete(componentKey); return s; });

    // Save to backend
    updateConfiguration(config.id, {
      material_selections: [{ component_key: componentKey, material_id: materialId }],
    });
  };

  const runValidation = async () => {
    const selArray = Object.entries(selections).map(([k, v]) => ({
      component_key: k,
      material_id: v,
    }));
    const result = await apiPost<ValidationResult>('/api/materials/validate', {
      hi_type_code: hiType,
      certifications: certs,
      selections: selArray,
    });
    setValidation(result);
  };

  return (
    <div>
      <div className="space-y-1">
        {components.map(comp => {
          const opts = optionsMap[comp.componentKey] || [];
          const selected = selections[comp.componentKey];
          const isInvalid = invalidKeys.has(comp.componentKey);

          return (
            <div
              key={comp.componentKey}
              className={`flex items-center gap-3 px-4 py-2 rounded ${
                isInvalid ? 'bg-red-900/20 border border-red-800' : 'bg-zinc-900 border border-zinc-800'
              }`}
            >
              <div className="w-48 flex-shrink-0">
                <span className="text-sm text-zinc-100">{comp.displayName}</span>
                <div className="flex gap-1 mt-0.5">
                  {comp.isWetted && <Badge text="wetted" color="blue" />}
                  {comp.isPressureBoundary && <Badge text="pressure" color="amber" />}
                </div>
              </div>

              <select
                value={selected || ''}
                onChange={e => handleSelect(comp.componentKey, e.target.value)}
                className="flex-1 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Select material --</option>
                {opts.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.common_name} {m.specification ? `(${m.specification})` : ''} — {'\u25CF'.repeat(m.cost_tier)}
                    {m.is_default ? ' [default]' : ''}
                  </option>
                ))}
              </select>

              <div className="w-32 flex-shrink-0 flex items-center gap-1">
                {opts.find(m => m.id === selected)?.requires_coating && (
                  <span className="text-[10px] text-amber-400">coating req.</span>
                )}
                {opts.find(m => m.id === selected)?.baba_status === 'non_compliant' && (
                  <span className="text-[10px] text-amber-400" title="Not BABA compliant">BABA</span>
                )}
              </div>

              {isInvalid && (
                <span className="text-xs text-red-400">Material no longer compliant</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Validation section */}
      <div className="mt-4 flex items-start gap-4">
        <button
          onClick={runValidation}
          className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded border border-zinc-700 hover:bg-zinc-700"
        >
          Validate Materials
        </button>
        {validation && (
          <div className="flex-1 space-y-1">
            {validation.messages.map((m, i) => (
              <div key={i} className={`text-xs px-3 py-1.5 rounded ${tierStyle(m.tier)}`}>
                <span className="font-medium">{tierIcon(m.tier)} {m.code}</span>
                {m.component_key && <span className="text-zinc-400"> ({m.component_key})</span>}
                : {m.message}
                {m.suggestion && <span className="text-zinc-400 ml-1">— {m.suggestion}</span>}
              </div>
            ))}
            {validation.messages.length === 0 && (
              <p className="text-xs text-green-400">All material selections are valid.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  const cls = color === 'blue'
    ? 'bg-blue-900/40 text-blue-400 border-blue-800'
    : 'bg-amber-900/40 text-amber-400 border-amber-800';
  return <span className={`px-1 py-0 text-[9px] rounded border ${cls}`}>{text}</span>;
}

function tierIcon(tier: string) {
  return { hard_block: '\uD83D\uDD34', cert_block: '\uD83D\uDFE0', warning: '\uD83D\uDFE1', advisory: '\uD83D\uDD35' }[tier] || '';
}

function tierStyle(tier: string) {
  return {
    hard_block: 'bg-red-900/30 text-red-300',
    cert_block: 'bg-amber-900/30 text-amber-300',
    warning: 'bg-yellow-900/30 text-yellow-300',
    advisory: 'bg-blue-900/30 text-blue-300',
  }[tier] || 'bg-zinc-800 text-zinc-300';
}
