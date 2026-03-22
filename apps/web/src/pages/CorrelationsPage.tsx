import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as d3 from 'd3';
import { useGeometryStore } from '../stores/geometryStore';

const FEATURES = [
  { value: 'trimRatio', label: 'Trim Ratio' },
  { value: 'beta2EffectiveDeg', label: '\u03B22 Effective (\u00B0)' },
  { value: 'deltaCwActualMm', label: '\u03B4 Cutwater (mm)' },
  { value: 'areaRatioActual', label: 'Area Ratio' },
  { value: 'bGapRatioActual', label: 'B Gap Ratio' },
  { value: 'overlapRatio', label: 'Overlap Ratio' },
  { value: 'nsActual', label: 'Specific Speed (Ns)' },
  { value: 'd2ActualMm', label: 'D2 Actual (mm)' },
];

const TARGETS = [
  { value: 'etaBepPct', label: '\u03B7 BEP (%)' },
  { value: 'qBepM3h', label: 'Q BEP (m\u00B3/h)' },
  { value: 'hBepM', label: 'H BEP (m)' },
  { value: 'pBepKw', label: 'P BEP (kW)' },
  { value: 'npshrAtBepM', label: 'NPSHr (m)' },
  { value: 'hShutoffM', label: 'H Shutoff (m)' },
];

const MARGIN = { top: 20, right: 20, bottom: 50, left: 60 };

