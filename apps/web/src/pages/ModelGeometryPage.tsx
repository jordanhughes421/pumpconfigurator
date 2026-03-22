import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGeometryStore } from '../stores/geometryStore';

export function ModelGeometryPage() {
  const { modelId } = useParams<{ modelId: string }>();
  const {
    impellers, volutes, loading,
    fetchImpellers, fetchVolutes,
    createImpeller, deleteImpeller,
    createVolute, deleteVolute,
  } = useGeometryStore();
  const [showImpForm, setShowImpForm] = useState(false);
  const [showVolForm, setShowVolForm] = useState(false);

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

      {loading && impellers.length === 0 && volutes.length === 0 && (
        <p className="text-zinc-400 text-sm">Loading...</p>
      )}

      {/* Impellers */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-zinc-300">Impeller Geometries ({impellers.length})</h3>
          <button onClick={() => setShowImpForm(!showImpForm)}
            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500">
            {showImpForm ? 'Cancel' : '+ Add Impeller'}
          </button>
        </div>

        {showImpForm && (
          <ImpellerForm modelId={modelId!} onCreate={async (data) => {
            await createImpeller(data);
            setShowImpForm(false);
            fetchImpellers(modelId);
          }} />
        )}

        <div className="grid gap-3">
          {impellers.map(imp => (
            <div key={imp.id} className="p-4 border border-zinc-800 rounded-lg bg-zinc-900 hover:border-zinc-600 transition-colors">
              <div className="flex items-center justify-between">
                <Link to={`/geometry/impellers/${imp.id}`} className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-zinc-100">{imp.patternNumber}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">Rev {imp.revision}</span>
                  </div>
                  <div className="flex gap-4 text-sm text-zinc-400 mt-1">
                    <span>D2={imp.d2MaxMm}mm</span>
                    {imp.z && <span>Z={imp.z}</span>}
                    {imp.beta2Deg && <span>&beta;2={imp.beta2Deg}&deg;</span>}
                    <span className="text-zinc-600">{imp.testResults.length} tests</span>
                    <span className="text-zinc-600">{imp.modifications.length} mods</span>
                  </div>
                </Link>
                <button onClick={async () => {
                  if (confirm(`Delete impeller ${imp.patternNumber}? This will also delete associated modifications and test results.`)) {
                    await deleteImpeller(imp.id);
                  }
                }} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 ml-3">Delete</button>
              </div>
            </div>
          ))}
          {impellers.length === 0 && !loading && !showImpForm && (
            <p className="text-zinc-500 text-sm">No impeller geometries recorded.</p>
          )}
        </div>
      </section>

      {/* Volutes */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-zinc-300">Volute Geometries ({volutes.length})</h3>
          <button onClick={() => setShowVolForm(!showVolForm)}
            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500">
            {showVolForm ? 'Cancel' : '+ Add Volute'}
          </button>
        </div>

        {showVolForm && (
          <VoluteForm modelId={modelId!} onCreate={async (data) => {
            await createVolute(data);
            setShowVolForm(false);
            fetchVolutes(modelId);
          }} />
        )}

        <div className="grid gap-3">
          {volutes.map(vol => (
            <div key={vol.id} className="p-4 border border-zinc-800 rounded-lg bg-zinc-900 hover:border-zinc-600 transition-colors">
              <div className="flex items-center justify-between">
                <Link to={`/geometry/volutes/${vol.id}`} className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-zinc-100">{vol.patternNumber}</span>
                    {vol.voluteType && <span className="text-xs px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">{vol.voluteType}</span>}
                  </div>
                  <div className="flex gap-4 text-sm text-zinc-400 mt-1">
                    {vol.a3Mm2 && <span>A3={vol.a3Mm2}mm&sup2;</span>}
                    {vol.deltaCwMm && <span>&delta;cw={vol.deltaCwMm}mm</span>}
                    <span className="text-zinc-600">{vol.testResults.length} tests</span>
                    <span className="text-zinc-600">{vol.modifications.length} mods</span>
                  </div>
                </Link>
                <button onClick={async () => {
                  if (confirm(`Delete volute ${vol.patternNumber}? This will also delete associated modifications and test results.`)) {
                    await deleteVolute(vol.id);
                  }
                }} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 ml-3">Delete</button>
              </div>
            </div>
          ))}
          {volutes.length === 0 && !loading && !showVolForm && (
            <p className="text-zinc-500 text-sm">No volute geometries recorded.</p>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Form helpers ──────────────────────────────────────────────────

function Inp({ label, name, value, onChange, type = 'text', required = false }: {
  label: string; name: string; value: string; onChange: (n: string, v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <label className="block text-xs">
      <span className="text-zinc-400">{label}</span>
      <input type={type} value={value} required={required}
        onChange={e => onChange(name, e.target.value)}
        className="mt-0.5 w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-zinc-100 text-xs" />
    </label>
  );
}

function Chk({ label, name, checked, onChange }: {
  label: string; name: string; checked: boolean; onChange: (n: string, v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-zinc-400">
      <input type="checkbox" checked={checked} onChange={e => onChange(name, e.target.checked)}
        className="rounded border-zinc-600 bg-zinc-800" />
      {label}
    </label>
  );
}

// ─── Impeller Create Form ──────────────────────────────────────────

function ImpellerForm({ modelId, onCreate }: { modelId: string; onCreate: (data: any) => Promise<void> }) {
  const [f, setF] = useState({
    patternNumber: '', revision: 'A', d2MaxMm: '', b2Mm: '', d1Mm: '', dHubMm: '',
    beta1HubDeg: '', beta1ShroudDeg: '', b1Mm: '', z: '', beta2Deg: '',
    thetaWrapDeg: '', t1Mm: '', t2Mm: '', a2TotalMm2: '',
    shroudType: 'closed', bladeProfileType: 'single_arc', hasBackVanes: false,
  });
  const [saving, setSaving] = useState(false);

  const set = (n: string, v: string | boolean) => setF(prev => ({ ...prev, [n]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onCreate({
        modelId,
        patternNumber: f.patternNumber,
        revision: f.revision,
        d2MaxMm: Number(f.d2MaxMm),
        b2Mm: f.b2Mm ? Number(f.b2Mm) : null,
        d1Mm: f.d1Mm ? Number(f.d1Mm) : null,
        dHubMm: f.dHubMm ? Number(f.dHubMm) : null,
        beta1HubDeg: f.beta1HubDeg ? Number(f.beta1HubDeg) : null,
        beta1ShroudDeg: f.beta1ShroudDeg ? Number(f.beta1ShroudDeg) : null,
        b1Mm: f.b1Mm ? Number(f.b1Mm) : null,
        z: f.z ? Number(f.z) : null,
        beta2Deg: f.beta2Deg ? Number(f.beta2Deg) : null,
        thetaWrapDeg: f.thetaWrapDeg ? Number(f.thetaWrapDeg) : null,
        t1Mm: f.t1Mm ? Number(f.t1Mm) : null,
        t2Mm: f.t2Mm ? Number(f.t2Mm) : null,
        a2TotalMm2: f.a2TotalMm2 ? Number(f.a2TotalMm2) : null,
        shroudType: f.shroudType,
        bladeProfileType: f.bladeProfileType,
        hasBackVanes: f.hasBackVanes,
      });
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="p-4 border border-zinc-700 rounded-lg bg-zinc-950 mb-4 space-y-3">
      <h4 className="text-xs font-medium text-zinc-300">New Impeller Geometry</h4>
      <div className="grid grid-cols-4 gap-3">
        <Inp label="Pattern Number *" name="patternNumber" value={f.patternNumber} onChange={set} required />
        <Inp label="Revision" name="revision" value={f.revision} onChange={set} />
        <Inp label="D2 max (mm) *" name="d2MaxMm" value={f.d2MaxMm} onChange={set} type="number" required />
        <Inp label="b2 (mm)" name="b2Mm" value={f.b2Mm} onChange={set} type="number" />
        <Inp label="D1 (mm)" name="d1Mm" value={f.d1Mm} onChange={set} type="number" />
        <Inp label="D hub (mm)" name="dHubMm" value={f.dHubMm} onChange={set} type="number" />
        <Inp label="b1 (mm)" name="b1Mm" value={f.b1Mm} onChange={set} type="number" />
        <Inp label="Z (vanes)" name="z" value={f.z} onChange={set} type="number" />
        <Inp label="&beta;1 hub (&deg;)" name="beta1HubDeg" value={f.beta1HubDeg} onChange={set} type="number" />
        <Inp label="&beta;1 shroud (&deg;)" name="beta1ShroudDeg" value={f.beta1ShroudDeg} onChange={set} type="number" />
        <Inp label="&beta;2 (&deg;)" name="beta2Deg" value={f.beta2Deg} onChange={set} type="number" />
        <Inp label="&theta; wrap (&deg;)" name="thetaWrapDeg" value={f.thetaWrapDeg} onChange={set} type="number" />
        <Inp label="t1 (mm)" name="t1Mm" value={f.t1Mm} onChange={set} type="number" />
        <Inp label="t2 (mm)" name="t2Mm" value={f.t2Mm} onChange={set} type="number" />
        <Inp label="A2 total (mm&sup2;)" name="a2TotalMm2" value={f.a2TotalMm2} onChange={set} type="number" />
        <Inp label="Shroud type" name="shroudType" value={f.shroudType} onChange={set} />
      </div>
      <div className="flex items-center gap-4">
        <Chk label="Has back vanes" name="hasBackVanes" checked={f.hasBackVanes} onChange={(n, v) => set(n, v)} />
        <button type="submit" disabled={saving}
          className="ml-auto text-xs px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50">
          {saving ? 'Saving...' : 'Create Impeller'}
        </button>
      </div>
    </form>
  );
}

// ─── Volute Create Form ────────────────────────────────────────────

function VoluteForm({ modelId, onCreate }: { modelId: string; onCreate: (data: any) => Promise<void> }) {
  const [f, setF] = useState({
    patternNumber: '', voluteType: 'single', a3Mm2: '', b3Mm: '', d3Mm: '',
    deltaCwMm: '', thetaCwDeg: '', cwLipProfile: 'sharp',
    hasSplitter: false, hasDiffuserVanes: false,
  });
  const [saving, setSaving] = useState(false);

  const set = (n: string, v: string | boolean) => setF(prev => ({ ...prev, [n]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onCreate({
        modelId,
        patternNumber: f.patternNumber,
        voluteType: f.voluteType,
        a3Mm2: f.a3Mm2 ? Number(f.a3Mm2) : null,
        b3Mm: f.b3Mm ? Number(f.b3Mm) : null,
        d3Mm: f.d3Mm ? Number(f.d3Mm) : null,
        deltaCwMm: f.deltaCwMm ? Number(f.deltaCwMm) : null,
        thetaCwDeg: f.thetaCwDeg ? Number(f.thetaCwDeg) : null,
        cwLipProfile: f.cwLipProfile,
        hasSplitter: f.hasSplitter,
        hasDiffuserVanes: f.hasDiffuserVanes,
      });
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="p-4 border border-zinc-700 rounded-lg bg-zinc-950 mb-4 space-y-3">
      <h4 className="text-xs font-medium text-zinc-300">New Volute Geometry</h4>
      <div className="grid grid-cols-4 gap-3">
        <Inp label="Pattern Number *" name="patternNumber" value={f.patternNumber} onChange={set} required />
        <Inp label="Volute type" name="voluteType" value={f.voluteType} onChange={set} />
        <Inp label="A3 (mm&sup2;)" name="a3Mm2" value={f.a3Mm2} onChange={set} type="number" />
        <Inp label="b3 (mm)" name="b3Mm" value={f.b3Mm} onChange={set} type="number" />
        <Inp label="D3 (mm)" name="d3Mm" value={f.d3Mm} onChange={set} type="number" />
        <Inp label="&delta; cutwater (mm)" name="deltaCwMm" value={f.deltaCwMm} onChange={set} type="number" />
        <Inp label="&theta; cutwater (&deg;)" name="thetaCwDeg" value={f.thetaCwDeg} onChange={set} type="number" />
        <Inp label="CW lip profile" name="cwLipProfile" value={f.cwLipProfile} onChange={set} />
      </div>
      <div className="flex items-center gap-4">
        <Chk label="Has splitter" name="hasSplitter" checked={f.hasSplitter} onChange={(n, v) => set(n, v)} />
        <Chk label="Has diffuser vanes" name="hasDiffuserVanes" checked={f.hasDiffuserVanes} onChange={(n, v) => set(n, v)} />
        <button type="submit" disabled={saving}
          className="ml-auto text-xs px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50">
          {saving ? 'Saving...' : 'Create Volute'}
        </button>
      </div>
    </form>
  );
}
