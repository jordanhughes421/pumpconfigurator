import { useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import { evaluateCurve, scaleCurveByTrim } from '@magnum-opus/shared';
import type { CurveSet, OperatingPoint } from '@magnum-opus/shared';

interface Props {
  curveSet: CurveSet;
  dutyFlow: number;
  dutyHead: number;
  npshaM: number;
  operatingPoint: OperatingPoint | null;
  systemHStatic: number | null;
  systemK: number | null;
  minImpellerMm: number;
  maxImpellerMm: number;
  refSpeed: number;
}

const MARGIN = { top: 20, right: 60, bottom: 40, left: 60 };
const SMALL_H = 180;

export function HQChart({
  curveSet, dutyFlow, dutyHead, npshaM, operatingPoint,
  systemHStatic, systemK, minImpellerMm, maxImpellerMm, refSpeed,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const powerSvgRef = useRef<SVGSVGElement>(null);
  const npshSvgRef = useRef<SVGSVGElement>(null);

  const draw = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 400;
    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = height - MARGIN.top - MARGIN.bottom;

    const hq = curveSet.HQ;
    const eq = curveSet.EQ;
    const pq = curveSet.PQ;
    const npshr = curveSet.NPSHR;

    const qMin = hq.valid_q_min;
    const qMax = hq.valid_q_max;
    const steps = 200;
    const qStep = (qMax - qMin) / steps;

    // Generate curve data points
    const hqPoints: [number, number][] = [];
    const eqPoints: [number, number][] = [];
    const pqPoints: [number, number][] = [];
    const npshPoints: [number, number][] = [];

    for (let i = 0; i <= steps; i++) {
      const q = qMin + i * qStep;
      const h = evaluateCurve(hq, q);
      const e = evaluateCurve(eq, q);
      const p = evaluateCurve(pq, q);
      const n = evaluateCurve(npshr, q);
      if (!isNaN(h)) hqPoints.push([q, h]);
      if (!isNaN(e)) eqPoints.push([q, e]);
      if (!isNaN(p)) pqPoints.push([q, p]);
      if (!isNaN(n)) npshPoints.push([q, n]);
    }

    // Min/max impeller curves (at reference speed, just trim)
    const minTrimSet = scaleCurveByTrim(
      { ...curveSet, impeller_diameter_mm: maxImpellerMm, speed_rpm: curveSet.speed_rpm, HQ: curveSet.HQ, EQ: curveSet.EQ, PQ: curveSet.PQ, NPSHR: curveSet.NPSHR },
      minImpellerMm
    );
    const maxTrimPoints: [number, number][] = [];
    const minTrimPoints: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const q0 = hq.valid_q_min + i * qStep;
      const h0 = evaluateCurve(hq, q0);
      if (!isNaN(h0)) maxTrimPoints.push([q0, h0]);

      const qM = minTrimSet.HQ.valid_q_min + i * (minTrimSet.HQ.valid_q_max - minTrimSet.HQ.valid_q_min) / steps;
      const hM = evaluateCurve(minTrimSet.HQ, qM);
      if (!isNaN(hM)) minTrimPoints.push([qM, hM]);
    }

    // Scales
    const allH = hqPoints.map(d => d[1]).concat(minTrimPoints.map(d => d[1]));
    const xScale = d3.scaleLinear().domain([0, qMax * 1.1]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, Math.max(...allH) * 1.15]).range([innerH, 0]);
    const allE = eqPoints.map(d => d[1]);
    const yScaleE = d3.scaleLinear().domain([0, Math.max(...allE, 100) * 1.1]).range([innerH, 0]);

    // Draw main chart
    const svg = d3.select(svgRef.current);
    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // BEP region (80-110% of BEP flow)
    const bepFlow = Number(curveSet.HQ.valid_q_max) / 1.4; // estimate BEP
    const bepLo = bepFlow * 0.8;
    const bepHi = bepFlow * 1.1;
    g.append('rect')
      .attr('x', xScale(bepLo))
      .attr('y', 0)
      .attr('width', xScale(bepHi) - xScale(bepLo))
      .attr('height', innerH)
      .attr('fill', '#16a34a').attr('opacity', 0.06);

    // Axes
    g.append('g').attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(8))
      .call(s => s.selectAll('text').attr('fill', '#a1a1aa').style('font-size', '11px'))
      .call(s => s.selectAll('line').attr('stroke', '#3f3f46'))
      .call(s => s.select('.domain').attr('stroke', '#3f3f46'));

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(6))
      .call(s => s.selectAll('text').attr('fill', '#60a5fa').style('font-size', '11px'))
      .call(s => s.selectAll('line').attr('stroke', '#3f3f46'))
      .call(s => s.select('.domain').attr('stroke', '#3f3f46'));

    g.append('g').attr('transform', `translate(${innerW},0)`)
      .call(d3.axisRight(yScaleE).ticks(6))
      .call(s => s.selectAll('text').attr('fill', '#4ade80').style('font-size', '11px'))
      .call(s => s.selectAll('line').attr('stroke', 'none'))
      .call(s => s.select('.domain').attr('stroke', '#3f3f46'));

    // Axis labels
    g.append('text').attr('x', innerW / 2).attr('y', innerH + 35)
      .attr('text-anchor', 'middle').attr('fill', '#71717a').style('font-size', '11px')
      .text('Flow (m\u00B3/h)');
    g.append('text').attr('transform', 'rotate(-90)').attr('x', -innerH / 2).attr('y', -45)
      .attr('text-anchor', 'middle').attr('fill', '#60a5fa').style('font-size', '11px')
      .text('Head (m)');
    g.append('text').attr('transform', 'rotate(90)').attr('x', innerH / 2).attr('y', -innerW - 45)
      .attr('text-anchor', 'middle').attr('fill', '#4ade80').style('font-size', '11px')
      .text('Efficiency (%)');

    const line = d3.line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveCatmullRom);

    const lineE = d3.line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScaleE(d[1]))
      .curve(d3.curveCatmullRom);

    // Min/max trim curves (gray)
    if (curveSet.impeller_diameter_mm !== maxImpellerMm) {
      g.append('path').datum(maxTrimPoints).attr('d', line)
        .attr('fill', 'none').attr('stroke', '#52525b').attr('stroke-width', 1).attr('stroke-dasharray', '4,4');
    }
    g.append('path').datum(minTrimPoints).attr('d', line)
      .attr('fill', 'none').attr('stroke', '#52525b').attr('stroke-width', 1).attr('stroke-dasharray', '4,4');

    // H-Q curve (blue)
    g.append('path').datum(hqPoints).attr('d', line)
      .attr('fill', 'none').attr('stroke', '#3b82f6').attr('stroke-width', 2.5);

    // Efficiency curve (green, dashed)
    g.append('path').datum(eqPoints).attr('d', lineE)
      .attr('fill', 'none').attr('stroke', '#4ade80').attr('stroke-width', 1.5).attr('stroke-dasharray', '6,3');

    // System curve
    if (systemHStatic !== null && systemK !== null) {
      const sysPoints: [number, number][] = [];
      for (let i = 0; i <= steps; i++) {
        const q = qMin + i * qStep;
        const h = systemHStatic + systemK * q * q;
        if (h <= yScale.domain()[1]) sysPoints.push([q, h]);
      }
      g.append('path').datum(sysPoints).attr('d', line)
        .attr('fill', 'none').attr('stroke', '#f97316').attr('stroke-width', 1.5).attr('stroke-dasharray', '4,2');
    }

    // Duty point (red crosshair)
    if (dutyFlow > 0 && dutyHead > 0) {
      const dx = xScale(dutyFlow), dy = yScale(dutyHead);
      g.append('line').attr('x1', dx - 8).attr('x2', dx + 8).attr('y1', dy).attr('y2', dy)
        .attr('stroke', '#ef4444').attr('stroke-width', 2);
      g.append('line').attr('x1', dx).attr('x2', dx).attr('y1', dy - 8).attr('y2', dy + 8)
        .attr('stroke', '#ef4444').attr('stroke-width', 2);
    }

    // Operating point (orange diamond)
    if (operatingPoint) {
      const ox = xScale(operatingPoint.flow_m3h), oy = yScale(operatingPoint.head_m);
      const diamond = d3.symbol().type(d3.symbolDiamond).size(80);
      g.append('path').attr('d', diamond()!).attr('transform', `translate(${ox},${oy})`)
        .attr('fill', '#f97316').attr('stroke', '#fff').attr('stroke-width', 0.5);
    }

    // Legend
    const legend = g.append('g').attr('transform', `translate(${innerW - 160}, 5)`);
    const items = [
      { label: 'H-Q', color: '#3b82f6', dash: '' },
      { label: 'Efficiency', color: '#4ade80', dash: '6,3' },
      { label: 'Duty Point', color: '#ef4444', dash: '' },
    ];
    if (systemHStatic !== null) items.push({ label: 'System Curve', color: '#f97316', dash: '4,2' });
    items.forEach((item, i) => {
      const row = legend.append('g').attr('transform', `translate(0,${i * 16})`);
      row.append('line').attr('x1', 0).attr('x2', 20).attr('y1', 5).attr('y2', 5)
        .attr('stroke', item.color).attr('stroke-width', 2)
        .attr('stroke-dasharray', item.dash || 'none');
      row.append('text').attr('x', 26).attr('y', 9)
        .attr('fill', '#a1a1aa').style('font-size', '10px').text(item.label);
    });

    // ── Power chart ──
    drawSmallChart(powerSvgRef.current, width, pqPoints, xScale.domain() as [number, number], '#a78bfa', 'Power (kW)');

    // ── NPSH chart ──
    drawNpshChart(npshSvgRef.current, width, npshPoints, xScale.domain() as [number, number], npshaM);

  }, [curveSet, dutyFlow, dutyHead, npshaM, operatingPoint, systemHStatic, systemK, minImpellerMm, maxImpellerMm]);

  // Redraw on data change and resize
  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => draw());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [draw]);

  return (
    <div ref={containerRef} className="w-full">
      <svg ref={svgRef} className="w-full" />
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <h4 className="text-xs text-zinc-500 mb-1">Power</h4>
          <svg ref={powerSvgRef} className="w-full" />
        </div>
        <div>
          <h4 className="text-xs text-zinc-500 mb-1">NPSH</h4>
          <svg ref={npshSvgRef} className="w-full" />
        </div>
      </div>
    </div>
  );
}

