// Chapter 03: filterable readiness matrix with expandable evidence rows.
import { READINESS, CATEGORY } from '../content/readiness.js';
import { el } from '../utils/env.js';

export function initReadiness() {
  const root = document.querySelector('[data-matrix]');
  if (!root) return;
  const list = root.querySelector('[data-matrix-rows]');
  const filters = [...root.querySelectorAll('[data-filter]')];

  const rows = READINESS.map((r, i) => {
    const id = `ready-${i}`;
    const btn = el('button', { type: 'button', class: 'matrix__row', 'aria-expanded': 'false', 'aria-controls': id }, [
      el('span', { class: 'matrix__cat', text: CATEGORY[r.cat] }),
      el('span', { class: 'matrix__label', text: r.label }),
      el('span', { class: 'matrix__status' }, [el('span', { class: 'dot dot--pass', 'aria-hidden': 'true' }), 'Verified']),
    ]);
    const how = el('p', { class: 'matrix__how', id, hidden: true, text: r.how });
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      how.hidden = !open;
    });
    const li = el('li', { 'data-cat': r.cat }, [btn, how]);
    list.append(li);
    return li;
  });

  filters.forEach((f) => f.addEventListener('click', () => {
    const cat = f.dataset.filter;
    filters.forEach((b) => b.setAttribute('aria-pressed', String(b === f)));
    rows.forEach((li) => (li.hidden = cat !== 'all' && li.dataset.cat !== cat));
  }));
}
