/* RMB "blueprint to takeoff" animation.
   Embed: <div data-takeoff-3d data-poster="/assets/takeoff-3d-poster.png"></div> + <script type="module" src="/assets/takeoff-3d.js"></script>
   Loads three@0.160.0 only when visible. Reduced motion = poster only. Counter values are illustrative. */
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const DUR = 10;
const C = { paper: '#0d1420', surface: '#141d2c', line: '#2a3547', blue: '#6ea3e0', soft: '#1c2b40', accent: '#f0895a', ink: '#eef1f5', muted: '#9aa5b4' };
// walls: [x1,z1,x2,z2] on a 24 x 16 plan; door gaps are the breaks between segments
const W = [[0,0,24,0],[24,0,24,16],[24,16,0,16],[0,16,0,0],[8,0,8,6],[8,9,8,16],[16,0,16,5],[16,8,16,16],[0,8,8,8],[16,8,24,8],[12,8,12,16],[8,4,16,4]]
  .map(([a,b,c,d],i)=>({a,b,c,d,len:Math.hypot(c-a,d-b),s:1.5+i*0.3}));
const TOTAL_LF = 1284, STUDS = 1046, SHEETS = 212, DOORS = 24;
const ease = x => x<0?0:x>1?1:x*x*(3-2*x);

function css(){
  if(document.getElementById('t3-css'))return;
  const s=document.createElement('style'); s.id='t3-css';
  s.textContent=`[data-takeoff-3d]{position:relative;overflow:hidden;background:${C.paper};aspect-ratio:16/9;container-type:size;font-family:system-ui,Segoe UI,sans-serif;color:${C.ink}}
[data-takeoff-3d] .t3-poster{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.t3-hud{position:absolute;left:4cqw;top:5cqh;display:grid;gap:1.4cqh;pointer-events:none}
.t3-row{display:flex;align-items:baseline;gap:1.6cqw;border-left:3px solid ${C.blue};padding-left:1.4cqw}
.t3-row b{font-size:max(22px,4.4cqh);font-variant-numeric:tabular-nums;min-width:4.2ch;color:${C.ink}}
.t3-row span{font-size:max(11px,2cqh);letter-spacing:.12em;text-transform:uppercase;color:${C.muted}}
.t3-end{position:absolute;left:0;right:0;bottom:7cqh;text-align:center;font-size:max(24px,6.4cqh);font-weight:700;color:${C.ink};opacity:0;pointer-events:none}
.t3-end i{color:${C.accent};font-style:normal}
.t3-note{position:absolute;right:2cqw;bottom:1.6cqh;font-size:max(10px,1.7cqh);color:${C.muted};opacity:.85;pointer-events:none}
.t3-fade{position:absolute;inset:0;background:${C.paper};opacity:0;pointer-events:none}
@container (max-aspect-ratio: 1/1){.t3-hud{left:6cqw;top:4cqh}.t3-row b{font-size:max(22px,3cqh)}.t3-end{bottom:9cqh;font-size:max(24px,4.4cqh)}}`;
  document.head.appendChild(s);
}

function sheetTexture(THREE){
  const c=document.createElement('canvas'); c.width=c.height=2048; const g=c.getContext('2d');
  g.fillStyle='#10213a'; g.fillRect(0,0,2048,2048);
  g.strokeStyle='rgba(110,163,224,.16)'; g.lineWidth=2;
  for(let i=0;i<=2048;i+=64){g.beginPath();g.moveTo(i,0);g.lineTo(i,2048);g.moveTo(0,i);g.lineTo(2048,i);g.stroke();}
  g.strokeStyle='rgba(110,163,224,.35)'; g.lineWidth=3; g.strokeRect(40,40,1968,1968); g.strokeRect(58,58,1932,1932);
  g.fillStyle=C.blue; g.font='bold 34px monospace'; g.fillText('SHEET A-101   FLOOR PLAN',90,1960);
  const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;return tx;
}

