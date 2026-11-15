/* solar.js - a rotating, high-detail solar system drawn as the background of the HOME page.
   Sun with glowing corona and rays, 8 planets (with atmospheres, Jupiter's bands, Saturn's rings),
   Earth's Moon, a spinning asteroid belt, twinkling stars, drifting nebula clouds and shooting stars.
   It is drawn on a <canvas> behind the page, only while the home page is showing, and pauses otherwise.
   Needs no images and no server changes. */
(() => {
  'use strict';

  const view = document.getElementById('view');
  if (!view) return;

  const TAU = Math.PI * 2;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- canvas + styles ---------- */
  const cv = document.createElement('canvas');
  cv.id = 'solarBg';
  cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  const ctx = cv.getContext('2d');
  if (!ctx) return;

  const style = document.createElement('style');
  style.textContent = `
    #solarBg{position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:0;pointer-events:none;display:none}
    .app{position:relative;z-index:1}
    body.solar-on .card,body.solar-on .side,body.solar-on .chat,body.solar-on .profile{
      background:linear-gradient(180deg,rgba(13,38,86,.62),rgba(6,18,46,.72));
      -webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px)}
    body.solar-on .hero h2,body.solar-on .hero .sub{text-shadow:0 2px 16px rgba(0,0,0,.9),0 0 30px rgba(0,0,0,.6)}
  `;
  document.head.appendChild(style);

  /* ---------- scene data ---------- */
  const PLANETS = [
    { n: 'Mercury', r: 0.12, s: 3.6,  c: ['#e6dfd2', '#9a9183', '#46403a'] },
    { n: 'Venus',   r: 0.18, s: 6.5,  c: ['#fff3cf', '#e6b863', '#8a5a1c'], atm: 'rgba(255,200,120,.4)' },
    { n: 'Earth',   r: 0.245, s: 7.2, c: ['#9bd6ff', '#2468d8', '#0a1f55'], atm: 'rgba(110,190,255,.5)', earth: true },
    { n: 'Mars',    r: 0.31, s: 5,    c: ['#ffb99a', '#c4492a', '#5a1d10'], atm: 'rgba(255,140,100,.2)' },
    { n: 'Jupiter', r: 0.50, s: 16,   c: ['#f8e0be', '#c99a68', '#6b4a2c'], bands: ['#b07c52', '#ead0a6', '#9c6a45', '#f4e2c4', '#a8744a'] },
    { n: 'Saturn',  r: 0.65, s: 13,   c: ['#fcecbf', '#d6b26a', '#7a5a26'], ring: true },
    { n: 'Uranus',  r: 0.80, s: 9.5,  c: ['#d6fcff', '#6fd6e0', '#1f6a78'], atm: 'rgba(150,240,255,.35)' },
    { n: 'Neptune', r: 0.93, s: 9,    c: ['#b4cbff', '#3a62e8', '#101f6a'], atm: 'rgba(100,140,255,.4)' }
  ].map(p => ({ ...p, a: rand(0, TAU), w: 0.3 * Math.pow(0.12 / p.r, 1.2), spin: rand(0, TAU) }));

  const BELT = Array.from({ length: 300 }, () => {
    const g = Math.floor(rand(120, 200));
    return { r: rand(0.385, 0.455), a: rand(0, TAU), k: rand(0.85, 1.15), s: rand(0.6, 1.9), col: `rgb(${g},${g - 8},${g - 20})` };
  });
  const BELT_W = 0.3 * Math.pow(0.12 / 0.42, 1.2);

  /* ---------- size-dependent state ---------- */
  let W = 0, H = 0, dpr = 1, maxDpr = Math.min(window.devicePixelRatio || 1, 2);
  let cx = 0, cy = 0, maxR = 0, sc = 1;
  const TILT = 0.36;                                   // how flat the orbits look (3D tilt)
  let stars = [], nebulae = [], shooters = [], nextShoot = 2;

  function resize() {
    dpr = maxDpr; W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cx = W * 0.52; cy = H * 0.47;
    maxR = Math.min(W * 0.52, H * 1.2);
    sc = clamp(W / 1400, 0.65, 1.35);
    const count = Math.round(clamp(W * H / 3200, 220, 700));
    const reach = Math.hypot(W, H) / 2 + 40;           // stars fill a circle so rotating never shows gaps
    const cols = ['#ffffff', '#cfe2ff', '#ffe9c4', '#ffd1d1', '#d4f1ff'];
    stars = Array.from({ length: count }, () => ({
      a: rand(0, TAU), d: Math.sqrt(Math.random()) * reach, s: Math.random() < 0.08 ? rand(1.8, 2.6) : rand(0.5, 1.4),
      tw: rand(0, TAU), sp: rand(0.8, 3), col: cols[Math.floor(Math.random() * cols.length)]
    }));
    nebulae = [
      { x: 0.15, y: 0.25, r: 0.45, c: '120,70,255', a: 0.16, ph: 0 },
      { x: 0.85, y: 0.7,  r: 0.5,  c: '30,140,255', a: 0.15, ph: 2 },
      { x: 0.55, y: 0.95, r: 0.4,  c: '20,200,170', a: 0.10, ph: 4 }
    ];
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ---------- drawing helpers ---------- */
  function sphere(x, y, rad, c, t, p) {
    const dx = cx - x, dy = cy - y, len = Math.hypot(dx, dy) || 1, lx = dx / len, ly = dy / len;   // direction to the Sun

    if (p.atm) {                                       // atmosphere glow
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y, rad * 0.9, x, y, rad * 1.7);
      g.addColorStop(0, p.atm); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad * 1.7, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    const base = ctx.createRadialGradient(x + lx * rad * 0.45, y + ly * rad * 0.45, rad * 0.1, x, y, rad);
    base.addColorStop(0, c[0]); base.addColorStop(0.55, c[1]); base.addColorStop(1, c[2]);
    ctx.fillStyle = base; ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();

    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.clip();

    if (p.bands) {                                     // Jupiter's stripes
      p.bands.forEach((col, i) => {
        ctx.fillStyle = col; ctx.globalAlpha = 0.35;
        ctx.fillRect(x - rad, y - rad + (i * 2 + 0.5) * rad / 5.2, rad * 2, rad / 6);
      });
      ctx.globalAlpha = 0.55; ctx.fillStyle = '#c0583a';              // the Great Red Spot, drifting across
      const gx = x + Math.sin(t * 0.25 + p.spin) * rad * 0.8;
      ctx.beginPath(); ctx.ellipse(gx, y + rad * 0.32, rad * 0.2, rad * 0.11, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (p.earth) {                                     // continents and clouds slide across to show rotation
      ctx.fillStyle = '#3fae5a'; ctx.globalAlpha = 0.9;
      for (let i = 0; i < 4; i++) {
        const ox = ((i * 0.9 + t * 0.35 + p.spin) % 3.6) - 1.8;
        ctx.beginPath(); ctx.ellipse(x + ox * rad, y + (i - 1.5) * rad * 0.38, rad * 0.5, rad * 0.28, i, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.45;
      for (let i = 0; i < 3; i++) {
        const ox = ((i * 1.3 + t * 0.55) % 3.6) - 1.8;
        ctx.beginPath(); ctx.ellipse(x + ox * rad, y + (i - 1) * rad * 0.5, rad * 0.55, rad * 0.14, 0.2, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    /* night side shadow */
    const sh = ctx.createLinearGradient(x + lx * rad, y + ly * rad, x - lx * rad, y - ly * rad);
    sh.addColorStop(0.35, 'rgba(0,0,12,0)'); sh.addColorStop(1, 'rgba(0,0,12,.72)');
    ctx.fillStyle = sh; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    ctx.restore();
  }

  function ringArc(x, y, rad, front) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(-0.32);
    const bands = [[1.45, 'rgba(210,180,120,.55)', 3], [1.62, 'rgba(240,215,160,.7)', 5], [1.82, 'rgba(190,160,110,.5)', 3], [2.0, 'rgba(235,205,150,.55)', 4], [2.2, 'rgba(170,145,100,.4)', 2]];
    bands.forEach(([k, col, w]) => {
      ctx.strokeStyle = col; ctx.lineWidth = w * (rad / 13);
      ctx.beginPath(); ctx.ellipse(0, 0, rad * k, rad * k * 0.3, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); ctx.stroke();
    });
    ctx.restore();
  }

  function drawSun(t) {
    const R = 30 * sc, pulse = 1 + 0.04 * Math.sin(t * 1.6);
    ctx.globalCompositeOperation = 'lighter';
    let g = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 6 * pulse);                  // corona
    g.addColorStop(0, 'rgba(255,190,70,.55)'); g.addColorStop(0.35, 'rgba(255,130,30,.18)'); g.addColorStop(1, 'rgba(255,100,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 6 * pulse, 0, TAU); ctx.fill();

    ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.05);                                     // slowly turning rays
    for (let i = 0; i < 14; i++) {
      ctx.rotate(TAU / 14);
      const len = R * (3.4 + 1.2 * Math.sin(t * 1.1 + i * 1.7));
      const rg = ctx.createLinearGradient(0, 0, len, 0);
      rg.addColorStop(0, 'rgba(255,210,120,.22)'); rg.addColorStop(1, 'rgba(255,160,40,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(R * 0.6, -R * 0.14); ctx.lineTo(len, 0); ctx.lineTo(R * 0.6, R * 0.14); ctx.fill();
    }
    ctx.restore();

    const fl = ctx.createLinearGradient(cx - R * 9, cy, cx + R * 9, cy);                         // lens flare streak
    fl.addColorStop(0, 'rgba(255,200,120,0)'); fl.addColorStop(0.5, 'rgba(255,230,170,.28)'); fl.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = fl; ctx.fillRect(cx - R * 9, cy - 1.5, R * 18, 3);
    ctx.globalCompositeOperation = 'source-over';

    g = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.25, R * 0.1, cx, cy, R);              // glowing surface
    g.addColorStop(0, '#fffbe6'); g.addColorStop(0.35, '#ffd24f'); g.addColorStop(0.8, '#ff8a1a'); g.addColorStop(1, '#e0500a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();

    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();                          // turning sunspots
    for (let i = 0; i < 6; i++) {
      const ox = ((i * 0.55 + t * 0.08) % 2.4) - 1.2;
      ctx.fillStyle = 'rgba(150,40,0,.35)';
      ctx.beginPath(); ctx.ellipse(cx + ox * R, cy + Math.sin(i * 2.3) * R * 0.55, R * 0.12, R * 0.08, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,200,.28)';
      ctx.beginPath(); ctx.arc(cx + ((ox + 0.6) % 1.2) * R, cy + Math.cos(i * 1.7) * R * 0.5, R * 0.07, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function drawBelt(t, front) {
    BELT.forEach(b => {
      const a = b.a + t * BELT_W * b.k, s = Math.sin(a);
      if ((s >= 0) !== front) return;
      const R = b.r * maxR;
      ctx.fillStyle = b.col;
      const z = b.s * sc * (1 + 0.3 * s);
      ctx.fillRect(cx + Math.cos(a) * R, cy + s * R * TILT, z, z);
    });
  }

  function drawPlanets(t, front) {
    PLANETS.forEach(p => {
      const a = p.a + t * p.w, s = Math.sin(a);
      if ((s >= 0) !== front) return;
      const R = p.r * maxR, x = cx + Math.cos(a) * R, y = cy + s * R * TILT;
      const rad = p.s * sc * (1 + 0.3 * s);

      if (p.ring) ringArc(x, y, rad, false);
      sphere(x, y, rad, p.c, t, p);
      if (p.ring) ringArc(x, y, rad, true);

      if (p.earth) {                                   // the Moon circles the Earth
        const ma = t * 2.2, mr = rad * 2.6;
        const mx = x + Math.cos(ma) * mr, my = y + Math.sin(ma) * mr * 0.4;
        sphere(mx, my, rad * 0.28, ['#f2f2f2', '#a8a8a8', '#4a4a4a'], t, {});
      }

      ctx.font = `600 ${Math.round(11 * clamp(sc, 0.85, 1.2))}px "Exo 2",sans-serif`;
      ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(220,235,255,.6)';
      ctx.fillText(p.n, x, y + rad * (p.ring ? 2.5 : 1.35) + 13);
    });
  }

  function drawBackdrop(t) {
    ctx.clearRect(0, 0, W, H);

    nebulae.forEach(n => {                             // drifting colour clouds
      const x = (n.x + 0.03 * Math.sin(t * 0.05 + n.ph)) * W, y = (n.y + 0.03 * Math.cos(t * 0.04 + n.ph)) * H, r = n.r * Math.max(W, H);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${n.c},${n.a})`); g.addColorStop(1, `rgba(${n.c},0)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    });

    const rot = t * 0.006;                             // star field turns slowly around the Sun
    stars.forEach(s => {
      const a = s.a + rot;
      ctx.globalAlpha = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * s.sp + s.tw));
      ctx.fillStyle = s.col;
      ctx.fillRect(cx + Math.cos(a) * s.d, cy + Math.sin(a) * s.d, s.s, s.s);
    });
    ctx.globalAlpha = 1;
  }

  function drawShooters(dt) {
    nextShoot -= dt;
    if (nextShoot <= 0 && shooters.length < 2) {
      shooters.push({ x: rand(W * 0.1, W), y: rand(0, H * 0.4), vx: rand(-900, -600), vy: rand(250, 450), life: 0 });
      nextShoot = rand(3, 7);
    }
    shooters = shooters.filter(s => {
      s.life += dt; s.x += s.vx * dt; s.y += s.vy * dt;
      const k = 1 - s.life / 0.8;
      if (k <= 0) return false;
      const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 0.12, s.y - s.vy * 0.12);
      g.addColorStop(0, `rgba(255,255,255,${k})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 0.12, s.y - s.vy * 0.12); ctx.stroke();
      return true;
    });
  }

  function draw(t, dt) {
    drawBackdrop(t);

    ctx.strokeStyle = 'rgba(110,160,255,.16)'; ctx.lineWidth = 1;          // orbit paths
    PLANETS.forEach(p => { ctx.beginPath(); ctx.ellipse(cx, cy, p.r * maxR, p.r * maxR * TILT, 0, 0, TAU); ctx.stroke(); });

    drawShooters(dt);
    drawBelt(t, false); drawPlanets(t, false);       // things behind the Sun
    drawSun(t);
    drawBelt(t, true); drawPlanets(t, true);         // things in front of the Sun
  }

  /* ---------- run only while the home page is showing ---------- */
  let running = false, raf = 0, last = 0, t = 8, slowFrames = 0, frames = 0;

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    draw(t, dt);
    if (maxDpr > 1 && ++frames > 90) {                 // slow computer? drop to normal resolution once
      slowFrames += dt > 0.034 ? 1 : 0;
      if (frames > 150) { if (slowFrames > 50) { maxDpr = 1; resize(); } frames = -99999; }
    }
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (running) return;
    if (reduce) { draw(t, 0); return; }               // reduced motion: one still picture
    running = true; last = performance.now(); raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  function sync() {
    const home = !!view.querySelector('.hero');
    cv.style.display = home ? 'block' : 'none';
    document.body.classList.toggle('solar-on', home);
    if (home && !document.hidden) start(); else stop();
  }

  window.addEventListener('resize', () => { resize(); if (reduce && cv.style.display === 'block') draw(t, 0); });
  document.addEventListener('visibilitychange', sync);
  new MutationObserver(sync).observe(view, { childList: true });

  resize();
  sync();
})();
