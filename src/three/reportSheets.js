// Report "sheets": one InstancedMesh of small spreadsheet-like planes.
// Each scene computes target transforms; the sheets ease toward them.
import * as THREE from 'three';

function sheetTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 176;
  const g = c.getContext('2d');
  g.fillStyle = '#f4f1e8';
  g.fillRect(0, 0, 128, 176);
  g.fillStyle = '#1f3b57';
  g.fillRect(0, 0, 128, 18);
  g.strokeStyle = '#c3ccd4';
  g.lineWidth = 1;
  for (let y = 30; y < 176; y += 12) {
    g.beginPath();
    g.moveTo(8, y + 0.5);
    g.lineTo(120, y + 0.5);
    g.stroke();
  }
  for (const x of [8, 44, 72, 96, 120]) {
    g.beginPath();
    g.moveTo(x + 0.5, 30);
    g.lineTo(x + 0.5, 170);
    g.stroke();
  }
  g.fillStyle = '#d9dfe4';
  for (let y = 42; y < 170; y += 36) g.fillRect(9, y + 1, 35, 11);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export class ReportSheets {
  constructor(count) {
    this.count = count;
    this.texture = sheetTexture();
    const geo = new THREE.PlaneGeometry(0.62, 0.84);
    const mat = new THREE.MeshBasicMaterial({ map: this.texture, side: THREE.DoubleSide, toneMapped: false });
    this.mesh = new THREE.InstancedMesh(geo, mat, count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;

    const n = count;
    this.cur = { p: new Float32Array(n * 3), r: new Float32Array(n * 3), s: new Float32Array(n * 3), c: new Float32Array(n * 3) };
    this.tgt = { p: new Float32Array(n * 3), r: new Float32Array(n * 3), s: new Float32Array(n * 3), c: new Float32Array(n * 3) };
    // per-instance random seeds
    this.seed = Array.from({ length: 6 }, () => Float32Array.from({ length: n }, Math.random));
    this.cur.s.fill(0);
    this.cur.c.fill(1);
    this.tgt.c.fill(1);

    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._v = new THREE.Vector3();
    this._sc = new THREE.Vector3();
    this._col = new THREE.Color();
    for (let i = 0; i < n; i++) this.mesh.setColorAt(i, this._col.setRGB(1, 1, 1));
  }

  set(i, x, y, z, rx, ry, rz, sx, sy = sx, col = null) {
    const k = i * 3;
    const t = this.tgt;
    t.p[k] = x; t.p[k + 1] = y; t.p[k + 2] = z;
    t.r[k] = rx; t.r[k + 1] = ry; t.r[k + 2] = rz;
    t.s[k] = sx; t.s[k + 1] = sy; t.s[k + 2] = 1;
    if (col) { t.c[k] = col.r; t.c[k + 1] = col.g; t.c[k + 2] = col.b; }
  }

  position(i) {
    const k = i * 3;
    return this._v.set(this.cur.p[k], this.cur.p[k + 1], this.cur.p[k + 2]);
  }

  /** Ease current → target. Returns the largest remaining delta. */
  step(k) {
    const { cur, tgt } = this;
    let maxD = 0;
    for (const key of ['p', 'r', 's', 'c']) {
      const a = cur[key];
      const b = tgt[key];
      for (let j = 0; j < a.length; j++) {
        const d = b[j] - a[j];
        if (d > maxD) maxD = d;
        else if (-d > maxD) maxD = -d;
        a[j] += d * k;
      }
    }
    for (let i = 0; i < this.count; i++) {
      const j = i * 3;
      this._e.set(cur.r[j], cur.r[j + 1], cur.r[j + 2]);
      this._q.setFromEuler(this._e);
      this._v.set(cur.p[j], cur.p[j + 1], cur.p[j + 2]);
      this._sc.set(Math.max(cur.s[j], 1e-4), Math.max(cur.s[j + 1], 1e-4), 1);
      this._m.compose(this._v, this._q, this._sc);
      this.mesh.setMatrixAt(i, this._m);
      this.mesh.setColorAt(i, this._col.setRGB(cur.c[j], cur.c[j + 1], cur.c[j + 2]));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor.needsUpdate = true;
    return maxD;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.texture.dispose();
  }
}
