// Target layouts for the report sheets, one per 3D scene.
// Each layout is a pure function of (sheet index, scene progress 0..1).
import * as THREE from 'three';
import { clamp, lerp, smooth } from '../utils/env.js';

export const PLACES = {
  tray: new THREE.Vector3(-10.2, 0.55, 1.5),
  gate: new THREE.Vector3(-6.6, 3.2, 1.5),
  records: new THREE.Vector3(-5.2, 1.2, 0.6),
  hold: new THREE.Vector3(-6.2, 0.5, 3.6),
  validated: new THREE.Vector3(-4.6, 4.4, 0.4),
};

const C = {
  paper: new THREE.Color(1, 1, 1),
  signal: new THREE.Color(0.55, 0.88, 0.97),
  pass: new THREE.Color(0.52, 0.95, 0.68),
  attn: new THREE.Color(1, 0.76, 0.38),
  crit: new THREE.Color(1, 0.45, 0.45),
  na: new THREE.Color(0.62, 0.67, 0.73),
};

const isAmber = (i) => i % 8 === 3;

function chaos(S, i) {
  const [r1, r2, r3, r4, r5, r6] = S.seed;
  S.set(
    i,
    -7 + r1[i] * 15,
    -0.5 + r2[i] * 10.5,
    -8 + r3[i] * 10,
    (r4[i] - 0.5) * 3,
    (r5[i] - 0.5) * 3,
    (r6[i] - 0.5) * 3,
    0.75 + r4[i] * 0.35,
    undefined,
    C.paper,
  );
}

function trayPos(S, i) {
  const col = i % 3;
  const level = Math.floor(i / 3);
  const [r1, r2] = S.seed;
  return [PLACES.tray.x + (col - 1) * 0.78 + (r1[i] - 0.5) * 0.08, PLACES.tray.y + level * 0.022, PLACES.tray.z + (r2[i] - 0.5) * 0.1];
}

function recordCell(i) {
  // 5 wide × 4 deep × n high block of structured records
  const x = i % 5;
  const z = Math.floor(i / 5) % 4;
  const y = Math.floor(i / 20);
  return [PLACES.records.x + x * 0.46, PLACES.records.y + y * 0.3, PLACES.records.z + z * 0.5];
}

function inbox(S, i, p) {
  const n = S.count;
  const s = i / n;
  const pA = clamp(p / 0.45);
  const pB = clamp((p - 0.45) / 0.55);
  if (pB <= 0) {
    // phase A: scattered sheets settle into the inbox tray
    const q = smooth(clamp(pA * 1.6 - s * 0.6));
    const [tx, ty, tz] = trayPos(S, i);
    chaos(S, i);
    const t = S.tgt;
    const k = i * 3;
    S.set(i, lerp(t.p[k], tx, q), lerp(t.p[k + 1], ty, q), lerp(t.p[k + 2], tz, q),
      lerp(t.r[k], -Math.PI / 2, q), lerp(t.r[k + 1], 0, q), lerp(t.r[k + 2], 0, q), lerp(t.s[k], 0.95, q), undefined, C.paper);
    return;
  }
  // phase B: each sheet leaves the tray, passes the scan gate, becomes a record strip
  const u = clamp(pB * 1.7 - (1 - s) * 0.7);
  const [tx, ty, tz] = trayPos(S, i);
  const lift = [PLACES.tray.x + 2, PLACES.gate.y, PLACES.gate.z];
  const [cx, cy, cz] = recordCell(i);
  if (u < 0.3) {
    const q = smooth(u / 0.3);
    S.set(i, lerp(tx, lift[0], q), lerp(ty, lift[1], q), lerp(tz, lift[2], q), lerp(-Math.PI / 2, 0, q), Math.PI / 2 * q, 0, 0.95, undefined, C.paper);
  } else if (u < 0.55) {
    const q = smooth((u - 0.3) / 0.25);
    S.set(i, lerp(lift[0], PLACES.gate.x, q), PLACES.gate.y, PLACES.gate.z, 0, Math.PI / 2, 0, 0.95, undefined, C.paper);
  } else {
    const q = smooth((u - 0.55) / 0.45);
    const col = C.paper.clone().lerp(C.signal, q);
    S.set(i, lerp(PLACES.gate.x, cx, q), lerp(PLACES.gate.y, cy, q), lerp(PLACES.gate.z, cz, q),
      0, lerp(Math.PI / 2, 0, q), 0, lerp(0.95, 0.7, q), lerp(0.95, 0.28, q), col);
  }
}

function qc(S, i, p) {
  const [cx, cy, cz] = recordCell(i);
  const split = smooth(clamp(p / 0.45));
  const resolve = smooth(clamp((p - 0.62) / 0.3));
  const amber = isAmber(i);
  const v = i - Math.floor((i + 4) / 8); // compact index among green ones
  const vx = PLACES.validated.x + (v % 6) * 0.44;
  const vy = PLACES.validated.y + Math.floor(v / 24) * 0.3;
  const vz = PLACES.validated.z + (Math.floor(v / 6) % 4) * 0.46;
  if (!amber) {
    S.set(i, lerp(cx, vx, split), lerp(cy, vy, split), lerp(cz, vz, split), 0, 0, 0, 0.7, 0.28, C.signal.clone().lerp(C.pass, split));
    return;
  }
  const a = Math.floor(i / 8);
  const hx = PLACES.hold.x + (a % 5) * 0.46;
  const hy = PLACES.hold.y + Math.floor(a / 5) * 0.3;
  const hz = PLACES.hold.z;
  // amber records wait at the hold gate, then are confirmed and join the validated block
  const extra = 20 + a;
  const fx = PLACES.validated.x + (extra % 6) * 0.44;
  const fy = PLACES.validated.y + 7 * 0.3 + Math.floor(a / 6) * 0.3;
  const fz = PLACES.validated.z + (a % 4) * 0.46;
  const px = lerp(lerp(cx, hx, split), fx, resolve);
  const py = lerp(lerp(cy, hy, split), fy, resolve);
  const pz = lerp(lerp(cz, hz, split), fz, resolve);
  const col = C.signal.clone().lerp(C.attn, split).lerp(C.pass, resolve);
  S.set(i, px, py, pz, 0, 0, 0, 0.7, 0.28, col);
}

function hidden(S, i) {
  S.set(i, 0, 4, -1, 0, 0, 0, 0, 0);
}

function archiveWall(S, i, p) {
  const cols = 20;
  const x = i % cols;
  const y = Math.floor(i / cols);
  const r = S.seed[0][i];
  const col = r < 0.83 ? C.pass : r < 0.92 ? C.attn : r < 0.95 ? C.crit : C.na;
  const q = smooth(clamp(p * 2));
  S.set(i, -9.5 + x * 1.0, 0.6 + y * 1.0, lerp(-3, -6, q), 0, 0, 0, 0.62, 0.78, col);
}

export const LAYOUTS = { hero: hidden, field: hidden, inbox, qc, equipment: hidden, impact: archiveWall };
