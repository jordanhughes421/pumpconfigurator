import { useEffect, useState, useCallback } from 'react';
import { useCurveStore } from '../stores/curveStore';
import { useConfigurationStore, type ConfigurationData } from '../stores/configurationStore';
import { HQChart } from './HQChart';

interface Props {
  config: ConfigurationData;
}

export function HydraulicTab({ config }: Props) {
  const ps = config.pumpSize;
  const maxD = Number(ps.model.maxImpellerMm);
  const minD = Number(ps.model.minImpellerMm);
  const refSpeed = ps.speedRpm;

  const {
    scaledCurves, operatingPoint, trimMm, speedRpm,
    systemHStatic, systemKFriction, loading,
    fetchCurves, setTrim, setSpeed, setSystemCurve,
  } = useCurveStore();
  const { updateConfiguration } = useConfigurationStore();

  const [showSystem, setShowSystem] = useState(systemHStatic !== null);
  const [localHStatic, setLocalHStatic] = useState(systemHStatic ?? 30);
  const [localK, setLocalK] = useState(systemKFriction ?? 0.002);

  // Fetch curves on mount
  useEffect(() => {
    fetchCurves(config.pumpSizeId);
  }, [config.pumpSizeId, fetchCurves]);

  // Initialize trim/speed from config
  useEffect(() => {
    if (config.impellerTrimMm) setTrim(Number(config.impellerTrimMm));
    if (config.speedRpm) setSpeed(config.speedRpm);
  }, [config.impellerTrimMm, config.speedRpm, setTrim, setSpeed]);

  // Debounced save on trim/speed change
  const [saveTimer, setSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const debouncedSave = useCallback((trimVal: number, speedVal: number) => {
    if (saveTimer) clearTimeout(saveTimer);
    const t = setTimeout(() => {
      updateConfiguration(config.id, { impeller_trim_mm: trimVal, speed_rpm: speedVal });
    }, 500);
    setSaveTimer(t);
  }, [config.id, updateConfiguration, saveTimer]);

  const handleTrimChange = (mm: number) => {
    setTrim(mm);
    debouncedSave(mm, speedRpm);
  };

  const handleSpeedChange = (rpm: number) => {
    setSpeed(rpm);
    debouncedSave(trimMm, rpm);
  };

  const handleSystemCurveToggle = (on: boolean) => {
    setShowSystem(on);
    if (on) {
      setSystemCurve(localHStatic, localK);
    } else {
      setSystemCurve(null, null);
    }
  };

  const handleSystemParamChange = (h: number, k: number) => {
    setLocalHStatic(h);
    setLocalK(k);
    if (showSystem) setSystemCurve(h, k);
  };

  const trimRatio = maxD > 0 ? trimMm / maxD : 1;

  if (loading) return <p className="text-zinc-500 text-sm">Loading curves...</p>;
  if (!scaledCurves) return <p className="text-zinc-500 text-sm">No curve data available.</p>;

  return (
    <div className="grid grid-cols-[1fr_340px] gap-6">
      {/* Chart */}
      <div className="space-y-4">
        <HQChart
          curveSet={scaledCurves}
          dutyFlow={Number(config.dutyFlowM3h)}
          dutyHead={Number(config.dutyHeadM)}
          npshaM={Number(config.npshaM)}
          operatingPoint={operatingPoint}
          systemHStatic={showSystem ? localHStatic : null}
          systemK={showSystem ? localK : null}
          minImpellerMm={minD}
          maxImpellerMm={maxD}
          refSpeed={refSpeed}
        />
      </div>

      {/* Control Panel */}
      <div className="space-y-4">
        {/* Impeller Trim */}
        <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900">
          <h4 className="text-xs text-zinc-400 font-medium mb-2">Impeller Trim</h4>
          <input
            type="range"
            min={minD}
            max={maxD}
            step={1}
            value={trimMm}
            onChange={e => handleTrimChange(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs font-mono mt-1">
            <span className="text-zinc-500">{minD} mm</span>
            <span className="text-zinc-100 text-sm">{trimMm} mm</span>
            <span className="text-zinc-500">{maxD} mm</span>
          </div>
          {trimRatio < 0.80 && (
            <p className="mt-2 text-xs text-amber-400">
              Trim ratio {trimRatio.toFixed(3)} is below 0.80 — affinity law accuracy degraded
            </p>
          )}
        </div>

        {/* Speed */}
        <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900">
          <h4 className="text-xs text-zinc-400 font-medium mb-2">Speed</h4>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={speedRpm}
              onChange={e => handleSpeedChange(Number(e.target.value))}
              className="w-24 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:border-blue-500"
            />
            <span className="text-xs text-zinc-400">rpm</span>
            <button
              onClick={() => handleSpeedChange(refSpeed)}
              className="ml-auto text-xs text-zinc-500 hover:text-zinc-300"
            >
              Reset ({refSpeed})
            </button>
          </div>
        </div>

        {/* Operating Point Readout */}
        {operatingPoint && (
          <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900">
            <h4 className="text-xs text-zinc-400 font-medium mb-2">Operating Point</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Readout label="Flow" value={`${operatingPoint.flow_m3h.toFixed(1)} m\u00B3/h`} />
              <Readout label="Head" value={`${operatingPoint.head_m.toFixed(1)} m`} />
              <Readout label="Efficiency" value={`${operatingPoint.efficiency_pct.toFixed(1)}%`} />
              <Readout label="Power" value={`${operatingPoint.power_kw.toFixed(1)} kW`} />
              <Readout label="NPSH Required" value={`${operatingPoint.npshr_m.toFixed(1)} m`} />
              <Readout label="BEP %" value={`${operatingPoint.pct_of_bep.toFixed(0)}%`} />
            </div>
            <div className="mt-2">
              <RegionBadge region={operatingPoint.operating_region} />
            </div>
          </div>
        )}

        {/* System Curve */}
        <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900">
          <label className="flex items-center gap-2 text-sm text-zinc-300 mb-2">
            <input
              type="checkbox"
              checked={showSystem}
              onChange={e => handleSystemCurveToggle(e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-800"
            />
            System Curve
          </label>
          {showSystem && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Static Head (m)</label>
                <input
                  type="number"
                  value={localHStatic}
                  onChange={e => handleSystemParamChange(Number(e.target.value), localK)}
                  className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Friction Coeff (k)</label>
                <input
                  type="number"
                  step={0.001}
                  value={localK}
                  onChange={e => handleSystemParamChange(localHStatic, Number(e.target.value))}
                  className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-zinc-500">{label}</span>
      <div className="font-mono text-zinc-100">{value}</div>
    </div>
  );
}

function RegionBadge({ region }: { region: string }) {
  const styles: Record<string, string> = {
    POR: 'bg-green-900/50 text-green-400 border-green-800',
    AOR: 'bg-amber-900/50 text-amber-400 border-amber-800',
    outside: 'bg-red-900/50 text-red-400 border-red-800',
  };
  const labels: Record<string, string> = {
    POR: 'Preferred Operating Region',
    AOR: 'Allowable Operating Region',
    outside: 'Outside Operating Region',
  };
  return (
    <span className={`px-2 py-1 text-xs rounded border ${styles[region] || styles.outside}`}>
      {labels[region] || region}
    </span>
  );
}