function drawSmallChart(
  svgEl: SVGSVGElement | null,
  width: number,
  points: [number, number][],
  xDomain: [number, number],
  color: string,
  yLabel: string,
) {
  if (!svgEl || points.length === 0) return;
  const innerW = width / 2 - MARGIN.left - MARGIN.right;
  const innerH = SMALL_H - MARGIN.top - MARGIN.bottom;

  const svg = d3.select(svgEl);
  svg.attr('width', width / 2).attr('height', SMALL_H);
  svg.selectAll('*').remove();

  const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

  const xScale = d3.scaleLinear().domain(xDomain).range([0, innerW]);
  const yMax = Math.max(...points.map(d => d[1])) * 1.15;
  const yScale = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

  g.append('g').attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(xScale).ticks(5))
    .call(s => { s.selectAll('text').attr('fill', '#a1a1aa').style('font-size', '10px'); s.selectAll('line').attr('stroke', '#3f3f46'); s.select('.domain').attr('stroke', '#3f3f46'); });

  g.append('g')
    .call(d3.axisLeft(yScale).ticks(4))
    .call(s => { s.selectAll('text').attr('fill', '#a1a1aa').style('font-size', '10px'); s.selectAll('line').attr('stroke', '#3f3f46'); s.select('.domain').attr('stroke', '#3f3f46'); });

  g.append('text').attr('transform', 'rotate(-90)').attr('x', -innerH / 2).attr('y', -40)
    .attr('text-anchor', 'middle').attr('fill', '#71717a').style('font-size', '10px').text(yLabel);

  const line = d3.line<[number, number]>().x(d => xScale(d[0])).y(d => yScale(d[1])).curve(d3.curveCatmullRom);
  g.append('path').datum(points).attr('d', line)
    .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2);
}

