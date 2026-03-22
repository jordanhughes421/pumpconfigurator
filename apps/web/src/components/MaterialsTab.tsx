import { useEffect, useState, useCallback, useRef } from 'react';
import { apiGet, apiPost, apiPut } from '../lib/api';
import { useConfigurationStore, type ConfigurationData } from '../stores/configurationStore';
import type { CertificationCode } from '@magnum-opus/shared';
import { SEAL_TYPES, SEAL_FACE_MATERIALS, SEAL_ELASTOMERS, OH_BB_LUBRICATION_TYPES, VS_LUBRICATION_TYPES, VS_BEARING_GROUPS } from '@magnum-opus/shared';

interface ComponentDrawing {
  id: string;
  drawingNumber: string;
  drawingUrl: string;
  title: string | null;
}

interface ComponentPartNumber {
  id: string;
  partNumber: string;
  lubricationTypes: string[] | null;
  certifications: string[] | null;
  notes: string | null;
  model: { id: string; modelCode: string } | null;
  drawings: ComponentDrawing[];
}

interface PropertyDef {
  id: string;
  propertyKey: string;
  displayName: string;
  unit: string | null;
  dataType: string;
  selectOptions: string[] | null;
  displayOrder: number;
  isRequired: boolean;
}

interface ComponentDef {
  id: string;
  componentKey: string;
  displayName: string;
  displayOrder: number;
  isWetted: boolean;
  isPressureBoundary: boolean;
  isRequired: boolean;
  lubricationTypes: string[] | null;
  lubricationAdded: boolean;
  partNumbers: ComponentPartNumber[];
  propertyDefs: PropertyDef[];
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

// --- Seal & coupling constants ---

const SEAL_TYPE_LABELS: Record<string, string> = {
  single_mechanical: 'Single Mechanical',
  dual_mechanical: 'Dual Mechanical (back-to-back)',
  tandem_mechanical: 'Tandem Mechanical',
  cartridge_single: 'Cartridge — Single',
  cartridge_dual: 'Cartridge — Dual',
  packed: 'Packed (Compression Packing)',
  dynamic_expeller: 'Dynamic / Expeller',
};

const SEAL_PLAN_OPTIONS = [
  { value: '', label: '-- None --' },
  { value: '01', label: 'Plan 01 — Internal recirculation' },
  { value: '02', label: 'Plan 02 — Dead-ended' },
  { value: '11', label: 'Plan 11 — Recirculation from pump discharge' },
  { value: '13', label: 'Plan 13 — Recirculation from seal chamber' },
  { value: '14', label: 'Plan 14 — Discharge through cyclone separator' },
  { value: '21', label: 'Plan 21 — Jacket cooled seal chamber' },
  { value: '23', label: 'Plan 23 — Recirculation from seal through heat exchanger' },
  { value: '32', label: 'Plan 32 — External fluid injection (clean)' },
  { value: '52', label: 'Plan 52 — Unpressurized external buffer fluid' },
  { value: '53A', label: 'Plan 53A — Pressurized barrier fluid (bladder)' },
  { value: '53B', label: 'Plan 53B — Pressurized barrier fluid (piston)' },
  { value: '53C', label: 'Plan 53C — Pressurized barrier fluid (external)' },
  { value: '54', label: 'Plan 54 — Pressurized external barrier fluid' },
  { value: '62', label: 'Plan 62 — External quench (steam/N₂)' },
  { value: '72', label: 'Plan 72 — External buffer with heat exchanger' },
];

const FACE_MATERIAL_LABELS: Record<string, string> = {
  SiC_sintered: 'Silicon Carbide — Sintered (SSiC)',
  SiC_reaction_bonded: 'Silicon Carbide — Reaction Bonded (RBSiC)',
  carbon_resin: 'Carbon — Resin Impregnated',
  carbon_antimony: 'Carbon — Antimony Impregnated',
  tungsten_carbide_co: 'Tungsten Carbide (Co binder)',
  tungsten_carbide_ni: 'Tungsten Carbide (Ni binder)',
  alumina: 'Alumina (Al₂O₃)',
};

const ELASTOMER_LABELS: Record<string, string> = {
  FKM_A: 'FKM Type A (Viton A)',
  FKM_B: 'FKM Type B (Viton B)',
  EPDM: 'EPDM',
  NBR: 'NBR (Buna-N)',
  FFKM: 'FFKM (Kalrez / Chemraz)',
  PTFE: 'PTFE (Teflon)',
};

const COUPLING_TYPES = [
  { value: 'flexible_jaw', label: 'Flexible Jaw (Lovejoy)' },
  { value: 'flexible_disc', label: 'Flexible Disc' },
  { value: 'flexible_grid', label: 'Flexible Grid (Falk)' },
  { value: 'flexible_gear', label: 'Flexible Gear' },
  { value: 'rigid_flange', label: 'Rigid Flange' },
  { value: 'rigid_sleeve', label: 'Rigid Sleeve' },
  { value: 'magnetic', label: 'Magnetic Drive' },
  { value: 'spacer', label: 'Spacer Coupling' },
];

// --- Lubrication constants ---

const LUBRICATION_LABELS: Record<string, string> = {
  grease: 'Grease Lubricated',
  oil_ring: 'Oil Ring Lubricated',
  oil_mist: 'Oil Mist Lubricated',
  oil_bath: 'Oil Bath',
  forced_oil: 'Forced Oil / Pressurized',
  product_lubricated: 'Product Lubricated',
  self_lubricated: 'Self Lubricated',
  external_flush: 'External Flush',
};

const BEARING_GROUP_LABELS: Record<string, string> = {
  line_shaft: 'Line Shaft Bushings',
  thrust: 'Thrust Bearing',
  bowl: 'Bowl Bearings',
};

interface LubeRulesResponse {
  rules: Array<{ condition: { certification?: string }; action: { restrict_to?: string[] }; description?: string }>;
  allowed_types: string[] | null;
}

// Components whose display/materials adapt based on seal type selection
const SEAL_COMPONENT_KEYS = new Set(['mechanical_seal', 'shaft_sleeve']);

// Packing material codes — when seal type is 'packed', only show these for mechanical_seal;
// when mechanical seal is selected (or no selection), hide these.
const PACKING_MATERIAL_PREFIX = 'PKG_';

interface Props {
  config: ConfigurationData;
  certs: CertificationCode[];
}

export function MaterialsTab({ config, certs }: Props) {
  const hiType = config.pumpSize.model.family.hiTypeCode;
  const modelId = config.pumpSize.model.id;
  const [components, setComponents] = useState<ComponentDef[]>([]);
  const [optionsMap, setOptionsMap] = useState<Record<string, MaterialOpt[]>>({});
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [pnSelections, setPnSelections] = useState<Record<string, string>>({});
  // Property values keyed by "componentKey:propertyDefId"
  const [propValues, setPropValues] = useState<Record<string, string>>({});
  const [invalidKeys, setInvalidKeys] = useState<Set<string>>(new Set());
  const [expandedProps, setExpandedProps] = useState<Set<string>>(new Set());
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const { updateConfiguration } = useConfigurationStore();
  const selectionsRef = useRef(selections);
  selectionsRef.current = selections;
  const initializedRef = useRef(false);

  // Seal & coupling local state
  const [sealType, setSealType] = useState(config.sealType || '');
  const [sealPlan, setSealPlan] = useState(config.sealPlan || '');
  const [sealFaceMaterial, setSealFaceMaterial] = useState(config.sealFaceMaterial || '');
  const [sealElastomer, setSealElastomer] = useState(config.sealElastomer || '');
  const [couplingType, setCouplingType] = useState(config.couplingType || '');

  // Lubrication state
  const isVS = hiType.startsWith('VS');
  const [lubeType, setLubeType] = useState(config.lubricationType || '');
  const [bearingLube, setBearingLube] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    if (config.bearingLubrication) {
      for (const bl of config.bearingLubrication) {
        init[bl.bearingGroup] = bl.lubricationType;
      }
    }
    return init;
  });
  const [lubeRules, setLubeRules] = useState<LubeRulesResponse | null>(null);

  const isPacked = sealType === 'packed';
  const isDynamic = sealType === 'dynamic_expeller';
  const isMechanical = sealType !== '' && !isPacked && !isDynamic;
  const isDual = ['dual_mechanical', 'cartridge_dual', 'tandem_mechanical'].includes(sealType);
  const requiresAPI610 = certs.includes('API610' as CertificationCode);

  const saveSealCoupling = (updates: Record<string, unknown>) => {
    updateConfiguration(config.id, updates);
  };

  // Fetch lubrication constraint rules based on active certifications
  useEffect(() => {
    const certParam = certs.length > 0 ? `?certs=${certs.join(',')}` : '';
    apiGet<LubeRulesResponse>(`/api/configurations/lubrication-rules${certParam}`)
      .then(setLubeRules)
      .catch(() => setLubeRules(null));
  }, [certs]);

  // Active lubrication type (for OH/BB, the global; for VS, we use per-group for material filtering)
  const activeLubeType = isVS ? '' : lubeType;

  // Available lube type options (may be restricted by certs)
  const baseLubeOptions = isVS ? [...VS_LUBRICATION_TYPES] : [...OH_BB_LUBRICATION_TYPES];
  const allowedLubeTypes = lubeRules?.allowed_types ?? null;
  const lubeOptions = allowedLubeTypes
    ? baseLubeOptions.filter(t => allowedLubeTypes.includes(t))
    : baseLubeOptions;

  // Cert warnings for current lube selection
  const lubeWarnings: string[] = [];
  if (lubeType && allowedLubeTypes && !allowedLubeTypes.includes(lubeType)) {
    for (const rule of lubeRules?.rules || []) {
      const action = rule.action as { restrict_to?: string[] };
      if (action.restrict_to && !action.restrict_to.includes(lubeType)) {
        lubeWarnings.push(rule.description || `${rule.condition.certification} restricts this lubrication type`);
      }
    }
  }

  const handleLubeChange = (value: string) => {
    setLubeType(value);
    updateConfiguration(config.id, { lubrication_type: value || null });
  };

  const handleBearingLubeChange = (group: string, value: string) => {
    setBearingLube(prev => ({ ...prev, [group]: value }));
    apiPut(`/api/configurations/${config.id}/bearing-lubrication`, {
      groups: [{ bearing_group: group, lubrication_type: value }],
    });
  };

  // Filter components by lubrication type
  const getVisibleComponents = (comps: ComponentDef[]): ComponentDef[] => {
    if (!activeLubeType) {
      // No lube selected: show all non-lubrication-added components + universal ones
      return comps.filter(c => !c.lubricationAdded);
    }
    return comps.filter(c => {
      if (c.lubricationTypes === null) return true; // universal
      if (c.lubricationTypes.includes(activeLubeType)) return true;
      return false;
    });
  };

  // Determine display name override and visibility for seal-related components
  const getSealComponentDisplay = (comp: ComponentDef): { visible: boolean; displayName: string; requiredOverride?: boolean } => {
    if (comp.componentKey === 'mechanical_seal') {
      if (!sealType || isMechanical) {
        return { visible: true, displayName: comp.displayName };
      }
      if (isPacked) {
        return { visible: true, displayName: 'Packing', requiredOverride: true };
      }
      if (isDynamic) {
        return { visible: true, displayName: 'Dynamic Seal / Expeller', requiredOverride: true };
      }
    }
    if (comp.componentKey === 'shaft_sleeve') {
      if (isPacked) {
        return { visible: true, displayName: comp.displayName, requiredOverride: true };
      }
      // Optional with mechanical seal / hidden if no seal type
      return { visible: true, displayName: comp.displayName };
    }
    return { visible: true, displayName: comp.displayName };
  };

  // Load component definitions
  useEffect(() => {
    apiGet<ComponentDef[]>(`/api/components/${hiType}`)
      .then(comps => {
        const sorted = comps.sort((a, b) => a.displayOrder - b.displayOrder);
        setComponents(sorted);
      });
  }, [hiType]);

  // Initialize selections from config (only once on mount)
  useEffect(() => {
    if (initializedRef.current) return;
    if (config.materialSelections.length === 0 && (!config.propertyValues || config.propertyValues.length === 0)) return;
    initializedRef.current = true;
    const sel: Record<string, string> = {};
    const pnSel: Record<string, string> = {};
    for (const ms of config.materialSelections) {
      sel[ms.componentKey] = ms.materialId;
      if (ms.partNumberId) pnSel[ms.componentKey] = ms.partNumberId;
    }
    setSelections(sel);
    setPnSelections(pnSel);
    // Initialize property values
    if (config.propertyValues) {
      const pv: Record<string, string> = {};
      for (const v of config.propertyValues) {
        const key = `${v.componentKey}:${v.propertyDefId}`;
        pv[key] = v.valueNumber != null ? String(v.valueNumber) : (v.valueText ?? '');
      }
      setPropValues(pv);
    }
  }, [config.materialSelections, config.propertyValues]);

  // Fetch material options for all components (re-fetch when components/certs/temp/lube change)
  const fetchAllOptions = useCallback(async () => {
    if (components.length === 0) return;
    const certParam = certs.length > 0 ? `&certs=${certs.join(',')}` : '';
    const tempParam = config.fluidTempC ? `&tempC=${config.fluidTempC}` : '';
    const lubeParam = activeLubeType ? `&lubricationType=${activeLubeType}` : '';
    const map: Record<string, MaterialOpt[]> = {};
    const newInvalid = new Set<string>();

    await Promise.all(components.map(async (comp) => {
      try {
        const data = await apiGet<MaterialOptionsResponse>(
          `/api/materials/options?componentDefId=${comp.id}${certParam}${tempParam}${lubeParam}`
        );
        map[comp.componentKey] = data.materials;

        // Check if current selection is still valid (use ref to avoid dep cycle)
        const currentSel = selectionsRef.current[comp.componentKey];
        if (currentSel && !data.materials.some(m => m.id === currentSel)) {
          newInvalid.add(comp.componentKey);
        }
      } catch {
        map[comp.componentKey] = [];
      }
    }));

    setOptionsMap(map);
    setInvalidKeys(newInvalid);
  }, [components, certs, config.fluidTempC, activeLubeType]);

  useEffect(() => { fetchAllOptions(); }, [fetchAllOptions]);

  // Auto-select defaults for unset components and persist to backend
  useEffect(() => {
    if (Object.keys(optionsMap).length === 0) return;
    const prev = selectionsRef.current;
    const newSel = { ...prev };
    const newEntries: { component_key: string; material_id: string }[] = [];
    for (const comp of components) {
      if (!newSel[comp.componentKey]) {
        const opts = optionsMap[comp.componentKey] || [];
        const def = opts.find(m => m.is_default) || opts[0];
        if (def) {
          newSel[comp.componentKey] = def.id;
          newEntries.push({ component_key: comp.componentKey, material_id: def.id });
        }
      }
    }
    if (newEntries.length > 0) {
      setSelections(newSel);
      updateConfiguration(config.id, { material_selections: newEntries });
    }
  }, [optionsMap, components, config.id, updateConfiguration]);

  // Filter materials for the mechanical_seal component based on seal type
  const getFilteredOpts = (componentKey: string, opts: MaterialOpt[]): MaterialOpt[] => {
    if (componentKey !== 'mechanical_seal') return opts;
    if (isPacked) {
      return opts.filter(m => m.material_code.startsWith(PACKING_MATERIAL_PREFIX));
    }
    // Mechanical seal or no selection: hide packing materials
    return opts.filter(m => !m.material_code.startsWith(PACKING_MATERIAL_PREFIX));
  };

  const handleSelect = (componentKey: string, materialId: string) => {
    setSelections(prev => ({ ...prev, [componentKey]: materialId }));
    setInvalidKeys(prev => { const s = new Set(prev); s.delete(componentKey); return s; });

    // Save to backend (fire-and-forget, don't let response overwrite local state)
    updateConfiguration(config.id, {
      material_selections: [{
        component_key: componentKey,
        material_id: materialId,
        part_number_id: pnSelections[componentKey] || null,
      }],
    });
  };

  const handlePartNumberSelect = (componentKey: string, partNumberId: string) => {
    setPnSelections(prev => ({ ...prev, [componentKey]: partNumberId }));
    const materialId = selections[componentKey];
    if (materialId) {
      updateConfiguration(config.id, {
        material_selections: [{
          component_key: componentKey,
          material_id: materialId,
          part_number_id: partNumberId || null,
        }],
      });
    }
  };

  const handlePropertyChange = (componentKey: string, propDef: PropertyDef, value: string) => {
    const key = `${componentKey}:${propDef.id}`;
    setPropValues(prev => ({ ...prev, [key]: value }));
  };

  const handlePropertyBlur = (componentKey: string, propDef: PropertyDef) => {
    const key = `${componentKey}:${propDef.id}`;
    const value = propValues[key] ?? '';
    const payload: any = { propertyDefId: propDef.id, componentKey };
    if (propDef.dataType === 'number') {
      payload.valueNumber = value ? parseFloat(value) : null;
    } else {
      payload.valueText = value || null;
    }
    apiPut(`/api/configurations/${config.id}/properties`, { values: [payload] });
  };

  const setAllCheapest = () => {
    const newSel: Record<string, string> = {};
    const entries: { component_key: string; material_id: string }[] = [];
    for (const comp of components) {
      const opts = getFilteredOpts(comp.componentKey, optionsMap[comp.componentKey] || []);
      if (opts.length === 0) continue;
      const cheapest = opts.reduce((best, m) => m.cost_tier < best.cost_tier ? m : best, opts[0]);
      newSel[comp.componentKey] = cheapest.id;
      entries.push({ component_key: comp.componentKey, material_id: cheapest.id });
    }
    setSelections(newSel);
    setInvalidKeys(new Set());
    if (entries.length > 0) {
      updateConfiguration(config.id, { material_selections: entries });
    }
  };

  const resetToDefaults = () => {
    const newSel: Record<string, string> = {};
    const entries: { component_key: string; material_id: string }[] = [];
    for (const comp of components) {
      const opts = getFilteredOpts(comp.componentKey, optionsMap[comp.componentKey] || []);
      if (opts.length === 0) continue;
      const def = opts.find(m => m.is_default) || opts[0];
      newSel[comp.componentKey] = def.id;
      entries.push({ component_key: comp.componentKey, material_id: def.id });
    }
    setSelections(newSel);
    setInvalidKeys(new Set());
    if (entries.length > 0) {
      updateConfiguration(config.id, { material_selections: entries });
    }
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
      {/* Seal & Coupling Configuration */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 border border-zinc-800 rounded-lg bg-zinc-900 space-y-3">
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Seal</h3>
          <SmallSelect
            label="Type"
            value={sealType}
            onChange={v => { setSealType(v); saveSealCoupling({ seal_type: v || null }); }}
            options={SEAL_TYPES.map(t => ({ value: t, label: SEAL_TYPE_LABELS[t] || t }))}
            placeholder="-- Select seal type --"
          />
          {requiresAPI610 && isPacked && (
            <p className="text-[10px] text-amber-400">API 610 generally requires mechanical seals, not packing.</p>
          )}
          {isMechanical && (
            <>
              <SmallSelect
                label="Seal Plan"
                value={sealPlan}
                onChange={v => { setSealPlan(v); saveSealCoupling({ seal_plan: v || null }); }}
                options={SEAL_PLAN_OPTIONS.map(p => ({ value: p.value, label: p.label }))}
              />
              {isDual && sealPlan !== '' && !['52', '53A', '53B', '53C', '54', '72'].includes(sealPlan) && (
                <p className="text-[10px] text-amber-400">Dual/tandem seals typically require Plan 52, 53, or 54.</p>
              )}
              <SmallSelect
                label="Face Material"
                value={sealFaceMaterial}
                onChange={v => { setSealFaceMaterial(v); saveSealCoupling({ seal_face_material: v || null }); }}
                options={SEAL_FACE_MATERIALS.map(m => ({ value: m, label: FACE_MATERIAL_LABELS[m] || m }))}
                placeholder="-- Select face material --"
              />
              <SmallSelect
                label="Elastomer"
                value={sealElastomer}
                onChange={v => { setSealElastomer(v); saveSealCoupling({ seal_elastomer: v || null }); }}
                options={SEAL_ELASTOMERS.map(e => ({ value: e, label: ELASTOMER_LABELS[e] || e }))}
                placeholder="-- Select elastomer --"
              />
            </>
          )}
        </div>

        <div className="p-3 border border-zinc-800 rounded-lg bg-zinc-900 space-y-3">
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Coupling</h3>
          <SmallSelect
            label="Type"
            value={couplingType}
            onChange={v => { setCouplingType(v); saveSealCoupling({ coupling_type: v || null }); }}
            options={COUPLING_TYPES}
            placeholder="-- Select coupling type --"
          />
        </div>
      </div>

      {/* Lubrication Configuration */}
      <div className="p-3 border border-zinc-800 rounded-lg bg-zinc-900 space-y-3 mb-4">
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Lubrication</h3>
        {isVS ? (
          <div className="grid grid-cols-3 gap-3">
            {VS_BEARING_GROUPS.map(group => (
              <SmallSelect
                key={group}
                label={BEARING_GROUP_LABELS[group] || group}
                value={bearingLube[group] || ''}
                onChange={v => handleBearingLubeChange(group, v)}
                options={baseLubeOptions.map(t => ({ value: t, label: LUBRICATION_LABELS[t] || t }))}
                placeholder="-- Select --"
              />
            ))}
          </div>
        ) : (
          <SmallSelect
            label="Type"
            value={lubeType}
            onChange={handleLubeChange}
            options={baseLubeOptions.map(t => ({
              value: t,
              label: `${LUBRICATION_LABELS[t] || t}${allowedLubeTypes && !allowedLubeTypes.includes(t) ? ' (restricted)' : ''}`,
            }))}
            placeholder="-- Select lubrication type --"
          />
        )}
        {lubeWarnings.map((w, i) => (
          <p key={i} className="text-[10px] text-amber-400">{w}</p>
        ))}
      </div>

      {/* Bulk actions */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={setAllCheapest}
          className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded border border-zinc-700 hover:bg-zinc-700"
        >
          Set Cheapest Compliant
        </button>
        <button
          onClick={resetToDefaults}
          className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded border border-zinc-700 hover:bg-zinc-700"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Component material rows */}
      <div className="space-y-1">
        {getVisibleComponents(components).map(comp => {
          const display = getSealComponentDisplay(comp);
          if (!display.visible) return null;

          const rawOpts = optionsMap[comp.componentKey] || [];
          const opts = getFilteredOpts(comp.componentKey, rawOpts);
          const selected = selections[comp.componentKey];
          const isInvalid = invalidKeys.has(comp.componentKey)
            || (selected && !opts.some(m => m.id === selected));
          const isRequired = display.requiredOverride ?? comp.isRequired;

          // Part numbers applicable to this model + active lubrication
          const applicablePNs = (comp.partNumbers || []).filter(pn => {
            if (pn.model && pn.model.id !== modelId) return false;
            if (activeLubeType && pn.lubricationTypes && pn.lubricationTypes.length > 0) {
              if (!pn.lubricationTypes.includes(activeLubeType)) return false;
            }
            return true;
          });
          const selectedPN = applicablePNs.find(pn => pn.id === pnSelections[comp.componentKey]) || null;

          return (
            <div
              key={comp.componentKey}
              className={`flex flex-wrap items-center gap-3 px-4 py-2 rounded ${
                isInvalid ? 'bg-red-900/20 border border-red-800' : 'bg-zinc-900 border border-zinc-800'
              }`}
            >
              <div className="w-48 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-zinc-100">
                    {display.displayName}
                    {!isRequired && <span className="text-zinc-600 text-xs ml-1">(optional)</span>}
                  </span>
                  {selectedPN?.drawings && selectedPN.drawings.length > 0 && (
                    <DrawingsPopover drawings={selectedPN.drawings} />
                  )}
                </div>
                <div className="flex gap-1 mt-0.5">
                  {comp.isWetted && <Badge text="wetted" color="blue" />}
                  {comp.isPressureBoundary && <Badge text="pressure" color="amber" />}
                  {SEAL_COMPONENT_KEYS.has(comp.componentKey) && sealType && (
                    <Badge text={isPacked ? 'packed' : isMechanical ? 'mech seal' : 'dynamic'} color="blue" />
                  )}
                </div>
              </div>

              {applicablePNs.length > 0 && (
                <div className="flex-shrink-0 flex items-center gap-1">
                  <select
                    value={pnSelections[comp.componentKey] || ''}
                    onChange={e => handlePartNumberSelect(comp.componentKey, e.target.value)}
                    className="w-36 px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="">-- P/N --</option>
                    {applicablePNs.map(pn => (
                      <option key={pn.id} value={pn.id}>
                        {pn.partNumber}{pn.model ? ` (${pn.model.modelCode})` : ''}{pn.certifications?.length ? ` [${pn.certifications.join(',')}]` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedPN?.certifications && selectedPN.certifications.length > 0 && (
                    <span className="flex gap-0.5">
                      {selectedPN.certifications.map((c: string) => (
                        <span key={c} className="text-[9px] px-1 py-0 bg-green-900/40 text-green-400 border border-green-800 rounded">{c}</span>
                      ))}
                    </span>
                  )}
                </div>
              )}

              <select
                value={selected && opts.some(m => m.id === selected) ? selected : ''}
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

              {/* Expandable properties */}
              {comp.propertyDefs && comp.propertyDefs.length > 0 && (
                <div className="w-full">
                  <button
                    onClick={() => setExpandedProps(prev => {
                      const s = new Set(prev);
                      s.has(comp.componentKey) ? s.delete(comp.componentKey) : s.add(comp.componentKey);
                      return s;
                    })}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                  >
                    <span className={`inline-block transition-transform ${expandedProps.has(comp.componentKey) ? 'rotate-90' : ''}`}>&#9654;</span>
                    Properties ({comp.propertyDefs.length})
                  </button>
                  {expandedProps.has(comp.componentKey) && (
                    <div className="flex flex-wrap gap-2 mt-1 pt-1 border-t border-zinc-800/50">
                      {comp.propertyDefs.map(pd => {
                        const pvKey = `${comp.componentKey}:${pd.id}`;
                        const val = propValues[pvKey] ?? '';
                        return (
                          <div key={pd.id} className="flex items-center gap-1">
                            <label className="text-[10px] text-zinc-500 whitespace-nowrap">
                              {pd.displayName}{pd.unit ? ` (${pd.unit})` : ''}
                            </label>
                            {pd.dataType === 'select' && pd.selectOptions ? (
                              <select
                                value={val}
                                onChange={e => { handlePropertyChange(comp.componentKey, pd, e.target.value); }}
                                onBlur={() => handlePropertyBlur(comp.componentKey, pd)}
                                className="w-20 px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-100 focus:outline-none focus:border-blue-500"
                              >
                                <option value="">—</option>
                                {pd.selectOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            ) : (
                              <input
                                type={pd.dataType === 'number' ? 'number' : 'text'}
                                value={val}
                                onChange={e => handlePropertyChange(comp.componentKey, pd, e.target.value)}
                                onBlur={() => handlePropertyBlur(comp.componentKey, pd)}
                                step={pd.dataType === 'number' ? 'any' : undefined}
                                className="w-20 px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-100 focus:outline-none focus:border-blue-500"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
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

// --- Small helper components ---

function DrawingsPopover({ drawings }: { drawings: ComponentDrawing[] }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        onClick={e => { e.stopPropagation(); setOpen(!open); }}
        className="text-blue-400 hover:text-blue-300"
        title={`${drawings.length} drawing${drawings.length > 1 ? 's' : ''}`}
      >
        <svg className="w-3.5 h-3.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 left-0 top-5 w-64 bg-zinc-900 border border-zinc-700 rounded shadow-lg p-2 space-y-1">
          {drawings.map(d => (
            <a
              key={d.id}
              href={d.drawingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-zinc-800 rounded"
            >
              <span className="text-zinc-300 font-mono">{d.drawingNumber}</span>
              {d.title && <span className="text-zinc-500 truncate">{d.title}</span>}
              <span className="text-blue-400 ml-auto">Open</span>
            </a>
          ))}
        </div>
      )}
    </span>
  );
}

function SmallSelect({ label, value, onChange, options, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] text-zinc-500 mb-0.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
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
