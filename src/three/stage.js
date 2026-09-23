// The fixed 3D stage behind the narrative. Renders only while something is
// changing (camera easing, sheets moving, user dragging); otherwise it sleeps.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildWellhead } from './wellhead.js';
import { ReportSheets } from './reportSheets.js';
import { LAYOUTS, PLACES, HERO_LINKS } from './layouts.js';
import { env, clamp, lerp } from '../utils/env.js';

const FOV = 36;
const STATUS_HEX = { pass: 0x2fb872, attn: 0xf0a52c, crit: 0xe5484d, na: 0x8b98a7 };

// Camera composition per scene. frame = [centerX, centerY, height] as
// fractions of the viewport; fit = world units that must fit that height.
const PRESETS = {
  hero: { target: [0, 4.2, 0], theta: 0.5, phi: 1.36, fit: 13.5, desk: [0.68, 0.55, 0.92], mob: [0.5, 0.74, 0.5], spin: -0.35 },
  problem: { target: [-2.5, 4, -1.5], theta: 0.3, phi: 1.24, fit: 17, desk: [0.72, 0.5, 1], mob: [0.5, 0.5, 1], spin: 0.1 },
  inbox: { target: [-7.0, 2.4, 1.5], theta: 0.05, phi: 1.32, fit: 12, desk: [0.75, 0.52, 0.9], mob: [0.5, 0.5, 0.9], spin: 0.1 },
  qc: { target: [-4.4, 3.0, 1.2], theta: 0.35, phi: 1.28, fit: 8.8, desk: [0.73, 0.5, 0.9], mob: [0.5, 0.5, 0.9], spin: 0.2 },
  equipment: { target: [0.4, 4.3, 0], theta: 0.62, phi: 1.3, fit: 10.2, desk: [0.72, 0.52, 0.9], mob: [0.5, 0.3, 0.6], spin: 0 },
  impact: { target: [0, 4.4, -2], theta: 0.0, phi: 1.36, fit: 13, desk: [0.5, 0.34, 0.6], mob: [0.5, 0.32, 0.55], spin: 0 },
};

export class Stage {
  constructor(container, { onPick } = {}) {
    this.container = container;
    this.onPick = onPick;
    this.low = env.lowPower;
    this.scene = 'hero';
    this.progress = 0;
    this.visible = true;
    this.frameEls = {};
    this.user = { theta: 0, phi: 0, zoom: 1 };
    this.selected = null;
    this.focusY = null;
    this.running = false;

    const renderer = new THREE.WebGLRenderer({ antialias: !this.low, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.low ? 1.5 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07111c);
    scene.fog = new THREE.Fog(0x07111c, 28, 64);
    this.scene3 = scene;

    if (!this.low) {
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 0.38;
      pmrem.dispose();
    }
    scene.add(new THREE.HemisphereLight(0xbfd4e6, 0x0a1018, this.low ? 1.3 : 0.9));
    const key = new THREE.DirectionalLight(0xfff1dc, 1.7);
    key.position.set(8, 14, 10);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x5aa8ff, 0.9);
    rim.position.set(-10, 6, -8);
    scene.add(rim);

    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);

    this.buildEnvironment();
    this.wellhead = buildWellhead({ detail: this.low ? 'low' : 'high' });
    scene.add(this.wellhead.root);

    this.sheets = new ReportSheets(this.low ? 56 : 160);
    scene.add(this.sheets.mesh);

    this.buildLinks();