export function CorrelationsPage() {
  const { correlation, modelSummaries, loading, fetchCorrelation, fetchModelSummaries } = useGeometryStore();
  const [feature, setFeature] = useState('trimRatio');
  const [target, setTarget] = useState('etaBepPct');
  const [modelId, setModelId] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => { fetchModelSummaries(); }, [fetchModelSummaries]);
  useEffect(() => { fetchCorrelation(feature, target, modelId || undefined); }, [feature, target, modelId, fetchCorrelation]);

  const draw = useCallback(() => {
    if (!svgRef.current || !containerRef.current || !correlation) return;

    const width = containerRef.current.clientWidth;
    const height = 400;
    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = height - MARGIN.top - MARGIN.bottom;

    const svg = d3.select(svgRef.current);
    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    if (correlation.points.length < 2) {
      g.append('text')
        .attr('x', innerW / 2).attr('y', innerH / 2)
        .attr('text-anchor', 'middle').attr('fill', '#71717a')
        .text('Not enough data points for correlation');
      return;
    }

    const xExt = d3.extent(correlation.points, d => d.x) as [number, number];
    const yExt = d3.extent(correlation.points, d => d.y) as [number, number];
    const xPad = (xExt[1] - xExt[0]) * 0.1 || 1;
    const yPad = (yExt[1] - yExt[0]) * 0.1 || 1;

    const xScale = d3.scaleLinear()
      .domain([xExt[0] - xPad, xExt[1] + xPad])
      .range([0, innerW]);
    const yScale = d3.scaleLinear()
      .domain([yExt[0] - yPad, yExt[1] + yPad])
      .range([innerH, 0]);

    // Grid
    g.append('g').attr('class', 'grid')
      .selectAll('line')
      .data(yScale.ticks(6))
      .join('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
      .attr('stroke', '#27272a').attr('stroke-dasharray', '2,2');

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(8))
      .call(g => g.selectAll('text').attr('fill', '#a1a1aa').attr('font-size', '11px'))
      .call(g => g.selectAll('line,path').attr('stroke', '#3f3f46'));

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(6))
      .call(g => g.selectAll('text').attr('fill', '#a1a1aa').attr('font-size', '11px'))
      .call(g => g.selectAll('line,path').attr('stroke', '#3f3f46'));

    // Axis labels
    const featureLabel = FEATURES.find(f => f.value === correlation.feature)?.label || correlation.feature;
    const targetLabel = TARGETS.find(t => t.value === correlation.target)?.label || correlation.target;

    g.append('text')
      .attr('x', innerW / 2).attr('y', innerH + 40)
      .attr('text-anchor', 'middle').attr('fill', '#a1a1aa').attr('font-size', '12px')
      .text(featureLabel);

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2).attr('y', -45)
      .attr('text-anchor', 'middle').attr('fill', '#a1a1aa').attr('font-size', '12px')
      .text(targetLabel);

    // Regression line
    const { slope, intercept } = correlation.regression;
    const xDomain = xScale.domain();
    const regLine = [
      { x: xDomain[0], y: slope * xDomain[0] + intercept },
      { x: xDomain[1], y: slope * xDomain[1] + intercept },
    ];

    g.append('line')
      .attr('x1', xScale(regLine[0].x)).attr('y1', yScale(regLine[0].y))
      .attr('x2', xScale(regLine[1].x)).attr('y2', yScale(regLine[1].y))
      .attr('stroke', '#ef4444').attr('stroke-width', 2).attr('stroke-dasharray', '6,3')
      .attr('opacity', 0.8);

    // Data points
    g.selectAll('circle')
      .data(correlation.points)
      .join('circle')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', 6)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#1d4ed8')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.9);

    // R² annotation
    g.append('text')
      .attr('x', innerW - 5).attr('y', 15)
      .attr('text-anchor', 'end').attr('fill', '#ef4444').attr('font-size', '13px').attr('font-weight', 'bold')
      .text(`R\u00B2 = ${correlation.regression.r_squared.toFixed(4)}`);

    g.append('text')
      .attr('x', innerW - 5).attr('y', 32)
      .attr('text-anchor', 'end').attr('fill', '#71717a').attr('font-size', '11px')
      .text(`n = ${correlation.n}  |  y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`);
  }, [correlation]);

  useEffect(() => {
    draw();
    const observer = new ResizeObserver(draw);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [draw]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/geometry" className="text-zinc-500 hover:text-zinc-300 text-sm">&larr; Dashboard</Link>
        <h2 className="text-xl font-semibold text-zinc-100">Correlation Analysis</h2>
      </div>

      {/* Controls */}
      <div className="flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Feature (X-axis)</label>
          <select
            value={feature}
            onChange={e => setFeature(e.target.value)}
            className="bg-zinc-800 text-zinc-200 text-sm rounded px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:outline-none"
          >
            {FEATURES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Target (Y-axis)</label>
          <select
            value={target}
            onChange={e => setTarget(e.target.value)}
            className="bg-zinc-800 text-zinc-200 text-sm rounded px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:outline-none"
          >
            {TARGETS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Filter by Model</label>
          <select
            value={modelId}
            onChange={e => setModelId(e.target.value)}
            className="bg-zinc-800 text-zinc-200 text-sm rounded px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Models</option>
            {modelSummaries.map(m => <option key={m.id} value={m.id}>{m.modelCode}</option>)}
          </select>
        </div>
        {loading && <span className="text-xs text-zinc-500">Loading...</span>}
      </div>

      {/* Chart */}
      <div ref={containerRef} className="border border-zinc-800 rounded-lg bg-zinc-900 p-2">
        <svg ref={svgRef} />
      </div>

      {/* Regression stats */}
      {correlation && correlation.n >= 2 && (
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="R\u00B2" value={correlation.regression.r_squared.toFixed(4)} />
          <StatCard label="Slope" value={correlation.regression.slope.toFixed(4)} />
          <StatCard label="Intercept" value={correlation.regression.intercept.toFixed(4)} />
          <StatCard label="Data Points" value={String(correlation.n)} />
        </div>
      )}

      {/* Data table */}
      {correlation && correlation.points.length > 0 && (
        <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-300 mb-3">Data Points</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-400 border-b border-zinc-800">
                  <th className="text-left py-2 pr-4">#</th>
                  <th className="text-left py-2 pr-4">{FEATURES.find(f => f.value === feature)?.label || feature}</th>
                  <th className="text-left py-2">{TARGETS.find(t => t.value === target)?.label || target}</th>
                </tr>
              </thead>
              <tbody>
                {correlation.points.map((p, i) => (
                  <tr key={p.id} className="border-b border-zinc-800/50 text-zinc-300 font-mono">
                    <td className="py-1.5 pr-4 text-zinc-500">{i + 1}</td>
                    <td className="py-1.5 pr-4">{p.x}</td>
                    <td className="py-1.5">{p.y}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 border border-zinc-800 rounded-lg bg-zinc-900 text-center">
      <div className="text-lg font-mono text-zinc-100">{value}</div>
      <div className="text-xs text-zinc-400 mt-1">{label}</div>
    </div>
  );
}
