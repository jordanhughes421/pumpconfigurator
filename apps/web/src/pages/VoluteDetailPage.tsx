import { useEffect, useRef, useCallback, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useGeometryStore,
  type VoluteGeometry, type GeometryTestResult, type TestDataPoint, type ImpellerGeometry,
} from '../stores/geometryStore';
import { apiGet } from '../lib/api';
import * as d3 from 'd3';

export function VoluteDetailPage() {
  const { voluteId } = useParams<{ voluteId: string }>();
  const store = useGeometryStore();
  const { modifications, testResults, fetchModifications, fetchTestResults, impellers, fetchImpellers } = store;
  const [volute, setVolute] = useState<VoluteGeometry | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [showModForm, setShowModForm] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);

  const reload = useCallback(() => {
    if (!voluteId) return;
    apiGet<VoluteGeometry>(`/api/geometry/volutes/${voluteId}`).then(d => {
      setVolute(d);
      setLoading(false);
    });
    fetchModifications({ voluteGeometryId: voluteId });
    fetchTestResults({ voluteGeometryId: voluteId });
  }, [voluteId, fetchModifications, fetchTestResults]);

  useEffect(() => {
    setLoading(true);
    reload();
    if (voluteId) {
      apiGet<VoluteGeometry>(`/api/geometry/volutes/${voluteId}`).then(d => {
        if (d.modelId) fetchImpellers(d.modelId);
      });
    }
  }, [voluteId, reload, fetchImpellers]);

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
        <button onClick={() => setEditing(!editing)}
          className="ml-auto text-xs px-3 py-1.5 border border-zinc-700 text-zinc-300 rounded hover:bg-zinc-800">
          {editing ? 'Cancel Edit' : 'Edit Geometry'}
        </button>
      </div>

      {/* Geometry Parameters (view or edit) */}
      {editing ? (
        <EditVoluteForm volute={volute} onSave={async (data) => {
          await store.updateVolute(volute.id, data);
          setEditing(false);
          reload();
        }} onCancel={() => setEditing(false)} />
      ) : (
        <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-300 mb-3">Volute Parameters</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <Row label="Pattern #" value={volute.patternNumber} />
            <Row label="Volute type" value={volute.voluteType} />
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
      )}

      {/* Modification History */}
      <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-zinc-300">Modification History ({modifications.length})</h3>
          <button onClick={() => setShowModForm(!showModForm)}
            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500">
            {showModForm ? 'Cancel' : '+ Add Modification'}
          </button>
        </div>

        {showModForm && (
          <ModificationForm
            targetType="volute" targetId={voluteId!}
            nextSeq={(modifications.length > 0 ? Math.max(...modifications.map(m => m.sequenceOrder)) : 0) + 1}
            onSave={async () => { setShowModForm(false); reload(); }}
          />
        )}

        {modifications.length === 0 && !showModForm ? (
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">
                      {mod.datePerformed && new Date(mod.datePerformed).toLocaleDateString()}
                      {mod.performedBy && ` by ${mod.performedBy}`}
                    </span>
                    <button onClick={async () => {
                      if (confirm('Delete this modification?')) {
                        await store.deleteModification(mod.id);
                        reload();
                      }
                    }} className="text-xs text-red-400 hover:text-red-300">Delete</button>
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
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-zinc-300">Test Results ({testResults.length})</h3>
          <button onClick={() => setShowTestForm(!showTestForm)}
            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500">
            {showTestForm ? 'Cancel' : '+ Add Test Result'}
          </button>
        </div>

        {showTestForm && (
          <TestResultForm
            voluteId={voluteId!}
            impellers={impellers}
            onSave={async () => { setShowTestForm(false); reload(); }}
          />
        )}

        {testResults.length === 0 && !showTestForm ? (
          <p className="text-zinc-500 text-sm">No test results recorded.</p>
        ) : (
          <div className="space-y-4">
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
                    <th className="text-left py-2 pr-3">Mods</th>
                    <th className="text-left py-2 pr-3">Data</th>
                    <th className="text-left py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.map(tr => {
                    const hasData = (tr.dataPointsBefore && tr.dataPointsBefore.length > 0) ||
                                    (tr.dataPointsAfter && tr.dataPointsAfter.length > 0);
                    const isExpanded = expandedResult === tr.id;
                    return (
                      <tr key={tr.id} className="border-b border-zinc-800/50 text-zinc-300 font-mono">
                        <td className="py-2 pr-3 cursor-pointer" onClick={() => hasData && setExpandedResult(isExpanded ? null : tr.id)}>{tr.d2ActualMm}mm</td>
                        <td className="py-2 pr-3">{tr.trimRatio ?? '--'}</td>
                        <td className="py-2 pr-3">{tr.qBepM3h ?? '--'}</td>
                        <td className="py-2 pr-3">{tr.hBepM ?? '--'}</td>
                        <td className="py-2 pr-3">{tr.etaBepPct ?? '--'}%</td>
                        <td className="py-2 pr-3">{tr.pBepKw ?? '--'}</td>
                        <td className="py-2 pr-3">{tr.npshrAtBepM ?? '--'}</td>
                        <td className="py-2 pr-3 text-zinc-400 font-sans text-xs">{tr.modificationsApplied?.join(', ') || 'none'}</td>
                        <td className="py-2 pr-3 text-zinc-400 font-sans text-xs cursor-pointer" onClick={() => hasData && setExpandedResult(isExpanded ? null : tr.id)}>
                          {hasData ? <span className={isExpanded ? 'text-blue-400' : 'text-zinc-500'}>{isExpanded ? '\u25BC' : '\u25B6'} {(tr.dataPointsAfter?.length || 0)} pts</span> : '--'}
                        </td>
                        <td className="py-2">
                          <button onClick={async () => {
                            if (confirm('Delete this test result?')) {
                              await store.deleteTestResult(tr.id);
                              reload();
                            }
                          }} className="text-xs text-red-400 hover:text-red-300">Del</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {expandedResult && (() => {
              const tr = testResults.find(r => r.id === expandedResult);
              if (!tr) return null;
              return <TestResultDetail result={tr} />;
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Edit Volute Form ──────────────────────────────────────────────

function EditVoluteForm({ volute, onSave, onCancel }: {
  volute: VoluteGeometry; onSave: (data: any) => Promise<void>; onCancel: () => void;
}) {
  const [f, setF] = useState({
    patternNumber: volute.patternNumber,
    voluteType: volute.voluteType ?? '',
    a3Mm2: volute.a3Mm2 ?? '',
    b3Mm: volute.b3Mm ?? '',
    d3Mm: volute.d3Mm ?? '',
    deltaCwMm: volute.deltaCwMm ?? '',
    thetaCwDeg: volute.thetaCwDeg ?? '',
    cwLipProfile: volute.cwLipProfile ?? '',
    hasSplitter: volute.hasSplitter,
    hasDiffuserVanes: volute.hasDiffuserVanes,
  });
  const [saving, setSaving] = useState(false);
  const set = (n: string, v: string | boolean) => setF(prev => ({ ...prev, [n]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const toN = (v: string) => v ? Number(v) : null;
      await onSave({
        patternNumber: f.patternNumber,
        voluteType: f.voluteType || null,
        a3Mm2: toN(f.a3Mm2),
        b3Mm: toN(f.b3Mm),
        d3Mm: toN(f.d3Mm),
        deltaCwMm: toN(f.deltaCwMm),
        thetaCwDeg: toN(f.thetaCwDeg),
        cwLipProfile: f.cwLipProfile || null,
        hasSplitter: f.hasSplitter,
        hasDiffuserVanes: f.hasDiffuserVanes,
      });
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="p-4 border border-blue-800 rounded-lg bg-zinc-900 space-y-3">
      <h3 className="text-sm font-medium text-zinc-300">Edit Volute Parameters</h3>
      <div className="grid grid-cols-4 gap-3">
        <Inp label="Pattern #" name="patternNumber" value={f.patternNumber} onChange={set} />
        <Inp label="Volute type" name="voluteType" value={f.voluteType} onChange={set} />
        <Inp label="A3 (mm&sup2;)" name="a3Mm2" value={f.a3Mm2} onChange={set} type="number" />
        <Inp label="b3 (mm)" name="b3Mm" value={f.b3Mm} onChange={set} type="number" />
        <Inp label="D3 (mm)" name="d3Mm" value={f.d3Mm} onChange={set} type="number" />
        <Inp label="&delta; cutwater (mm)" name="deltaCwMm" value={f.deltaCwMm} onChange={set} type="number" />
        <Inp label="&theta; cutwater (&deg;)" name="thetaCwDeg" value={f.thetaCwDeg} onChange={set} type="number" />
        <Inp label="CW lip profile" name="cwLipProfile" value={f.cwLipProfile} onChange={set} />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <input type="checkbox" checked={f.hasSplitter} onChange={e => set('hasSplitter', e.target.checked)} />
          Splitter
        </label>
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <input type="checkbox" checked={f.hasDiffuserVanes} onChange={e => set('hasDiffuserVanes', e.target.checked)} />
          Diffuser vanes
        </label>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={onCancel} className="text-xs px-3 py-1.5 border border-zinc-700 text-zinc-400 rounded hover:bg-zinc-800">Cancel</button>
          <button type="submit" disabled={saving} className="text-xs px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── Modification Form ─────────────────────────────────────────────

function ModificationForm({ targetType, targetId, nextSeq, onSave }: {
  targetType: 'impeller' | 'volute'; targetId: string; nextSeq: number; onSave: () => Promise<void>;
}) {
  const { createModification } = useGeometryStore();
  const [f, setF] = useState({
    modificationCode: '', modificationCategory: 'cutwater', sequenceOrder: String(nextSeq),
    beforeKey: '', beforeVal: '', afterKey: '', afterVal: '',
    datePerformed: '', performedBy: '', notes: '',
  });
  const [beforePairs, setBeforePairs] = useState<[string, string][]>([]);
  const [afterPairs, setAfterPairs] = useState<[string, string][]>([]);
  const [saving, setSaving] = useState(false);
  const set = (n: string, v: string) => setF(prev => ({ ...prev, [n]: v }));

  const addBefore = () => { if (f.beforeKey) { setBeforePairs([...beforePairs, [f.beforeKey, f.beforeVal]]); setF(p => ({ ...p, beforeKey: '', beforeVal: '' })); } };
  const addAfter = () => { if (f.afterKey) { setAfterPairs([...afterPairs, [f.afterKey, f.afterVal]]); setF(p => ({ ...p, afterKey: '', afterVal: '' })); } };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const gBefore: Record<string, number> = {};
      beforePairs.forEach(([k, v]) => { gBefore[k] = Number(v); });
      const gAfter: Record<string, number> = {};
      afterPairs.forEach(([k, v]) => { gAfter[k] = Number(v); });

      await createModification({
        modificationCode: f.modificationCode,
        modificationCategory: f.modificationCategory,
        targetType,
        ...(targetType === 'impeller' ? { impellerGeometryId: targetId } : { voluteGeometryId: targetId }),
        sequenceOrder: Number(f.sequenceOrder),
        geometryBefore: gBefore,
        geometryAfter: gAfter,
        datePerformed: f.datePerformed || null,
        performedBy: f.performedBy || null,
        notes: f.notes || null,
      });
      await onSave();
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="p-4 border border-zinc-700 rounded-lg bg-zinc-950 mb-4 space-y-3">
      <h4 className="text-xs font-medium text-zinc-300">New Modification</h4>
      <div className="grid grid-cols-4 gap-3">
        <Inp label="Code *" name="modificationCode" value={f.modificationCode} onChange={set} required />
        <Inp label="Category" name="modificationCategory" value={f.modificationCategory} onChange={set} />
        <Inp label="Seq #" name="sequenceOrder" value={f.sequenceOrder} onChange={set} type="number" />
        <Inp label="Date" name="datePerformed" value={f.datePerformed} onChange={set} type="date" />
        <Inp label="Performed by" name="performedBy" value={f.performedBy} onChange={set} />
        <div className="col-span-3">
          <Inp label="Notes" name="notes" value={f.notes} onChange={set} />
        </div>
      </div>

      {/* Before/After key-value pairs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-xs text-red-400 font-medium">Before values:</span>
          <div className="flex gap-1 mt-1">
            <input placeholder="key" value={f.beforeKey} onChange={e => set('beforeKey', e.target.value)}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100" />
            <input placeholder="value" value={f.beforeVal} onChange={e => set('beforeVal', e.target.value)} type="number"
              className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100" />
            <button type="button" onClick={addBefore} className="text-xs px-2 py-1 bg-zinc-700 rounded text-zinc-300">+</button>
          </div>
          {beforePairs.map(([k, v], i) => (
            <div key={i} className="flex items-center gap-1 mt-1 text-xs font-mono text-zinc-400">
              <span>{k}: {v}</span>
              <button type="button" onClick={() => setBeforePairs(beforePairs.filter((_, j) => j !== i))} className="text-red-500 ml-1">&times;</button>
            </div>
          ))}
        </div>
        <div>
          <span className="text-xs text-green-400 font-medium">After values:</span>
          <div className="flex gap-1 mt-1">
            <input placeholder="key" value={f.afterKey} onChange={e => set('afterKey', e.target.value)}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100" />
            <input placeholder="value" value={f.afterVal} onChange={e => set('afterVal', e.target.value)} type="number"
              className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100" />
            <button type="button" onClick={addAfter} className="text-xs px-2 py-1 bg-zinc-700 rounded text-zinc-300">+</button>
          </div>
          {afterPairs.map(([k, v], i) => (
            <div key={i} className="flex items-center gap-1 mt-1 text-xs font-mono text-zinc-400">
              <span>{k}: {v}</span>
              <button type="button" onClick={() => setAfterPairs(afterPairs.filter((_, j) => j !== i))} className="text-green-500 ml-1">&times;</button>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={saving}
        className="text-xs px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50">
        {saving ? 'Saving...' : 'Add Modification'}
      </button>
    </form>
  );
}

// ─── Test Result Form ──────────────────────────────────────────────

function TestResultForm({ voluteId, impellers, onSave }: {
  voluteId: string; impellers: ImpellerGeometry[]; onSave: () => Promise<void>;
}) {
  const { createTestResult } = useGeometryStore();
  const [f, setF] = useState({
    impellerGeometryId: impellers[0]?.id ?? '',
    d2ActualMm: '', speedRpm: '', trimRatio: '',
    qBepM3h: '', hBepM: '', etaBepPct: '', pBepKw: '', npshrAtBepM: '', hShutoffM: '',
    testType: 'field', testDate: '', modsApplied: '',
  });
  const [beforePts, setBeforePts] = useState<TestDataPoint[]>([]);
  const [afterPts, setAfterPts] = useState<TestDataPoint[]>([]);
  const [newBefore, setNewBefore] = useState({ q: '', h: '', p: '', eta: '', npshr: '' });
  const [newAfter, setNewAfter] = useState({ q: '', h: '', p: '', eta: '', npshr: '' });
  const [saving, setSaving] = useState(false);
  const set = (n: string, v: string) => setF(prev => ({ ...prev, [n]: v }));

  const addPt = (target: 'before' | 'after') => {
    const src = target === 'before' ? newBefore : newAfter;
    const pt: TestDataPoint = { q: Number(src.q), h: Number(src.h), p: Number(src.p), eta: Number(src.eta), npshr: Number(src.npshr) };
    if (target === 'before') { setBeforePts([...beforePts, pt]); setNewBefore({ q: '', h: '', p: '', eta: '', npshr: '' }); }
    else { setAfterPts([...afterPts, pt]); setNewAfter({ q: '', h: '', p: '', eta: '', npshr: '' }); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const toN = (v: string) => v ? Number(v) : null;
      await createTestResult({
        impellerGeometryId: f.impellerGeometryId,
        voluteGeometryId: voluteId,
        d2ActualMm: Number(f.d2ActualMm),
        speedRpm: Number(f.speedRpm),
        trimRatio: toN(f.trimRatio),
        qBepM3h: toN(f.qBepM3h), hBepM: toN(f.hBepM), etaBepPct: toN(f.etaBepPct),
        pBepKw: toN(f.pBepKw), npshrAtBepM: toN(f.npshrAtBepM), hShutoffM: toN(f.hShutoffM),
        testType: f.testType || null,
        testDate: f.testDate || null,
        modificationsApplied: f.modsApplied ? f.modsApplied.split(',').map(s => s.trim()) : [],
        dataPointsBefore: beforePts.length > 0 ? beforePts : null,
        dataPointsAfter: afterPts.length > 0 ? afterPts : null,
      });
      await onSave();
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="p-4 border border-zinc-700 rounded-lg bg-zinc-950 mb-4 space-y-3">
      <h4 className="text-xs font-medium text-zinc-300">New Test Result</h4>
      <div className="grid grid-cols-4 gap-3">
        <label className="block text-xs">
          <span className="text-zinc-400">Impeller *</span>
          <select value={f.impellerGeometryId} onChange={e => set('impellerGeometryId', e.target.value)} required
            className="mt-0.5 w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-zinc-100 text-xs">
            {impellers.map(imp => <option key={imp.id} value={imp.id}>{imp.patternNumber} Rev {imp.revision}</option>)}
          </select>
        </label>
        <Inp label="D2 actual (mm) *" name="d2ActualMm" value={f.d2ActualMm} onChange={set} type="number" required />
        <Inp label="Speed (RPM) *" name="speedRpm" value={f.speedRpm} onChange={set} type="number" required />
        <Inp label="Trim ratio" name="trimRatio" value={f.trimRatio} onChange={set} type="number" />
        <Inp label="Q bep (m&sup3;/h)" name="qBepM3h" value={f.qBepM3h} onChange={set} type="number" />
        <Inp label="H bep (m)" name="hBepM" value={f.hBepM} onChange={set} type="number" />
        <Inp label="&eta; bep (%)" name="etaBepPct" value={f.etaBepPct} onChange={set} type="number" />
        <Inp label="P bep (kW)" name="pBepKw" value={f.pBepKw} onChange={set} type="number" />
        <Inp label="NPSHr (m)" name="npshrAtBepM" value={f.npshrAtBepM} onChange={set} type="number" />
        <Inp label="H shutoff (m)" name="hShutoffM" value={f.hShutoffM} onChange={set} type="number" />
        <Inp label="Test type" name="testType" value={f.testType} onChange={set} />
        <Inp label="Test date" name="testDate" value={f.testDate} onChange={set} type="date" />
      </div>
      <Inp label="Mods applied (comma-separated)" name="modsApplied" value={f.modsApplied} onChange={set} />

      {/* Data points entry */}
      <div className="grid grid-cols-2 gap-4">
        <DataPointEntry label="Before Modification" points={beforePts} setPoints={setBeforePts}
          newPt={newBefore} setNewPt={setNewBefore} onAdd={() => addPt('before')} />
        <DataPointEntry label="After Modification" points={afterPts} setPoints={setAfterPts}
          newPt={newAfter} setNewPt={setNewAfter} onAdd={() => addPt('after')} />
      </div>

      <button type="submit" disabled={saving}
        className="text-xs px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50">
        {saving ? 'Saving...' : 'Add Test Result'}
      </button>
    </form>
  );
}

function DataPointEntry({ label, points, setPoints, newPt, setNewPt, onAdd }: {
  label: string;
  points: TestDataPoint[];
  setPoints: (pts: TestDataPoint[]) => void;
  newPt: { q: string; h: string; p: string; eta: string; npshr: string };
  setNewPt: (pt: { q: string; h: string; p: string; eta: string; npshr: string }) => void;
  onAdd: () => void;
}) {
  const canAdd = points.length < 20 && newPt.q && newPt.h;
  return (
    <div>
      <span className="text-xs text-zinc-400 font-medium">{label} ({points.length}/20 pts)</span>
      <div className="flex gap-1 mt-1">
        <input placeholder="Q" value={newPt.q} onChange={e => setNewPt({ ...newPt, q: e.target.value })} type="number"
          className="w-14 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-1 text-xs text-zinc-100" />
        <input placeholder="H" value={newPt.h} onChange={e => setNewPt({ ...newPt, h: e.target.value })} type="number"
          className="w-14 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-1 text-xs text-zinc-100" />
        <input placeholder="P" value={newPt.p} onChange={e => setNewPt({ ...newPt, p: e.target.value })} type="number"
          className="w-14 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-1 text-xs text-zinc-100" />
        <input placeholder="&eta;" value={newPt.eta} onChange={e => setNewPt({ ...newPt, eta: e.target.value })} type="number"
          className="w-14 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-1 text-xs text-zinc-100" />
        <input placeholder="NPSHr" value={newPt.npshr} onChange={e => setNewPt({ ...newPt, npshr: e.target.value })} type="number"
          className="w-14 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-1 text-xs text-zinc-100" />
        <button type="button" onClick={onAdd} disabled={!canAdd}
          className="text-xs px-2 py-1 bg-zinc-700 rounded text-zinc-300 disabled:opacity-30">+</button>
      </div>
      {points.length > 0 && (
        <div className="mt-1 max-h-32 overflow-y-auto">
          <table className="w-full text-xs font-mono text-zinc-400">
            <tbody>
              {points.map((pt, i) => (
                <tr key={i}>
                  <td className="pr-1">{pt.q}</td>
                  <td className="pr-1">{pt.h}</td>
                  <td className="pr-1">{pt.p}</td>
                  <td className="pr-1">{pt.eta}</td>
                  <td className="pr-1">{pt.npshr}</td>
                  <td><button type="button" onClick={() => setPoints(points.filter((_, j) => j !== i))} className="text-red-500">&times;</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Test Result Detail (charts + data tables) ────────────────────────

type CurveKey = 'h' | 'p' | 'eta' | 'npshr';
const CURVE_LABELS: Record<CurveKey, { label: string; unit: string; color: string }> = {
  h:     { label: 'Head',       unit: 'm',  color: '#3b82f6' },
  p:     { label: 'Power',      unit: 'kW', color: '#f59e0b' },
  eta:   { label: 'Efficiency', unit: '%',  color: '#10b981' },
  npshr: { label: 'NPSHr',     unit: 'm',  color: '#ef4444' },
};

function TestResultDetail({ result }: { result: GeometryTestResult }) {
  const before = result.dataPointsBefore;
  const after = result.dataPointsAfter;
  const [activeTab, setActiveTab] = useState<'charts' | 'data'>('charts');
  const hasBefore = before && before.length > 0;
  const hasAfter = after && after.length > 0;

  return (
    <div className="border border-zinc-700 rounded-lg bg-zinc-950 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h4 className="text-sm font-medium text-zinc-200">
            Test Data — {result.d2ActualMm}mm
            {result.modificationsApplied && result.modificationsApplied.length > 0
              ? ` (${result.modificationsApplied.join(' + ')})`
              : ' (Baseline)'}
          </h4>
          {hasBefore && <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-red-400">Before: {before!.length} pts</span>}
          {hasAfter && <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-green-400">After: {after!.length} pts</span>}
        </div>
        <div className="flex gap-1">
          <button onClick={() => setActiveTab('charts')}
            className={`text-xs px-2 py-1 rounded ${activeTab === 'charts' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>Charts</button>
          <button onClick={() => setActiveTab('data')}
            className={`text-xs px-2 py-1 rounded ${activeTab === 'data' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>Data</button>
        </div>
      </div>
      {activeTab === 'charts' ? (
        <div className="grid grid-cols-2 gap-4">
          {(Object.keys(CURVE_LABELS) as CurveKey[]).map(key => (
            <BeforeAfterChart key={key} curveKey={key} before={before} after={after} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {hasBefore && <div><h5 className="text-xs font-medium text-red-400 mb-2">Before ({before!.length} pts)</h5><DataPointTable points={before!} /></div>}
          {hasAfter && <div><h5 className="text-xs font-medium text-green-400 mb-2">After ({after!.length} pts)</h5><DataPointTable points={after!} /></div>}
        </div>
      )}
    </div>
  );
}

// ─── Before/After D3 Chart ─────────────────────────────────────────

function BeforeAfterChart({ curveKey, before, after }: {
  curveKey: CurveKey; before: TestDataPoint[] | null; after: TestDataPoint[] | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const info = CURVE_LABELS[curveKey];

  const draw = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    d3.select(el).selectAll('*').remove();
    const hasBefore = before && before.length > 0;
    const hasAfter = after && after.length > 0;
    if (!hasBefore && !hasAfter) return;

    const W = el.clientWidth;
    const H = 220;
    const margin = { top: 24, right: 16, bottom: 36, left: 48 };
    const w = W - margin.left - margin.right;
    const h = H - margin.top - margin.bottom;

    const svg = d3.select(el).append('svg').attr('width', W).attr('height', H).style('cursor', 'crosshair');
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const allPts = [...(before || []), ...(after || [])];
    const qMax = d3.max(allPts, d => d.q) || 1;
    const yVals = allPts.map(d => d[curveKey]);
    const yMin = Math.min(0, d3.min(yVals) || 0);
    const yMax = (d3.max(yVals) || 1) * 1.1;

    const x = d3.scaleLinear().domain([0, qMax * 1.05]).range([0, w]);
    const y = d3.scaleLinear().domain([yMin, yMax]).range([h, 0]);

    g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).ticks(6).tickSize(-h))
      .call(g => g.selectAll('.tick line').attr('stroke', '#27272a'))
      .call(g => g.selectAll('.tick text').attr('fill', '#71717a').attr('font-size', '10px'))
      .call(g => g.select('.domain').attr('stroke', '#3f3f46'));
    g.append('g').call(d3.axisLeft(y).ticks(5).tickSize(-w))
      .call(g => g.selectAll('.tick line').attr('stroke', '#27272a'))
      .call(g => g.selectAll('.tick text').attr('fill', '#71717a').attr('font-size', '10px'))
      .call(g => g.select('.domain').attr('stroke', '#3f3f46'));

    const line = d3.line<TestDataPoint>().x(d => x(d.q)).y(d => y(d[curveKey])).curve(d3.curveMonotoneX);

    if (hasBefore) {
      g.append('path').datum(before!).attr('d', line).attr('fill', 'none').attr('stroke', info.color)
        .attr('stroke-width', 1.5).attr('stroke-dasharray', '6,3').attr('opacity', 0.5);
      g.selectAll('.dot-b').data(before!).join('circle').attr('cx', d => x(d.q)).attr('cy', d => y(d[curveKey]))
        .attr('r', 2).attr('fill', info.color).attr('opacity', 0.4);
    }
    if (hasAfter) {
      const area = d3.area<TestDataPoint>().x(d => x(d.q)).y0(h).y1(d => y(d[curveKey])).curve(d3.curveMonotoneX);
      g.append('path').datum(after!).attr('d', area).attr('fill', info.color).attr('opacity', 0.08);
      g.append('path').datum(after!).attr('d', line).attr('fill', 'none').attr('stroke', info.color).attr('stroke-width', 2);
      g.selectAll('.dot-a').data(after!).join('circle').attr('cx', d => x(d.q)).attr('cy', d => y(d[curveKey]))
        .attr('r', 3).attr('fill', info.color).attr('opacity', 0.8);
    }

    svg.append('text').attr('x', margin.left + w / 2).attr('y', 14).attr('text-anchor', 'middle')
      .attr('fill', '#a1a1aa').attr('font-size', '11px').attr('font-weight', '500').text(`${info.label} vs Flow`);
    svg.append('text').attr('x', margin.left + w / 2).attr('y', H - 4).attr('text-anchor', 'middle')
      .attr('fill', '#71717a').attr('font-size', '10px').text('Q (m\u00B3/h)');

    // Legend
    const legendY = margin.top + 4;
    if (hasBefore) {
      const lg = svg.append('g').attr('transform', `translate(${margin.left + 8},${legendY})`);
      lg.append('line').attr('x1', 0).attr('x2', 16).attr('y1', 0).attr('y2', 0).attr('stroke', info.color).attr('stroke-width', 1.5).attr('stroke-dasharray', '4,2').attr('opacity', 0.5);
      lg.append('text').attr('x', 20).attr('y', 3).attr('fill', '#a1a1aa').attr('font-size', '9px').text('Before');
    }
    if (hasAfter) {
      const off = hasBefore ? 64 : 0;
      const lg = svg.append('g').attr('transform', `translate(${margin.left + 8 + off},${legendY})`);
      lg.append('line').attr('x1', 0).attr('x2', 16).attr('y1', 0).attr('y2', 0).attr('stroke', info.color).attr('stroke-width', 2);
      lg.append('text').attr('x', 20).attr('y', 3).attr('fill', '#a1a1aa').attr('font-size', '9px').text('After');
    }

    // Crosshair
    const crossLine = g.append('line').attr('y1', 0).attr('y2', h).attr('stroke', '#52525b').attr('stroke-width', 1).attr('stroke-dasharray', '3,3').style('display', 'none');
    const tooltip = svg.append('g').style('display', 'none');
    const tooltipBg = tooltip.append('rect').attr('fill', '#18181b').attr('stroke', '#3f3f46').attr('rx', 4).attr('opacity', 0.95);
    const tooltipText = tooltip.append('text').attr('fill', '#e4e4e7').attr('font-size', '10px').attr('font-family', 'monospace');
    const bisect = d3.bisector<TestDataPoint, number>(d => d.q).left;
    function findNearest(pts: TestDataPoint[], qVal: number) {
      const i = bisect(pts, qVal); const d0 = pts[i - 1]; const d1 = pts[i];
      if (!d0 && !d1) return null; if (!d0) return d1; if (!d1) return d0;
      return qVal - d0.q > d1.q - qVal ? d1 : d0;
    }
    svg.append('rect').attr('x', margin.left).attr('y', margin.top).attr('width', w).attr('height', h)
      .attr('fill', 'none').attr('pointer-events', 'all')
      .on('mouseenter', () => { crossLine.style('display', null); tooltip.style('display', null); })
      .on('mouseleave', () => { crossLine.style('display', 'none'); tooltip.style('display', 'none'); })
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event, g.node());
        const qVal = x.invert(mx);
        crossLine.attr('x1', mx).attr('x2', mx);
        const lines: string[] = [`Q: ${qVal.toFixed(1)}`];
        if (hasBefore) { const pt = findNearest(before!, qVal); if (pt) lines.push(`Before: ${pt[curveKey].toFixed(1)} ${info.unit}`); }
        if (hasAfter) { const pt = findNearest(after!, qVal); if (pt) lines.push(`After: ${pt[curveKey].toFixed(1)} ${info.unit}`); }
        if (hasBefore && hasAfter) {
          const bPt = findNearest(before!, qVal); const aPt = findNearest(after!, qVal);
          if (bPt && aPt) { const delta = aPt[curveKey] - bPt[curveKey]; lines.push(`\u0394: ${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`); }
        }
        tooltipText.selectAll('tspan').remove();
        lines.forEach((l, i) => tooltipText.append('tspan').attr('x', 6).attr('dy', i === 0 ? 12 : 13).text(l));
        const box = (tooltipText.node() as SVGTextElement).getBBox();
        tooltipBg.attr('width', box.width + 12).attr('height', box.height + 8);
        const tipX = mx + margin.left + 12;
        const flip = tipX + box.width + 12 > W - 8;
        tooltip.attr('transform', `translate(${flip ? mx + margin.left - box.width - 20 : tipX},${margin.top + 8})`);
      });
  }, [before, after, curveKey, info]);

  useEffect(() => { draw(); }, [draw]);
  useEffect(() => {
    const obs = new ResizeObserver(() => draw());
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [draw]);

  return <div ref={ref} className="w-full" />;
}

function DataPointTable({ points }: { points: TestDataPoint[] }) {
  return (
    <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-zinc-950">
          <tr className="text-zinc-400 border-b border-zinc-800">
            <th className="text-left py-1.5 pr-2">#</th>
            <th className="text-right py-1.5 pr-2">Q</th>
            <th className="text-right py-1.5 pr-2">H</th>
            <th className="text-right py-1.5 pr-2">P</th>
            <th className="text-right py-1.5 pr-2">&eta;</th>
            <th className="text-right py-1.5">NPSHr</th>
          </tr>
        </thead>
        <tbody>
          {points.map((pt, i) => (
            <tr key={i} className="border-b border-zinc-800/30 text-zinc-300 font-mono">
              <td className="py-1 pr-2 text-zinc-500">{i + 1}</td>
              <td className="py-1 pr-2 text-right">{pt.q}</td>
              <td className="py-1 pr-2 text-right">{pt.h}</td>
              <td className="py-1 pr-2 text-right">{pt.p}</td>
              <td className="py-1 pr-2 text-right">{pt.eta}</td>
              <td className="py-1 text-right">{pt.npshr}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Shared helpers ────────────────────────────────────────────────

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
