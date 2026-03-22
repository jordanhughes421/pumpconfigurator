import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { useSelectionStore } from '../stores/selectionStore';
import { useConfigurationStore } from '../stores/configurationStore';
import type { PumpCandidate, DutyPoint } from '@magnum-opus/shared';

export function SelectionPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { activeProject, fetchProject } = useProjectStore();
  const { dutyPoint, constraints, candidates, isSearching, error, setDutyPoint, setConstraints, searchPumps } = useSelectionStore();
  const { createConfiguration } = useConfigurationStore();

  useEffect(() => {
    if (projectId && !activeProject) fetchProject(projectId);
  }, [projectId, activeProject, fetchProject]);

  const handleSearch = () => {
    searchPumps(activeProject?.certifications || []);
  };

  const handleSelect = async (candidate: PumpCandidate) => {
    if (!projectId) return;
    const configId = await createConfiguration({
      project_id: projectId,
      pump_size_id: candidate.pump_size_id,
      tag_number: '',
      service: '',
      duty_flow_m3h: Number(dutyPoint.flow_m3h) || 100,
      duty_head_m: Number(dutyPoint.head_m) || 50,
      npsha_m: Number(dutyPoint.npsha_m) || 8,
      fluid_sg: Number(dutyPoint.fluid_sg) || 1.0,
      fluid_temp_c: Number(dutyPoint.fluid_temperature_c) || 20,
      impeller_trim_mm: candidate.impeller_diameter_mm,
      speed_rpm: candidate.speed_rpm,
    });
    navigate(`/projects/${projectId}/configure/${configId}`);
  };

  const numField = (label: string, key: keyof DutyPoint, unit: string) => (
    <div>
      <label className="text-xs text-zinc-400 block mb-1">{label} ({unit})</label>
      <input
        type="number"
        value={dutyPoint[key] ?? ''}
        onChange={e => setDutyPoint({ [key]: parseFloat(e.target.value) || 0 })}
        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:border-blue-500"
      />
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
        <Link to="/" className="hover:text-zinc-300">Projects</Link>
        <span>/</span>
        <Link to={`/projects/${projectId}`} className="hover:text-zinc-300">{activeProject?.name || '...'}</Link>
        <span>/</span>
        <span className="text-zinc-100">Select Pump</span>
      </div>

      <div className="grid grid-cols-[400px_1fr] gap-6">
        {/* Duty Point Form */}
        <div className="space-y-4">
          <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Duty Point</h3>
            <div className="grid grid-cols-2 gap-3">
              {numField('Flow', 'flow_m3h', 'm\u00B3/h')}
              {numField('Head', 'head_m', 'm')}
              {numField('NPSH Available', 'npsha_m', 'm')}
              {numField('Fluid SG', 'fluid_sg', '')}
              {numField('Viscosity', 'fluid_viscosity_cst', 'cSt')}
              {numField('Temperature', 'fluid_temperature_c', '\u00B0C')}
            </div>
            <div className="mt-3">
              <label className="text-xs text-zinc-400 block mb-1">Fluid Type</label>
              <input
                type="text"
                value={dutyPoint.fluid_type ?? 'water'}
                onChange={e => setDutyPoint({ fluid_type: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Constraints</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Installation</label>
                <select
                  value={constraints.installation_type || 'horizontal'}
                  onChange={e => setConstraints({ installation_type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                  <option value="inline">Inline</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={constraints.vfd || false}
                  onChange={e => setConstraints({ vfd: e.target.checked })}
                  className="rounded border-zinc-600 bg-zinc-800"
                />
                Variable Frequency Drive (VFD)
              </label>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {isSearching ? 'Searching...' : 'Search Pumps'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        {/* Candidate Results */}
        <div>
          {candidates.length > 0 && (
            <div className="border border-zinc-800 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-900 border-b border-zinc-800">
                    <th className="text-left px-3 py-2 text-zinc-400 font-medium">#</th>
                    <th className="text-left px-3 py-2 text-zinc-400 font-medium">Model</th>
                    <th className="text-left px-3 py-2 text-zinc-400 font-medium">Size</th>
                    <th className="text-left px-3 py-2 text-zinc-400 font-medium">Type</th>
                    <th className="text-right px-3 py-2 text-zinc-400 font-medium">Flow</th>
                    <th className="text-right px-3 py-2 text-zinc-400 font-medium">Head</th>
                    <th className="text-right px-3 py-2 text-zinc-400 font-medium">Eff %</th>
                    <th className="text-right px-3 py-2 text-zinc-400 font-medium">NPSH Margin</th>
                    <th className="text-right px-3 py-2 text-zinc-400 font-medium">BEP %</th>
                    <th className="text-center px-3 py-2 text-zinc-400 font-medium">Region</th>
                    <th className="text-right px-3 py-2 text-zinc-400 font-medium">Score</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c, i) => (
                    <tr
                      key={c.pump_size_id}
                      className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-3 py-2 text-zinc-500 font-mono">{i + 1}</td>
                      <td className="px-3 py-2 text-zinc-100 font-mono text-xs">{c.model_code}</td>
                      <td className="px-3 py-2 text-zinc-300 font-mono text-xs">{c.size_designation}</td>
                      <td className="px-3 py-2 text-zinc-400">{c.hi_type_code}</td>
                      <td className="px-3 py-2 text-zinc-300 font-mono text-right">{c.rated_flow_m3h.toFixed(1)}</td>
                      <td className="px-3 py-2 text-zinc-300 font-mono text-right">{c.rated_head_m.toFixed(1)}</td>
                      <td className="px-3 py-2 text-zinc-300 font-mono text-right">{c.rated_efficiency_pct.toFixed(1)}</td>
                      <td className="px-3 py-2 text-zinc-300 font-mono text-right">
                        {(Number(dutyPoint.npsha_m) - c.npshr_at_bep_m).toFixed(1)} m
                      </td>
                      <td className="px-3 py-2 text-zinc-300 font-mono text-right">{c.pct_of_bep.toFixed(0)}%</td>
                      <td className="px-3 py-2 text-center">
                        <RegionBadge region={c.operating_region} />
                      </td>
                      <td className="px-3 py-2 text-zinc-100 font-mono text-right font-medium">{c.score.toFixed(1)}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleSelect(c)}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!isSearching && candidates.length === 0 && (
            <div className="flex items-center justify-center h-64 text-zinc-500 text-sm">
              Enter duty point parameters and click Search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RegionBadge({ region }: { region: string }) {
  const colors: Record<string, string> = {
    POR: 'bg-green-900/50 text-green-400 border-green-800',
    AOR: 'bg-amber-900/50 text-amber-400 border-amber-800',
    outside: 'bg-red-900/50 text-red-400 border-red-800',
  };
  return (
    <span className={`px-1.5 py-0.5 text-[10px] rounded border ${colors[region] || colors.outside}`}>
      {region}
    </span>
  );
}
