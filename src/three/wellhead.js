// Procedural, simplified wellhead + X-mas tree built from Three.js primitives.
// Original geometry written for this portfolio. Proportions are generic and
// illustrative: no pressure ratings, bore sizes or field configuration.
import * as THREE from 'three';

const PAINT = 0x5c656d;

function makeMaterials() {
  return {
    paint: new THREE.MeshStandardMaterial({ color: PAINT, metalness: 0.35, roughness: 0.55 }),
    paintDark: new THREE.MeshStandardMaterial({ color: 0x434b52, metalness: 0.4, roughness: 0.55 }),
    flange: new THREE.MeshStandardMaterial({ color: 0x4f575e, metalness: 0.5, roughness: 0.48 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xa9b0b6, metalness: 0.9, roughness: 0.3 }),
    bolt: new THREE.MeshStandardMaterial({ color: 0xa3abb2, metalness: 0.85, roughness: 0.35 }),
    wheel: new THREE.MeshStandardMaterial({ color: 0x1c2227, metalness: 0.4, roughness: 0.6 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xb49f68, metalness: 0.8, roughness: 0.35 }),
    dial: new THREE.MeshStandardMaterial({ color: 0xefede6, metalness: 0, roughness: 0.8 }),
    pipe: new THREE.MeshStandardMaterial({ color: 0x8a9197, metalness: 0.7, roughness: 0.42 }),
    plinth: new THREE.MeshStandardMaterial({ color: 0x1a2735, metalness: 0.1, roughness: 0.9 }),
  };
}

/**
 * @param {{ detail?: 'high' | 'low' }} opts
 * @returns {{ root: THREE.Group, anchors: Record<string, THREE.Object3D>, pickables: THREE.Mesh[], highlight: (part: string|null, color?: number) => void, step: (k?: number) => number, reveal: (t: number) => void, dispose: () => void }}
 */
