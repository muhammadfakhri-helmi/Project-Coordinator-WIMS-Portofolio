// Scene 11: inspection records ↔ 3D hotspots ↔ detail panel.
// Works with the WebGL stage or, without it, with the SVG schematic.
import { HOTSPOTS, STATUS_LABEL } from '../content/hotspots.js';
import { SCHEMATIC_SVG, SCHEMATIC_POINTS } from './fallbackSchematic.js';
import { el, env } from '../utils/env.js';

const byId = Object.fromEntries(HOTSPOTS.map((h) => [h.id, h]));
const byPart = Object.fromEntries(HOTSPOTS.map((h) => [h.part, h]));

function markerButton(h) {
  return el('button', {
    type: 'button',
    class: 'hotspot',
    'data-status': h.status,
    'data-id': h.id,
    'aria-pressed': 'false',
    'aria-label': `${h.component}: ${STATUS_LABEL[h.status]}. Show record.`,
  }, [el('span', { class: 'hotspot__ring', 'aria-hidden': 'true' }), el('span', { class: 'hotspot__label', 'aria-hidden': 'true', text: h.component })]);
}

export function initEquipment() {
  let stage = null;
  const section = document.getElementById('equipment');
  const tbody = section.querySelector('[data-records]');
  const detail = section.querySelector('[data-detail]');
  const frame = section.querySelector('[data-equipment-frame]');
  const layer = document.querySelector('[data-hotspot-layer]');
  const leader = document.querySelector('[data-leader]');
  const leaderLine = leader.querySelector('line');
  const listeners = [];
  let selected = null;

  // ---- records table (also the text alternative for the 3D view) -------
  const rows = {};
  for (const h of HOTSPOTS) {
    const btn = el('button', { type: 'button', 'data-id': h.id, 'aria-pressed': 'false' }, [
      el('span', { class: `dot dot--${h.status}`, 'aria-hidden': 'true' }),
      el('span', { text: h.component }),
    ]);
    btn.addEventListener('click', () => select(h.id, 'row'));
    const tr = el('tr', {}, [
      el('td', {}, btn),
      el('td', { class: 'res', text: h.result }),
      el('td', { text: h.severity }),
    ]);
    rows[h.id] = tr;
    tbody.append(tr);
  }

  // ---- markers --------------------------------------------------------
  const markers = {};
  function attachStage(s3) {
    stage = s3;
    for (const h of HOTSPOTS) {
      const b = markerButton(h);
      b.addEventListener('click', () => select(h.id, 'marker'));
      markers[h.id] = b;
      layer.append(b);
    }
    wire3D();
    if (selected) select(selected);
  }

  function useFallback() {
    // SVG fallback in both hero and equipment frames
    document.documentElement.classList.add('no-webgl');
    const heroSlot = document.querySelector('[data-fallback-slot="hero"]');
    heroSlot.innerHTML = `<div class="fallback"><div class="fallback__box" style="position:relative;aspect-ratio:300/440;height:min(80%,560px)">${SCHEMATIC_SVG}</div></div>`;
    const box = el('div', { class: 'fallback__box', style: 'position:relative;aspect-ratio:300/440;height:min(88%,620px)' });
    box.innerHTML = SCHEMATIC_SVG;
    for (const h of HOTSPOTS) {
      const [x, y] = SCHEMATIC_POINTS[h.part];
      const b = markerButton(h);
      b.style.left = `${(x / 300) * 100}%`;
      b.style.top = `${(y / 440) * 100}%`;
      b.addEventListener('click', () => select(h.id, 'marker'));
      markers[h.id] = b;
      box.append(b);
    }
    const wrap = el('div', { class: 'fallback' }, [el('p', { class: 'fallback__note', text: 'Static schematic — 3D view unavailable on this device' }), box]);
    frame.prepend(wrap);
    frame.style.cursor = 'default';
    if (selected) select(selected);
  }

  // ---- selection ------------------------------------------------------
  function renderDetail(h) {
    detail.innerHTML = '';
    const fields = [
      ['Inspection category', h.category],
      ['Latest result', h.result],
      ['Maintenance outcome', h.outcome],
      ['Severity', h.severity],
      ['Inspection date', h.date],
      ['Source report', h.source],
      ['Recommended follow-up', h.followUp],
      ['Evidence status', h.evidence],
    ];
    detail.append(
      el('div', { class: 'detail__head' }, [
        el('span', { class: `dot dot--${h.status}`, 'aria-hidden': 'true' }),
        el('h3', { id: 'detail-title', text: h.component }),
        el('span', { class: 'detail__sev', 'data-status': h.status, text: STATUS_LABEL[h.status] }),
      ]),
      el('dl', {}, fields.map(([k, v]) => el('div', {}, [el('dt', { text: k }), el('dd', { text: v })]))),
    );
  }

  function select(id, from) {
    const h = byId[id];
    if (!h) return;
    selected = id;
    for (const [k, tr] of Object.entries(rows)) {
      const on = k === id;
      tr.classList.toggle('is-selected', on);
      tr.querySelector('button').setAttribute('aria-pressed', String(on));
    }
    for (const [k, b] of Object.entries(markers)) b.setAttribute('aria-pressed', String(k === id));
    renderDetail(h);
    if (stage) stage.select(id, h.part, h.status);
    // on narrow screens a marker tap should bring the record into view
    if (from === 'marker' && env.mobile) detail.scrollIntoView({ block: 'nearest', behavior: env.reducedMotion ? 'auto' : 'smooth' });
    listeners.forEach((fn) => fn(h));
  }

  // ---- 3D-only behaviour: projection, orbit, picking, leader line -------
  function wire3D() {
    stage.setFrameElement('equipment', frame);
    stage.setFrameElement('hero', document.querySelector('.hero__frame'), { mobileOnly: true });
    frame.tabIndex = 0;
    frame.setAttribute('role', 'group');
    frame.setAttribute('aria-label', '3D equipment view. Use arrow keys to rotate and plus or minus to zoom. Hotspot buttons follow.');

    const pt = {};
    const updateOverlay = () => {
      const active = stage.scene === 'equipment';
      layer.hidden = !active;
      if (!active) {
        leader.classList.remove('is-on');
        return;
      }
      const fr = frame.getBoundingClientRect();
      for (const h of HOTSPOTS) {
        stage.anchorScreen(h.part, pt);
        const b = markers[h.id];
        const inside = pt.visible && pt.x > fr.left && pt.x < fr.right && pt.y > Math.max(fr.top, 56) && pt.y < fr.bottom;
        b.style.transform = `translate(${pt.x}px, ${pt.y}px)`;
        b.style.visibility = inside ? 'visible' : 'hidden';
        b.classList.toggle('is-behind', pt.behind);
        if (h.id === selected) Object.assign(pt, { sx: pt.x, sy: pt.y, sIn: inside });
      }
      // leader line from selected row to its marker (wide screens only)
      const tr = selected && rows[selected];
      if (tr && pt.sIn && window.innerWidth >= 1024) {
        const r = tr.getBoundingClientRect();
        const visibleRow = r.bottom > 56 && r.top < window.innerHeight;
        if (visibleRow) {
          leaderLine.setAttribute('x1', r.right);
          leaderLine.setAttribute('y1', r.top + r.height / 2);
          leaderLine.setAttribute('x2', pt.sx - 12);
          leaderLine.setAttribute('y2', pt.sy);
          leader.classList.add('is-on');
          return;
        }
      }
      leader.classList.remove('is-on');
    };
    stage.onFrame(updateOverlay);
    window.addEventListener('scroll', () => stage.attached && stage.kick(), { passive: true });

    // drag to orbit; a short tap picks a component
    let drag = null;
    frame.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      drag = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId, touch: e.pointerType !== 'mouse', axis: null };
    });
    frame.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      if (drag.touch) {
        // touch: horizontal drags rotate, vertical drags stay page scroll
        if (!drag.axis && drag.moved > 6) drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (drag.axis !== 'x') return;
        stage.orbit(-dx * 0.01, 0);
      } else {
        if (drag.moved > 4 && !stage.dragging) {
          stage.dragging = true;
          frame.classList.add('is-dragging');
          frame.setPointerCapture(e.pointerId);
        }
        stage.orbit(-dx * 0.008, -dy * 0.005);
      }
    });
    const end = (e) => {
      if (!drag) return;
      if (drag.moved < 6 && e.type === 'pointerup') {
        const part = stage.pick(e.clientX, e.clientY);
        if (part && byPart[part]) select(byPart[part].id, 'marker');
      }
      drag = null;
      stage.dragging = false;
      frame.classList.remove('is-dragging');
    };
    frame.addEventListener('pointerup', end);
    frame.addEventListener('pointercancel', end);

    frame.addEventListener('keydown', (e) => {
      if (e.target !== frame) return;
      const map = { ArrowLeft: [0.15, 0], ArrowRight: [-0.15, 0], ArrowUp: [0, 0.08], ArrowDown: [0, -0.08] };
      if (map[e.key]) {
        e.preventDefault();
        stage.orbit(...map[e.key]);
      } else if (e.key === '+' || e.key === '=') stage.zoom(0.88);
      else if (e.key === '-') stage.zoom(1.14);
    });
    section.querySelector('[data-view="zoom-in"]').addEventListener('click', () => stage.zoom(0.88));
    section.querySelector('[data-view="zoom-out"]').addEventListener('click', () => stage.zoom(1.14));
    section.querySelector('[data-view="reset"]').addEventListener('click', () => stage.resetView());
  }

  return {
    select,
    attachStage,
    useFallback,
    get selected() {
      return selected;
    },
    onSelect(fn) {
      listeners.push(fn);
    },
  };
}
