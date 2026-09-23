// Cinematic scroll story: a plan draws itself, walls rise, framing fills in, board and block go on,
// then the whole takeoff separates into counted material stacks. Scroll position drives everything.
import * as THREE from 'three';

const canvas = document.getElementById('story-canvas');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isSmall = window.matchMedia('(max-width: 800px)').matches;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isSmall, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.25 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06101f);
scene.fog = new THREE.Fog(0x06101f, 30, 80);
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 300);

scene.add(new THREE.HemisphereLight(0x9cc3ff, 0x0b1a2e, 0.9));
const key = new THREE.DirectionalLight(0xffe2c4, 1.6);
key.position.set(-14, 22, 12);
scene.add(key);
const rim = new THREE.DirectionalLight(0x5fa8ff, 0.8);
rim.position.set(18, 10, -16);
scene.add(rim);

// ---------- helpers ----------
const clamp01 = x => Math.max(0, Math.min(1, x));
const ease = x => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const lerp = THREE.MathUtils.lerp;

// ---------- blueprint sheet ----------
const sheet = new THREE.Mesh(new THREE.PlaneGeometry(60, 40),
  new THREE.MeshStandardMaterial({ color: 0x0d2b4e, roughness: 0.95 }));
sheet.rotation.x = -Math.PI / 2;
scene.add(sheet);
const gridMinor = new THREE.GridHelper(60, 120, 0x1a3c63, 0x13304f);
gridMinor.scale.z = 40 / 60; gridMinor.position.y = 0.01; scene.add(gridMinor);
const gridMajor = new THREE.GridHelper(60, 12, 0x2f5d8f, 0x2f5d8f);
gridMajor.scale.z = 40 / 60; gridMajor.position.y = 0.015; scene.add(gridMajor);

// ---------- floor plan: a 2-bed unit (ft/2 units) ----------
const PLAN = {
  stud: [
    [[-14, -8], [2, -8]], [[2, -8], [2, 8]], [[2, 8], [-14, 8]], [[-14, 8], [-14, -8]],
    [[-6, -8], [-6, 1]], [[-14, 1], [-2, 1]], [[-2, 1], [-2, 8]], [[-6, 4], [-2, 4]],
  ],
  cmu: [[[2, -8], [14, -8]], [[14, -8], [14, 2]], [[14, 2], [2, 2]]],
};
const H = 4.2;
const walls = [];

const glowLine = new THREE.LineBasicMaterial({ color: 0xbfe0ff, transparent: true });
const cmuLine = new THREE.LineBasicMaterial({ color: 0x8fd4a8, transparent: true });
const planLines = [];
function addPlanLine(a, b, mat) {
  const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a[0], 0.05, a[1]), new THREE.Vector3(b[0], 0.05, b[1])]);
  const l = new THREE.Line(g, mat); scene.add(l);
  planLines.push({ l, a, b });
}

const studMat = new THREE.MeshStandardMaterial({ color: 0xd4dde8, metalness: 0.75, roughness: 0.3 });
const trackMat = new THREE.MeshStandardMaterial({ color: 0xa9b6c6, metalness: 0.7, roughness: 0.35 });
const boardBase = new THREE.MeshStandardMaterial({ color: 0xf2eee4, roughness: 0.9, transparent: true });
const cmuMat = new THREE.MeshStandardMaterial({ color: 0x9d978d, roughness: 1 });
const ghostMat = new THREE.MeshBasicMaterial({ color: 0x5fa8ff, transparent: true, opacity: 0.12, depthWrite: false });

function wallGroup(a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const len = Math.hypot(dx, dz), ang = Math.atan2(dz, dx);
  const g = new THREE.Group();
  g.position.set(a[0], 0, a[1]); g.rotation.y = -ang;
  scene.add(g);
  return { g, len };
}