    // eased view state
    const p = PRESETS.hero;
    this.view = {
      target: new THREE.Vector3(...p.target),
      theta: p.theta,
      phi: p.phi,
      dist: 20,
      cx: 0.72,
      cy: 0.55,
      spin: p.spin,
      w: { gate: 0, tray: 0, hold: 0, links: 1 },
    };
    this.tmp = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();
    this.applyLayout();
    this.kick();
  }

  // ------------------------------------------------------------ scenery
  buildEnvironment() {
    const s = this.scene3;
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(40, 48),
      new THREE.MeshStandardMaterial({ color: 0x0b1724, roughness: 0.95, metalness: 0.05 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.3;
    s.add(ground);
    const grid = new THREE.GridHelper(60, 60, 0x1b3148, 0x12243a);
    grid.position.y = -0.29;
    s.add(grid);

    // soft contact shadow (texture, not a shadow map)
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0,0,0,0.65)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const blob = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 7),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }),
    );
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = -0.28;
    s.add(blob);

    const lineMat = (color) => new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 });
    const frame = (w, h, d, color) => new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), lineMat(color));

    this.tray = frame(3.0, 0.9, 1.5, 0x9fb3c6);
    this.tray.position.copy(PLACES.tray).add(new THREE.Vector3(0, 0.35, 0));
    s.add(this.tray);

    this.gate = new THREE.Group();
    this.gate.add(frame(0.12, 2.2, 2.2, 0x46c2e0));
    const scanPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 2.2),
      new THREE.MeshBasicMaterial({ color: 0x46c2e0, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
    );
    scanPlane.rotation.y = Math.PI / 2;
    this.gate.add(scanPlane);
    this.gate.position.copy(PLACES.gate);
    s.add(this.gate);

    this.hold = frame(2.6, 1.2, 1.0, 0xf0a52c);
    this.hold.position.copy(PLACES.hold).add(new THREE.Vector3(0.9, 0.35, 0));
    s.add(this.hold);
  }

  buildLinks() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(HERO_LINKS.length * 6), 3));
    this.links = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x46c2e0, transparent: true, opacity: 0.5 }));
    this.links.frustumCulled = false;
    this.scene3.add(this.links);
  }

  // ------------------------------------------------------------ public API
  setScene(name, progress = 0) {
    const changed = name !== this.scene;
    this.scene = name;
    this.progress = progress;
    if (changed && name !== 'equipment') this.focusY = null;
    this.applyLayout();
    this.kick();
  }

  setProgress(progress) {
    this.progress = progress;
    this.applyLayout();
    this.kick();
  }

  setVisible(v) {
    if (v === this.visible) return;
    this.visible = v;
    this.container.parentElement.classList.toggle('is-hidden', !v);
    if (v) this.kick();
  }

  /** Attach a scene's composition to a page element (it then follows scrolling). */
  setFrameElement(scene, el, { mobileOnly = false } = {}) {
    this.frameEls[scene] = { el, mobileOnly };
  }

  select(id, part, status) {
    this.selected = id;
    this.wellhead.highlight(part, STATUS_HEX[status]);
    const a = this.wellhead.anchors[part];
    if (a) {
      a.getWorldPosition(this.tmp);
      this.focusY = clamp(this.tmp.y, 2.5, 6.5);
    }
    this.kick();
  }

  orbit(dTheta, dPhi) {
    this.user.theta += dTheta;
    this.user.phi = clamp(this.user.phi + dPhi, -0.45, 0.22);
    this.kick();
  }

  zoom(f) {
    this.user.zoom = clamp(this.user.zoom * f, 0.6, 1.45);
    this.kick();
  }

  resetView() {
    this.user.theta = 0;
    this.user.phi = 0;
    this.user.zoom = 1;
    this.focusY = null;
    this.kick();
  }

  anchorScreen(part, out) {
    const a = this.wellhead.anchors[part];
    a.getWorldPosition(this.tmp);
    const world = this.tmp.clone();
    this.tmp.project(this.camera);
    // the view offset is part of the projection matrix, so NDC maps straight to the viewport
    out.x = (this.tmp.x * 0.5 + 0.5) * this.width;
    out.y = (-this.tmp.y * 0.5 + 0.5) * this.height;
    out.visible = this.tmp.z < 1;
    // facing test: is the anchor on the camera side of the tree axis?
    const n = world.clone().setY(0).normalize();
    const v = this.camera.position.clone().sub(world).setY(0).normalize();
    out.behind = n.dot(v) < -0.15;
    return out;
  }

  pick(clientX, clientY) {
    const x = (clientX / this.width) * 2 - 1;
    const y = -(clientY / this.height) * 2 + 1;
    this.raycaster.setFromCamera({ x, y }, this.camera);
    const hit = this.raycaster.intersectObjects(this.wellhead.pickables, false)[0];
    return hit ? hit.object.userData.part : null;
  }

  onFrame(fn) {
    this.afterRender = fn;
  }

  // ------------------------------------------------------------ internals
  applyLayout() {
    const fn = LAYOUTS[this.scene];
    if (!fn) return; // paper scenes keep the last composition
    for (let i = 0; i < this.sheets.count; i++) fn(this.sheets, i, this.progress);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.width = w;
    this.height = h;
    this.offX = 0;
    this.offY = 0;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.kick();
  }

  kick() {
    if (this.running || !this.visible) return;
    this.running = true;
    requestAnimationFrame(() => this.frame());
  }

  frameTarget() {
    const p = PRESETS[this.scene];
    if (!p) return null;
    const mobile = env.mobile;
    let [cx, cy, fh] = mobile ? p.mob : p.desk;
    let fw = 1;
    const attached = this.frameEls[this.scene];
    this.attached = false;
    if (attached && (!attached.mobileOnly || mobile)) {
      const r = attached.el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        cx = (r.left + r.width / 2) / this.width;
        cy = (r.top + r.height / 2) / this.height;
        fh = r.height / this.height;
        fw = r.width / this.width;
        this.attached = true;
      }
    }
    const t = this.tmp.set(...p.target);
    if (this.scene === 'equipment' && this.focusY != null) t.y = lerp(t.y, this.focusY, 0.5);
    let dist = p.fit / (fh * 2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    // narrow frames: keep the whole subject inside the frame width too
    const frameAspect = (fw * this.width) / (fh * this.height);
    if (frameAspect < 0.75) dist *= Math.min(1.9, 0.75 / frameAspect);
    let theta = p.theta;
    let phi = p.phi;
    if (this.scene === 'equipment') {
      theta += this.user.theta;
      phi += this.user.phi;
      dist *= this.user.zoom;
    }
    if (this.scene === 'hero') theta += this.progress * 0.25;
    return { target: t.clone(), theta, phi, dist, cx, cy, spin: p.spin };
  }

  frame() {
    this.running = false;
    if (!this.visible) return;
    const reduced = env.reducedMotion;
    const k = reduced ? 1 : 0.1;
    const v = this.view;
    let moving = 0;

    const t = this.frameTarget();
    if (t) {
      const ease = (a, b) => {
        const d = b - a;
        moving = Math.max(moving, Math.abs(d));
        return a + d * k;
      };
      v.target.x = ease(v.target.x, t.target.x);
      v.target.y = ease(v.target.y, t.target.y);
      v.target.z = ease(v.target.z, t.target.z);
      v.theta = ease(v.theta, t.theta);
      v.phi = ease(v.phi, t.phi);
      v.dist = ease(v.dist, t.dist);
      // frame centre must follow a scrolling element exactly, so it is not eased there
      const direct = this.attached || reduced;
      v.cx = direct ? t.cx : ease(v.cx, t.cx);
      v.cy = direct ? t.cy : ease(v.cy, t.cy);
      const spin = this.scene === 'hero' ? t.spin + this.progress * 0.5 : t.spin;
      v.spin = ease(v.spin, spin);

      const s = this.scene;
      const wt = {
        gate: s === 'inbox' || s === 'qc' ? 1 : 0,
        tray: s === 'inbox' ? 1 : s === 'qc' ? 0.25 : 0,
        hold: s === 'qc' ? clamp(1 - (this.progress - 0.7) / 0.25) : 0,
        links: s === 'hero' ? clamp(1 - this.progress * 1.4) : 0,
      };
      for (const key in wt) v.w[key] = ease(v.w[key], wt[key]);
    }

    // camera
    const sinP = Math.sin(v.phi);
    this.camera.position.set(
      v.target.x + v.dist * sinP * Math.sin(v.theta),
      v.target.y + v.dist * Math.cos(v.phi),
      v.target.z + v.dist * sinP * Math.cos(v.theta),
    );
    this.camera.lookAt(v.target);
    this.offX = v.cx * this.width - this.width / 2;
    this.offY = v.cy * this.height - this.height / 2;
    this.camera.setViewOffset(this.width, this.height, -this.offX, -this.offY, this.width, this.height);
    this.wellhead.root.rotation.y = v.spin;

    // helpers
    this.tray.material.opacity = v.w.tray * 0.6;
    this.gate.children[0].material.opacity = v.w.gate * 0.9;
    this.gate.children[1].material.opacity = v.w.gate * 0.1;
    this.hold.material.opacity = v.w.hold * 0.9;
    this.tray.visible = v.w.tray > 0.01;
    this.gate.visible = v.w.gate > 0.01;
    this.hold.visible = v.w.hold > 0.01;

    // sheets
    moving = Math.max(moving, this.sheets.step(reduced ? 1 : 0.08));

    // hero connection lines: sheet → component
    this.links.visible = v.w.links > 0.01;
    if (this.links.visible) {
      this.links.material.opacity = v.w.links * 0.45;
      const arr = this.links.geometry.attributes.position.array;
      HERO_LINKS.forEach((part, i) => {
        const sp = this.sheets.position(i);
        arr.set([sp.x, sp.y, sp.z], i * 6);
        this.wellhead.anchors[part].getWorldPosition(this.tmp);
        arr.set([this.tmp.x, this.tmp.y, this.tmp.z], i * 6 + 3);
      });
      this.links.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene3, this.camera);
    if (this.afterRender) this.afterRender();

    if (moving > 0.0015 || this.dragging) this.kick();
  }
}
