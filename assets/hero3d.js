// 3D hero: a blueprint sheet whose walls rise into framing, then board, with live count labels.
import * as THREE from 'three';

const host = document.getElementById('hero3d');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (host && !reduce) init();

function init() {
  const fallback = document.querySelector('.plan-card');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.appendChild(renderer.domElement);
  if (fallback) fallback.style.display = 'none';
  host.style.display = 'block';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
  const rig = new THREE.Group();
  scene.add(rig);

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(8, 14, 10);
  scene.add(sun);

  // Blueprint sheet
  const sheet = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 17),
    new THREE.MeshStandardMaterial({ color: 0x0d2b4e, roughness: 0.9 })
  );
  sheet.rotation.x = -Math.PI / 2;
  rig.add(sheet);
  const grid = new THREE.GridHelper(26, 26, 0x3d6ea8, 0x23486f);
  grid.position.y = 0.01;
  grid.scale.z = 17 / 26;
  rig.add(grid);

  // Floor plan (units ~ feet/2). Same layout as the flat plan card.
  const stud = [ // metal stud partitions
    [[-9, -5], [3, -5]], [[3, -5], [3, 3]], [[3, 3], [-9, 3]], [[-9, 3], [-9, -5]], [[-3, -5], [-3, 3]],
  ];
  const cmu = [[[3, -5], [9, -5]], [[9, -5], [9, -1]], [[9, -1], [3, -1]]];
  const confirm = [[[-9, 5.5], [1, 5.5]]];
  const H = 3.2;

  const lineMat = c => new THREE.LineBasicMaterial({ color: c });
  const studMat = new THREE.MeshStandardMaterial({ color: 0xc9d3de, metalness: 0.6, roughness: 0.35 });
  const trackMat = new THREE.MeshStandardMaterial({ color: 0xaab6c4, metalness: 0.6, roughness: 0.4 });
  const boardMat = new THREE.MeshStandardMaterial({ color: 0xf1ede2, roughness: 0.95, transparent: true, opacity: 0 });
  const cmuMat = new THREE.MeshStandardMaterial({ color: 0x9a948a, roughness: 1 });

  const walls = [];
  function planLine(a, b, color) {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(a[0], 0.03, a[1]), new THREE.Vector3(b[0], 0.03, b[1])]);
    rig.add(new THREE.Line(g, lineMat(color)));
  }
  function wallFrame(a, b) {
    const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), ang = Math.atan2(dz, dx);
    const grp = new THREE.Group();
    grp.position.set(a[0], 0, a[1]);
    grp.rotation.y = -ang;
    const n = Math.max(2, Math.round(len / 0.67) + 1);
    const studs = [];
    for (let i = 0; i < n; i++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.06, H, 0.18), studMat);
      s.position.set((len * i) / (n - 1), H / 2, 0);
      grp.add(s); studs.push(s);
    }
    for (const y of [0.02, H - 0.02]) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.2), trackMat);
      t.position.set(len / 2, y, 0); grp.add(t); studs.push(t);
    }
    const boards = [];
    for (const side of [-0.13]) {
      const bd = new THREE.Mesh(new THREE.BoxGeometry(len, H, 0.04), boardMat.clone());
      bd.position.set(len / 2, H / 2, side); grp.add(bd); boards.push(bd);
    }
    grp.scale.y = 0.001;
    rig.add(grp);
    return { grp, boards };
  }
  function wallCmu(a, b) {
    const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), ang = Math.atan2(dz, dx);
    const grp = new THREE.Group();
    grp.position.set(a[0], 0, a[1]);
    grp.rotation.y = -ang;
    const bw = 0.62, bh = 0.32, rows = Math.round(H / bh);
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? bw / 2 : 0;
      for (let x = -off; x < len - 0.01; x += bw) {
        const w = Math.min(bw - 0.03, len - Math.max(x, 0));
        if (w <= 0.05) continue;
        const blk = new THREE.Mesh(new THREE.BoxGeometry(w, bh - 0.03, 0.3), cmuMat);
        blk.position.set(Math.max(x, 0) + w / 2, r * bh + bh / 2, 0);
        grp.add(blk);
      }
    }
    grp.scale.y = 0.001;
    rig.add(grp);
    return { grp, boards: [] };
  }
  stud.forEach(([a, b]) => { planLine(a, b, 0xe7eef7); walls.push({ ...wallFrame(a, b), kind: 'stud' }); });
  cmu.forEach(([a, b]) => { planLine(a, b, 0x8fd4a8); walls.push({ ...wallCmu(a, b), kind: 'cmu' }); });
  confirm.forEach(([a, b]) => planLine(a, b, 0xf0895a));

  // Count labels (HTML, projected from 3D anchors)
  const labels = [
    { at: new THREE.Vector3(-6, H + 0.7, 3), html: '<b>312</b> 3-5/8" studs <i class="ok">Matched</i>', from: 0.35 },
    { at: new THREE.Vector3(6, H + 0.6, -3), html: '<b>4,180</b> 8" CMU <i class="ok">Matched</i>', from: 0.5 },
    { at: new THREE.Vector3(-1, H + 0.7, -5), html: '<b>1,840</b> sheets 5/8" GWB <i class="ok">Matched</i>', from: 0.8 },
    { at: new THREE.Vector3(-4, 0.5, 5.5), html: '<b>86 LF</b> unlabeled partition <i class="warn">Confirm</i>', from: 0.2 },
  ].map(l => {
    const el = document.createElement('div');
    el.className = 'h3d-label';
    el.innerHTML = l.html;
    host.appendChild(el);
    return { ...l, el };
  });

  // Sizing
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  resize();

  // Interaction: mouse tilt + scroll progress
  let mx = 0, my = 0;
  window.addEventListener('pointermove', e => {
    mx = (e.clientX / window.innerWidth) * 2 - 1;
    my = (e.clientY / window.innerHeight) * 2 - 1;
  });
  const t0 = performance.now();
  const ease = x => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3));
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const v = new THREE.Vector3();
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(host);

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = (now - t0) / 1000;
    // Build plays on load (0 -> 1 over ~5s); scroll pushes it the rest of the way.
    const p = Math.max(clamp01((t - 0.4) / 5), clamp01(window.scrollY / 350));

    walls.forEach((w, i) => {
      const start = 0.05 + i * 0.05;
      w.grp.scale.y = Math.max(0.001, ease(clamp01((p - start) / 0.3)));
      if (i % 2 === 0) w.boards.forEach(b => { b.material.opacity = ease(clamp01((p - 0.7) / 0.25)) * 0.92; });
    });

    // Camera: starts top-down on the sheet, swings to a 3/4 view as walls rise
    const k = ease(clamp01(p / 0.6));
    const radius = 30 - 3 * k;
    const elev = THREE.MathUtils.lerp(1.45, 0.72, k) + my * 0.05;
    const az = THREE.MathUtils.lerp(0, -0.55, k) + mx * 0.18 + Math.sin(t * 0.25) * 0.04;
    camera.position.set(Math.sin(az) * Math.cos(elev) * radius, Math.sin(elev) * radius, Math.cos(az) * Math.cos(elev) * radius);
    camera.lookAt(0, 0.6, 0.5);

    renderer.render(scene, camera);

    const w = host.clientWidth, h = host.clientHeight;
    labels.forEach(l => {
      v.copy(l.at).project(camera);
      l.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px) translate(-50%,-100%)`;
      l.el.style.opacity = ease(clamp01((p - l.from) / 0.12));
    });
  }
  requestAnimationFrame(frame);
}