async function start(el){
  const THREE = await import(THREE_URL);
  const cap = /[?&]capture=1/.test(location.search);
  const r = new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:cap}); r.setPixelRatio(Math.min(devicePixelRatio,2));
  r.setClearColor(C.paper); el.insertBefore(r.domElement, el.firstChild);
  const scene=new THREE.Scene(), cam=new THREE.PerspectiveCamera(38,1,.1,200);
  scene.add(new THREE.AmbientLight(0xffffff,.8)); const dl=new THREE.DirectionalLight(0xffffff,1.1); dl.position.set(-10,20,8); scene.add(dl);
  const g=new THREE.Group(); g.position.set(-12,0,-8); scene.add(g);
  const sheet=new THREE.Mesh(new THREE.PlaneGeometry(30,22),new THREE.MeshBasicMaterial({map:sheetTexture(THREE),transparent:true}));
  sheet.rotation.x=-Math.PI/2; sheet.position.set(12,-.02,8); g.add(sheet);
  const H=3, wm=new THREE.MeshLambertMaterial({color:0x2c4a73}), em=new THREE.LineBasicMaterial({color:C.blue,transparent:true});
  const walls=W.map(w=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),wm); const th=.36;
    m.rotation.y=-Math.atan2(w.d-w.b,w.c-w.a); m.position.set((w.a+w.c)/2,0,(w.b+w.d)/2); m.scale.set(w.len+th,.001,th);
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),em)); g.add(m); return m;});
  const dm=new THREE.LineBasicMaterial({color:C.accent,transparent:true});
  [[8,6],[16,5],[12,12]].forEach(([x,z])=>{const pts=[];for(let i=0;i<=16;i++){const a=i/16*Math.PI/2;pts.push(new THREE.Vector3(x+Math.cos(a)*1.4,.03,z+Math.sin(a)*1.4));}g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),dm));});
  const $=(cls,p=el)=>{const d=document.createElement('div');d.className=cls;p.appendChild(d);return d;};
  const hud=$('t3-hud');
  const rows=['Wall LF','Studs','Drywall sheets','Doors'].map(l=>{const row=$('t3-row',hud);const b=document.createElement('b');b.textContent='0';const s=document.createElement('span');s.textContent=l;row.append(b,s);return b;});
  const end=$('t3-end'); end.innerHTML='Your takeoff, <i>done.</i>';
  $('t3-note').textContent='Illustration. Counts are examples, not a real project.';
  const fade=$('t3-fade');
  function size(){const w=el.clientWidth,h=el.clientHeight;r.setSize(w,h,false);r.domElement.style.cssText='position:absolute;inset:0;width:100%;height:100%';cam.aspect=w/h;cam.updateProjectionMatrix();}
  size(); new ResizeObserver(size).observe(el);
  const lfAll=W.reduce((a,w)=>a+w.len,0), fmt=n=>Math.round(n).toLocaleString('en-US');
  function draw(t){
    const orbit=-.5+t/DUR*.9, portrait=cam.aspect<1, dist=portrait?74:42;
    cam.position.set(Math.sin(orbit)*dist, dist*(.95-ease((t-1.2)/3)*.35), Math.cos(orbit)*dist*.8+(portrait?4:0));
    cam.lookAt(0,-1,portrait?-3:1);
    sheet.material.opacity=ease(t/.8); em.opacity=ease((t-.4)/1); dm.opacity=ease((t-.6)/1);
    let lf=0;
    walls.forEach((m,i)=>{const p=ease((t-W[i].s)/1.8);m.scale.y=Math.max(.001,p*H);m.position.y=p*H/2;lf+=W[i].len*p;});
    const k=lf/lfAll, k2=ease((t-1.5)/4.8);
    rows[0].textContent=fmt(TOTAL_LF*k); rows[1].textContent=fmt(STUDS*k2);
    rows[2].textContent=fmt(SHEETS*k2); rows[3].textContent=fmt(DOORS*ease((t-2)/4.5));
    const ea=ease((t-7.6)/.7); end.style.opacity=ea; end.style.transform=`translateY(${(1-ea)*12}px)`;
    fade.style.opacity=Math.max(1-ease(t/.5), ease((t-9.5)/.5));
    r.render(scene,cam);
  }
  window.__setT=draw;
  if(cap){draw(+(new URLSearchParams(location.search).get('t')||0));return;}
  let t0=performance.now(),run=true;
  function loop(n){if(!run)return;const t=((n-t0)/1000)%DUR;window.__t=t;draw(t);requestAnimationFrame(loop);}
  new IntersectionObserver(([e])=>{run=e.isIntersecting;if(run){t0=performance.now()-(window.__t||0)*1000;requestAnimationFrame(loop);}}).observe(el);
  requestAnimationFrame(loop);
}

export function mount(el){
  css(); const poster=el.dataset.poster;
  if(poster&&!el.querySelector('.t3-poster')){const i=new Image();i.src=poster;i.alt='3D takeoff illustration: floor plan walls rising with wall LF, studs, drywall and door counts';i.className='t3-poster';el.appendChild(i);}
  const cap=/[?&]capture=1/.test(location.search);
  if(!cap&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const go=()=>start(el).then(()=>{const p=el.querySelector('.t3-poster');if(p)p.remove();}).catch(e=>console.error("t3",e&&e.message));
  if(cap||!('IntersectionObserver' in window))return go();
  const io=new IntersectionObserver(([e])=>{if(e.isIntersecting){io.disconnect();go();}},{rootMargin:'200px'});io.observe(el);
}
document.querySelectorAll('[data-takeoff-3d]').forEach(mount);