let studCount = 0, sheetCount = 0, blockCount = 0;
PLAN.stud.forEach(([a, b], wi) => {
  addPlanLine(a, b, glowLine);
  const { g, len } = wallGroup(a, b);
  const ghost = new THREE.Mesh(new THREE.BoxGeometry(len, H, 0.3), ghostMat.clone());
  ghost.position.set(len / 2, H / 2, 0); g.add(ghost);
  const n = Math.max(2, Math.round(len / 0.67) + 1);
  const studs = [];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.07, H, 0.2), studMat);
    s.position.set((len * i) / (n - 1), H / 2, 0); g.add(s); studs.push(s); studCount++;
  }
  const tracks = [0.03, H - 0.03].map(y => {
    const t = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.22), trackMat);
    t.position.set(len / 2, y, 0); g.add(t); return t;
  });
  // board: 4ft (=2 units) wide sheets, one side; every other wall gets both sides later
  const sheets = [];
  const sides = wi % 2 ? [-0.14] : [-0.14, 0.14];
  sides.forEach(z => {
    for (let x = 0; x < len - 0.01; x += 2) {
      const w = Math.min(2, len - x) - 0.03;
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, H - 0.04, 0.05), boardBase.clone());
      m.position.set(x + w / 2 + 0.015, H / 2, z);
      m.userData.home = m.position.clone();
      m.userData.side = Math.sign(z);
      g.add(m); sheets.push(m); sheetCount++;
    }
  });
  walls.push({ kind: 'stud', g, ghost, studs, tracks, sheets, i: wi });
});
PLAN.cmu.forEach(([a, b], ci) => {
  addPlanLine(a, b, cmuLine);
  const { g, len } = wallGroup(a, b);
  const ghost = new THREE.Mesh(new THREE.BoxGeometry(len, H, 0.4), ghostMat.clone());
  ghost.position.set(len / 2, H / 2, 0); g.add(ghost);
  const bw = 0.8, bh = 0.4, rows = Math.round(H / bh), blocks = [];
  for (let r = 0; r < rows; r++) {
    const off = r % 2 ? bw / 2 : 0;
    for (let x = -off; x < len - 0.01; x += bw) {
      const x0 = Math.max(x, 0), w = Math.min(x + bw, len) - x0 - 0.04;
      if (w <= 0.08) continue;
      const blk = new THREE.Mesh(new THREE.BoxGeometry(w, bh - 0.04, 0.38), cmuMat);
      blk.position.set(x0 + w / 2, r * bh + bh / 2, 0);
      blk.userData.row = r; blk.visible = false;
      g.add(blk); blocks.push(blk); blockCount++;
    }
  }
  walls.push({ kind: 'cmu', g, ghost, blocks, rows, i: ci });
});

// ---------- material stacks (finale) ----------
const stacks = new THREE.Group(); scene.add(stacks);
function pallet(x, z) {
  const p = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.3, 3.2), new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 1 }));
  p.position.set(x, 0.15, z); stacks.add(p); return p;
}
const stackItems = [];
{ // drywall stack
  pallet(-10, 16);
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(4, 0.12, 3), boardBase.clone());
    s.material.opacity = 1; s.position.set(-10, 0.36 + i * 0.13, 16); s.userData.i = i; stacks.add(s); stackItems.push(s);
  }
  // stud bundle
  pallet(0, 16);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 3), studMat);
    s.position.set(-1.6 + c * 0.45, 0.4 + r * 0.14, 16); s.userData.i = r * 8 + c; stacks.add(s); stackItems.push(s);
  }
  // CMU pallet
  pallet(10, 16);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) for (let d = 0; d < 3; d++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.46, 0.9), cmuMat);
    b.position.set(8.6 + c * 0.95, 0.55 + r * 0.48, 15 + d * 0.95); b.userData.i = r * 12 + c * 3 + d; stacks.add(b); stackItems.push(b);
  }
}
stackItems.forEach(s => { s.userData.home = s.position.clone(); });

// ---------- floating particles (dust in the light) ----------
{
  const N = 700, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 70; pos[i * 3 + 1] = Math.random() * 25; pos[i * 3 + 2] = (Math.random() - 0.5) * 50; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var dust = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x9cc3ff, size: 0.06, transparent: true, opacity: 0.5 }));
  scene.add(dust);
}

// ---------- counters in the DOM ----------
const counters = [...document.querySelectorAll('[data-count]')];
const totals = { studs: studCount * 24, sheets: sheetCount * 23, blocks: blockCount * 11, lf: 1284 };
counters.forEach(el => { el.dataset.total = totals[el.dataset.count] || 0; });

// ---------- sizing ----------
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < 700 ? 52 : 38;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize); resize();

// ---------- camera path keyed to scroll ----------
// p: 0 draw plan (top down) · .18 walls rise · .36 framing · .55 board + block · .74 separate into stacks · .9 CTA
const camKeys = [
  { p: 0.00, pos: [0, 58, 0.01], look: [0, 0, 0] },
  { p: 0.16, pos: [0, 44, 6], look: [0, 0, 0] },
  { p: 0.32, pos: [-26, 22, 26], look: [-2, 1, 0] },
  { p: 0.50, pos: [-10, 9, 16], look: [-6, 2, 0] },
  { p: 0.66, pos: [22, 14, 22], look: [2, 2, 0] },
  { p: 0.82, pos: [0, 16, 40], look: [0, 1, 10] },
  { p: 1.00, pos: [0, 22, 44], look: [0, 0, 8] },
];
const vA = new THREE.Vector3(), vB = new THREE.Vector3(), lA = new THREE.Vector3(), lB = new THREE.Vector3();
function camAt(p) {
  let i = 0; while (i < camKeys.length - 2 && p > camKeys[i + 1].p) i++;
  const k0 = camKeys[i], k1 = camKeys[i + 1], t = ease((p - k0.p) / (k1.p - k0.p));
  vA.fromArray(k0.pos); vB.fromArray(k1.pos); camera.position.lerpVectors(vA, vB, t);
  lA.fromArray(k0.look); lB.fromArray(k1.look); lA.lerp(lB, t);
  return lA;
}

