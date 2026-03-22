import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import { useConfigurationStore, type ConfigurationData } from '../stores/configurationStore';
import type { CertificationCode } from '@magnum-opus/shared';

interface BaseplatePreset {
  id: string;
  type: string;
  material: string;
  hasDripRim: boolean;
  hasDrain: boolean;
  groutType: string | null;
  domesticManufactured: boolean;
  description: string | null;
}

const FRAME_TYPES = [
  { value: 'bent_plate', label: 'Bent Plate' },
  { value: 'c_channel', label: 'C-Channel' },
  { value: 'i_beam', label: 'I-Beam / W-Beam' },
  { value: 'cast', label: 'Cast (one-piece)' },
  { value: 'soleplate', label: 'Soleplate' },
  { value: 'spring_mounted', label: 'Spring-Isolated' },
];

const MATERIALS = [
  { value: 'Carbon Steel', label: 'Carbon Steel' },
  { value: 'Gray Cast Iron', label: 'Gray Cast Iron' },
  { value: '304 Stainless Steel', label: '304 Stainless Steel' },
  { value: '316 Stainless Steel', label: '316 Stainless Steel' },
  { value: 'Duplex Stainless Steel', label: 'Duplex Stainless Steel' },
  { value: 'Fiberglass (FRP)', label: 'Fiberglass (FRP)' },
];

const GROUT_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'cementitious', label: 'Cementitious' },
  { value: 'epoxy', label: 'Epoxy' },
];

interface Props {
  config: ConfigurationData;
  certs: CertificationCode[];
}

export function BaseplateTab({ config, certs }: Props) {
  const [presets, setPresets] = useState<BaseplatePreset[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(true);
  const { updateConfiguration } = useConfigurationStore();

  // Local form state
  const [frameType, setFrameType] = useState(config.baseplateFrameType || '');
  const [material, setMaterial] = useState(config.baseplateMaterial || '');
  const [hasDripRim, setHasDripRim] = useState(config.baseplateHasDripRim);
  const [hasDrain, setHasDrain] = useState(config.baseplateHasDrain);
  const [groutType, setGroutType] = useState(config.baseplateGroutType || 'none');
  const [domestic, setDomestic] = useState(config.baseplateDomestic);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('modelId', config.pumpSize.model.id);
    if (certs.length > 0) params.set('certs', certs.join(','));
    apiGet<BaseplatePreset[]>(`/api/baseplates/options?${params}`)
      .then(setPresets)
      .finally(() => setLoadingPresets(false));
  }, [config.pumpSize.model.id, certs]);

  const save = (updates: Record<string, unknown>) => {
    updateConfiguration(config.id, updates);
  };

  const applyPreset = (preset: BaseplatePreset) => {
    const ft = preset.type === 'cast_iron' ? 'cast'
      : preset.type === 'fabricated_steel' ? 'bent_plate'
      : preset.type === 'ss_fabricated' ? 'bent_plate'
      : preset.type === 'spring_mounted' ? 'spring_mounted'
      : preset.type === 'soleplate' ? 'soleplate'
      : 'bent_plate';
    setFrameType(ft);
    setMaterial(preset.material);
    setHasDripRim(preset.hasDripRim);
    setHasDrain(preset.hasDrain);
    setGroutType(preset.groutType || 'none');
    setDomestic(preset.domesticManufactured);
    save({
      baseplate_id: preset.id,
      baseplate_frame_type: ft,
      baseplate_material: preset.material,
      baseplate_has_drip_rim: preset.hasDripRim,
      baseplate_has_drain: preset.hasDrain,
      baseplate_grout_type: preset.groutType || 'none',
      baseplate_domestic: preset.domesticManufactured,
    });
  };

  const requiresBABA = certs.includes('BABA' as CertificationCode);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Presets */}
      <section>
        <h3 className="text-sm font-medium text-zinc-300 mb-2">Start from a preset</h3>
        <div className="flex gap-2 flex-wrap">
          {loadingPresets ? (
            <span className="text-xs text-zinc-500">Loading...</span>
          ) : (
            presets.map(p => (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                  config.baseplateId === p.id
                    ? 'border-blue-600 bg-blue-900/30 text-blue-300'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500'
                }`}
              >
                {p.type.replace(/_/g, ' ')}
              </button>
            ))
          )}
        </div>
      </section>

      {/* Configuration form */}
      <section className="p-4 border border-zinc-800 rounded-lg bg-zinc-900 space-y-4">
        <h3 className="text-sm font-medium text-zinc-300">Baseplate Configuration</h3>

        {/* Frame Type */}
        <Field label="Frame Construction">
          <select
            value={frameType}
            onChange={e => { setFrameType(e.target.value); save({ baseplate_frame_type: e.target.value }); }}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
          >
            <option value="">-- Select frame type --</option>
            {FRAME_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </Field>

        {/* Material */}
        <Field label="Material">
          <select
            value={material}
            onChange={e => { setMaterial(e.target.value); save({ baseplate_material: e.target.value }); }}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
          >
            <option value="">-- Select material --</option>
            {MATERIALS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </Field>

        {/* Grout Type */}
        <Field label="Grout Type">
          <select
            value={groutType}
            onChange={e => { setGroutType(e.target.value); save({ baseplate_grout_type: e.target.value }); }}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
          >
            {GROUT_TYPES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </Field>

        {/* Toggles */}
        <div className="grid grid-cols-3 gap-4">
          <Toggle
            label="Drip Rim"
            checked={hasDripRim}
            onChange={v => { setHasDripRim(v); save({ baseplate_has_drip_rim: v }); }}
          />
          <Toggle
            label="Drain Port"
            checked={hasDrain}
            onChange={v => { setHasDrain(v); save({ baseplate_has_drain: v }); }}
          />
          <Toggle
            label="Domestic Manufactured"
            checked={domestic}
            onChange={v => { setDomestic(v); save({ baseplate_domestic: v }); }}
            warn={requiresBABA && !domestic}
            warnText="BABA requires domestic"
          />
        </div>
      </section>

      {/* Summary */}
      {frameType && (
        <section className="p-4 border border-zinc-800 rounded-lg bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-300 mb-3">Baseplate Summary</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <SummaryRow label="Frame" value={FRAME_TYPES.find(f => f.value === frameType)?.label || frameType} />
            <SummaryRow label="Material" value={material || '--'} />
            <SummaryRow label="Grout" value={GROUT_TYPES.find(g => g.value === groutType)?.label || groutType} />
            <SummaryRow label="Drip Rim" value={hasDripRim ? 'Yes' : 'No'} />
            <SummaryRow label="Drain" value={hasDrain ? 'Yes' : 'No'} />
            <SummaryRow label="Domestic" value={domestic ? 'Yes' : 'No'} />
          </div>
        </section>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange, warn, warnText }: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  warn?: boolean;
  warnText?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 cursor-pointer">
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`w-9 h-5 rounded-full transition-colors relative ${checked ? 'bg-blue-600' : 'bg-zinc-700'}`}
        >
          <span className={`block w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
        <span className="text-sm text-zinc-300">{label}</span>
      </label>
      {warn && warnText && (
        <p className="text-[10px] text-amber-400 mt-0.5 ml-11">{warnText}</p>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-100 font-mono">{value}</span>
    </div>
  );
}
