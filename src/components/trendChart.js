// Scene 10: SVG cumulative performance chart, revealed import by import.
import { CUMULATIVE } from '../content/trend.js';

const NS = 'http://www.w3.org/2000/svg';
const W = 760;
const H = 320;
const PAD = { l: 44, r: 12, t: 12, b: 30 };

function svg(tag, attrs = {}, text) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text != null) n.textContent = text;
  return n;
}

export function initTrend() {
  const root = document.querySelector('[data-trend]');
  const host = root.querySelector('[data-trend-chart]');
  const countEl = root.querySelector('[data-trend-count]');
  const pctEl = root.querySelector('[data-trend-pct]');
  const summary = root.querySelector('[data-trend-summary]');
  const tableHost = root.querySelector('[data-trend-table]');
  const data = CUMULATIVE;
  const n = data.length;

  const x = (i) => PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r);
  const y = (v) => PAD.t + (1 - v / 100) * (H - PAD.t - PAD.b);

  const after10 = data.slice(10).map((d) => d.pct);
  const lo = Math.floor(Math.min(...after10));
  const hi = Math.ceil(Math.max(...after10));
  const last = data[n - 1].pct;
  const desc = `Illustrative data. Cumulative passed percentage after each of ${n} imported reports. It starts at ${Math.round(data[0].pct)}% with the first report, moves quickly while few records exist, and stays between ${lo}% and ${hi}% after the tenth import, ending at ${last.toFixed(1)}%.`;

  const chart = svg('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-labelledby': 'trend-svg-title trend-svg-desc' });
  chart.append(svg('title', { id: 'trend-svg-title' }, 'Cumulative valve maintenance passed percentage by imported report'));
  chart.append(svg('desc', { id: 'trend-svg-desc' }, desc));

  for (const v of [0, 25, 50, 75, 100]) {
    chart.append(svg('line', { class: 'chart-grid', x1: PAD.l, x2: W - PAD.r, y1: y(v), y2: y(v) }));
    chart.append(svg('text', { class: 'chart-axis', x: PAD.l - 8, y: y(v) + 4, 'text-anchor': 'end' }, `${v}%`));
  }
  let lastMonth = '';
  data.forEach((d, i) => {
    if (d.month !== lastMonth) {
      chart.append(svg('text', { class: 'chart-axis', x: x(i), y: H - 8, 'text-anchor': 'middle' }, d.month));
      lastMonth = d.month;
    }
  });

  const line = svg('polyline', { class: 'chart-line', points: '' });
  const cursor = svg('line', { class: 'chart-cursor', y1: PAD.t, y2: H - PAD.b, x1: -10, x2: -10 });
  const dots = svg('g');
  chart.append(cursor, line, dots);
  const dotEls = data.map((d, i) => {
    const c = svg('circle', { class: 'chart-dot', cx: x(i), cy: y(d.pct), r: 3.5, opacity: 0 });
    dots.append(c);
    return c;
  });
  host.append(chart);
  summary.textContent = desc;

  // data table alternative
  const table = document.createElement('table');
  table.innerHTML = '<thead><tr><th scope="col">Import</th><th scope="col">Month</th><th scope="col">Scored</th><th scope="col">Passed</th><th scope="col">Cumulative passed</th></tr></thead>';
  const tb = document.createElement('tbody');
  for (const d of data) {
    const tr = document.createElement('tr');
    for (const v of [d.n, d.month, d.scored, d.passed, `${d.pct.toFixed(1)}%`]) {
      const td = document.createElement('td');
      td.textContent = v;
      tr.append(td);
    }
    tb.append(tr);
  }
  table.append(tb);
  tableHost.append(table);

  let shownK = -1;
  function setProgress(p) {
    const k = Math.max(1, Math.round(p * n));
    if (k === shownK) return;
    shownK = k;
    line.setAttribute('points', data.slice(0, k).map((d, i) => `${x(i)},${y(d.pct)}`).join(' '));
    dotEls.forEach((c, i) => c.setAttribute('opacity', i < k ? 1 : 0));
    cursor.setAttribute('x1', x(k - 1));
    cursor.setAttribute('x2', x(k - 1));
    countEl.textContent = k;
    pctEl.textContent = `${data[k - 1].pct.toFixed(1)}%`;
  }
  setProgress(1);
  return { setProgress };
}
