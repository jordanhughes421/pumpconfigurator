import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGeometryStore } from '../stores/geometryStore';

export function GeometryDashboard() {
  const { modelSummaries, loading, fetchModelSummaries } = useGeometryStore();

  useEffect(() => { fetchModelSummaries(); }, [fetchModelSummaries]);

  if (loading && modelSummaries.length === 0) {
    return <p className="text-zinc-400 text-sm">Loading geometry data...</p>;
  }

  const withGeometry = modelSummaries.filter(m => m.impellerCount > 0 || m.voluteCount > 0);
  const withoutGeometry = modelSummaries.filter(m => m.impellerCount === 0 && m.voluteCount === 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">Geometry Dashboard</h2>
          <p className="text-sm text-zinc-400 mt-1">Impeller & volute geometry data, modifications, and correlations</p>
        </div>
        <Link
          to="/geometry/correlations"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-500 transition-colors"
        >
          Correlation Analysis
        </Link>
      </div>

      {modelSummaries.length === 0 ? (
        <p className="text-zinc-500 text-sm">No pump models found.</p>
      ) : (
        <>
          {/* Models with geometry */}
          {withGeometry.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Models with Geometry Data ({withGeometry.length})</h3>
              <div className="grid gap-4">
                {withGeometry.map(m => (
                  <Link
                    key={m.id}
                    to={`/geometry/models/${m.id}`}
                    className="block p-5 border border-zinc-800 rounded-lg bg-zinc-900 hover:border-zinc-600 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-medium text-zinc-100">{m.modelCode}</h3>
                        <p className="text-sm text-zinc-400 mt-0.5">
                          {m.familyName} <span className="text-zinc-600">|</span> {m.hiTypeCode}
                        </p>
                      </div>
                      <div className="flex gap-6 text-center">
                        <Stat label="Impellers" value={m.impellerCount} />
                        <Stat label="Volutes" value={m.voluteCount} />
                        <Stat label="Tests" value={m.testResultCount} />
                        <Stat label="Mods" value={m.modificationCount} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Models without geometry — add data */}
          {withoutGeometry.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-zinc-400 mb-3">Other Models — Add Geometry Data</h3>
              <div className="grid gap-2">
                {withoutGeometry.map(m => (
                  <Link
                    key={m.id}
                    to={`/geometry/models/${m.id}`}
                    className="flex items-center justify-between p-4 border border-zinc-800/50 rounded-lg bg-zinc-900/50 hover:border-zinc-600 transition-colors"
                  >
                    <div>
                      <span className="text-sm font-medium text-zinc-300">{m.modelCode}</span>
                      <span className="text-xs text-zinc-500 ml-2">{m.familyName} | {m.hiTypeCode}</span>
                    </div>
                    <span className="text-xs text-zinc-500">No geometry data yet</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-lg font-mono text-zinc-100">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}