export function buildWellhead({ detail = 'high' } = {}) {
  const hi = detail === 'high';
  const SEG = hi ? 32 : 16;
  const M = makeMaterials();
  const root = new THREE.Group();
  root.name = 'wellhead';
  const bolts = []; // world matrices, merged into one InstancedMesh at the end
  const anchors = {};

  const cyl = (rt, rb, h, mat, seg = SEG) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);

  // Flange disc with bolt ring. axis: 'y' | 'x' | 'z'
  function flange(parent, r, at, axis = 'y', n = 12) {
    const d = cyl(r, r, 0.14, M.flange, SEG);
    orient(d, axis);
    d.position.copy(at);
    parent.add(d);
    if (!hi) return;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const b = new THREE.Object3D();
      const rr = r * 0.82;
      if (axis === 'y') b.position.set(at.x + Math.cos(a) * rr, at.y, at.z + Math.sin(a) * rr);
      if (axis === 'x') b.position.set(at.x, at.y + Math.sin(a) * rr, at.z + Math.cos(a) * rr);
      if (axis === 'z') b.position.set(at.x + Math.cos(a) * rr, at.y + Math.sin(a) * rr, at.z);
      orient(b, axis);
      b.userData.bolt = true;
      parent.add(b);
    }
  }

  function orient(o, axis) {
    if (axis === 'x') o.rotation.z = Math.PI / 2;
    if (axis === 'z') o.rotation.x = Math.PI / 2;
  }

  function handwheel(R) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.TorusGeometry(R, R * 0.1, hi ? 10 : 6, hi ? 32 : 18), M.wheel));
    const hub = cyl(R * 0.16, R * 0.16, R * 0.28, M.wheel, 12);
    hub.rotation.x = Math.PI / 2;
    g.add(hub);
    for (let i = 0; i < 3; i++) {
      const s = cyl(R * 0.045, R * 0.045, R * 1.9, M.wheel, 8);
      s.rotation.z = (i / 3) * Math.PI;
      g.add(s);
    }
    return g;
  }

  // Gate valve with vertical bore; bonnet + handwheel out along ±X.
  function verticalValve(side) {
    const g = new THREE.Group();
    const r = 0.52;
    g.add(cyl(r, r, 0.6, M.paint));
    flange(g, r * 1.18, new THREE.Vector3(0, 0.42, 0));
    flange(g, r * 1.18, new THREE.Vector3(0, -0.42, 0));
    const bonnet = cyl(r * 0.46, r * 0.68, r * 1.4, M.paintDark, 20);
    bonnet.rotation.z = Math.PI / 2;
    bonnet.position.x = side * (r + r * 0.55);
    g.add(bonnet);
    const stem = cyl(0.05, 0.05, r * 1.3, M.steel, 8);
    stem.rotation.z = Math.PI / 2;
    stem.position.x = side * (r + r * 1.45);
    g.add(stem);
    const w = handwheel(0.46);
    w.rotation.y = Math.PI / 2;
    w.position.x = side * (r + r * 2.15);
    g.add(w);
    return g;
  }

  // Gate valve with horizontal bore along X; bonnet + handwheel up.
  function horizontalValve() {
    const g = new THREE.Group();
    const r = 0.4;
    const b = cyl(r, r, 0.7, M.paint);
    b.rotation.z = Math.PI / 2;
    g.add(b);
    flange(g, r * 1.14, new THREE.Vector3(0.36, 0, 0), 'x', 8);
    flange(g, r * 1.14, new THREE.Vector3(-0.36, 0, 0), 'x', 8);
    const bonnet = cyl(r * 0.48, r * 0.66, r * 1.3, M.paintDark, 16);
    bonnet.position.y = r + r * 0.5;
    g.add(bonnet);
    const stem = cyl(0.045, 0.045, r * 1.1, M.steel, 8);
    stem.position.y = r + r * 1.3;
    g.add(stem);
    const w = handwheel(0.38);
    w.rotation.x = Math.PI / 2;
    w.position.y = r + r * 1.95;
    g.add(w);
    return g;
  }

  function spool(rBot, rTop, H) {
    const g = new THREE.Group();
    g.add(cyl(rTop, rBot, H, M.paint));
    flange(g, rTop * 1.14, new THREE.Vector3(0, H / 2, 0));
    flange(g, rBot * 1.1, new THREE.Vector3(0, -H / 2, 0), 'y', 16);
    return g;
  }

  // Side outlet along +X: stub, small gate valve, blind end or gauge.
  function sideOutlet(len, withGauge) {
    const g = new THREE.Group();
    const stub = cyl(0.14, 0.14, len, M.paint, 14);
    stub.rotation.z = Math.PI / 2;
    stub.position.x = len / 2;
    g.add(stub);
    const vb = box(0.36, 0.42, 0.36, M.paint);
    vb.position.x = len * 0.85;
    g.add(vb);
    const w = handwheel(0.24);
    w.rotation.x = Math.PI / 2;
    w.position.set(len * 0.85, 0.44, 0);
    g.add(w);
    const cap = cyl(0.18, 0.18, 0.1, M.flange, 16);
    cap.rotation.z = Math.PI / 2;
    cap.position.x = len * 1.08;
    g.add(cap);
    if (withGauge) {
      const gg = smallGauge();
      gg.position.x = len * 1.12;
      g.add(gg);
    }
    const anchor = new THREE.Object3D();
    anchor.position.set(len * 0.85, 0.1, 0.25);
    g.add(anchor);
    g.userData.anchor = anchor;
    return g;
  }

  function smallGauge() {
    const g = new THREE.Group();
    const stem = cyl(0.04, 0.04, 0.2, M.steel, 8);
    stem.rotation.z = Math.PI / 2;
    stem.position.x = 0.1;
    g.add(stem);
    const body = cyl(0.15, 0.15, 0.09, M.brass, 20);
    body.rotation.z = Math.PI / 2;
    body.position.x = 0.25;
    g.add(body);
    const dial = cyl(0.12, 0.12, 0.02, M.dial, 20);
    dial.rotation.z = Math.PI / 2;
    dial.position.x = 0.3;
    g.add(dial);
    return g;
  }

  function radial(parent, child, y, angle) {
    const w = new THREE.Group();
    w.add(child);
    w.position.y = y;
    w.rotation.y = angle;
    parent.add(w);
    return w;
  }

  const parts = {};
  function place(key, group, x, y, z = 0) {
    group.position.set(x, y, z);
    root.add(group);
    parts[key] = group;
    return group;
  }

  function anchorAt(key, parent, x, y, z) {
    const a = new THREE.Object3D();
    a.position.set(x, y, z);
    parent.add(a);
    anchors[key] = a;
  }

  // ---- stack (y = 0 is deck level) ------------------------------------
  const plinth = cyl(1.9, 2.1, 0.12, M.plinth, SEG);
  plinth.position.y = -0.24;
  root.add(plinth);

  // conductor: outermost pipe the wellhead is landed on
  const conductor = new THREE.Group();
  conductor.add(cyl(1.5, 1.5, 0.42, M.paintDark));
  const lip = cyl(1.62, 1.62, 0.06, M.flange);
  lip.position.y = 0.19;
  conductor.add(lip);
  place('conductor', conductor, 0, -0.1);
  anchorAt('conductor', conductor, 0.4, 0, 1.5);

  const casingHead = place('casingHead', spool(1.4, 1.12, 1.3), 0, 0.75);
  radial(casingHead, sideOutlet(1.3, false), 0.1, Math.PI);

  const tubingSpool = place('tubingSpool', spool(1.02, 0.82, 1.15), 0, 2.2);
  const annulusOutlet = sideOutlet(1.15, true);
  radial(tubingSpool, annulusOutlet, 0.05, -0.55); // faces the front-right
  parts.annulus = annulusOutlet;
  anchors.annulus = annulusOutlet.userData.anchor;
  radial(tubingSpool, sideOutlet(1.15, false), 0.05, Math.PI);

  const adapter = new THREE.Group();
  adapter.add(cyl(0.6, 0.78, 0.6, M.paint));
  flange(adapter, 0.72, new THREE.Vector3(0, 0.32, 0));
  flange(adapter, 0.9, new THREE.Vector3(0, -0.32, 0), 'y', 16);
  place('flange', adapter, 0, 3.12);
  anchorAt('flange', adapter, 0.25, -0.32, 0.88);

  const lmv = place('master', verticalValve(1), 0, 4.0);
  anchorAt('master', lmv, 0, 0, 0.56);
  const umv = place('upperMaster', verticalValve(-1), 0, 4.98);
  anchorAt('upperMaster', umv, 0, 0, 0.56);

  const cross = new THREE.Group();
  cross.add(cyl(0.52, 0.52, 0.6, M.paint));
  const arm = cyl(0.38, 0.38, 1.46, M.paint, 20);
  arm.rotation.z = Math.PI / 2;
  cross.add(arm);
  flange(cross, 0.62, new THREE.Vector3(0, 0.4, 0));
  flange(cross, 0.62, new THREE.Vector3(0, -0.4, 0));
  place('cross', cross, 0, 5.94);

  const wing = place('wing', horizontalValve(), 1.5, 5.94);
  anchorAt('wing', wing, 0, 0, 0.44);
  const kill = place('killWing', horizontalValve(), -1.5, 5.94);
  kill.rotation.y = Math.PI;
  const killCap = cyl(0.2, 0.2, 0.3, M.paintDark, 16);
  killCap.rotation.z = Math.PI / 2;
  killCap.position.set(-2.35, 5.94, 0);
  root.add(killCap);

  const choke = new THREE.Group();
  choke.add(box(0.52, 0.52, 0.52, M.paintDark));
  const bonnet = cyl(0.14, 0.14, 0.42, M.brass, 12);
  bonnet.position.y = 0.44;
  choke.add(bonnet);
  const out = cyl(0.16, 0.16, 0.8, M.pipe, 14);
  out.rotation.z = Math.PI / 2;
  out.position.x = 0.62;
  choke.add(out);
  const drop = cyl(0.16, 0.16, 1.6, M.pipe, 14);
  drop.position.set(1.02, -0.72, 0);
  choke.add(drop);
  place('choke', choke, 2.55, 5.94);
  anchorAt('choke', choke, 0, 0.05, 0.34);

  const swab = place('swab', verticalValve(1), 0, 6.9);
  anchorAt('swab', swab, 0, 0, 0.56);

  const cap = new THREE.Group();
  cap.add(cyl(0.32, 0.48, 0.46, M.paint, 20));
  flange(cap, 0.58, new THREE.Vector3(0, -0.23, 0), 'y', 8);
  const lift = cyl(0.2, 0.2, 0.28, M.steel, 16);
  lift.position.y = 0.32;
  cap.add(lift);
  place('cap', cap, 0, 7.62);

  const gauge = new THREE.Group();
  const gStem = cyl(0.05, 0.05, 0.26, M.steel, 8);
  gStem.position.y = 0.13;
  gauge.add(gStem);
  const gBody = cyl(0.24, 0.24, 0.1, M.brass, 24);
  gBody.rotation.x = Math.PI / 2;
  gBody.position.y = 0.4;
  gauge.add(gBody);
  const gDial = cyl(0.2, 0.2, 0.02, M.dial, 24);
  gDial.rotation.x = Math.PI / 2;
  gDial.position.set(0, 0.4, 0.06);
  gauge.add(gDial);
  const needle = box(0.16, 0.014, 0.01, M.wheel);
  needle.position.set(0.03, 0.43, 0.075);
  needle.rotation.z = 0.6;
  gauge.add(needle);
  place('gauge', gauge, 0, 8.02);
  anchorAt('gauge', gauge, 0, 0.4, 0.12);

  // ---- bolts → one InstancedMesh ---------------------------------------
  root.updateMatrixWorld(true);
  const boltObjs = [];
  root.traverse((o) => o.userData.bolt && boltObjs.push(o));
  if (boltObjs.length) {
    const boltMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 6), M.bolt, boltObjs.length);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const m = new THREE.Matrix4();
    boltObjs.forEach((o, i) => {
      boltMesh.setMatrixAt(i, m.multiplyMatrices(inv, o.matrixWorld));
      o.parent.remove(o);
    });
    boltMesh.instanceMatrix.needsUpdate = true;
    root.add(boltMesh);
    bolts.push(boltMesh);
  }

  // ---- per-part material clones: tint on selection, reveal from silhouette --
  // Reveal order runs bottom to top, the way the equipment is assembled.
  const ORDER = ['conductor', 'casingHead', 'tubingSpool', 'annulus', 'flange', 'master', 'upperMaster', 'cross', 'wing', 'killWing', 'choke', 'swab', 'cap', 'gauge'];
  const PICKABLE = new Set(['master', 'upperMaster', 'swab', 'wing', 'choke', 'gauge', 'flange', 'annulus', 'conductor']);
  const SILHOUETTE = new THREE.Color(0x0a121b);
  const pickables = [];
  const tinted = {};
  const claimed = new Set();
  // nested parts first: the annulus outlet sits inside the tubing spool group
  for (const key of ['annulus', ...ORDER.filter((k) => k !== 'annulus')]) {
    const cache = new Map();
    tinted[key] = [];
    parts[key].traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || claimed.has(o)) return;
      claimed.add(o);
      if (!cache.has(o.material)) {
        const c = o.material.clone();
        c.userData.base = c.color.clone();
        c.userData.metal = c.metalness;
        cache.set(o.material, c);
        tinted[key].push(c);
      }
      o.material = cache.get(o.material);
      o.userData.part = key;
      if (PICKABLE.has(key)) pickables.push(o);
    });
  }
  // shared (unclaimed) materials: bolts, extra outlets, kill cap
  const shared = Object.values(M);
  shared.forEach((m) => {
    m.userData.base = m.color.clone();
    m.userData.metal = m.metalness;
  });

  // emissive eases toward its target so a state change reads as a transition
  const glow = Object.fromEntries(ORDER.map((k) => [k, { now: 0, target: 0, color: new THREE.Color(0x46c2e0) }]));

  function highlight(part, color = 0x46c2e0) {
    for (const key of ORDER) {
      const g = glow[key];
      g.target = key === part ? 0.34 : 0;
      if (key === part) g.color.setHex(color);
    }
  }

  /** Ease emissive tints; returns the largest remaining difference. */
  function step(k = 0.12) {
    let moving = 0;
    for (const key of ORDER) {
      const g = glow[key];
      const d = g.target - g.now;
      if (Math.abs(d) < 0.002) g.now = g.target;
      else g.now += d * k;
      moving = Math.max(moving, Math.abs(d));
      for (const m of tinted[key]) {
        m.emissive.copy(g.color);
        m.emissiveIntensity = g.now;
      }
    }
    return moving;
  }

  /** 0 = dark silhouette, 1 = fully lit. Parts come in one after another. */
  function reveal(t) {
    const n = ORDER.length;
    ORDER.forEach((key, i) => {
      const q = Math.min(1, Math.max(0, t * (n + 2) - i));
      const e = q * q * (3 - 2 * q);
      for (const m of tinted[key]) {
        m.color.copy(SILHOUETTE).lerp(m.userData.base, e);
        m.metalness = m.userData.metal * e;
      }
    });
    const e = Math.min(1, Math.max(0, t * 1.1));
    shared.forEach((m) => {
      m.color.copy(SILHOUETTE).lerp(m.userData.base, e);
      m.metalness = m.userData.metal * e;
    });
  }

  function dispose() {
    root.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
    });
    Object.values(M).forEach((m) => m.dispose());
    Object.values(tinted).flat().forEach((m) => m.dispose());
  }

  return { root, anchors, pickables, highlight, step, reveal, order: ORDER, dispose, bolts };
}
