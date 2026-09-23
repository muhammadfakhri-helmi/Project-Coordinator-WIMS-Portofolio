// Scene 8: working filters over a fictional report register.
import { REPORTS, FILTERS } from '../content/reports.js';
import { el } from '../utils/env.js';

const LABELS = ['Final Inspection file', 'Well / platform', 'Inspection', 'Scope', 'Source', 'Anomalies', 'Original'];

export function initArchive() {
  const root = document.querySelector('[data-archive]');
  const form = root.querySelector('[data-archive-filters]');
  const tbody = root.querySelector('[data-archive-rows]');
  const count = root.querySelector('[data-archive-count]');

  // options come from the data, so filters and rows never disagree
  for (const [name, f] of Object.entries(FILTERS)) {
    const select = form.elements[name];
    const values = f.options || [...new Set(REPORTS.map(f.values))].sort().reverse();
    for (const v of values) select.append(el('option', { value: v, text: v }));
  }

  const rows = REPORTS.map((r) => {
    const sev = r.highest.toLowerCase();
    const cells = [
      el('td', {}, [el('span', { class: 'file', text: r.file })]),
      el('td', {}, [document.createTextNode(r.well), el('small', { text: `${r.platform} · ${r.status}` })]),
      el('td', {}, [el('span', { class: 'date', text: r.date })]),
      el('td', {}, [el('span', { class: r.scope === 'Historical' ? 'scope scope--hist' : 'scope', text: r.scope })]),
      el('td', { text: r.source }),
      el('td', {}, [document.createTextNode(String(r.anomalies)), el('small', { class: `sev-${sev}`, text: r.anomalies ? `Highest: ${r.highest}` : 'None recorded' })]),
      el('td', {}, [el('span', { class: 'access', text: 'Controlled' })]),
    ];
    cells.forEach((c, i) => {
      c.setAttribute('data-label', LABELS[i]);
      // keep each cell's content in one box so the mobile card layout stays two-column
      c.replaceChildren(el('div', {}, [...c.childNodes]));
    });
    const tr = el('tr', {}, cells);
    tbody.append(tr);
    return { r, tr };
  });

  function apply() {
    const active = Object.entries(FILTERS)
      .map(([name, f]) => [f, form.elements[name].value])
      .filter(([, v]) => v);
    let shown = 0;
    for (const { r, tr } of rows) {
      const ok = active.every(([f, v]) => (f.match ? f.match(r, v) : f.values(r) === v));
      tr.classList.toggle('is-hidden', !ok);
      if (ok) shown++;
    }
    count.textContent = shown === REPORTS.length
      ? `${shown} example reports`
      : `${shown} of ${REPORTS.length} example reports match`;
  }

  form.addEventListener('change', apply);
  form.addEventListener('reset', () => setTimeout(apply));
  form.addEventListener('submit', (e) => e.preventDefault());
  apply();

  return { rows: rows.map((x) => x.tr) };
}
