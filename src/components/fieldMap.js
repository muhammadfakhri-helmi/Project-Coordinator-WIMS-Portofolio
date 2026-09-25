// Chapter 04: route list ↔ route map ↔ detail panel.
// The list in the copy column is the accessible control; map markers are a
// pointer shortcut to the same actions. Desktop uses the WebGL stage; small
// screens and devices without WebGL get a static SVG map.
import { BASE, NODES, ROUTES, WORK_STEPS, nodeById } from '../content/route.js';
import { el, env } from '../utils/env.js';

const W = 520;
const H = 400;
const sx = (x) => (x + 14) * 20;
const sy = (z) => (z + 11) * 20;
const routeById = Object.fromEntries(ROUTES.map((r) => [r.id, r]));

function svgMap() {
  const paths = ROUTES.map((r) => {
    const pts = ['base', ...r.stops, 'base'].map((id) => `${sx(nodeById[id].x)},${sy(nodeById[id].z)}`).join(' ');
    return `<polyline class="map__route" data-route="${r.id}" points="${pts}" />`;
  }).join('');
  const nodes = NODES.map((n) => `<g class="map__node" data-node="${n.id}" data-crew="${n.crew}"><circle cx="${sx(n.x)}" cy="${sy(n.z)}" r="9" /><text x="${sx(n.x) + 14}" y="${sy(n.z) + 4}">${n.label.replace('Node ', '')}</text></g>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Schematic route map: two vessel loops from a supply base through eight fictional nodes">
    <rect class="map__sea" width="${W}" height="${H}" rx="4" />
    ${paths}
    <rect class="map__base" x="${sx(BASE.x) - 14}" y="${sy(BASE.z) - 9}" width="28" height="18" />
    <text class="map__base-label" x="${sx(BASE.x) - 14}" y="${sy(BASE.z) + 26}">Supply base</text>
    ${nodes}
  </svg>`;
}

export function initFieldMap() {
  const section = document.getElementById('field');
  if (!section) return { attachStage() {}, useFallback() {} };
  const frame = section.querySelector('[data-field-frame]');
  const layer = section.querySelector('[data-field-layer]');
  const detail = section.querySelector('[data-field-detail]');
  const routeBtns = [...section.querySelectorAll('[data-route]')].filter((b) => b.tagName === 'BUTTON');
  const nodeBtns = [...section.querySelectorAll('.node-btn')];
  let stage = null;
  let pinnedRoute = null;
  let activeNode = null;
  let svg = null;
  const markers = {};

  // ---- detail panel -----------------------------------------------------
  function showNode(id) {
    const n = nodeById[id];
    const r = routeById[n.crew];
    detail.replaceChildren(
      el('p', { class: 'field-detail__k', text: `${r.label} · fictional location` }),
      el('h3', { text: `${n.label} — ${n.focus}` }),
      el('ol', { class: 'field-detail__steps' }, WORK_STEPS.map(([k, v], i) => el('li', {}, [
        el('span', { class: 'field-detail__n', text: String(i + 1).padStart(2, '0') }),
        el('div', {}, [el('strong', { text: k }), el('span', { text: v })]),
      ]))),
    );
  }
  function showRoute(id) {
    const r = routeById[id];
    detail.replaceChildren(
      el('p', { class: 'field-detail__k', text: 'Work sequence · sanitized' }),
      el('h3', { text: r.label }),
      el('ol', { class: 'field-detail__seq' }, r.sequence.map((s) => el('li', { text: s }))),
    );
  }
  function showDefault() {
    detail.replaceChildren(el('p', { class: 'field-detail__empty', text: 'No node selected. Each visit follows five steps: inspection, testing, maintenance, troubleshooting and reporting.' }));
  }

  // ---- state → map ------------------------------------------------------
  function emphasise(routeId) {
    stage?.setRouteFocus(routeId);
    if (svg) {
      svg.querySelectorAll('[data-route]').forEach((p) => p.classList.toggle('is-dim', !!routeId && p.dataset.route !== routeId));
      svg.querySelectorAll('.map__node').forEach((g) => {
        g.classList.toggle('is-dim', !!routeId && g.dataset.crew !== routeId);
        g.classList.toggle('is-active', g.dataset.node === activeNode);
      });
    }
    section.querySelectorAll('.crew').forEach((c) => c.classList.toggle('is-dim', !!routeId && c.dataset.crew !== routeId));
  }
  function refresh() {
    const focus = activeNode ? nodeById[activeNode].crew : pinnedRoute;
    emphasise(focus);
    stage?.setRouteNode(activeNode);
    Object.entries(markers).forEach(([id, b]) => b.classList.toggle('is-active', id === activeNode));
  }

  function selectNode(id) {
    activeNode = activeNode === id ? null : id;
    nodeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.node === activeNode)));
    if (activeNode) showNode(activeNode);
    else if (pinnedRoute) showRoute(pinnedRoute);
    else showDefault();
    refresh();
  }

  function pinRoute(id) {
    pinnedRoute = pinnedRoute === id ? null : id;
    routeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.route === pinnedRoute)));
    activeNode = null;
    nodeBtns.forEach((b) => b.setAttribute('aria-pressed', 'false'));
    if (pinnedRoute) showRoute(pinnedRoute);
    else showDefault();
    refresh();
  }

  // hover / focus previews, click commits (no hover-only behaviour)
  routeBtns.forEach((b) => {
    const id = b.dataset.route;
    b.addEventListener('click', () => pinRoute(id));
    const preview = () => !activeNode && emphasise(id);
    const restore = () => refresh();
    b.addEventListener('pointerenter', preview);
    b.addEventListener('focus', preview);
    b.addEventListener('pointerleave', restore);
    b.addEventListener('blur', restore);
  });
  nodeBtns.forEach((b) => b.addEventListener('click', () => selectNode(b.dataset.node)));

  // ---- markers ------------------------------------------------------------
  function marker(n) {
    const b = el('button', { type: 'button', class: 'route-marker', 'data-crew': n.crew, tabindex: '-1', 'aria-hidden': 'true' }, [
      el('span', { class: 'route-marker__dot' }),
      el('span', { class: 'route-marker__label', text: n.label }),
    ]);
    b.addEventListener('click', () => selectNode(n.id));
    b.addEventListener('pointerenter', () => !activeNode && emphasise(n.crew));
    b.addEventListener('pointerleave', () => refresh());
    markers[n.id] = b;
    return b;
  }

  function useSvg() {
    if (svg) return;
    const box = el('div', { class: 'map' });
    box.innerHTML = svgMap();
    svg = box.querySelector('svg');
    for (const n of NODES) {
      const m = marker(n);
      m.style.left = `${(sx(n.x) / W) * 100}%`;
      m.style.top = `${(sy(n.z) / H) * 100}%`;
      box.append(m);
    }
    frame.append(box);
    frame.classList.add('is-svg');
    refresh();
  }

  function attachStage(s) {
    if (env.mobile) {
      useSvg();
      return;
    }
    stage = s;
    for (const n of NODES) layer.append(marker(n));
    stage.setFrameElement('field', frame);
    const pt = {};
    stage.onFrame(() => {
      const on = stage.scene === 'field';
      layer.hidden = !on;
      if (!on) return;
      const fr = frame.getBoundingClientRect();
      for (const n of NODES) {
        stage.routeScreen(n.id, pt);
        const inside = pt.visible && pt.x > fr.left && pt.x < fr.right && pt.y > Math.max(fr.top, 56) && pt.y < fr.bottom;
        markers[n.id].style.transform = `translate(${pt.x}px, ${pt.y}px)`;
        markers[n.id].style.visibility = inside ? 'visible' : 'hidden';
      }
    });
    refresh();
  }

  return { attachStage, useFallback: useSvg };
}
