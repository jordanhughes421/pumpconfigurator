import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import { useConfigurationStore, type ConfigurationData } from '../stores/configurationStore';
import type { CertificationCode } from '@magnum-opus/shared';

interface Baseplate {
  id: string;
  type: string;
  material: string;
  hasDripRim: boolean;
  hasDrain: boolean;
  groutType: string | null;
  domesticManufactured: boolean;
  description: string | null;
}

interface Props {
  config: ConfigurationData;
  certs: CertificationCode[];
}

export function BaseplateTab({ config, certs }: Props) {
  const [baseplates, setBaseplates] = useState<Baseplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { updateConfiguration } = useConfigurationStore();
  const selectedId = config.baseplateId;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('modelId', config.pumpSize.model.id);
    if (certs.length > 0) params.set('certs', certs.join(','));

    apiGet<Baseplate[]>(`/api/baseplates/options?${params}`)
      .then(setBaseplates)
      .finally(() => setLoading(false));
  }, [config.pumpSize.model.id, certs]);

  const handleSelect = (bpId: string) => {
    updateConfiguration(config.id, { baseplate_id: bpId });
  };

  if (loading) return <p className="text-zinc-500 text-sm">Loading baseplates...</p>;

  return (
    <div className="grid gap-3 max-w-2xl">
      {baseplates.map(bp => {
        const isSelected = bp.id === selectedId;
        return (
          <div
            key={bp.id}
            className={`flex items-center gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${
              isSelected
                ? 'border-blue-600 bg-blue-900/20'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
            }`}
            onClick={() => handleSelect(bp.id)}
          >
            <div className="flex-1">
              <div className="text-sm font-medium text-zinc-100 capitalize">
                {bp.type.replace(/_/g, ' ')}
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">{bp.material}</div>
              {bp.description && (
                <div className="text-xs text-zinc-500 mt-1">{bp.description}</div>
              )}
              <div className="flex gap-3 mt-2 text-[10px] text-zinc-500">
                {bp.hasDripRim && <span>Drip rim</span>}
                {bp.hasDrain && <span>Drain</span>}
                {bp.groutType && bp.groutType !== 'none' && <span>Grout: {bp.groutType}</span>}
                {bp.domesticManufactured && <span className="text-green-500">Domestic</span>}
              </div>
            </div>
            {isSelected && (
              <span className="text-xs text-blue-400 font-medium">Selected</span>
            )}
          </div>
        );
      })}
      {baseplates.length === 0 && (
        <p className="text-zinc-500 text-sm">No baseplates match the current filters.</p>
      )}
    </div>
  );
}
