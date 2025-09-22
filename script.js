// Canvas setup
const canvas = document.getElementById('hearts');
const ctx = canvas.getContext('2d', { alpha: true });
let W, H, dpr;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = canvas.width = Math.floor(innerWidth * dpr);
  H = canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
}
addEventListener('resize', resize, { passive: true });
resize();

// Particle system
const hearts = [];
const TAU = Math.PI * 2;

function spawnHeart(x, y, opts = {}) {
  const size = opts.size ?? (Math.random() * 12 + 10); // px (pre-dpr)
  const s = size * dpr;
  const angle = (Math.random() * Math.PI / 2) - Math.PI / 4; // -45..45deg
  const speed = (opts.speed ?? (Math.random() * 0.7 + 0.6)) * dpr;
  hearts.push({
    x: x * dpr,
    y: y * dpr,
    vx: Math.cos(angle) * speed * 0.4,
    vy: -Math.abs(Math.sin(angle) * speed) - (Math.random() * 0.8 + 0.6),
    g: 0.015 * dpr,
    life: 1,
    decay: Math.random() * 0.006 + 0.004,
    rot: Math.random() * TAU,
    rotV: (Math.random() - 0.5) * 0.03,
    size: s
  });
}

// Draw a heart path centered at 0,0 with given size
function heartPath(size) {
  const s = size;
  ctx.beginPath();
  // Parametric heart using two arcs and a triangle-ish bottom
  const top = -0.25 * s;
  ctx.moveTo(0, top);
  ctx.bezierCurveTo(0, -0.7 * s, -0.55 * s, -0.7 * s, -0.62 * s, -0.25 * s);
  ctx.bezierCurveTo(-0.65 * s, 0.15 * s, -0.25 * s, 0.25 * s, 0, 0.6 * s);
  ctx.bezierCurveTo(0.25 * s, 0.25 * s, 0.65 * s, 0.15 * s, 0.62 * s, -0.25 * s);
  ctx.bezierCurveTo(0.55 * s, -0.7 * s, 0, -0.7 * s, 0, top);
  ctx.closePath();
}

function drawHeart(h) {
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.rotate(h.rot);
  heartPath(h.size);
  const grd = ctx.createRadialGradient(0, -0.2 * h.size, 2, 0, 0, h.size);
  grd.addColorStop(0, 'rgba(255, 160, 190, 0.95)');
  grd.addColorStop(0.5, 'rgba(255, 80, 130, 0.9)');
  grd.addColorStop(1, 'rgba(255, 50, 110, 0.0)');
  ctx.fillStyle = grd;
  ctx.fill();
  ctx.restore();
}

let last = 0;
function loop(t=0){
  const dt = Math.min((t - last) / 16.666, 2);
  last = t;
  ctx.clearRect(0, 0, W, H);

  // idle drift spawn
  if (hearts.length < 60 && Math.random() < 0.3) {
    spawnHeart(Math.random() * innerWidth, innerHeight - 10, { size: Math.random()*8 + 8, speed: 0.5 });
  }

  for (let i = hearts.length - 1; i >= 0; i--){
    const h = hearts[i];
    h.vy += h.g * dt;
    h.x += h.vx * dt;
    h.y += h.vy * dt;
    h.rot += h.rotV * dt;
    h.life -= h.decay * dt;

    drawHeart(h);
    if (h.life <= 0 || h.y - h.size > H + 40) {
      hearts.splice(i, 1);
    }
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Interakciók
function vibe(ms=10){ if (navigator.vibrate) try{ navigator.vibrate(ms); }catch{} }
function burst(x, y, n=14){
  for (let i=0;i<n;i++){
    spawnHeart(x + (Math.random()-0.5)*24, y + (Math.random()-0.5)*24, { size: Math.random()*10 + 8, speed: 1.1 });
  }
  vibe(14);
}

const heartBtn = document.getElementById('heartBtn');
heartBtn.addEventListener('click', (e)=>{
  const rect = heartBtn.getBoundingClientRect();
  const cx = rect.left + rect.width/2;
  const cy = rect.top + rect.height/2;
  burst(cx, cy, 18);
});

addEventListener('pointerdown', (e)=>{
  if (e.target.closest('button, dialog')) return;
  burst(e.clientX, e.clientY, 16);
}, { passive: true });

// Kis üzenet (modal)
const dialog = document.getElementById('loveNote');
const noteBtn = document.getElementById('noteBtn');
noteBtn.addEventListener('click', ()=> dialog.showModal());
dialog.addEventListener('click', (e)=>{ if (e.target === dialog) dialog.close(); });

// Írógép hatás
const phrases = [
  "Mindig itt leszek neked.",
  "Te vagy az otthonom.",
  "Szeretlek. Nagyon. Komolyan.",
  "Minden nap, minden percben."
];
const tw = document.getElementById('typewriter');
let p = 0, i = 0, erasing = false;

function typeLoop(){
  const current = phrases[p];
  if (!erasing){
    i++;
    tw.textContent = current.slice(0, i);
    if (i === current.length){
      erasing = true;
      setTimeout(typeLoop, 1300);
      return;
    }
  } else {
    i--;
    tw.textContent = current.slice(0, i);
    if (i === 0){
      erasing = false;
      p = (p + 1) % phrases.length;
    }
  }
  const speed = erasing ? 28 : 46;
  setTimeout(typeLoop, speed + Math.random()*60);
}
typeLoop();

// Finom parallax telefonon
if (window.DeviceOrientationEvent){
  window.addEventListener('deviceorientation', (e)=>{
    const tiltX = (e.gamma || 0) / 45; // -1..1
    const tiltY = (e.beta  || 0) / 45;
    // enyhe lebegés: szívek általános sodrása
    for (const h of hearts){
      h.vx += tiltX * 0.005;
      h.vy -= tiltY * 0.002;
    }
  }, { passive: true });
}
