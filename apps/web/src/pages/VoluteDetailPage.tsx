import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGeometryStore, type VoluteGeometry } from '../stores/geometryStore';
import { apiGet } from '../lib/api';

export function VoluteDetailPage() {
  const { voluteId } = useParams<{ voluteId: string }>();
  const { modifications, fetchModifications } = useGeometryStore();
  const [volute, setVolute] = useState<VoluteGeometry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!voluteId) return;
    setLoading(true);
    apiGet<VoluteGeometry>(`/api/geometry/volutes/${voluteId}`).then(d => {
      setVolute(d);
      setLoading(false);
    });
    fetchModifications({ voluteGeometryId: voluteId });
  }, [voluteId, fetchModifications]);

  if (loading || !volute) {
    return <p className="text-zinc-400 text-sm">Loading volute...</p>;
  }

  const modelId = volute.modelId;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {modelId && (
          <Link to={`/geometry/models/${modelId}`} className="text-zinc-500 hover:text-zinc-300 text-sm">&larr; Model</Link>
        )}
        <h2 className="text-xl font-semibold text-zinc-100">
          {volute.patternNumber}
          {volute.voluteType && <span className="text-zinc-500 text-base ml-2">({volute.voluteType})</span>}
        </h2>
      </div>

      {/* Geometry Parameters */}
      <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Volute Parameters</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <Row label="A3" value={volute.a3Mm2} unit="mm\u00B2" />
          <Row label="b3" value={volute.b3Mm} unit="mm" />
          <Row label="D3" value={volute.d3Mm} unit="mm" />
          <Row label={'\u03B4 cutwater'} value={volute.deltaCwMm} unit="mm" />
          <Row label={'\u03B8 cutwater'} value={volute.thetaCwDeg} unit="\u00B0" />
          <Row label="CW lip profile" value={volute.cwLipProfile} />
          <Row label="Splitter" value={volute.hasSplitter ? 'Yes' : 'No'} />
          <Row label="Diffuser vanes" value={volute.hasDiffuserVanes ? 'Yes' : 'No'} />
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
                  </div>
                  <div className="text-xs text-zinc-500">
                    {mod.datePerformed && new Date(mod.datePerformed).toLocaleDateString()}
                    {mod.performedBy && ` by ${mod.performedBy}`}
                  </div>
                </div>
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
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Associated Test Results ({volute.testResults?.length ?? 0})</h3>
        {(!volute.testResults || volute.testResults.length === 0) ? (
          <p className="text-zinc-500 text-sm">No test results.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-400 border-b border-zinc-800">
                  <th className="text-left py-2 pr-3">D2</th>
                  <th className="text-left py-2 pr-3">Q_bep</th>
                  <th className="text-left py-2 pr-3">H_bep</th>
                  <th className="text-left py-2 pr-3">&eta;_bep</th>
                  <th className="text-left py-2 pr-3">Type</th>
                  <th className="text-left py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {volute.testResults.map(tr => (
                  <tr key={tr.id} className="border-b border-zinc-800/50 text-zinc-300 font-mono">
                    <td className="py-2 pr-3">{tr.d2ActualMm}mm</td>
                    <td className="py-2 pr-3">{tr.qBepM3h ?? '--'}</td>
                    <td className="py-2 pr-3">{tr.hBepM ?? '--'}</td>
                    <td className="py-2 pr-3">{tr.etaBepPct ?? '--'}%</td>
                    <td className="py-2 pr-3 font-sans text-xs text-zinc-400">{tr.testType ?? '--'}</td>
                    <td className="py-2 font-sans text-xs text-zinc-400">{tr.testDate ? new Date(tr.testDate).toLocaleDateString() : '--'}</td>
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
