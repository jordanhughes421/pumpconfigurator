import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGeometryStore } from '../stores/geometryStore';

export function ModelGeometryPage() {
  const { modelId } = useParams<{ modelId: string }>();
  const { impellers, volutes, loading, fetchImpellers, fetchVolutes } = useGeometryStore();

  useEffect(() => {
    if (modelId) {
      fetchImpellers(modelId);
      fetchVolutes(modelId);
    }
  }, [modelId, fetchImpellers, fetchVolutes]);

  const modelCode = impellers[0]?.model?.modelCode || volutes[0]?.model?.modelCode || 'Model';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/geometry" className="text-zinc-500 hover:text-zinc-300 text-sm">&larr; Dashboard</Link>
        <h2 className="text-xl font-semibold text-zinc-100">{modelCode}</h2>
      </div>

      {loading && impellers.length === 0 && (
        <p className="text-zinc-400 text-sm">Loading...</p>
      )}

      {/* Impellers */}
      <section>
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Impeller Geometries ({impellers.length})</h3>
        <div className="grid gap-3">
          {impellers.map(imp => (
            <Link
              key={imp.id}
              to={`/geometry/impellers/${imp.id}`}
              className="p-4 border border-zinc-800 rounded-lg bg-zinc-900 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-zinc-100">{imp.patternNumber}</span>
                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">Rev {imp.revision}</span>
                </div>
                <div className="flex gap-4 text-sm text-zinc-400">
                  <span>D2={imp.d2MaxMm}mm</span>
                  {imp.z && <span>Z={imp.z}</span>}
                  {imp.beta2Deg && <span>&beta;2={imp.beta2Deg}&deg;</span>}
                  <span className="text-zinc-600">{imp.testResults.length} tests</span>
                  <span className="text-zinc-600">{imp.modifications.length} mods</span>
                </div>
              </div>
            </Link>
          ))}
          {impellers.length === 0 && !loading && (
            <p className="text-zinc-500 text-sm">No impeller geometries recorded.</p>
          )}
        </div>
      </section>

      {/* Volutes */}
      <section>
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Volute Geometries ({volutes.length})</h3>
        <div className="grid gap-3">
          {volutes.map(vol => (
            <Link
              key={vol.id}
              to={`/geometry/volutes/${vol.id}`}
              className="p-4 border border-zinc-800 rounded-lg bg-zinc-900 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-zinc-100">{vol.patternNumber}</span>
                  {vol.voluteType && (
                    <span className="ml-2 text-xs px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">{vol.voluteType}</span>
                  )}
                </div>
                <div className="flex gap-4 text-sm text-zinc-400">
                  {vol.a3Mm2 && <span>A3={vol.a3Mm2}mm&sup2;</span>}
                  {vol.deltaCwMm && <span>&delta;cw={vol.deltaCwMm}mm</span>}
                  <span className="text-zinc-600">{vol.testResults.length} tests</span>
                  <span className="text-zinc-600">{vol.modifications.length} mods</span>
                </div>
              </div>
            </Link>
          ))}
          {volutes.length === 0 && !loading && (
            <p className="text-zinc-500 text-sm">No volute geometries recorded.</p>
          )}
        </div>
      </section>
    </div>
  );
}