function drawNpshChart(
  svgEl: SVGSVGElement | null,
  width: number,
  points: [number, number][],
  xDomain: [number, number],
  npshaM: number,
) {
  if (!svgEl || points.length === 0) return;
  const innerW = width / 2 - MARGIN.left - MARGIN.right;
  const innerH = SMALL_H - MARGIN.top - MARGIN.bottom;

  const svg = d3.select(svgEl);
  svg.attr('width', width / 2).attr('height', SMALL_H);
  svg.selectAll('*').remove();

  const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

  const xScale = d3.scaleLinear().domain(xDomain).range([0, innerW]);
  const yMax = Math.max(...points.map(d => d[1]), npshaM) * 1.2;
  const yScale = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

  g.append('g').attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(xScale).ticks(5))
    .call(s => { s.selectAll('text').attr('fill', '#a1a1aa').style('font-size', '10px'); s.selectAll('line').attr('stroke', '#3f3f46'); s.select('.domain').attr('stroke', '#3f3f46'); });

  g.append('g')
    .call(d3.axisLeft(yScale).ticks(4))
    .call(s => { s.selectAll('text').attr('fill', '#a1a1aa').style('font-size', '10px'); s.selectAll('line').attr('stroke', '#3f3f46'); s.select('.domain').attr('stroke', '#3f3f46'); });

  g.append('text').attr('transform', 'rotate(-90)').attr('x', -innerH / 2).attr('y', -40)
    .attr('text-anchor', 'middle').attr('fill', '#71717a').style('font-size', '10px').text('NPSH (m)');

  // NPSHr curve
  const line = d3.line<[number, number]>().x(d => xScale(d[0])).y(d => yScale(d[1])).curve(d3.curveCatmullRom);
  g.append('path').datum(points).attr('d', line)
    .attr('fill', 'none').attr('stroke', '#f472b6').attr('stroke-width', 2);

  // NPSHa line
  g.append('line')
    .attr('x1', 0).attr('x2', innerW)
    .attr('y1', yScale(npshaM)).attr('y2', yScale(npshaM))
    .attr('stroke', '#ef4444').attr('stroke-width', 1).attr('stroke-dasharray', '6,4');

  // Labels
  g.append('text').attr('x', innerW - 4).attr('y', yScale(npshaM) - 4)
    .attr('text-anchor', 'end').attr('fill', '#ef4444').style('font-size', '10px').text('NPSHa');
}
