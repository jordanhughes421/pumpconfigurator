import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGeometryStore, type ImpellerGeometry } from '../stores/geometryStore';
import { apiGet } from '../lib/api';
import { useState } from 'react';

export function ImpellerDetailPage() {
  const { impellerId } = useParams<{ impellerId: string }>();
  const { modifications, testResults, fetchModifications, fetchTestResults } = useGeometryStore();
  const [impeller, setImpeller] = useState<ImpellerGeometry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!impellerId) return;
    setLoading(true);
    apiGet<ImpellerGeometry>(`/api/geometry/impellers/${impellerId}`).then(d => {
      setImpeller(d);
      setLoading(false);
    });
    fetchModifications({ impellerGeometryId: impellerId });
    fetchTestResults({ impellerGeometryId: impellerId });
  }, [impellerId, fetchModifications, fetchTestResults]);

  if (loading || !impeller) {
    return <p className="text-zinc-400 text-sm">Loading impeller...</p>;
  }

  const modelId = impeller.modelId;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {modelId && (
          <Link to={`/geometry/models/${modelId}`} className="text-zinc-500 hover:text-zinc-300 text-sm">&larr; Model</Link>
        )}
        <h2 className="text-xl font-semibold text-zinc-100">
          {impeller.patternNumber} <span className="text-zinc-500 text-base">Rev {impeller.revision}</span>
        </h2>
      </div>

      {/* Geometry Parameters */}
      <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Geometry Parameters</h3>
        <div className="grid grid-cols-3 gap-x-8 gap-y-2 text-sm">
          <Section title="Inlet">
            <Row label="D1" value={impeller.d1Mm} unit="mm" />
            <Row label="D_hub" value={impeller.dHubMm} unit="mm" />
            <Row label="b1" value={impeller.b1Mm} unit="mm" />
            <Row label={'\u03B21 hub'} value={impeller.beta1HubDeg} unit="\u00B0" />
            <Row label={'\u03B21 shroud'} value={impeller.beta1ShroudDeg} unit="\u00B0" />
          </Section>
          <Section title="Vane">
            <Row label="Z" value={impeller.z} />
            <Row label={'\u03B22'} value={impeller.beta2Deg} unit="\u00B0" />
            <Row label={'\u03B8 wrap'} value={impeller.thetaWrapDeg} unit="\u00B0" />
            <Row label="t1" value={impeller.t1Mm} unit="mm" />
            <Row label="t2" value={impeller.t2Mm} unit="mm" />
            <Row label="Profile" value={impeller.bladeProfileType} />
          </Section>
          <Section title="Exit">
            <Row label="D2 max" value={impeller.d2MaxMm} unit="mm" />
            <Row label="b2" value={impeller.b2Mm} unit="mm" />
            <Row label="A2 total" value={impeller.a2TotalMm2} unit="mm\u00B2" />
            <Row label="Shroud" value={impeller.shroudType} />
            <Row label="Back vanes" value={impeller.hasBackVanes ? 'Yes' : 'No'} />
          </Section>
        </div>
      </div>

      {/* Modification History */}
      <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Modification History ({modifications.length})</h3>
        {modifications.length === 0 ? (
          <p className="text-zinc-500 text-sm">No modifications recorded.</p>
        ) : (
          <div className="space-y-3">
            {modifications.map(mod => (
              <div key={mod.id} className="p-3 border border-zinc-800 rounded bg-zinc-950">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-zinc-100">{mod.modificationCode}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">{mod.modificationCategory}</span>
                    <span className="text-xs text-zinc-500">seq #{mod.sequenceOrder}</span>
                  </div>
                  <div className="text-xs text-zinc-500">
                    {mod.datePerformed && new Date(mod.datePerformed).toLocaleDateString()}
                    {mod.performedBy && ` by ${mod.performedBy}`}
                  </div>
                </div>
                {/* Before/After diff */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-red-400 font-medium">Before:</span>
                    <div className="font-mono text-zinc-400 mt-1">
                      {Object.entries(mod.geometryBefore).map(([k, v]) => (
                        <div key={k}>{k}: {String(v)}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-green-400 font-medium">After:</span>
                    <div className="font-mono text-zinc-400 mt-1">
                      {Object.entries(mod.geometryAfter).map(([k, v]) => (
                        <div key={k}>{k}: {String(v)}</div>
                      ))}
                    </div>
                  </div>
                </div>
                {mod.notes && <p className="text-xs text-zinc-500 mt-2 italic">{mod.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Results */}
      <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Test Results ({testResults.length})</h3>
        {testResults.length === 0 ? (
          <p className="text-zinc-500 text-sm">No test results recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-400 border-b border-zinc-800">
                  <th className="text-left py-2 pr-3">D2</th>
                  <th className="text-left py-2 pr-3">Trim</th>
                  <th className="text-left py-2 pr-3">Q_bep</th>
                  <th className="text-left py-2 pr-3">H_bep</th>
                  <th className="text-left py-2 pr-3">&eta;_bep</th>
                  <th className="text-left py-2 pr-3">P_bep</th>
                  <th className="text-left py-2 pr-3">NPSHr</th>
                  <th className="text-left py-2 pr-3">Type</th>
                  <th className="text-left py-2 pr-3">Date</th>
                  <th className="text-left py-2">Mods Applied</th>
                </tr>
              </thead>
              <tbody>
                {testResults.map(tr => (
                  <tr key={tr.id} className="border-b border-zinc-800/50 text-zinc-300 font-mono">
                    <td className="py-2 pr-3">{tr.d2ActualMm}mm</td>
                    <td className="py-2 pr-3">{tr.trimRatio ?? '--'}</td>
                    <td className="py-2 pr-3">{tr.qBepM3h ?? '--'}</td>
                    <td className="py-2 pr-3">{tr.hBepM ?? '--'}</td>
                    <td className="py-2 pr-3">{tr.etaBepPct ?? '--'}%</td>
                    <td className="py-2 pr-3">{tr.pBepKw ?? '--'}</td>
                    <td className="py-2 pr-3">{tr.npshrAtBepM ?? '--'}</td>
                    <td className="py-2 pr-3 text-zinc-400 font-sans text-xs">{tr.testType ?? '--'}</td>
                    <td className="py-2 pr-3 text-zinc-400 font-sans text-xs">{tr.testDate ? new Date(tr.testDate).toLocaleDateString() : '--'}</td>
                    <td className="py-2 text-zinc-400 font-sans text-xs">{tr.modificationsApplied?.join(', ') || 'none'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value, unit }: { label: string; value: string | number | null | undefined; unit?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="font-mono text-zinc-200">
        {value != null ? `${value}${unit ? ` ${unit}` : ''}` : '--'}
      </span>
    </div>
  );
}
