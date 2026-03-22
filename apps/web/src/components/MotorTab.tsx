import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import { useConfigurationStore, type ConfigurationData } from '../stores/configurationStore';
import type { CertificationCode } from '@magnum-opus/shared';

interface Motor {
  id: string;
  manufacturer: string;
  modelNumber: string;
  powerKw: string;
  powerHp: string;
  speedRpm: number;
  poles: number;
  voltage: string;
  enclosure: string;
  frame: string;
  efficiencyClass: string;
  fullLoadEfficiency: string;
  serviceFactor: string;
  isInverterDuty: boolean;
  domesticManufactured: boolean;
  fmApproved: boolean;
  ulListed: boolean;
  hazardousClass: string | null;
}

interface Props {
  config: ConfigurationData;
  certs: CertificationCode[];
}

export function MotorTab({ config, certs }: Props) {
  const [motors, setMotors] = useState<Motor[]>([]);
  const [loading, setLoading] = useState(true);
  const { updateConfiguration } = useConfigurationStore();
  const selectedId = config.motorOptionId;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('modelId', config.pumpSize.model.id);
    if (certs.length > 0) params.set('certs', certs.join(','));

    apiGet<Motor[]>(`/api/motors/options?${params}`)
      .then(setMotors)
      .finally(() => setLoading(false));
  }, [config.pumpSize.model.id, certs]);

  const handleSelect = (motorId: string) => {
    updateConfiguration(config.id, { motor_option_id: motorId });
  };

  if (loading) return <p className="text-zinc-500 text-sm">Loading motors...</p>;

  return (
    <div>
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 border-b border-zinc-800">
              <th className="text-left px-3 py-2 text-zinc-400 font-medium">Model</th>
              <th className="text-right px-3 py-2 text-zinc-400 font-medium">Power</th>
              <th className="text-right px-3 py-2 text-zinc-400 font-medium">Speed</th>
              <th className="text-left px-3 py-2 text-zinc-400 font-medium">Enclosure</th>
              <th className="text-left px-3 py-2 text-zinc-400 font-medium">Frame</th>
              <th className="text-left px-3 py-2 text-zinc-400 font-medium">Class</th>
              <th className="text-right px-3 py-2 text-zinc-400 font-medium">Eff %</th>
              <th className="text-right px-3 py-2 text-zinc-400 font-medium">SF</th>
              <th className="text-center px-3 py-2 text-zinc-400 font-medium">VFD</th>
              <th className="text-center px-3 py-2 text-zinc-400 font-medium">Domestic</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {motors.map(m => {
              const isSelected = m.id === selectedId;
              return (
                <tr
                  key={m.id}
                  className={`border-b border-zinc-800 transition-colors ${
                    isSelected ? 'bg-blue-900/20' : 'hover:bg-zinc-800/50'
                  }`}
                >
                  <td className="px-3 py-2 font-mono text-xs text-zinc-100">{m.modelNumber}</td>
                  <td className="px-3 py-2 font-mono text-right text-zinc-300">{Number(m.powerKw)} kW</td>
                  <td className="px-3 py-2 font-mono text-right text-zinc-300">{m.speedRpm}</td>
                  <td className="px-3 py-2 text-zinc-300">{m.enclosure}</td>
                  <td className="px-3 py-2 font-mono text-zinc-400">{m.frame}</td>
                  <td className="px-3 py-2 text-zinc-400">{m.efficiencyClass}</td>
                  <td className="px-3 py-2 font-mono text-right text-zinc-300">{Number(m.fullLoadEfficiency).toFixed(1)}</td>
                  <td className="px-3 py-2 font-mono text-right text-zinc-400">{Number(m.serviceFactor).toFixed(2)}</td>
                  <td className="px-3 py-2 text-center">{m.isInverterDuty ? '\u2713' : ''}</td>
                  <td className="px-3 py-2 text-center">{m.domesticManufactured ? '\u2713' : ''}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleSelect(m.id)}
                      className={`px-2 py-1 text-xs rounded ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {motors.length === 0 && (
        <p className="text-zinc-500 text-sm mt-4">No motors match the current filters.</p>
      )}
    </div>
  );
}
