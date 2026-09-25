// Abstract offshore route map: two closed vessel loops from a supply base
// through fictional nodes. Simple lines, discs and vessel markers only.
import * as THREE from 'three';
import { BASE, NODES, ROUTES, nodeById } from '../content/route.js';

const COLORS = { a: 0x46c2e0, b: 0xe4dccb };
const Y = 0.02;

export function buildRouteMap({ low = false } = {}) {
  const root = new THREE.Group();
  root.name = 'routeMap';
  root.visible = false;
  // map coordinates are generous for the SVG; the 3D view is drawn more compact
  root.scale.set(0.7, 1, 0.7);
  const anchors = {};
  const seg = low ? 16 : 32;

  const nodeGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.5, seg);
  const ringGeo = new THREE.RingGeometry(0.62, 0.72, seg);
  const nodeMat = new THREE.MeshStandardMaterial({ color: 0x8a959f, metalness: 0.5, roughness: 0.5 });
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x5c656d, metalness: 0.3, roughness: 0.6 });

  const rings = {};
  for (const n of NODES) {
    const g = new THREE.Group();
    g.position.set(n.x, Y, n.z);
    const post = new THREE.Mesh(nodeGeo, nodeMat);
    post.position.y = 0.25;
    g.add(post);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: COLORS[n.crew], transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    g.add(ring);
    rings[n.id] = ring;
    const a = new THREE.Object3D();
    a.position.y = 0.6;
    g.add(a);
    anchors[n.id] = a;
    root.add(g);
  }

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 1.1), baseMat);
  base.position.set(BASE.x, 0.2, BASE.z);
  root.add(base);
  const baseAnchor = new THREE.Object3D();
  baseAnchor.position.set(BASE.x, 0.6, BASE.z);
  root.add(baseAnchor);
  anchors.base = baseAnchor;

  // routes: closed Catmull-Rom loops through base → stops → base
  const routes = {};
  const hullGeo = new THREE.BoxGeometry(0.9, 0.22, 0.34);
  const bowGeo = new THREE.ConeGeometry(0.17, 0.34, 4);
  for (const r of ROUTES) {
    const pts = ['base', ...r.stops].map((id) => {
      const n = nodeById[id];
      return new THREE.Vector3(n.x, Y, n.z);
    });
    const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.5);
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getSpacedPoints(low ? 90 : 180));
    const mat = new THREE.LineDashedMaterial({ color: COLORS[r.id], dashSize: 0.45, gapSize: 0.3, transparent: true, opacity: 0.7 });
    const line = new THREE.Line(geo, mat);
    line.computeLineDistances();
    root.add(line);

    const vessel = new THREE.Group();
    const vmat = new THREE.MeshStandardMaterial({ color: COLORS[r.id], metalness: 0.2, roughness: 0.5 });
    const hull = new THREE.Mesh(hullGeo, vmat);
    hull.position.y = 0.14;
    vessel.add(hull);
    const bow = new THREE.Mesh(bowGeo, vmat);
    bow.rotation.z = -Math.PI / 2;
    bow.position.set(0.6, 0.14, 0);
    vessel.add(bow);
    root.add(vessel);
    routes[r.id] = { curve, line, vessel, offset: r.id === 'a' ? 0 : 0.45 };
  }

  const tmp = new THREE.Vector3();
  const ahead = new THREE.Vector3();
  let focus = null;
  let active = null;

  /** Place vessels along their loops. t in seconds (or a fixed value). */
  function update(t) {
    for (const r of Object.values(routes)) {
      const u = (t * 0.018 + r.offset) % 1;
      r.curve.getPointAt(u, tmp);
      r.curve.getPointAt((u + 0.004) % 1, ahead);
      r.vessel.position.copy(tmp);
      r.vessel.rotation.y = Math.atan2(-(ahead.z - tmp.z), ahead.x - tmp.x);
    }
  }

  function applyEmphasis() {
    for (const [id, r] of Object.entries(routes)) {
      const on = !focus || focus === id;
      r.line.material.opacity = on ? 0.9 : 0.18;
      r.vessel.visible = on || !focus;
    }
    for (const n of NODES) {
      const on = (!focus || focus === n.crew) && (!active || active === n.id);
      rings[n.id].material.opacity = active === n.id ? 1 : on ? 0.55 : 0.15;
      rings[n.id].scale.setScalar(active === n.id ? 1.35 : 1);
    }
  }

  function setFocus(routeId) {
    focus = routeId;
    applyEmphasis();
  }

  function setActive(nodeId) {
    active = nodeId;
    applyEmphasis();
  }

  update(4);
  applyEmphasis();
  return { root, anchors, update, setFocus, setActive };
}
