import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { useCatalogStore } from '../stores/catalogStore';
import type { PumpFamily, PumpModel, PumpSize, CatalogMaterial, CatalogMotor, ComponentDef, ComponentDrawing, ComponentPropertyDef, CurveDataRow } from '../stores/catalogStore';
import { CERTIFICATION_CODES, OH_BB_LUBRICATION_TYPES, evaluatePolynomial } from '@magnum-opus/shared';

const SUB_TABS = ['Pumps', 'Materials', 'Motors', 'Components'] as const;
type SubTab = typeof SUB_TABS[number];

export function CatalogPage() {
  const [activeTab, setActiveTab] = useState<SubTab>('Pumps');

  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-100 mb-4">Catalog</h2>
      <div className="flex border-b border-zinc-800 mb-6">
        {SUB_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {activeTab === 'Pumps' && <PumpsPanel />}
      {activeTab === 'Materials' && <MaterialsPanel />}
      {activeTab === 'Motors' && <MotorsPanel />}
      {activeTab === 'Components' && <ComponentsPanel />}
    </div>
  );
}

// ============================================================================
// PUMPS PANEL
// ============================================================================

function PumpsPanel() {
  const { families, familiesLoading, fetchFamilies, createFamily, updateFamily, deleteFamily, createModel, updateModel, deleteModel } = useCatalogStore();
  const [showCreate, setShowCreate] = useState(false);
  const [editingFamily, setEditingFamily] = useState<PumpFamily | null>(null);
  const [expandedFamily, setExpandedFamily] = useState<string | null>(null);
  const [showCreateModel, setShowCreateModel] = useState<string | null>(null);
  const [editingModel, setEditingModel] = useState<PumpModel | null>(null);

  useEffect(() => { fetchFamilies(); }, [fetchFamilies]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-zinc-400">{families.length} pump families</p>
        <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">
          New Family
        </button>
      </div>

      {showCreate && (
        <FamilyForm
          onSave={async (data) => { await createFamily(data); setShowCreate(false); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {editingFamily && (
        <FamilyForm
          initial={editingFamily}
          onSave={async (data) => { await updateFamily(editingFamily.id, data); setEditingFamily(null); }}
          onCancel={() => setEditingFamily(null)}
        />
      )}

      {familiesLoading && families.length === 0 ? (
        <p className="text-zinc-500 text-sm">Loading...</p>
      ) : (
        <div className="space-y-3">
          {families.map(f => (
            <div key={f.id} className="border border-zinc-800 rounded-lg bg-zinc-900">
              <div className="flex items-center justify-between p-4">
                <button onClick={() => setExpandedFamily(expandedFamily === f.id ? null : f.id)} className="text-left flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-zinc-100">{f.name}</span>
                    <span className="px-1.5 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded border border-zinc-700">{f.hiTypeCode}</span>
                    <span className="text-xs text-zinc-500">{f.flowRegime} / {f.orientation} / {f.staging}</span>
                    <span className="text-xs text-zinc-600">{f.models?.length || 0} models</span>
                  </div>
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setEditingFamily(f)} className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded">Edit</button>
                  <button onClick={async () => { if (confirm(`Delete family "${f.name}" and all its models?`)) await deleteFamily(f.id); }} className="px-2 py-1 text-xs text-red-400 hover:text-red-300 bg-zinc-800 rounded">Delete</button>
                </div>
              </div>

              {expandedFamily === f.id && (
                <div className="border-t border-zinc-800 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Models</span>
                    <button onClick={() => setShowCreateModel(f.id)} className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">Add Model</button>
                  </div>

                  {showCreateModel === f.id && (
                    <ModelForm
                      familyId={f.id}
                      onSave={async (data) => { await createModel(data); setShowCreateModel(null); }}
                      onCancel={() => setShowCreateModel(null)}
                    />
                  )}

                  {editingModel && editingModel.familyId === f.id && (
                    <ModelForm
                      familyId={f.id}
                      initial={editingModel}
                      onSave={async (data) => { await updateModel(editingModel.id, data); setEditingModel(null); }}
                      onCancel={() => setEditingModel(null)}
                    />
                  )}

                  {(!f.models || f.models.length === 0) ? (
                    <p className="text-xs text-zinc-600">No models yet.</p>
                  ) : (
                    <div className="grid gap-2">
                      {f.models.map(m => (
                        <ModelCard
                          key={m.id}
                          model={m}
                          onEdit={() => setEditingModel(m)}
                          onDelete={async () => { if (confirm(`Delete model "${m.modelCode}"?`)) await deleteModel(m.id); }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FamilyForm({ initial, onSave, onCancel }: { initial?: PumpFamily; onSave: (d: any) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name || '');
  const [hiTypeCode, setHiTypeCode] = useState(initial?.hiTypeCode || '');
  const [flowRegime, setFlowRegime] = useState(initial?.flowRegime || 'centrifugal');
  const [orientation, setOrientation] = useState(initial?.orientation || 'horizontal');
  const [staging, setStaging] = useState(initial?.staging || 'single');
  const [description, setDescription] = useState(initial?.description || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !hiTypeCode.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), hi_type_code: hiTypeCode.trim(), flow_regime: flowRegime, orientation, staging, description: description || null });
    } finally { setSaving(false); }
  };

  return (
    <div className="mb-4 p-4 border border-zinc-700 rounded-lg bg-zinc-900 space-y-3">
      <h4 className="text-sm font-medium text-zinc-300">{initial ? 'Edit' : 'New'} Pump Family</h4>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Name" value={name} onChange={setName} autoFocus />
        <Input label="HI Type Code" value={hiTypeCode} onChange={setHiTypeCode} placeholder="e.g. OH1" />
        <Select label="Flow Regime" value={flowRegime} onChange={setFlowRegime} options={['centrifugal', 'mixed_flow', 'axial_flow']} />
        <Select label="Orientation" value={orientation} onChange={setOrientation} options={['horizontal', 'vertical']} />
        <Select label="Staging" value={staging} onChange={setStaging} options={['single', 'multi_stage', 'double_suction']} />
        <Input label="Description" value={description} onChange={setDescription} />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={saving} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded hover:bg-zinc-700">Cancel</button>
      </div>
    </div>
  );
}

function ModelForm({ familyId, initial, onSave, onCancel }: { familyId: string; initial?: PumpModel; onSave: (d: any) => Promise<void>; onCancel: () => void }) {
  const [modelCode, setModelCode] = useState(initial?.modelCode || '');
  const [ratedSpeedRpm, setRatedSpeedRpm] = useState(initial?.ratedSpeedRpm?.toString() || '3560');
  const [maxImpeller, setMaxImpeller] = useState(initial?.maxImpellerMm?.toString() || '');
  const [minImpeller, setMinImpeller] = useState(initial?.minImpellerMm?.toString() || '');
  const [frameSize, setFrameSize] = useState(initial?.frameSize || '');
  const [suctionSizeMm, setSuctionSizeMm] = useState(initial?.suctionSizeMm?.toString() || '');
  const [dischargeSizeMm, setDischargeSizeMm] = useState(initial?.dischargeSizeMm?.toString() || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!modelCode.trim() || !maxImpeller || !minImpeller || !ratedSpeedRpm) return;
    setSaving(true);
    try {
      await onSave({
        family_id: familyId,
        model_code: modelCode.trim(),
        rated_speed_rpm: parseInt(ratedSpeedRpm),
        max_impeller_mm: parseFloat(maxImpeller),
        min_impeller_mm: parseFloat(minImpeller),
        frame_size: frameSize || null,
        suction_size_mm: suctionSizeMm ? parseInt(suctionSizeMm) : null,
        discharge_size_mm: dischargeSizeMm ? parseInt(dischargeSizeMm) : null,
      });
    } finally { setSaving(false); }
  };

  return (
    <div className="p-3 border border-zinc-700 rounded bg-zinc-900/50 space-y-3">
      <h5 className="text-xs font-medium text-zinc-400">{initial ? 'Edit' : 'New'} Model</h5>
      <div className="grid grid-cols-3 gap-3">
        <Input label="Model Code" value={modelCode} onChange={setModelCode} autoFocus />
        <Input label="Rated Speed (RPM)" value={ratedSpeedRpm} onChange={setRatedSpeedRpm} type="number" />
        <Input label="Frame Size" value={frameSize} onChange={setFrameSize} />
        <Input label="Max Impeller (mm)" value={maxImpeller} onChange={setMaxImpeller} type="number" />
        <Input label="Min Impeller (mm)" value={minImpeller} onChange={setMinImpeller} type="number" />
        <Input label="Suction Size (mm)" value={suctionSizeMm} onChange={setSuctionSizeMm} type="number" />
        <Input label="Discharge Size (mm)" value={dischargeSizeMm} onChange={setDischargeSizeMm} type="number" />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={saving} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded hover:bg-zinc-700">Cancel</button>
      </div>
    </div>
  );
}

// ============================================================================
// MODEL CARD — Expandable model with sizes and curve data
// ============================================================================

function ModelCard({ model, onEdit, onDelete }: { model: PumpModel; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-zinc-800/50 rounded border border-zinc-800">
      <div className="flex items-center justify-between p-3">
        <button onClick={() => setExpanded(!expanded)} className="text-left flex-1 flex items-center gap-4">
          <span className="text-xs text-zinc-600">{expanded ? '\u25BC' : '\u25B6'}</span>
          <span className="text-sm font-mono text-zinc-100">{model.modelCode}</span>
          <span className="text-xs text-zinc-500">{Number(model.ratedSpeedRpm)} RPM</span>
          <span className="text-xs text-zinc-500">Impeller: {Number(model.minImpellerMm)}-{Number(model.maxImpellerMm)} mm</span>
          {model.frameSize && <span className="text-xs text-zinc-600">Frame: {model.frameSize}</span>}
          <span className="text-xs text-zinc-600">{model.sizes?.length || 0} sizes</span>
        </button>
        <div className="flex gap-2">
          <button onClick={onEdit} className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded">Edit</button>
          <button onClick={onDelete} className="px-2 py-1 text-xs text-red-400 hover:text-red-300 bg-zinc-800 rounded">Delete</button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-zinc-800 p-3">
          <SizesSection sizes={model.sizes || []} />
        </div>
      )}
    </div>
  );
}

function SizesSection({ sizes }: { sizes: PumpSize[] }) {
  const [expandedSize, setExpandedSize] = useState<string | null>(null);

  if (sizes.length === 0) {
    return <p className="text-xs text-zinc-600">No sizes defined.</p>;
  }

  return (
    <div className="space-y-2">
      <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Sizes & Curves</span>
      {sizes.map(s => (
        <div key={s.id} className="border border-zinc-700/50 rounded bg-zinc-900/50">
          <button
            onClick={() => setExpandedSize(expandedSize === s.id ? null : s.id)}
            className="w-full text-left p-2 flex items-center gap-4"
          >
            <span className="text-xs text-zinc-600">{expandedSize === s.id ? '\u25BC' : '\u25B6'}</span>
            <span className="text-sm font-mono text-zinc-200">{s.sizeDesignation}</span>
            <span className="text-xs text-zinc-500">{Number(s.impellerDiameterMm)} mm</span>
            <span className="text-xs text-zinc-500">{s.speedRpm} RPM</span>
            {s.ratedFlowM3h && <span className="text-xs text-zinc-500">{Number(s.ratedFlowM3h)} m3/h</span>}
            {s.ratedHeadM && <span className="text-xs text-zinc-500">{Number(s.ratedHeadM)} m</span>}
            {s.ratedEfficiency && <span className="text-xs text-zinc-500">{Number(s.ratedEfficiency)}%</span>}
          </button>
          {expandedSize === s.id && <CurveSection sizeId={s.id} speedRpm={s.speedRpm} impellerDiameterMm={Number(s.impellerDiameterMm)} />}
        </div>
      ))}
    </div>
  );
}

function CurveSection({ sizeId, speedRpm, impellerDiameterMm }: { sizeId: string; speedRpm: number; impellerDiameterMm: number }) {
  const { curveSets, curveSetsLoading, fetchCurveSets, createCurveSet, updateCurveSet, deleteCurveSet, updateCurveData, createCurveData, deleteCurveData } = useCatalogStore();
  const sets = curveSets[sizeId] || [];
  const [showCreate, setShowCreate] = useState(false);
  const [expandedSet, setExpandedSet] = useState<string | null>(null);
  const [editingCurve, setEditingCurve] = useState<string | null>(null);
  const [showAddCurve, setShowAddCurve] = useState<string | null>(null);

  useEffect(() => { fetchCurveSets(sizeId); }, [sizeId, fetchCurveSets]);

  return (
    <div className="border-t border-zinc-700/50 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400 font-medium">Curve Sets ({sets.length})</span>
        <button onClick={() => setShowCreate(true)} className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">Add Curve Set</button>
      </div>

      {showCreate && (
        <CurveSetForm
          defaults={{ speed_rpm: speedRpm, impeller_diameter_mm: impellerDiameterMm }}
          onSave={async (data) => { await createCurveSet({ ...data, size_id: sizeId }); setShowCreate(false); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {curveSetsLoading && sets.length === 0 && <p className="text-xs text-zinc-600">Loading curves...</p>}

      {sets.map(cs => (
        <div key={cs.id} className="border border-zinc-700/30 rounded bg-zinc-800/30">
          <div className="flex items-center justify-between p-2">
            <button onClick={() => setExpandedSet(expandedSet === cs.id ? null : cs.id)} className="text-left flex-1 flex items-center gap-3">
              <span className="text-xs text-zinc-600">{expandedSet === cs.id ? '\u25BC' : '\u25B6'}</span>
              <span className="text-xs font-mono text-zinc-200">{cs.speedRpm} RPM @ {Number(cs.impellerDiameterMm)} mm</span>
              {cs.isReference && <span className="px-1 py-0.5 text-[10px] bg-blue-900/50 text-blue-400 rounded">REF</span>}
              <span className="text-xs text-zinc-600">{cs.source}</span>
              <span className="text-xs text-zinc-600">{cs.curves.length} curves</span>
            </button>
            <div className="flex gap-2">
              <button
                onClick={async () => { await updateCurveSet(cs.id, { is_reference: !cs.isReference }); }}
                className="px-2 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded"
              >
                {cs.isReference ? 'Unset Ref' : 'Set as Ref'}
              </button>
              <button
                onClick={async () => { if (confirm('Delete this curve set and all its curves?')) await deleteCurveSet(cs.id, sizeId); }}
                className="px-2 py-0.5 text-[10px] text-red-400 hover:text-red-300 bg-zinc-800 rounded"
              >Delete</button>
            </div>
          </div>

          {expandedSet === cs.id && (
            <div className="border-t border-zinc-700/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Curves</span>
                <button onClick={() => setShowAddCurve(cs.id)} className="px-2 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-500">Add Curve</button>
              </div>

              {showAddCurve === cs.id && (
                <CurveDataForm
                  curveSetId={cs.id}
                  existingTypes={cs.curves.map(c => c.curveType)}
                  onSave={async (data) => { await createCurveData(data); setShowAddCurve(null); }}
                  onCancel={() => setShowAddCurve(null)}
                />
              )}

              {cs.curves.length === 0 ? (
                <p className="text-xs text-zinc-600">No curves. Add HQ, EQ, PQ, NPSHR curves.</p>
              ) : (
                <div className="space-y-2">
                  {cs.curves.map(c => (
                    <div key={c.id}>
                      {editingCurve === c.id ? (
                        <CurveDataForm
                          curveSetId={cs.id}
                          initial={c}
                          existingTypes={[]}
                          onSave={async (data) => { await updateCurveData(c.id, data, sizeId); setEditingCurve(null); }}
                          onCancel={() => setEditingCurve(null)}
                        />
                      ) : (
                        <div className="flex items-start justify-between p-2 bg-zinc-800/50 rounded border border-zinc-700/30">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-xs font-mono font-medium text-zinc-100">{c.curveType}</span>
                              <span className="text-xs text-zinc-500">{c.representation}</span>
                              {c.yUnit && <span className="text-xs text-zinc-600">y: {c.yUnit}</span>}
                              {c.validQMin != null && c.validQMax != null && (
                                <span className="text-xs text-zinc-600">Q: {Number(c.validQMin)}-{Number(c.validQMax)} {c.xUnit}</span>
                              )}
                            </div>
                            {c.coefficients && (
                              <div className="text-xs font-mono text-zinc-400 break-all">
                                coefficients: [{c.coefficients.map(v => typeof v === 'number' ? v.toPrecision(6) : v).join(', ')}]
                              </div>
                            )}
                            {c.dataPoints && (
                              <div className="text-xs font-mono text-zinc-400">
                                {Array.isArray(c.dataPoints) ? `${c.dataPoints.length} data points` : 'data points (object)'}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 ml-2">
                            <button onClick={() => setEditingCurve(c.id)} className="px-2 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded">Edit</button>
                            <button
                              onClick={async () => { if (confirm(`Delete ${c.curveType} curve?`)) await deleteCurveData(c.id, sizeId); }}
                              className="px-2 py-0.5 text-[10px] text-red-400 hover:text-red-300 bg-zinc-800 rounded"
                            >Delete</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <CurveSetPreview curves={cs.curves} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CurveSetForm({ defaults, onSave, onCancel }: {
  defaults?: { speed_rpm?: number; impeller_diameter_mm?: number };
  onSave: (d: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [speedRpm, setSpeedRpm] = useState(defaults?.speed_rpm?.toString() || '');
  const [diameterMm, setDiameterMm] = useState(defaults?.impeller_diameter_mm?.toString() || '');
  const [source, setSource] = useState('catalog');
  const [isReference, setIsReference] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!speedRpm || !diameterMm) return;
    setSaving(true);
    try {
      await onSave({
        speed_rpm: parseInt(speedRpm),
        impeller_diameter_mm: parseFloat(diameterMm),
        source,
        is_reference: isReference,
      });
    } finally { setSaving(false); }
  };

  return (
    <div className="p-3 border border-zinc-700 rounded bg-zinc-900/50 space-y-2">
      <h5 className="text-xs font-medium text-zinc-400">New Curve Set</h5>
      <div className="grid grid-cols-4 gap-2">
        <Input label="Speed (RPM)" value={speedRpm} onChange={setSpeedRpm} type="number" autoFocus />
        <Input label="Impeller Diameter (mm)" value={diameterMm} onChange={setDiameterMm} type="number" />
        <Select label="Source" value={source} onChange={setSource} options={['catalog', 'test', 'cfd', 'field']} />
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Reference</label>
          <label className="flex items-center gap-2 text-xs text-zinc-400 mt-1.5">
            <input type="checkbox" checked={isReference} onChange={e => setIsReference(e.target.checked)} />
            Is Reference Set
          </label>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={saving} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 disabled:opacity-50">
          {saving ? 'Saving...' : 'Create'}
        </button>
        <button onClick={onCancel} className="px-3 py-1 bg-zinc-800 text-zinc-300 text-xs rounded hover:bg-zinc-700">Cancel</button>
      </div>
    </div>
  );
}

// ============================================================================
// CURVE PREVIEW COMPONENTS
// ============================================================================

const CURVE_COLORS: Record<string, string> = {
  HQ: '#3b82f6',
  EQ: '#4ade80',
  PQ: '#a78bfa',
  NPSHR: '#f472b6',
};

const CURVE_Y_LABELS: Record<string, string> = {
  HQ: 'Head (m)',
  EQ: 'Efficiency (%)',
  PQ: 'Power (kW)',
  NPSHR: 'NPSHr (m)',
};

/** Attach interactive crosshair + tooltip to an SVG chart area */
function attachCrosshair(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  innerW: number,
  innerH: number,
  margin: { top: number; left: number },
  xScale: d3.ScaleLinear<number, number>,
  evalAtQ: (q: number) => { label: string; value: string; color: string }[],
) {
  const crosshairG = g.append('g').attr('class', 'crosshair').style('display', 'none');
  crosshairG.append('line').attr('class', 'ch-x')
    .attr('y1', 0).attr('y2', innerH)
    .attr('stroke', '#71717a').attr('stroke-width', 0.5).attr('stroke-dasharray', '3,3');
  crosshairG.append('line').attr('class', 'ch-y')
    .attr('x1', 0).attr('x2', innerW)
    .attr('stroke', '#71717a').attr('stroke-width', 0.5).attr('stroke-dasharray', '3,3');
  const dot = crosshairG.append('circle').attr('r', 4).attr('fill', '#fff').attr('stroke', '#3b82f6').attr('stroke-width', 1.5);

  const tooltip = svg.append('g').attr('class', 'tooltip-g').style('display', 'none');
  const tooltipRect = tooltip.append('rect')
    .attr('rx', 4).attr('ry', 4).attr('fill', '#18181b').attr('stroke', '#3f3f46').attr('stroke-width', 1).attr('opacity', 0.95);
  const tooltipText = tooltip.append('text')
    .attr('fill', '#e4e4e7').style('font-size', '11px').style('font-family', 'monospace');

  // Invisible overlay for mouse events
  svg.append('rect')
    .attr('x', margin.left).attr('y', margin.top)
    .attr('width', innerW).attr('height', innerH)
    .attr('fill', 'none').attr('pointer-events', 'all')
    .on('mouseenter', () => { crosshairG.style('display', null); tooltip.style('display', null); })
    .on('mouseleave', () => { crosshairG.style('display', 'none'); tooltip.style('display', 'none'); })
    .on('mousemove', function (event) {
      const [mx] = d3.pointer(event, g.node());
      const q = xScale.invert(Math.max(0, Math.min(mx, innerW)));
      const items = evalAtQ(q);
      if (items.length === 0) return;

      crosshairG.select('.ch-x').attr('x1', mx).attr('x2', mx);
      // Use the first item's value for the horizontal line & dot
      const primaryY = parseFloat(items[0].value);
      if (!isNaN(primaryY)) {
        const py = parseFloat(items[0].value); // raw pixel already handled below
      }
      // Position dot on first series
      dot.attr('cx', mx).attr('cy', 0).style('display', 'none');

      // Build tooltip lines
      tooltipText.selectAll('*').remove();
      tooltipText.append('tspan')
        .attr('x', 8).attr('dy', 16)
        .attr('fill', '#a1a1aa')
        .text(`Q = ${q.toFixed(1)} m\u00B3/h`);
      items.forEach(item => {
        tooltipText.append('tspan')
          .attr('x', 8).attr('dy', 16)
          .attr('fill', item.color)
          .text(`${item.label}: ${item.value}`);
      });

      const lineCount = items.length + 1;
      const boxW = 170;
      const boxH = lineCount * 16 + 8;
      tooltipRect.attr('width', boxW).attr('height', boxH);

      // Position tooltip avoiding edge overflow
      let tx = margin.left + mx + 12;
      let ty = margin.top + 10;
      if (tx + boxW > margin.left + innerW) tx = margin.left + mx - boxW - 12;
      if (ty + boxH > margin.top + innerH) ty = margin.top + innerH - boxH;
      tooltip.attr('transform', `translate(${tx},${ty})`);
    });
}

/** Live preview of a single curve while editing coefficients */
function CurvePreview({ curveType, representation, coeffStr, validQMin, validQMax }: {
  curveType: string;
  representation: string;
  coeffStr: string;
  validQMin: string;
  validQMax: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const coefficients = useMemo(() => {
    if (!coeffStr.trim()) return null;
    const parsed = coeffStr.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    return parsed.length > 0 ? parsed : null;
  }, [coeffStr]);

  const qMin = parseFloat(validQMin) || 0;
  const qMax = parseFloat(validQMax) || 0;
  const color = CURVE_COLORS[curveType] || '#60a5fa';
  const yLabel = CURVE_Y_LABELS[curveType] || curveType;

  const draw = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return;
    if (!coefficients || qMax <= qMin || representation !== 'polynomial') return;

    const width = containerRef.current.clientWidth;
    const height = 280;
    const margin = { top: 16, right: 20, bottom: 36, left: 56 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const steps = 200;
    const qStep = (qMax - qMin) / steps;
    const points: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const q = qMin + i * qStep;
      const v = evaluatePolynomial(coefficients, q);
      if (isFinite(v)) points.push([q, v]);
    }

    if (points.length < 2) return;

    const svg = d3.select(svgRef.current);
    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const yValues = points.map(p => p[1]);
    const yMinVal = Math.min(...yValues);
    const yMaxVal = Math.max(...yValues);
    const yPad = (yMaxVal - yMinVal) * 0.1 || 1;

    const xScale = d3.scaleLinear().domain([qMin, qMax]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([Math.min(0, yMinVal - yPad), yMaxVal + yPad]).range([innerH, 0]);

    // Horizontal grid lines
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(6).tickSize(-innerW))
      .call(s => {
        s.selectAll('.tick line').attr('stroke', '#27272a');
        s.selectAll('.tick text').attr('fill', '#a1a1aa').style('font-size', '10px');
        s.select('.domain').attr('stroke', '#3f3f46');
      });

    // X axis
    g.append('g').attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(8))
      .call(s => {
        s.selectAll('text').attr('fill', '#a1a1aa').style('font-size', '10px');
        s.selectAll('line').attr('stroke', '#3f3f46');
        s.select('.domain').attr('stroke', '#3f3f46');
      });

    // Labels
    g.append('text').attr('x', innerW / 2).attr('y', innerH + 32)
      .attr('text-anchor', 'middle').attr('fill', '#71717a').style('font-size', '10px').text('Flow (m\u00B3/h)');
    g.append('text').attr('transform', 'rotate(-90)').attr('x', -innerH / 2).attr('y', -42)
      .attr('text-anchor', 'middle').attr('fill', color).style('font-size', '10px').text(yLabel);

    // Filled area under curve
    const area = d3.area<[number, number]>()
      .x(d => xScale(d[0]))
      .y0(innerH)
      .y1(d => yScale(d[1]))
      .curve(d3.curveCatmullRom);
    g.append('path').datum(points).attr('d', area)
      .attr('fill', color).attr('opacity', 0.06);

    // Curve line
    const line = d3.line<[number, number]>().x(d => xScale(d[0])).y(d => yScale(d[1])).curve(d3.curveCatmullRom);
    g.append('path').datum(points).attr('d', line)
      .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2.5);

    // Interactive crosshair
    const localCoeffs = coefficients;
    attachCrosshair(svg, g, innerW, innerH, margin, xScale, (q) => {
      if (q < qMin || q > qMax) return [];
      const v = evaluatePolynomial(localCoeffs, q);
      if (!isFinite(v)) return [];
      return [{ label: yLabel, value: v.toFixed(2), color }];
    });

  }, [coefficients, qMin, qMax, representation, color, yLabel]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(() => draw());
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [draw]);

  const canRender = coefficients && qMax > qMin && representation === 'polynomial';

  if (!canRender) {
    return (
      <div className="h-[280px] flex items-center justify-center border border-zinc-700/30 rounded bg-zinc-800/20">
        <span className="text-xs text-zinc-600">
          {representation !== 'polynomial'
            ? 'Preview available for polynomial curves only'
            : !coefficients
              ? 'Enter coefficients to see preview'
              : 'Set valid Q range to see preview'}
        </span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="border border-zinc-700/30 rounded bg-zinc-800/20">
      <svg ref={svgRef} className="w-full" style={{ cursor: 'crosshair' }} />
    </div>
  );
}

/** Preview of all curves in a curve set */
function CurveSetPreview({ curves }: { curves: CurveDataRow[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const polyCurves = useMemo(() =>
    curves.filter(c => c.representation === 'polynomial' && c.coefficients && c.validQMin != null && c.validQMax != null),
    [curves]
  );

  const draw = useCallback(() => {
    if (!svgRef.current || !containerRef.current || polyCurves.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = 340;
    const margin = { top: 16, right: 70, bottom: 36, left: 56 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Q range from HQ curve or first available
    const hqCurve = polyCurves.find(c => c.curveType === 'HQ') || polyCurves[0];
    const qMin = Number(hqCurve.validQMin);
    const qMax = Number(hqCurve.validQMax);
    if (qMax <= qMin) return;

    const steps = 200;
    const xScale = d3.scaleLinear().domain([0, qMax * 1.1]).range([0, innerW]);

    // Build series data with per-series y-scales
    type Series = { type: string; points: [number, number][]; color: string; yScale: d3.ScaleLinear<number, number>; coefficients: number[]; qMin: number; qMax: number; yUnit: string };
    const allSeries: Series[] = [];

    for (const c of polyCurves) {
      const cqMin = Number(c.validQMin);
      const cqMax = Number(c.validQMax);
      const cStep = (cqMax - cqMin) / steps;
      const pts: [number, number][] = [];
      for (let i = 0; i <= steps; i++) {
        const q = cqMin + i * cStep;
        const v = evaluatePolynomial(c.coefficients!, q);
        if (isFinite(v)) pts.push([q, v]);
      }
      if (pts.length > 1) {
        const vals = pts.map(p => p[1]);
        const sYScale = d3.scaleLinear().domain([0, Math.max(...vals) * 1.15]).range([innerH, 0]);
        allSeries.push({
          type: c.curveType, points: pts, color: CURVE_COLORS[c.curveType] || '#71717a',
          yScale: sYScale, coefficients: c.coefficients!, qMin: cqMin, qMax: cqMax,
          yUnit: c.yUnit || '',
        });
      }
    }

    if (allSeries.length === 0) return;

    // Primary y-axis (HQ)
    const primary = allSeries.find(s => s.type === 'HQ') || allSeries[0];

    // Horizontal grid
    g.append('g')
      .call(d3.axisLeft(primary.yScale).ticks(6).tickSize(-innerW))
      .call(s => {
        s.selectAll('.tick line').attr('stroke', '#27272a');
        s.selectAll('.tick text').attr('fill', primary.color).style('font-size', '10px');
        s.select('.domain').attr('stroke', '#3f3f46');
      });

    // Secondary y-axis (EQ, right side) if present
    const eqSeries = allSeries.find(s => s.type === 'EQ');
    if (eqSeries) {
      g.append('g').attr('transform', `translate(${innerW},0)`)
        .call(d3.axisRight(eqSeries.yScale).ticks(6))
        .call(s => {
          s.selectAll('.tick text').attr('fill', eqSeries.color).style('font-size', '10px');
          s.selectAll('.tick line').attr('stroke', 'none');
          s.select('.domain').attr('stroke', '#3f3f46');
        });
    }

    // X axis
    g.append('g').attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(8))
      .call(s => {
        s.selectAll('text').attr('fill', '#a1a1aa').style('font-size', '10px');
        s.selectAll('line').attr('stroke', '#3f3f46');
        s.select('.domain').attr('stroke', '#3f3f46');
      });

    // Axis labels
    g.append('text').attr('x', innerW / 2).attr('y', innerH + 32)
      .attr('text-anchor', 'middle').attr('fill', '#71717a').style('font-size', '10px').text('Flow (m\u00B3/h)');
    g.append('text').attr('transform', 'rotate(-90)').attr('x', -innerH / 2).attr('y', -42)
      .attr('text-anchor', 'middle').attr('fill', primary.color).style('font-size', '10px')
      .text(CURVE_Y_LABELS[primary.type] || primary.type);
    if (eqSeries) {
      g.append('text').attr('transform', 'rotate(90)').attr('x', innerH / 2).attr('y', -innerW - 50)
        .attr('text-anchor', 'middle').attr('fill', eqSeries.color).style('font-size', '10px')
        .text('Efficiency (%)');
    }

    // Draw filled area for HQ
    const hqData = allSeries.find(s => s.type === 'HQ');
    if (hqData) {
      const area = d3.area<[number, number]>()
        .x(d => xScale(d[0]))
        .y0(innerH)
        .y1(d => hqData.yScale(d[1]))
        .curve(d3.curveCatmullRom);
      g.append('path').datum(hqData.points).attr('d', area)
        .attr('fill', hqData.color).attr('opacity', 0.04);
    }

    // Draw each series
    for (const series of allSeries) {
      const line = d3.line<[number, number]>()
        .x(d => xScale(d[0]))
        .y(d => series.yScale(d[1]))
        .curve(d3.curveCatmullRom);

      const dash = series.type === 'EQ' ? '6,3' : series.type === 'NPSHR' ? '4,2' : series.type === 'PQ' ? '8,4' : '';
      g.append('path').datum(series.points).attr('d', line)
        .attr('fill', 'none').attr('stroke', series.color).attr('stroke-width', 2.5)
        .attr('stroke-dasharray', dash || 'none');
    }

    // Legend
    const legend = g.append('g').attr('transform', `translate(${innerW + 8}, 4)`);
    allSeries.forEach((s, i) => {
      const row = legend.append('g').attr('transform', `translate(0,${i * 18})`);
      const dash = s.type === 'EQ' ? '6,3' : s.type === 'NPSHR' ? '4,2' : s.type === 'PQ' ? '8,4' : 'none';
      row.append('line').attr('x1', 0).attr('x2', 16).attr('y1', 5).attr('y2', 5)
        .attr('stroke', s.color).attr('stroke-width', 2).attr('stroke-dasharray', dash);
      row.append('text').attr('x', 22).attr('y', 9)
        .attr('fill', '#a1a1aa').style('font-size', '10px').text(s.type);
    });

    // Interactive crosshair with multi-curve readout
    const seriesRef = allSeries;
    attachCrosshair(svg, g, innerW, innerH, margin, xScale, (q) => {
      const items: { label: string; value: string; color: string }[] = [];
      for (const s of seriesRef) {
        if (q < s.qMin || q > s.qMax) continue;
        const v = evaluatePolynomial(s.coefficients, q);
        if (!isFinite(v)) continue;
        const unit = s.yUnit || (CURVE_Y_LABELS[s.type]?.match(/\((.+)\)/)?.[1] || '');
        items.push({ label: s.type, value: `${v.toFixed(2)} ${unit}`, color: s.color });
      }
      return items;
    });

  }, [polyCurves]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(() => draw());
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [draw]);

  if (polyCurves.length === 0) return null;

  return (
    <div ref={containerRef} className="border border-zinc-700/30 rounded bg-zinc-800/20 mt-2">
      <svg ref={svgRef} className="w-full" style={{ cursor: 'crosshair' }} />
    </div>
  );
}

const CURVE_TYPES = ['HQ', 'EQ', 'PQ', 'NPSHR'] as const;
const REPRESENTATIONS = ['polynomial', 'cubic_spline', 'linear'] as const;

function CurveDataForm({ curveSetId, initial, existingTypes, onSave, onCancel }: {
  curveSetId: string;
  initial?: CurveDataRow;
  existingTypes: string[];
  onSave: (d: any) => Promise<void>;
  onCancel: () => void;
}) {
  const availableTypes = initial ? CURVE_TYPES : CURVE_TYPES.filter(t => !existingTypes.includes(t));
  const [curveType, setCurveType] = useState(initial?.curveType || availableTypes[0] || 'HQ');
  const [representation, setRepresentation] = useState(initial?.representation || 'polynomial');
  const [coeffStr, setCoeffStr] = useState(
    initial?.coefficients ? initial.coefficients.join(', ') : ''
  );
  const [yUnit, setYUnit] = useState(initial?.yUnit || '');
  const [validQMin, setValidQMin] = useState(initial?.validQMin?.toString() || '');
  const [validQMax, setValidQMax] = useState(initial?.validQMax?.toString() || '');
  const [saving, setSaving] = useState(false);

  // Auto-suggest y-unit based on curve type
  useEffect(() => {
    if (!initial && !yUnit) {
      const defaults: Record<string, string> = { HQ: 'm', EQ: '%', PQ: 'kW', NPSHR: 'm' };
      setYUnit(defaults[curveType] || '');
    }
  }, [curveType]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const coefficients = coeffStr.trim()
        ? coeffStr.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
        : null;

      const data: any = {
        representation,
        coefficients,
        y_unit: yUnit || null,
        valid_q_min: validQMin ? parseFloat(validQMin) : null,
        valid_q_max: validQMax ? parseFloat(validQMax) : null,
      };

      if (!initial) {
        data.curve_set_id = curveSetId;
        data.curve_type = curveType;
      }

      await onSave(data);
    } finally { setSaving(false); }
  };

  return (
    <div className="p-3 border border-zinc-700 rounded bg-zinc-900/50 space-y-2">
      <h5 className="text-xs font-medium text-zinc-400">{initial ? `Edit ${initial.curveType}` : 'Add Curve'}</h5>
      <div className="grid grid-cols-3 gap-2">
        {!initial && (
          <Select label="Curve Type" value={curveType} onChange={setCurveType} options={availableTypes as unknown as string[]} />
        )}
        <Select label="Representation" value={representation} onChange={setRepresentation} options={REPRESENTATIONS as unknown as string[]} />
        <Input label="Y Unit" value={yUnit} onChange={setYUnit} placeholder="m, %, kW" />
        <Input label="Valid Q Min" value={validQMin} onChange={setValidQMin} type="number" />
        <Input label="Valid Q Max" value={validQMax} onChange={setValidQMax} type="number" />
      </div>
      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Coefficients (comma-separated, highest degree first)</label>
        <input
          value={coeffStr}
          onChange={e => setCoeffStr(e.target.value)}
          placeholder="e.g. -0.00012, 0.005, 80.0"
          className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:border-blue-500"
        />
      </div>
      <CurvePreview
        curveType={initial?.curveType || curveType}
        representation={representation}
        coeffStr={coeffStr}
        validQMin={validQMin}
        validQMax={validQMax}
      />
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={saving} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="px-3 py-1 bg-zinc-800 text-zinc-300 text-xs rounded hover:bg-zinc-700">Cancel</button>
      </div>
    </div>
  );
}

// ============================================================================
// MATERIALS PANEL
// ============================================================================

function MaterialsPanel() {
  const { materials, materialsLoading, fetchMaterials, activeMaterial, fetchMaterial, createMaterial, updateMaterial, deleteMaterial, setMaterialCertifications, setMaterialComponents, componentDefs, fetchComponentDefs, certifications, fetchCertifications } = useCatalogStore();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchMaterials(); fetchComponentDefs(); fetchCertifications(); }, [fetchMaterials, fetchComponentDefs, fetchCertifications]);

  useEffect(() => { if (detailId) fetchMaterial(detailId); }, [detailId, fetchMaterial]);

  const filtered = materials.filter(m =>
    m.materialCode.toLowerCase().includes(search.toLowerCase()) ||
    m.commonName.toLowerCase().includes(search.toLowerCase()) ||
    m.materialGroup.toLowerCase().includes(search.toLowerCase())
  );

  // Detail view for a single material
  if (detailId && activeMaterial) {
    return (
      <MaterialDetail
        material={activeMaterial}
        componentDefs={componentDefs}
        certifications={certifications}
        onBack={() => setDetailId(null)}
        onSaveCerts={async (certs) => { await setMaterialCertifications(detailId, certs); }}
        onSaveComponents={async (comps) => { await setMaterialComponents(detailId, comps); }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <p className="text-sm text-zinc-400">{filtered.length} materials</p>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search materials..."
            className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:outline-none focus:border-blue-500 w-64"
          />
        </div>
        <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">
          New Material
        </button>
      </div>

      {showCreate && (
        <MaterialForm
          onSave={async (data) => { await createMaterial(data); setShowCreate(false); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {materialsLoading && materials.length === 0 ? (
        <p className="text-zinc-500 text-sm">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
                <th className="pb-2 pr-4">Code</th>
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Group</th>
                <th className="pb-2 pr-4">Spec</th>
                <th className="pb-2 pr-4">Max Temp</th>
                <th className="pb-2 pr-4">Hardness (BHN)</th>
                <th className="pb-2 pr-4">Ferrous</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                editingId === m.id ? (
                  <tr key={m.id}>
                    <td colSpan={8} className="py-2">
                      <MaterialForm
                        initial={m}
                        onSave={async (data) => { await updateMaterial(m.id, data); setEditingId(null); }}
                        onCancel={() => setEditingId(null)}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={m.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-2 pr-4 font-mono text-zinc-100">{m.materialCode}</td>
                    <td className="py-2 pr-4 text-zinc-300">{m.commonName}</td>
                    <td className="py-2 pr-4">
                      <span className="px-1.5 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded">{m.materialGroup}</span>
                    </td>
                    <td className="py-2 pr-4 text-zinc-500 text-xs">{m.specification || '-'}</td>
                    <td className="py-2 pr-4 text-zinc-400">{m.maxTemperatureC != null ? `${m.maxTemperatureC} C` : '-'}</td>
                    <td className="py-2 pr-4 text-zinc-400">
                      {m.hardnessMinBhn != null ? `${m.hardnessMinBhn}-${m.hardnessMaxBhn}` : '-'}
                    </td>
                    <td className="py-2 pr-4 text-zinc-400">{m.isFerrous == null ? '-' : m.isFerrous ? 'Yes' : 'No'}</td>
                    <td className="py-2 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setDetailId(m.id)} className="px-2 py-1 text-xs text-blue-400 hover:text-blue-300 bg-zinc-800 rounded">Details</button>
                        <button onClick={() => setEditingId(m.id)} className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded">Edit</button>
                        <button onClick={async () => { if (confirm(`Delete material "${m.commonName}"?`)) await deleteMaterial(m.id); }} className="px-2 py-1 text-xs text-red-400 hover:text-red-300 bg-zinc-800 rounded">Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MaterialForm({ initial, onSave, onCancel }: { initial?: CatalogMaterial; onSave: (d: any) => Promise<void>; onCancel: () => void }) {
  const [materialCode, setMaterialCode] = useState(initial?.materialCode || '');
  const [commonName, setCommonName] = useState(initial?.commonName || '');
  const [materialGroup, setMaterialGroup] = useState(initial?.materialGroup || 'cast_iron');
  const [specification, setSpecification] = useState(initial?.specification || '');
  const [unsNumber, setUnsNumber] = useState(initial?.unsNumber || '');
  const [maxTempC, setMaxTempC] = useState(initial?.maxTemperatureC?.toString() || '');
  const [maxPressureBar, setMaxPressureBar] = useState(initial?.maxPressureBar?.toString() || '');
  const [leadContentPct, setLeadContentPct] = useState(initial?.leadContentPct?.toString() || '');
  const [isFerrous, setIsFerrous] = useState<string>(initial?.isFerrous == null ? '' : initial.isFerrous ? 'true' : 'false');
  const [domesticSource, setDomesticSource] = useState(initial?.domesticSourceAvailable ?? true);
  const [densityKgM3, setDensityKgM3] = useState(initial?.densityKgM3?.toString() || '');
  const [hardnessMinBhn, setHardnessMinBhn] = useState(initial?.hardnessMinBhn?.toString() || '');
  const [hardnessMaxBhn, setHardnessMaxBhn] = useState(initial?.hardnessMaxBhn?.toString() || '');
  const [isHardenable, setIsHardenable] = useState(initial?.isHardenable ?? false);
  const [hardeningMethods, setHardeningMethods] = useState(initial?.hardeningMethods || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!materialCode.trim() || !commonName.trim()) return;
    setSaving(true);
    try {
      await onSave({
        material_code: materialCode.trim(),
        common_name: commonName.trim(),
        material_group: materialGroup,
        specification: specification || null,
        uns_number: unsNumber || null,
        max_temperature_c: maxTempC ? parseFloat(maxTempC) : null,
        max_pressure_bar: maxPressureBar ? parseFloat(maxPressureBar) : null,
        lead_content_pct: leadContentPct ? parseFloat(leadContentPct) : null,
        is_ferrous: isFerrous === '' ? null : isFerrous === 'true',
        domestic_source_available: domesticSource,
        density_kg_m3: densityKgM3 ? parseFloat(densityKgM3) : null,
        hardness_min_bhn: hardnessMinBhn ? parseFloat(hardnessMinBhn) : null,
        hardness_max_bhn: hardnessMaxBhn ? parseFloat(hardnessMaxBhn) : null,
        is_hardenable: isHardenable,
        hardening_methods: hardeningMethods || null,
        notes: notes || null,
      });
    } finally { setSaving(false); }
  };

  const MATERIAL_GROUPS = ['cast_iron', 'ductile_iron', 'carbon_steel', 'stainless_steel', 'duplex_stainless', 'bronze', 'nickel_alloy', 'copper_alloy', 'elastomer', 'ceramic', 'carbon', 'polymer'];

  return (
    <div className="mb-4 p-4 border border-zinc-700 rounded-lg bg-zinc-900 space-y-3">
      <h4 className="text-sm font-medium text-zinc-300">{initial ? 'Edit' : 'New'} Material</h4>
      <div className="grid grid-cols-3 gap-3">
        <Input label="Material Code" value={materialCode} onChange={setMaterialCode} autoFocus placeholder="e.g. CF8M" />
        <Input label="Common Name" value={commonName} onChange={setCommonName} placeholder="e.g. 316 Stainless Steel" />
        <Select label="Material Group" value={materialGroup} onChange={setMaterialGroup} options={MATERIAL_GROUPS} />
        <Input label="Specification" value={specification} onChange={setSpecification} placeholder="e.g. ASTM A351" />
        <Input label="UNS Number" value={unsNumber} onChange={setUnsNumber} placeholder="e.g. J92900" />
        <Input label="Max Temp (C)" value={maxTempC} onChange={setMaxTempC} type="number" />
        <Input label="Max Pressure (bar)" value={maxPressureBar} onChange={setMaxPressureBar} type="number" />
        <Input label="Lead Content (%)" value={leadContentPct} onChange={setLeadContentPct} type="number" />
        <Select label="Ferrous" value={isFerrous} onChange={setIsFerrous} options={['', 'true', 'false']} labels={['Unknown', 'Yes', 'No']} />
        <Input label="Density (kg/m3)" value={densityKgM3} onChange={setDensityKgM3} type="number" />
        <Input label="Hardness Min (BHN)" value={hardnessMinBhn} onChange={setHardnessMinBhn} type="number" />
        <Input label="Hardness Max (BHN)" value={hardnessMaxBhn} onChange={setHardnessMaxBhn} type="number" />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <input type="checkbox" checked={domesticSource} onChange={e => setDomesticSource(e.target.checked)} className="rounded bg-zinc-800 border-zinc-700" />
          Domestic Source Available
        </label>
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <input type="checkbox" checked={isHardenable} onChange={e => setIsHardenable(e.target.checked)} className="rounded bg-zinc-800 border-zinc-700" />
          Hardenable
        </label>
      </div>
      {isHardenable && (
        <Input label="Hardening Methods" value={hardeningMethods} onChange={setHardeningMethods} placeholder="e.g. flame, induction" />
      )}
      <Input label="Notes" value={notes} onChange={setNotes} />
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={saving} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded hover:bg-zinc-700">Cancel</button>
      </div>
    </div>
  );
}

function MaterialDetail({ material, componentDefs, certifications, onBack, onSaveCerts, onSaveComponents }: {
  material: CatalogMaterial;
  componentDefs: ComponentDef[];
  certifications: any[];
  onBack: () => void;
  onSaveCerts: (certs: any[]) => Promise<void>;
  onSaveComponents: (comps: any[]) => Promise<void>;
}) {
  // Local state for cert editing
  const existingCertCodes = new Set((material.certifications || []).map((c: any) => c.certification?.code || ''));
  const [selectedCerts, setSelectedCerts] = useState<Set<string>>(existingCertCodes);

  // Local state for component assignment editing
  const existingCompIds = new Set((material.materialOptions || []).map((o: any) => o.componentDefId || o.componentDef?.id));
  const [selectedComps, setSelectedComps] = useState<Set<string>>(existingCompIds);

  const [savingCerts, setSavingCerts] = useState(false);
  const [savingComps, setSavingComps] = useState(false);

  const toggleCert = (code: string) => {
    setSelectedCerts(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  const toggleComp = (id: string) => {
    setSelectedComps(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSaveCerts = async () => {
    setSavingCerts(true);
    try {
      await onSaveCerts(Array.from(selectedCerts).map(code => ({ certification_code: code })));
    } finally { setSavingCerts(false); }
  };

  const handleSaveComps = async () => {
    setSavingComps(true);
    try {
      await onSaveComponents(Array.from(selectedComps).map(id => ({ component_def_id: id })));
    } finally { setSavingComps(false); }
  };

  // Group component defs by HI type for display
  const compsByType = componentDefs.reduce<Record<string, ComponentDef[]>>((acc, c) => {
    (acc[c.hiTypeCode] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div>
      <button onClick={onBack} className="text-sm text-zinc-400 hover:text-zinc-200 mb-4 flex items-center gap-1">
        &larr; Back to Materials
      </button>

      <div className="flex items-center gap-4 mb-6">
        <h3 className="text-lg font-semibold text-zinc-100 font-mono">{material.materialCode}</h3>
        <span className="text-zinc-300">{material.commonName}</span>
        <span className="px-1.5 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded">{material.materialGroup}</span>
      </div>

      {/* Properties summary */}
      <div className="grid grid-cols-4 gap-4 mb-6 text-sm">
        <PropCard label="Specification" value={material.specification} />
        <PropCard label="UNS Number" value={material.unsNumber} />
        <PropCard label="Max Temp" value={material.maxTemperatureC != null ? `${material.maxTemperatureC} C` : null} />
        <PropCard label="Hardness (BHN)" value={material.hardnessMinBhn != null ? `${material.hardnessMinBhn}-${material.hardnessMaxBhn}` : null} />
        <PropCard label="Lead Content" value={material.leadContentPct != null ? `${material.leadContentPct}%` : null} />
        <PropCard label="Ferrous" value={material.isFerrous == null ? null : material.isFerrous ? 'Yes' : 'No'} />
        <PropCard label="Domestic Source" value={material.domesticSourceAvailable ? 'Yes' : 'No'} />
        <PropCard label="Density" value={material.densityKgM3 != null ? `${material.densityKgM3} kg/m3` : null} />
      </div>

      {/* Certifications section */}
      <div className="mb-6 p-4 border border-zinc-800 rounded-lg bg-zinc-900">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-zinc-300">Certifications</h4>
          <button onClick={handleSaveCerts} disabled={savingCerts} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50">
            {savingCerts ? 'Saving...' : 'Save Certifications'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(certifications.length > 0 ? certifications.map((c: any) => c.code) : CERTIFICATION_CODES).map((code: string) => (
            <button
              key={code}
              onClick={() => toggleCert(code)}
              className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                selectedCerts.has(code)
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Component assignments section */}
      <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-zinc-300">Allowed Components</h4>
          <button onClick={handleSaveComps} disabled={savingComps} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50">
            {savingComps ? 'Saving...' : 'Save Components'}
          </button>
        </div>
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {Object.entries(compsByType).sort(([a], [b]) => a.localeCompare(b)).map(([hiType, comps]) => (
            <div key={hiType}>
              <h5 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">{hiType}</h5>
              <div className="flex flex-wrap gap-2">
                {comps.map(c => (
                  <button
                    key={c.id}
                    onClick={() => toggleComp(c.id)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      selectedComps.has(c.id)
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    {c.displayName}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PropCard({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="p-3 bg-zinc-800/50 rounded border border-zinc-800">
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className="text-sm text-zinc-200">{value || '-'}</div>
    </div>
  );
}

// ============================================================================
// MOTORS PANEL
// ============================================================================

function MotorsPanel() {
  const { motors, motorsLoading, fetchMotors, createMotor, updateMotor, deleteMotor } = useCatalogStore();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchMotors(); }, [fetchMotors]);

  const filtered = motors.filter(m => {
    const s = search.toLowerCase();
    return (
      (m.manufacturer || '').toLowerCase().includes(s) ||
      (m.modelNumber || '').toLowerCase().includes(s) ||
      m.frame.toLowerCase().includes(s) ||
      m.enclosure.toLowerCase().includes(s) ||
      m.powerKw.toString().includes(s)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <p className="text-sm text-zinc-400">{filtered.length} motors</p>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search motors..."
            className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:outline-none focus:border-blue-500 w-64"
          />
        </div>
        <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">
          New Motor
        </button>
      </div>

      {showCreate && (
        <MotorForm
          onSave={async (data) => { await createMotor(data); setShowCreate(false); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {motorsLoading && motors.length === 0 ? (
        <p className="text-zinc-500 text-sm">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
                <th className="pb-2 pr-4">Manufacturer</th>
                <th className="pb-2 pr-4">Model</th>
                <th className="pb-2 pr-4">Power</th>
                <th className="pb-2 pr-4">Speed</th>
                <th className="pb-2 pr-4">Voltage</th>
                <th className="pb-2 pr-4">Frame</th>
                <th className="pb-2 pr-4">Enclosure</th>
                <th className="pb-2 pr-4">Flags</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                editingId === m.id ? (
                  <tr key={m.id}>
                    <td colSpan={9} className="py-2">
                      <MotorForm
                        initial={m}
                        onSave={async (data) => { await updateMotor(m.id, data); setEditingId(null); }}
                        onCancel={() => setEditingId(null)}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={m.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-2 pr-4 text-zinc-300">{m.manufacturer || '-'}</td>
                    <td className="py-2 pr-4 font-mono text-zinc-100">{m.modelNumber || '-'}</td>
                    <td className="py-2 pr-4 text-zinc-300">{Number(m.powerKw)} kW{m.powerHp ? ` / ${Number(m.powerHp)} HP` : ''}</td>
                    <td className="py-2 pr-4 text-zinc-400">{m.speedRpm} RPM</td>
                    <td className="py-2 pr-4 text-zinc-400">{m.voltage}</td>
                    <td className="py-2 pr-4 text-zinc-400">{m.frame}</td>
                    <td className="py-2 pr-4 text-zinc-400">{m.enclosure}</td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-1">
                        {m.ulListed && <span className="px-1 py-0.5 text-[10px] bg-zinc-800 text-zinc-400 rounded">UL</span>}
                        {m.fmApproved && <span className="px-1 py-0.5 text-[10px] bg-zinc-800 text-zinc-400 rounded">FM</span>}
                        {m.isInverterDuty && <span className="px-1 py-0.5 text-[10px] bg-zinc-800 text-zinc-400 rounded">VFD</span>}
                        {m.domesticManufactured && <span className="px-1 py-0.5 text-[10px] bg-zinc-800 text-zinc-400 rounded">DOM</span>}
                      </div>
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(m.id)} className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded">Edit</button>
                        <button onClick={async () => { if (confirm('Delete this motor?')) await deleteMotor(m.id); }} className="px-2 py-1 text-xs text-red-400 hover:text-red-300 bg-zinc-800 rounded">Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MotorForm({ initial, onSave, onCancel }: { initial?: CatalogMotor; onSave: (d: any) => Promise<void>; onCancel: () => void }) {
  const [manufacturer, setManufacturer] = useState(initial?.manufacturer || '');
  const [modelNumber, setModelNumber] = useState(initial?.modelNumber || '');
  const [powerKw, setPowerKw] = useState(initial?.powerKw?.toString() || '');
  const [powerHp, setPowerHp] = useState(initial?.powerHp?.toString() || '');
  const [speedRpm, setSpeedRpm] = useState(initial?.speedRpm?.toString() || '3560');
  const [voltage, setVoltage] = useState(initial?.voltage || '460');
  const [phase, setPhase] = useState(initial?.phase?.toString() || '3');
  const [frequencyHz, setFrequencyHz] = useState(initial?.frequencyHz?.toString() || '60');
  const [enclosure, setEnclosure] = useState(initial?.enclosure || 'TEFC');
  const [frame, setFrame] = useState(initial?.frame || '');
  const [efficiencyClass, setEfficiencyClass] = useState(initial?.efficiencyClass || '');
  const [fullLoadEfficiency, setFullLoadEfficiency] = useState(initial?.fullLoadEfficiency?.toString() || '');
  const [serviceFactor, setServiceFactor] = useState(initial?.serviceFactor?.toString() || '1.15');
  const [isInverterDuty, setIsInverterDuty] = useState(initial?.isInverterDuty ?? false);
  const [ulListed, setUlListed] = useState(initial?.ulListed ?? false);
  const [fmApproved, setFmApproved] = useState(initial?.fmApproved ?? false);
  const [domesticManufactured, setDomesticManufactured] = useState(initial?.domesticManufactured ?? false);
  const [hazardousClass, setHazardousClass] = useState(initial?.hazardousClass || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!powerKw || !speedRpm || !voltage || !enclosure || !frame) return;
    setSaving(true);
    try {
      await onSave({
        manufacturer: manufacturer || null,
        model_number: modelNumber || null,
        power_kw: parseFloat(powerKw),
        power_hp: powerHp ? parseFloat(powerHp) : null,
        speed_rpm: parseInt(speedRpm),
        voltage,
        phase: parseInt(phase),
        frequency_hz: parseInt(frequencyHz),
        enclosure,
        frame,
        efficiency_class: efficiencyClass || null,
        full_load_efficiency: fullLoadEfficiency ? parseFloat(fullLoadEfficiency) : null,
        service_factor: parseFloat(serviceFactor),
        is_inverter_duty: isInverterDuty,
        ul_listed: ulListed,
        fm_approved: fmApproved,
        domestic_manufactured: domesticManufactured,
        hazardous_class: hazardousClass || null,
      });
    } finally { setSaving(false); }
  };

  return (
    <div className="mb-4 p-4 border border-zinc-700 rounded-lg bg-zinc-900 space-y-3">
      <h4 className="text-sm font-medium text-zinc-300">{initial ? 'Edit' : 'New'} Motor</h4>
      <div className="grid grid-cols-4 gap-3">
        <Input label="Manufacturer" value={manufacturer} onChange={setManufacturer} autoFocus />
        <Input label="Model Number" value={modelNumber} onChange={setModelNumber} />
        <Input label="Power (kW)" value={powerKw} onChange={setPowerKw} type="number" />
        <Input label="Power (HP)" value={powerHp} onChange={setPowerHp} type="number" />
        <Input label="Speed (RPM)" value={speedRpm} onChange={setSpeedRpm} type="number" />
        <Input label="Voltage" value={voltage} onChange={setVoltage} />
        <Input label="Phase" value={phase} onChange={setPhase} type="number" />
        <Input label="Frequency (Hz)" value={frequencyHz} onChange={setFrequencyHz} type="number" />
        <Select label="Enclosure" value={enclosure} onChange={setEnclosure} options={['TEFC', 'TENV', 'ODP', 'WPI', 'WPII', 'TEBC', 'TEWC', 'XP']} />
        <Input label="Frame" value={frame} onChange={setFrame} placeholder="e.g. 256T" />
        <Input label="Efficiency Class" value={efficiencyClass} onChange={setEfficiencyClass} placeholder="e.g. IE3" />
        <Input label="Full Load Efficiency (%)" value={fullLoadEfficiency} onChange={setFullLoadEfficiency} type="number" />
        <Input label="Service Factor" value={serviceFactor} onChange={setServiceFactor} type="number" />
        <Input label="Hazardous Class" value={hazardousClass} onChange={setHazardousClass} placeholder="e.g. Class I Div 1" />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <input type="checkbox" checked={isInverterDuty} onChange={e => setIsInverterDuty(e.target.checked)} className="rounded bg-zinc-800 border-zinc-700" />
          Inverter Duty (VFD)
        </label>
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <input type="checkbox" checked={ulListed} onChange={e => setUlListed(e.target.checked)} className="rounded bg-zinc-800 border-zinc-700" />
          UL Listed
        </label>
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <input type="checkbox" checked={fmApproved} onChange={e => setFmApproved(e.target.checked)} className="rounded bg-zinc-800 border-zinc-700" />
          FM Approved
        </label>
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <input type="checkbox" checked={domesticManufactured} onChange={e => setDomesticManufactured(e.target.checked)} className="rounded bg-zinc-800 border-zinc-700" />
          Domestic Manufactured
        </label>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={saving} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded hover:bg-zinc-700">Cancel</button>
      </div>
    </div>
  );
}

// ============================================================================
// SHARED FORM PRIMITIVES
// ============================================================================
// COMPONENTS PANEL
// ============================================================================

function ComponentsPanel() {
  const { componentDefs, fetchComponentDefs, families, fetchFamilies, updateComponentDef, addPartNumber, updatePartNumber, deletePartNumber, addDrawing, updateDrawing, deleteDrawing, addPropertyDef, updatePropertyDef, deletePropertyDef } = useCatalogStore();
  const [expandedComp, setExpandedComp] = useState<string | null>(null);

  useEffect(() => { fetchComponentDefs(); fetchFamilies(); }, [fetchComponentDefs, fetchFamilies]);

  // Build model lookup from families, keyed by HI type
  const modelsByHiType = useMemo(() => {
    const map: Record<string, { id: string; modelCode: string }[]> = {};
    for (const f of families) {
      if (!map[f.hiTypeCode]) map[f.hiTypeCode] = [];
      for (const m of (f.models || [])) {
        map[f.hiTypeCode].push({ id: m.id, modelCode: m.modelCode });
      }
    }
    return map;
  }, [families]);

  // Group components by HI type
  const grouped = useMemo(() => {
    const map: Record<string, ComponentDef[]> = {};
    for (const c of componentDefs) {
      if (!map[c.hiTypeCode]) map[c.hiTypeCode] = [];
      map[c.hiTypeCode].push(c);
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [componentDefs]);

  const totalDrawings = componentDefs.reduce((sum, c) => sum + c.partNumbers.reduce((s, pn) => s + pn.drawings.length, 0), 0);

  return (
    <div>
      <p className="text-sm text-zinc-400 mb-4">
        {componentDefs.length} components across {grouped.length} HI types
        {totalDrawings > 0 && ` \u00B7 ${totalDrawings} drawings`}
      </p>
      <div className="space-y-4">
        {grouped.map(([hiType, comps]) => (
          <div key={hiType} className="border border-zinc-800 rounded-lg bg-zinc-900">
            <div className="px-4 py-3 border-b border-zinc-800">
              <span className="font-medium text-zinc-100">{hiType}</span>
              <span className="text-xs text-zinc-500 ml-2">{comps.length} components</span>
            </div>
            <div className="divide-y divide-zinc-800">
              {comps.map(comp => {
                const pnCount = comp.partNumbers.length;
                const dwgCount = comp.partNumbers.reduce((s, pn) => s + pn.drawings.length, 0);
                return (
                  <div key={comp.id}>
                    <button
                      onClick={() => setExpandedComp(expandedComp === comp.id ? null : comp.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-800/50"
                    >
                      <span className="text-sm text-zinc-100 w-48">{comp.displayName}</span>
                      <span className="text-xs text-zinc-500 w-36">{comp.componentKey}</span>
                      <span className="text-xs text-zinc-600 ml-auto">
                        {pnCount > 0 && `${pnCount} P/N`}
                        {pnCount > 0 && dwgCount > 0 && ' \u00B7 '}
                        {dwgCount > 0 && `${dwgCount} dwg`}
                      </span>
                      <span className="text-zinc-600 text-xs">{expandedComp === comp.id ? '\u25B2' : '\u25BC'}</span>
                    </button>

                    {expandedComp === comp.id && (
                      <ComponentDetailPanel
                        comp={comp}
                        allModels={modelsByHiType[hiType] || []}
                        onUpdateComp={updateComponentDef}
                        onAddPartNumber={addPartNumber}
                        onUpdatePartNumber={updatePartNumber}
                        onDeletePartNumber={deletePartNumber}
                        onAddDrawing={addDrawing}
                        onUpdateDrawing={updateDrawing}
                        onDeleteDrawing={deleteDrawing}
                        onAddPropertyDef={addPropertyDef}
                        onUpdatePropertyDef={updatePropertyDef}
                        onDeletePropertyDef={deletePropertyDef}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComponentDetailPanel({ comp, allModels, onUpdateComp, onAddPartNumber, onUpdatePartNumber, onDeletePartNumber, onAddDrawing, onUpdateDrawing, onDeleteDrawing, onAddPropertyDef, onUpdatePropertyDef, onDeletePropertyDef }: {
  comp: ComponentDef;
  allModels: { id: string; modelCode: string }[];
  onUpdateComp: (id: string, data: any) => Promise<void>;
  onAddPartNumber: (compId: string, data: any) => Promise<void>;
  onUpdatePartNumber: (pnId: string, data: any) => Promise<void>;
  onDeletePartNumber: (pnId: string) => Promise<void>;
  onAddDrawing: (pnId: string, data: any) => Promise<void>;
  onUpdateDrawing: (drawingId: string, data: any) => Promise<void>;
  onDeleteDrawing: (drawingId: string) => Promise<void>;
  onAddPropertyDef: (compId: string, data: any) => Promise<void>;
  onUpdatePropertyDef: (propDefId: string, data: any) => Promise<void>;
  onDeletePropertyDef: (propDefId: string) => Promise<void>;
}) {
  const [showAddPN, setShowAddPN] = useState(false);
  const [editingPN, setEditingPN] = useState<string | null>(null);
  const [expandedPN, setExpandedPN] = useState<string | null>(null);
  const [showAddProp, setShowAddProp] = useState(false);
  const [editingProp, setEditingProp] = useState<string | null>(null);

  return (
    <div className="px-4 py-3 bg-zinc-950/50 space-y-4">
      {/* Component info badges */}
      <div className="flex gap-2 text-[10px]">
        {comp.isWetted && <span className="px-1.5 py-0.5 bg-blue-900/40 text-blue-400 border border-blue-800 rounded">wetted</span>}
        {comp.isPressureBoundary && <span className="px-1.5 py-0.5 bg-amber-900/40 text-amber-400 border border-amber-800 rounded">pressure boundary</span>}
        {comp.isPerStage && <span className="px-1.5 py-0.5 bg-purple-900/40 text-purple-400 border border-purple-800 rounded">per-stage</span>}
        {comp.isRequired && <span className="px-1.5 py-0.5 bg-green-900/40 text-green-400 border border-green-800 rounded">required</span>}
      </div>

      {/* Part Numbers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Part Numbers</span>
          <button onClick={() => setShowAddPN(true)} className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">
            Add Part Number
          </button>
        </div>

        {showAddPN && (
          <PartNumberForm
            allModels={allModels}
            onSave={async (data) => { await onAddPartNumber(comp.id, data); setShowAddPN(false); }}
            onCancel={() => setShowAddPN(false)}
          />
        )}

        {comp.partNumbers.length === 0 ? (
          <p className="text-xs text-zinc-600">No part numbers yet.</p>
        ) : (
          <div className="space-y-2">
            {comp.partNumbers.map(pn => (
              <div key={pn.id} className="border border-zinc-800 rounded bg-zinc-900">
                {editingPN === pn.id ? (
                  <div className="px-3 py-2">
                    <PartNumberForm
                      allModels={allModels}
                      initial={{ partNumber: pn.partNumber, modelId: pn.model?.id || null, notes: pn.notes, lubricationTypes: pn.lubricationTypes, certifications: pn.certifications }}
                      onSave={async (data) => { await onUpdatePartNumber(pn.id, data); setEditingPN(null); }}
                      onCancel={() => setEditingPN(null)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-3 py-2">
                    <span className="text-sm text-zinc-100 font-mono">{pn.partNumber}</span>
                    {pn.model && (
                      <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
                        {pn.model.modelCode}
                      </span>
                    )}
                    {!pn.model && (
                      <span className="text-[10px] text-zinc-500 italic">all models</span>
                    )}
                    {pn.certifications && pn.certifications.length > 0 && (
                      <span className="flex gap-0.5">
                        {pn.certifications.map((c: string) => (
                          <span key={c} className="text-[9px] px-1 py-0 bg-green-900/40 text-green-400 border border-green-800 rounded">{c}</span>
                        ))}
                      </span>
                    )}
                    {pn.lubricationTypes && pn.lubricationTypes.length > 0 && (
                      <span className="flex gap-0.5">
                        {pn.lubricationTypes.map((t: string) => (
                          <span key={t} className="text-[9px] px-1 py-0 bg-blue-900/40 text-blue-400 border border-blue-800 rounded">{t.replace(/_/g, ' ')}</span>
                        ))}
                      </span>
                    )}
                    {pn.notes && (
                      <span className="text-[10px] text-zinc-500 truncate max-w-[200px]" title={pn.notes}>{pn.notes}</span>
                    )}
                    <span className="text-xs text-zinc-600 ml-auto">
                      {pn.drawings.length > 0 && `${pn.drawings.length} drawing${pn.drawings.length > 1 ? 's' : ''}`}
                    </span>
                    <button
                      onClick={() => setExpandedPN(expandedPN === pn.id ? null : pn.id)}
                      className="text-xs text-zinc-400 hover:text-zinc-200"
                    >
                      {expandedPN === pn.id ? 'Collapse' : 'Expand'}
                    </button>
                    <button
                      onClick={() => setEditingPN(pn.id)}
                      className="text-xs text-zinc-400 hover:text-zinc-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => { if (confirm(`Delete part number "${pn.partNumber}" and all its drawings?`)) await onDeletePartNumber(pn.id); }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                )}

                {expandedPN === pn.id && editingPN !== pn.id && (
                  <PartNumberDrawings
                    pn={pn}
                    onAddDrawing={onAddDrawing}
                    onUpdateDrawing={onUpdateDrawing}
                    onDeleteDrawing={onDeleteDrawing}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Property Definitions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Properties</span>
          <button onClick={() => setShowAddProp(true)} className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500">
            Add Property
          </button>
        </div>

        {showAddProp && (
          <PropertyDefForm
            onSave={async (data) => { await onAddPropertyDef(comp.id, data); setShowAddProp(false); }}
            onCancel={() => setShowAddProp(false)}
          />
        )}

        {(!comp.propertyDefs || comp.propertyDefs.length === 0) ? (
          <p className="text-xs text-zinc-600">No properties defined.</p>
        ) : (
          <div className="space-y-1">
            {comp.propertyDefs.map(pd => (
              <div key={pd.id}>
                {editingProp === pd.id ? (
                  <PropertyDefForm
                    initial={pd}
                    onSave={async (data) => { await onUpdatePropertyDef(pd.id, data); setEditingProp(null); }}
                    onCancel={() => setEditingProp(null)}
                  />
                ) : (
                  <div className="flex items-center gap-3 px-3 py-1.5 bg-zinc-900 rounded border border-zinc-800">
                    <span className="text-xs text-zinc-500 font-mono w-36">{pd.propertyKey}</span>
                    <span className="text-xs text-zinc-200 w-32">{pd.displayName}</span>
                    <span className="text-[10px] text-zinc-500 w-12">{pd.unit || '—'}</span>
                    <span className="text-[10px] text-zinc-600 w-16">{pd.dataType}</span>
                    {pd.isRequired && <span className="text-[10px] text-green-400">req</span>}
                    <span className="ml-auto" />
                    <button onClick={() => setEditingProp(pd.id)} className="text-xs text-zinc-400 hover:text-zinc-200">Edit</button>
                    <button
                      onClick={async () => { if (confirm(`Delete property "${pd.displayName}"?`)) await onDeletePropertyDef(pd.id); }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PartNumberDrawings({ pn, onAddDrawing, onUpdateDrawing, onDeleteDrawing }: {
  pn: { id: string; drawings: ComponentDrawing[] };
  onAddDrawing: (pnId: string, data: any) => Promise<void>;
  onUpdateDrawing: (drawingId: string, data: any) => Promise<void>;
  onDeleteDrawing: (drawingId: string) => Promise<void>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingDrawing, setEditingDrawing] = useState<ComponentDrawing | null>(null);

  return (
    <div className="px-3 pb-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Drawings</span>
        <button onClick={() => setShowAdd(true)} className="px-1.5 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-500">
          Add Drawing
        </button>
      </div>

      {showAdd && (
        <DrawingForm
          onSave={async (data) => { await onAddDrawing(pn.id, data); setShowAdd(false); }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {editingDrawing && (
        <DrawingForm
          initial={editingDrawing}
          onSave={async (data) => { await onUpdateDrawing(editingDrawing.id, data); setEditingDrawing(null); }}
          onCancel={() => setEditingDrawing(null)}
        />
      )}

      {pn.drawings.length === 0 ? (
        <p className="text-[10px] text-zinc-600">No drawings yet.</p>
      ) : (
        <div className="space-y-1">
          {pn.drawings.map(d => (
            <div key={d.id} className="flex items-center gap-3 px-2 py-1.5 bg-zinc-950 rounded border border-zinc-800">
              <span className="text-xs text-zinc-300 font-mono w-28">{d.drawingNumber}</span>
              {d.title && <span className="text-xs text-zinc-400 flex-1">{d.title}</span>}
              <a href={d.drawingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline">Open</a>
              <button onClick={() => setEditingDrawing(d)} className="text-xs text-zinc-400 hover:text-zinc-200">Edit</button>
              <button onClick={async () => { if (confirm(`Delete drawing "${d.drawingNumber}"?`)) await onDeleteDrawing(d.id); }} className="text-xs text-red-400 hover:text-red-300">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PartNumberForm({ allModels, initial, onSave, onCancel }: {
  allModels: { id: string; modelCode: string }[];
  initial?: { partNumber: string; modelId: string | null; notes: string | null; lubricationTypes: string[] | null; certifications: string[] | null };
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [partNumber, setPartNumber] = useState(initial?.partNumber || '');
  const [modelId, setModelId] = useState(initial?.modelId || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [lubeTypes, setLubeTypes] = useState<Set<string>>(new Set(initial?.lubricationTypes || []));
  const [certs, setCerts] = useState<Set<string>>(new Set(initial?.certifications || []));
  const [saving, setSaving] = useState(false);

  const toggleLube = (t: string) => setLubeTypes(prev => { const s = new Set(prev); s.has(t) ? s.delete(t) : s.add(t); return s; });
  const toggleCert = (c: string) => setCerts(prev => { const s = new Set(prev); s.has(c) ? s.delete(c) : s.add(c); return s; });

  const handleSubmit = async () => {
    if (!partNumber.trim()) return;
    setSaving(true);
    try {
      await onSave({
        part_number: partNumber.trim(),
        model_id: modelId || null,
        notes: notes.trim() || null,
        lubrication_types: lubeTypes.size > 0 ? [...lubeTypes] : null,
        certifications: certs.size > 0 ? [...certs] : null,
      });
    } finally { setSaving(false); }
  };

  return (
    <div className="mb-3 p-3 border border-zinc-700 rounded bg-zinc-900 space-y-2">
      <h4 className="text-xs font-medium text-zinc-300">{initial ? 'Edit' : 'Add'} Part Number</h4>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-zinc-500 block mb-0.5">Part Number *</label>
          <input value={partNumber} onChange={e => setPartNumber(e.target.value)} placeholder="PN-4521-A"
            className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-blue-500" autoFocus />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 block mb-0.5">Pump Model (optional)</label>
          <select value={modelId} onChange={e => setModelId(e.target.value)}
            className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-blue-500">
            <option value="">-- All models --</option>
            {allModels.map(m => <option key={m.id} value={m.id}>{m.modelCode}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 block mb-0.5">Notes (optional)</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes..."
            className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-blue-500" />
        </div>
      </div>
      {/* Certifications */}
      <div>
        <label className="text-[10px] text-zinc-500 block mb-1">Certifications</label>
        <div className="flex flex-wrap gap-1">
          {CERTIFICATION_CODES.map(c => (
            <button key={c} onClick={() => toggleCert(c)}
              className={`px-1.5 py-0.5 text-[10px] rounded border ${certs.has(c) ? 'bg-green-900/50 text-green-400 border-green-700' : 'bg-zinc-800 text-zinc-500 border-zinc-700'} hover:border-zinc-500`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      {/* Lubrication types */}
      <div>
        <label className="text-[10px] text-zinc-500 block mb-1">Lubrication Compatibility</label>
        <div className="flex flex-wrap gap-1">
          {OH_BB_LUBRICATION_TYPES.map(t => (
            <button key={t} onClick={() => toggleLube(t)}
              className={`px-1.5 py-0.5 text-[10px] rounded border ${lubeTypes.has(t) ? 'bg-blue-900/50 text-blue-400 border-blue-700' : 'bg-zinc-800 text-zinc-500 border-zinc-700'} hover:border-zinc-500`}>
              {t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <p className="text-[9px] text-zinc-600 mt-0.5">Leave all unselected for universal compatibility</p>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={saving || !partNumber.trim()}
          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded hover:bg-zinc-700">Cancel</button>
      </div>
    </div>
  );
}

function DrawingForm({ initial, onSave, onCancel }: {
  initial?: ComponentDrawing;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [drawingNumber, setDrawingNumber] = useState(initial?.drawingNumber || '');
  const [drawingUrl, setDrawingUrl] = useState(initial?.drawingUrl || '');
  const [title, setTitle] = useState(initial?.title || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!drawingNumber.trim() || !drawingUrl.trim()) return;
    setSaving(true);
    try {
      await onSave({
        drawing_number: drawingNumber.trim(),
        drawing_url: drawingUrl.trim(),
        title: title.trim() || null,
      });
    } finally { setSaving(false); }
  };

  return (
    <div className="mb-3 p-3 border border-zinc-700 rounded bg-zinc-900 space-y-2">
      <h4 className="text-xs font-medium text-zinc-300">{initial ? 'Edit' : 'Add'} Drawing</h4>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-zinc-500 block mb-0.5">Drawing Number *</label>
          <input value={drawingNumber} onChange={e => setDrawingNumber(e.target.value)} placeholder="DWG-4521-A"
            className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-blue-500" autoFocus />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 block mb-0.5">URL *</label>
          <input value={drawingUrl} onChange={e => setDrawingUrl(e.target.value)} placeholder="https://..."
            className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 block mb-0.5">Title (optional)</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Assembly drawing"
            className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-blue-500" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={saving || !drawingNumber.trim() || !drawingUrl.trim()}
          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded hover:bg-zinc-700">Cancel</button>
      </div>
    </div>
  );
}

function PropertyDefForm({ initial, onSave, onCancel }: {
  initial?: ComponentPropertyDef;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [propertyKey, setPropertyKey] = useState(initial?.propertyKey || '');
  const [displayName, setDisplayName] = useState(initial?.displayName || '');
  const [unit, setUnit] = useState(initial?.unit || '');
  const [dataType, setDataType] = useState(initial?.dataType || 'number');
  const [isRequired, setIsRequired] = useState(initial?.isRequired || false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!propertyKey.trim() || !displayName.trim()) return;
    setSaving(true);
    try {
      await onSave({
        property_key: propertyKey.trim(),
        display_name: displayName.trim(),
        unit: unit.trim() || null,
        data_type: dataType,
        is_required: isRequired,
      });
    } finally { setSaving(false); }
  };

  return (
    <div className="mb-3 p-3 border border-zinc-700 rounded bg-zinc-900 space-y-2">
      <h4 className="text-xs font-medium text-zinc-300">{initial ? 'Edit' : 'Add'} Property</h4>
      <div className="grid grid-cols-5 gap-2">
        <div>
          <label className="text-[10px] text-zinc-500 block mb-0.5">Key *</label>
          <input value={propertyKey} onChange={e => setPropertyKey(e.target.value)} placeholder="bore_dia_mm"
            disabled={!!initial}
            className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-blue-500 disabled:opacity-50" autoFocus />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 block mb-0.5">Display Name *</label>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Bore Diameter"
            className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 block mb-0.5">Unit</label>
          <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="mm"
            className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 block mb-0.5">Type</label>
          <select value={dataType} onChange={e => setDataType(e.target.value)}
            className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-blue-500">
            <option value="number">number</option>
            <option value="text">text</option>
            <option value="select">select</option>
          </select>
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={isRequired} onChange={e => setIsRequired(e.target.checked)}
              className="rounded border-zinc-700" />
            Required
          </label>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={saving || !propertyKey.trim() || !displayName.trim()}
          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded hover:bg-zinc-700">Cancel</button>
      </div>
    </div>
  );
}

// ============================================================================
// SHARED HELPERS
// ============================================================================

function Input({ label, value, onChange, type = 'text', placeholder, autoFocus }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="text-xs text-zinc-400 mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
      />
    </div>
  );
}

function Select({ label, value, onChange, options, labels }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; labels?: string[];
}) {
  return (
    <div>
      <label className="text-xs text-zinc-400 mb-1 block">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
      >
        {options.map((opt, i) => (
          <option key={opt} value={opt}>{labels ? labels[i] : opt}</option>
        ))}
      </select>
    </div>
  );
}