// ---------- scroll ----------
let target = 0, prog = 0;
const story = document.getElementById('story');
function readScroll() {
  const r = story.getBoundingClientRect();
  target = clamp01(-r.top / (r.height - window.innerHeight));
}
window.addEventListener('scroll', readScroll, { passive: true }); readScroll();
let mx = 0, my = 0, smx = 0, smy = 0, lastP = -1;
window.addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
let storyVisible = true;
new IntersectionObserver(([e]) => { storyVisible = e.isIntersecting; }).observe(story);

const chapters = [...document.querySelectorAll('.chapter')];
const bar = document.getElementById('story-progress');
const tally = document.querySelector('.tally');
const clock = new THREE.Clock();

function frame() {
  requestAnimationFrame(frame);
  const t = clock.getElapsedTime();
  prog += (target - prog) * (reduce ? 1 : 0.08);
  smx += (mx - smx) * 0.06; smy += (my - smy) * 0.06;
  const moving = Math.abs(target - prog) > 1e-4 || Math.abs(mx - smx) > 1e-3 || Math.abs(my - smy) > 1e-3;
  if (!storyVisible || (!moving && lastP >= 0)) return;
  if (!moving) prog = target;
  lastP = prog;
  const p = prog;

  // plan lines draw in
  const draw = seg(p, 0.02, 0.16);
  planLines.forEach((pl, i) => {
    const local = clamp01(draw * planLines.length - i * 0.6);
    const pos = pl.l.geometry.attributes.position;
    pos.setXYZ(1, lerp(pl.a[0], pl.b[0], local), 0.05, lerp(pl.a[1], pl.b[1], local));
    pos.needsUpdate = true;
  });

  // walls: ghost volume rises, then studs, then board/block
  const rise = seg(p, 0.16, 0.30), frameIn = seg(p, 0.28, 0.44), boardIn = seg(p, 0.46, 0.62), explode = seg(p, 0.70, 0.84);
  walls.forEach(w => {
    w.ghost.scale.y = Math.max(0.001, ease(rise - w.i * 0.03));
    w.ghost.position.y = (H * w.ghost.scale.y) / 2;
    w.ghost.material.opacity = 0.14 * (1 - frameIn) * (1 - explode);
    if (w.kind === 'stud') {
      w.studs.forEach((s, i) => {
        const k = ease(frameIn * 1.6 - (i / w.studs.length) * 0.6);
        s.scale.y = Math.max(0.001, k); s.position.y = (H * k) / 2; s.visible = k > 0.002 && explode < 1;
      });
      w.tracks.forEach(tr => { tr.visible = frameIn > 0.05 && explode < 1; tr.scale.x = Math.max(0.001, ease(frameIn * 1.4)); tr.position.x = tr.geometry.parameters.width * tr.scale.x / 2; });
      w.sheets.forEach((m, i) => {
        const k = ease(boardIn * 1.5 - (i / w.sheets.length) * 0.5);
        m.position.copy(m.userData.home); m.position.z += m.userData.side * (1 - k) * 6; m.position.y += (1 - k) * 3;
        m.rotation.x = (1 - k) * 0.6 * m.userData.side;
        m.material.opacity = k * (1 - explode);
        m.visible = k > 0.01 && explode < 1;
      });
    } else {
      const shown = Math.floor(ease(boardIn * 1.3) * w.rows);
      w.blocks.forEach(b => { b.visible = b.userData.row < shown && explode < 1; });
    }
    w.g.visible = explode < 1;
  });

  // finale stacks: materials drop onto pallets
  stacks.visible = explode > 0;
  stackItems.forEach(s => {
    const k = ease(explode * 1.8 - (s.userData.i % 40) / 40 * 0.8);
    s.position.copy(s.userData.home); s.position.y += (1 - k) * 12;
    s.visible = k > 0.001;
  });
  planLines.forEach(pl => { pl.l.material.opacity = 1 - explode * 0.7; });

  // camera
  const look = camAt(p);
  camera.position.x += smx * 2.5; camera.position.y += -smy * 1.5;
  camera.lookAt(look);
  dust.rotation.y = t * 0.01;

  renderer.render(scene, camera);

  // chapters + counters + progress
  chapters.forEach(c => {
    const a = +c.dataset.from, b = +c.dataset.to;
    const vis = p >= a && p <= b ? Math.min(1, (p - a) / 0.03, (b - p) / 0.03) : 0;
    c.style.opacity = vis; c.style.transform = `translateY(${(1 - vis) * 24}px)`;
    c.style.pointerEvents = vis > 0.5 ? 'auto' : 'none';
  });
  counters.forEach(el => {
    const k = ease(seg(p, +el.dataset.from, +el.dataset.from + 0.08));
    el.textContent = Math.round(+el.dataset.total * k).toLocaleString('en-US');
  });
  if (bar) bar.style.transform = `scaleX(${p})`;
  if (tally) tally.classList.toggle('off', p > 0.7);
}
frame();
