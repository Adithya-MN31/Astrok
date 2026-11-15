(() => {
  const view = document.getElementById('view');
  const nav = document.getElementById('nav');
  const KEY = 'astro-games-v1';
  let db = { best: {}, won: {} };
  try { db = { ...db, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { /* storage unavailable */ }
  const saveDb = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* ignore */ } };

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const alive = () => !!$('gamesPage');
  const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const rnd = n => Math.floor(Math.random() * n);

  let timers = [], cleanups = [], handler = null, submitH = null, current = null;
  const clearTimers = () => { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; cleanups.forEach(f => f()); cleanups = []; };
  const after = (fn, ms) => { const t = setTimeout(() => { if (alive()) fn(); }, ms); timers.push(t); return t; };
  const every = (fn, ms) => { const t = setInterval(() => { if (alive()) fn(); else clearInterval(t); }, ms); timers.push(t); return t; };


  /* ---------- helpers for the graphical (canvas) games ---------- */
  const on = (target, ev, fn) => { target.addEventListener(ev, fn); cleanups.push(() => target.removeEventListener(ev, fn)); };
  const loop = fn => {
    let id, stop = false, last = performance.now();
    const tick = now => {
      if (stop || !alive()) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      fn(dt);
      if (!stop) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    cleanups.push(() => { stop = true; cancelAnimationFrame(id); });
  };
  const canvas = (a, w, h) => {
    a.insertAdjacentHTML('beforeend', `<canvas class="g-canvas" width="${w}" height="${h}" aria-label="Game screen"></canvas>`);
    const c = a.querySelector('canvas');
    return [c, c.getContext('2d')];
  };
  const pointerX = (c, e) => { const r = c.getBoundingClientRect(); return (e.clientX - r.left) * c.width / r.width; };
  const keyboard = () => {
    const k = {};
    const typing = e => /^(INPUT|TEXTAREA)$/.test(e.target.tagName);
    on(window, 'keydown', e => {
      if (typing(e)) return;
      const key = e.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(key)) e.preventDefault();
      k[key] = true;
    });
    on(window, 'keyup', e => { k[e.key.toLowerCase()] = false; });
    return k;
  };
  const sky = (x, W, H, stars) => {
    x.fillStyle = '#02061a'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#ffffffaa';
    stars.forEach(s => x.fillRect(s.x, s.y, s.s > 50 ? 2 : 1, s.s > 50 ? 2 : 1));
  };
  const makeStars = (W, H) => Array.from({ length: 45 }, () => ({ x: rnd(W), y: rnd(H), s: 15 + rnd(60) }));
  const hud = (x, text, W) => { x.fillStyle = '#eaf2ff'; x.font = 'bold 15px sans-serif'; x.textAlign = 'left'; x.textBaseline = 'top'; x.fillText(text, 10, 8); };

  const style = document.createElement('style');
  style.textContent = `
    .g-grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));margin-top:14px}
    .g-card{padding:16px;display:flex;flex-direction:column;gap:6px;align-items:flex-start}
    .g-card small{color:var(--muted)}
    .g-card .btn{margin-top:auto}
    .g-ic{font-size:2.2rem}
    .g-area{padding:18px;margin-top:12px}
    .g-tag{color:#6fc0ff;font-weight:700;font-size:.85rem}
    .g-big{font-size:2.4rem;font-weight:800;color:var(--gold);letter-spacing:.12em;margin:10px 0;word-break:break-all}
    .g-row{display:flex;gap:8px;margin:10px 0}
    .g-mem{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:360px;margin-top:10px}
    .g-blast{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:300px;margin-top:10px}
    .g-cell{aspect-ratio:1;font-size:1.8rem;border-radius:12px;border:1px solid var(--line);background:#0a2257}
    .g-cell:hover,.g-cell.up{background:#14388a}
    .g-cell.ok{background:#0f5a35;border-color:var(--green)}
    .g-order{display:grid;gap:8px;margin-top:10px}
    .g-pad{width:100%;min-height:140px;border-radius:16px;font-size:1.4rem;font-weight:800;border:1px solid var(--line);background:#5c1623;margin-top:10px}
    .g-pad.go{background:#0f5a35;border-color:var(--green)}
    .g-tf{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}
    .g-canvas{display:block;width:100%;max-width:480px;border-radius:12px;border:1px solid var(--line);background:#02061a;touch-action:none;margin-top:10px;cursor:crosshair}
    .g-touch{display:flex;gap:8px;margin-top:10px;max-width:480px}
    .g-touch .btn{flex:1;user-select:none;touch-action:none}
  `;
  document.head.appendChild(style);

  const FACTS = [
    ['There is no sound in space because there is no air to carry it.', true, 'Sound needs air or another material to travel through.'],
    ['Astronauts float because there is no gravity at the space station.', false, 'Gravity is still strong there. They float because they are in constant free fall around Earth.'],
    ['A day on Venus is longer than its year.', true, 'Venus spins so slowly that one turn takes longer than one trip around the Sun.'],
    ['The Sun is a planet.', false, 'The Sun is a star.'],
    ['The Moon has a night that lasts about 14 Earth days.', true, 'The Moon turns slowly, so its night is very long.'],
    ['Mars looks red because of rusty iron dust.', true, 'Iron in the dust reacts with oxygen, like rust on Earth.'],
    ['Astronauts can grow a little taller in space.', true, 'Their spines stretch without gravity pressing down.'],
    ['Saturn is the only planet with rings.', false, 'Jupiter, Uranus and Neptune have rings too.'],
    ['The space station circles Earth about every 90 minutes.', true, 'That is why the crew sees about 16 sunrises a day.'],
    ['Radio messages from Mars reach Earth instantly.', false, 'They take between 3 and 22 minutes each way.'],
    ['Jupiter is the largest planet in our solar system.', true, 'More than 1,000 Earths could fit inside it.'],
    ['Stars twinkle because space is windy.', false, 'Twinkling happens when starlight passes through Earth\'s moving air.'],
    ['Spacewalkers use tethers so they do not drift away.', true, 'Tools are tethered too.'],
    ['The Moon makes its own light.', false, 'It reflects sunlight.']
  ];

  /* shared engine for the two "put it in order" games */
  const orderStart = (items, label) => a => {
    let next = 0, miss = 0;
    a.innerHTML = `<p class="g-tag">${esc(label)} · Mistakes: <b id="gM">0</b></p>
      <div class="g-order">${shuffle(items.map((t, i) => [t, i])).map(([t, i]) => `<button class="opt" data-o="${i}">${esc(t)}</button>`).join('')}</div>`;
    handler = b => {
      if (b.dataset.o === undefined || b.disabled) return;
      if (+b.dataset.o === next) {
        b.disabled = true; b.classList.add('good'); b.textContent = `${next + 1}. ${b.textContent}`; next++;
        if (next === items.length) after(() => end(miss, miss <= 2), 600);
      } else {
        miss++; $('gM').textContent = miss; b.classList.add('bad'); after(() => b.classList.remove('bad'), 400);
      }
    };
  };

  const GAMES = [
    { id: 'quiz', icon: '🧠', name: 'Space Quiz Blitz', desc: 'Answer 8 random questions from the missions.', goal: '6 of 8 right', unit: '/8', xp: 15,
      start(a) {
        const qs = shuffle(MISSIONS.flatMap(m => m.steps)).slice(0, 8);
        let i = 0, score = 0, lock = false;
        const show = () => {
          lock = false; const q = qs[i];
          a.innerHTML = `<span class="g-tag">Question ${i + 1} of ${qs.length}</span><h3>${esc(q.q)}</h3>
            <div class="opts">${q.options.map((o, n) => `<button class="opt" data-n="${n}">${esc(o)}</button>`).join('')}</div>`;
        };
        handler = b => {
          if (b.dataset.n === undefined || lock) return; lock = true;
          const q = qs[i], n = +b.dataset.n, ok = n === q.answer; if (ok) score++;
          a.querySelectorAll('.opt').forEach((x, k) => { if (k === q.answer) x.classList.add('good'); else if (k === n) x.classList.add('bad'); });
          a.insertAdjacentHTML('beforeend', `<p class="why">${ok ? '✅ ' : '❌ '}${esc(q.why)}</p>`);
          after(() => { i++; i < qs.length ? show() : end(score, score >= 6); }, 1800);
        };
        show();
      } },

    { id: 'memory', icon: '🃏', name: 'Memory Match', desc: 'Flip cards and find all 8 matching pairs.', goal: '16 moves or fewer', unit: ' moves', low: true, xp: 15,
      start(a) {
        const em = ['🌍', '🌙', '☀️', '🪐', '⭐', '☄️', '🚀', '🛰️'];
        const cards = shuffle([...em, ...em]);
        let open = [], moves = 0, found = 0, lock = false;
        a.innerHTML = `<p class="g-tag">Moves: <b id="gMv">0</b></p>
          <div class="g-mem">${cards.map((c, i) => `<button class="g-cell" data-i="${i}" aria-label="Hidden card">❔</button>`).join('')}</div>`;
        handler = b => {
          if (lock || b.dataset.i === undefined || b.classList.contains('up')) return;
          b.classList.add('up'); b.textContent = cards[+b.dataset.i]; open.push(b);
          if (open.length < 2) return;
          moves++; $('gMv').textContent = moves;
          const [x, y] = open; open = [];
          if (cards[+x.dataset.i] === cards[+y.dataset.i]) {
            found++; x.classList.add('ok'); y.classList.add('ok');
            if (found === em.length) after(() => end(moves, moves <= 16), 600);
          } else {
            lock = true;
            after(() => { [x, y].forEach(c => { c.classList.remove('up'); c.textContent = '❔'; }); lock = false; }, 800);
          }
        };
      } },

    { id: 'blast', icon: '☄️', name: 'Asteroid Blast', desc: 'Click each asteroid before it jumps away. 20 seconds!', goal: '12 hits', unit: ' hits', xp: 15,
      start(a) {
        let score = 0, left = 20, cur = -1;
        a.innerHTML = `<p class="g-tag">Time: <b id="gT">20</b>s · Hits: <b id="gS">0</b></p>
          <div class="g-blast">${Array.from({ length: 9 }, (_, i) => `<button class="g-cell" data-i="${i}" aria-label="Space">·</button>`).join('')}</div>`;
        const cells = [...a.querySelectorAll('.g-cell')];
        const spawn = () => { if (cur >= 0) cells[cur].textContent = '·'; cur = rnd(9); cells[cur].textContent = '☄️'; };
        spawn(); every(spawn, 800);
        every(() => { left--; $('gT').textContent = left; if (left <= 0) end(score, score >= 12); }, 1000);
        handler = b => {
          if (b.dataset.i !== undefined && +b.dataset.i === cur) { score++; $('gS').textContent = score; cells[cur].textContent = '💥'; cur = -1; }
        };
      } },

    { id: 'scramble', icon: '🔤', name: 'Word Scramble', desc: 'Unscramble the space words.', goal: '4 of 6 right', unit: '/6', xp: 15,
      start(a) {
        const words = shuffle(['ROCKET', 'ORBIT', 'COMET', 'GALAXY', 'PLANET', 'ASTRONAUT', 'GRAVITY', 'NEBULA', 'METEOR', 'SATELLITE']).slice(0, 6);
        let i = 0, score = 0, lock = false;
        const scr = w => { let s; do { s = shuffle([...w]).join(''); } while (s === w); return s; };
        const show = () => {
          lock = false;
          a.innerHTML = `<span class="g-tag">Word ${i + 1} of ${words.length}</span><div class="g-big">${scr(words[i])}</div>
            <form id="gForm" class="g-row"><input type="text" id="gIn" maxlength="14" autocomplete="off" aria-label="Your answer"><button class="btn" type="submit">Check</button></form>
            <p id="gMsg" class="sub"></p>`;
          $('gIn').focus();
        };
        submitH = () => {
          const v = $('gIn').value.trim().toUpperCase(); if (!v || lock) return; lock = true;
          const ok = v === words[i]; if (ok) score++;
          $('gMsg').textContent = ok ? '✅ Correct!' : `❌ It was ${words[i]}`;
          after(() => { i++; i < words.length ? show() : end(score, score >= 4); }, 1200);
        };
        show();
      } },

    { id: 'launch', icon: '🚀', name: 'Launch Sequence', desc: 'Put the rocket launch steps in the right order.', goal: '2 mistakes or fewer', unit: ' mistakes', low: true, xp: 15,
      start: orderStart(['Put on your spacesuit', 'Run the systems checklist', 'Load the fuel', 'Start the countdown', 'Ignite the engines', 'Liftoff!'], 'Click the steps in order') },

    { id: 'planets', icon: '🪐', name: 'Planet Order', desc: 'Click the planets from the Sun outward.', goal: '2 mistakes or fewer', unit: ' mistakes', low: true, xp: 15,
      start: orderStart(['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'], 'Closest to the Sun first') },

    { id: 'satellite', icon: '🛰️', name: 'Find the Satellite', desc: 'A satellite hides between 1 and 100. Scan for it in 7 tries.', goal: 'Find it', unit: ' tries', low: true, xp: 15,
      start(a) {
        const target = 1 + rnd(100); let tries = 0;
        a.innerHTML = `<p class="g-tag">Distance in thousands of km (1 to 100) · Tries: <b id="gTr">0</b>/7</p>
          <form id="gForm" class="g-row"><input type="text" inputmode="numeric" id="gIn" maxlength="3" autocomplete="off" aria-label="Your guess"><button class="btn" type="submit">Scan</button></form>
          <p id="gMsg" class="sub"></p>`;
        $('gIn').focus();
        submitH = () => {
          const n = parseInt($('gIn').value, 10);
          if (!(n >= 1 && n <= 100)) { $('gMsg').textContent = 'Type a number from 1 to 100.'; return; }
          tries++; $('gTr').textContent = tries; $('gIn').value = '';
          if (n === target) return end(tries, true);
          if (tries >= 7) return end(tries, false, `The satellite was at ${target}.`);
          $('gMsg').textContent = n < target ? '⬆ Higher!' : '⬇ Lower!';
        };
      } },

    { id: 'reflex', icon: '⚡', name: 'Docking Reflex', desc: 'Click the pad the moment it turns green. 5 rounds.', goal: 'Average under 450 ms', unit: ' ms', low: true, xp: 15,
      start(a) {
        let round = 0, total = 0, t0 = 0, ready = false, busy = false, timer;
        a.innerHTML = `<p class="g-tag">Round <b id="gR">1</b> of 5. Clicking too early restarts the round.</p><button class="g-pad" id="gPad">Get ready…</button>`;
        const pad = $('gPad');
        const arm = () => {
          busy = false; ready = false; pad.className = 'g-pad'; pad.textContent = 'Wait for green…';
          timer = after(() => { ready = true; t0 = performance.now(); pad.className = 'g-pad go'; pad.textContent = 'DOCK NOW!'; }, 1200 + Math.random() * 2500);
        };
        handler = b => {
          if (b.id !== 'gPad' || busy) return;
          if (!ready) { clearTimeout(timer); busy = true; pad.textContent = 'Too early! Wait for green…'; after(arm, 1000); return; }
          const ms = Math.round(performance.now() - t0); total += ms; round++;
          ready = false; busy = true; pad.className = 'g-pad'; pad.textContent = `${ms} ms`;
          $('gR').textContent = Math.min(round + 1, 5);
          if (round >= 5) after(() => { const avg = Math.round(total / 5); end(avg, avg < 450); }, 900);
          else after(arm, 900);
        };
        arm();
      } },

    { id: 'facts', icon: '🧪', name: 'Fact or Fiction', desc: 'Is the space statement true or false?', goal: '8 of 10 right', unit: '/10', xp: 15,
      start(a) {
        const qs = shuffle(FACTS).slice(0, 10);
        let i = 0, score = 0, lock = false;
        const show = () => {
          lock = false;
          a.innerHTML = `<span class="g-tag">Statement ${i + 1} of ${qs.length}</span><h3>${esc(qs[i][0])}</h3>
            <div class="g-tf"><button class="btn" data-t="1">✅ True</button><button class="btn ghost" data-t="0">❌ False</button></div>`;
        };
        handler = b => {
          if (b.dataset.t === undefined || lock) return; lock = true;
          const ok = (b.dataset.t === '1') === qs[i][1]; if (ok) score++;
          a.insertAdjacentHTML('beforeend', `<p class="why">${ok ? '✅ Right! ' : '❌ Not quite. '}${esc(qs[i][2])}</p>`);
          after(() => { i++; i < qs.length ? show() : end(score, score >= 8); }, 1800);
        };
        show();
      } },

    { id: 'math', icon: '🔢', name: 'Oxygen Math', desc: 'Solve as many sums as you can in 30 seconds.', goal: '8 correct', unit: ' correct', xp: 15,
      start(a) {
        let score = 0, left = 30, ans = 0;
        const make = () => {
          let x = 2 + rnd(18), y = 2 + rnd(8); const t = rnd(3);
          if (t === 0) { ans = x + y; return `${x} + ${y}`; }
          if (t === 1) { if (y > x) [x, y] = [y, x]; ans = x - y; return `${x} − ${y}`; }
          x = 2 + rnd(8); ans = x * y; return `${x} × ${y}`;
        };
        a.innerHTML = `<p class="g-tag">Time: <b id="gT">30</b>s · Correct: <b id="gS">0</b></p><div class="g-big" id="gQ"></div>
          <form id="gForm" class="g-row"><input type="text" inputmode="numeric" id="gIn" maxlength="4" autocomplete="off" aria-label="Answer"><button class="btn" type="submit">Go</button></form>`;
        const next = () => { $('gQ').textContent = make() + ' = ?'; $('gIn').value = ''; $('gIn').focus(); };
        next();
        submitH = () => {
          if ($('gIn').value.trim() === '') return;
          if (parseInt($('gIn').value, 10) === ans) { score++; $('gS').textContent = score; }
          next();
        };
        every(() => { left--; $('gT').textContent = left; if (left <= 0) end(score, score >= 8); }, 1000);
      } },

    /* ================= GRAPHICAL GAMES ================= */
    { id: 'shooter', icon: '🔫', name: 'Asteroid Shooter', desc: 'Steer your ship and blast falling asteroids. 30 seconds, 3 lives!', goal: '15 asteroids', unit: ' asteroids', xp: 15,
      start(a) {
        const W = 480, H = 360;
        a.innerHTML = `<p class="g-tag">Move with your mouse, finger or the ← → keys. Your ship fires by itself.</p>`;
        const [c, x] = canvas(a, W, H), keys = keyboard(), stars = makeStars(W, H);
        let sx = W / 2, score = 0, lives = 3, left = 30, fireT = 0, spawnT = 0, bullets = [], rocks = [], hitFlash = 0;
        const move = e => { sx = pointerX(c, e); };
        on(c, 'pointermove', move); on(c, 'pointerdown', move);
        loop(dt => {
          left -= dt; hitFlash = Math.max(0, hitFlash - dt);
          if (keys.arrowleft || keys.a) sx -= 280 * dt;
          if (keys.arrowright || keys.d) sx += 280 * dt;
          sx = Math.max(18, Math.min(W - 18, sx));
          fireT -= dt; if (fireT <= 0) { bullets.push({ x: sx, y: H - 48 }); fireT = 0.25; }
          spawnT -= dt; if (spawnT <= 0) { rocks.push({ x: 24 + rnd(W - 48), y: -24, r: 12 + rnd(12), v: 70 + rnd(80), rot: 0 }); spawnT = 0.5 + Math.random() * 0.3; }
          bullets.forEach(b => { b.y -= 430 * dt; });
          rocks.forEach(r => { r.y += r.v * dt; r.rot += dt * 2; });
          stars.forEach(s => { s.y += s.s * dt; if (s.y > H) { s.y = 0; s.x = rnd(W); } });
          rocks.forEach(r => {
            bullets.forEach(b => { if (!b.dead && !r.dead && Math.hypot(b.x - r.x, b.y - r.y) < r.r + 4) { b.dead = r.dead = true; score++; } });
            if (!r.dead && Math.hypot(sx - r.x, H - 34 - r.y) < r.r + 14) { r.dead = true; lives--; hitFlash = 0.3; }
          });
          bullets = bullets.filter(b => !b.dead && b.y > -10);
          rocks = rocks.filter(r => !r.dead && r.y < H + 40);

          sky(x, W, H, stars);
          x.fillStyle = '#ffe27a';
          bullets.forEach(b => x.fillRect(b.x - 2, b.y - 8, 4, 12));
          rocks.forEach(r => {
            x.save(); x.translate(r.x, r.y); x.rotate(r.rot);
            x.fillStyle = '#8a93a6'; x.beginPath(); x.arc(0, 0, r.r, 0, 7); x.fill();
            x.fillStyle = '#5d6577'; x.beginPath(); x.arc(-r.r * 0.3, -r.r * 0.2, r.r * 0.25, 0, 7); x.arc(r.r * 0.3, r.r * 0.3, r.r * 0.18, 0, 7); x.fill();
            x.restore();
          });
          x.save(); x.translate(sx, H - 34);
          x.fillStyle = hitFlash > 0 ? '#ff5d6c' : '#dfe9ff';
          x.beginPath(); x.moveTo(0, -20); x.lineTo(14, 14); x.lineTo(0, 7); x.lineTo(-14, 14); x.closePath(); x.fill();
          x.fillStyle = '#ff9d3d'; x.beginPath(); x.moveTo(-5, 10); x.lineTo(0, 14 + Math.random() * 10); x.lineTo(5, 10); x.fill();
          x.restore();
          hud(x, `Hits: ${score}   Lives: ${'❤'.repeat(Math.max(0, lives))}   Time: ${Math.max(0, Math.ceil(left))}s`, W);
          if (lives <= 0 || left <= 0) end(score, score >= 15);
        });
      } },

    { id: 'lander', icon: '🛬', name: 'Rocket Lander', desc: 'Fire your thrusters and land softly on the green pad.', goal: 'Land safely', unit: '% fuel left', xp: 15, winOnly: true,
      start(a) {
        const W = 480, H = 360, G = H - 24, stars = makeStars(W, H);
        a.innerHTML = `<p class="g-tag">Hold ↑ / Space (or 🔥) to fire the engine, ← → to steer. Touch down slowly. Fuel: <b id="gF">100</b>%</p>`;
        const [c, x] = canvas(a, W, H), keys = keyboard(), touch = { up: false, l: false, r: false };
        a.insertAdjacentHTML('beforeend', `<div class="g-touch"><button class="btn ghost" id="tL" type="button">◀</button><button class="btn" id="tU" type="button">🔥 Thrust</button><button class="btn ghost" id="tR" type="button">▶</button></div>`);
        [['tL', 'l'], ['tU', 'up'], ['tR', 'r']].forEach(([id, k]) => {
          const b = $(id);
          on(b, 'pointerdown', e => { e.preventDefault(); touch[k] = true; });
          ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => on(b, ev, () => { touch[k] = false; }));
        });
        const pad = { x: 40 + rnd(W - 170), w: 90 };
        let px = 60 + rnd(W - 120), py = 40, vx = (Math.random() - 0.5) * 40, vy = 0, fuel = 100;
        loop(dt => {
          const up = keys.arrowup || keys.w || keys[' '] || touch.up, lf = keys.arrowleft || keys.a || touch.l, rt = keys.arrowright || keys.d || touch.r;
          let ax = 0, ay = 45, burn = false;
          if (fuel > 0) {
            if (up) { ay = -70; fuel -= 22 * dt; burn = true; }
            if (lf) { ax -= 45; fuel -= 8 * dt; }
            if (rt) { ax += 45; fuel -= 8 * dt; }
          }
          fuel = Math.max(0, fuel);
          vx += ax * dt; vy += ay * dt; px += vx * dt; py += vy * dt;
          if (px < 12) { px = 12; vx = 0; } if (px > W - 12) { px = W - 12; vx = 0; }
          if (py < 14) { py = 14; vy = Math.max(vy, 0); }
          $('gF').textContent = Math.round(fuel);

          sky(x, W, H, stars);
          x.fillStyle = '#4a4f5e'; x.fillRect(0, G, W, H - G);
          x.fillStyle = '#37d67a'; x.fillRect(pad.x, G, pad.w, 6);
          x.save(); x.translate(px, py);
          if (burn) { x.fillStyle = '#ff9d3d'; x.beginPath(); x.moveTo(-6, 12); x.lineTo(0, 22 + Math.random() * 12); x.lineTo(6, 12); x.fill(); }
          x.fillStyle = '#dfe9ff'; x.fillRect(-8, -14, 16, 26);
          x.fillStyle = '#5ab0ff'; x.beginPath(); x.arc(0, -4, 4, 0, 7); x.fill();
          x.strokeStyle = '#dfe9ff'; x.lineWidth = 2; x.beginPath(); x.moveTo(-8, 12); x.lineTo(-13, 16); x.moveTo(8, 12); x.lineTo(13, 16); x.stroke();
          x.restore();
          const safe = Math.abs(vy) < 35 && Math.abs(vx) < 20;
          x.fillStyle = safe ? '#37d67a' : '#ff5d6c';
          x.font = 'bold 14px sans-serif'; x.textAlign = 'left'; x.textBaseline = 'top';
          x.fillText(`Down speed: ${Math.round(vy)}   Side speed: ${Math.round(Math.abs(vx))}   ${safe ? 'SAFE' : 'TOO FAST'}`, 10, 8);

          if (py + 16 >= G) {
            const onPad = px > pad.x && px < pad.x + pad.w;
            if (safe && onPad) end(Math.round(fuel), true, 'Perfect soft landing!');
            else end(0, false, !onPad ? 'You missed the landing pad.' : 'Too fast! Keep down speed under 35 and side speed under 20.');
          }
        });
      } },

    { id: 'catcher', icon: '🌟', name: 'Star Catcher', desc: 'Move your astronaut to catch stars and dodge space junk. 30 seconds!', goal: '20 stars', unit: ' stars', xp: 15,
      start(a) {
        const W = 480, H = 360, stars = makeStars(W, H);
        a.innerHTML = `<p class="g-tag">Move with your mouse, finger or the ← → keys. Stars +1, junk −2.</p>`;
        const [c, x] = canvas(a, W, H), keys = keyboard();
        let px = W / 2, score = 0, left = 30, spawnT = 0, items = [], flash = 0;
        const move = e => { px = pointerX(c, e); };
        on(c, 'pointermove', move); on(c, 'pointerdown', move);
        loop(dt => {
          left -= dt; flash = Math.max(0, flash - dt);
          if (keys.arrowleft || keys.a) px -= 300 * dt;
          if (keys.arrowright || keys.d) px += 300 * dt;
          px = Math.max(24, Math.min(W - 24, px));
          spawnT -= dt; if (spawnT <= 0) { items.push({ x: 24 + rnd(W - 48), y: -20, v: 100 + rnd(90), junk: Math.random() < 0.3 }); spawnT = 0.42; }
          items.forEach(i => { i.y += i.v * dt; });
          items.forEach(i => {
            if (Math.abs(i.x - px) < 30 && Math.abs(i.y - (H - 40)) < 28) {
              i.dead = true;
              if (i.junk) { score = Math.max(0, score - 2); flash = 0.3; } else score++;
            }
          });
          items = items.filter(i => !i.dead && i.y < H + 30);
          stars.forEach(s => { s.y += s.s * dt; if (s.y > H) { s.y = 0; s.x = rnd(W); } });

          sky(x, W, H, stars);
          if (flash > 0) { x.fillStyle = 'rgba(255,93,108,.25)'; x.fillRect(0, 0, W, H); }
          x.font = '28px serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
          items.forEach(i => x.fillText(i.junk ? '🛰️' : '⭐', i.x, i.y));
          x.font = '36px serif'; x.fillText('🧑‍🚀', px, H - 40);
          hud(x, `Stars: ${score}   Time: ${Math.max(0, Math.ceil(left))}s`, W);
          if (left <= 0) end(score, score >= 20);
        });
      } }
  ];

  const fmt = (g, s) => `${s}${g.unit}`;
  const bestText = g => (db.best[g.id] != null ? `Best: ${fmt(g, db.best[g.id])}` : 'Not played yet') + (db.won[g.id] ? ' · ✔ XP earned' : '');

  function hub() {
    clearTimers(); handler = null; submitH = null; current = null;
    view.innerHTML = `<div id="gamesPage"><h2>🎮 Games</h2>
      <p class="sub">${GAMES.length} quick space games, including graphical arcade games. Reach a game's goal for the first time to earn +15 XP!</p>
      <div class="g-grid">${GAMES.map(g => `
        <div class="card g-card"><div class="g-ic">${g.icon}</div><b>${esc(g.name)}</b>
          <small>${esc(g.desc)}</small><small>Goal: ${esc(g.goal)}</small><small>${esc(bestText(g))}</small>
          <button class="btn" data-g="${g.id}">Play ➜</button></div>`).join('')}</div></div>`;
  }

  function play(id) {
    clearTimers(); handler = null; submitH = null;
    current = GAMES.find(x => x.id === id);
    view.innerHTML = `<div id="gamesPage"><button class="btn ghost" data-act="hub">⬅ All games</button>
      <h2 style="margin-top:12px">${current.icon} ${esc(current.name)}</h2>
      <p class="sub">${esc(current.desc)} Goal: ${esc(current.goal)}.</p><div id="gArea" class="card g-area"></div></div>`;
    current.start($('gArea'));
  }

  function end(score, win, extra = '') {
    clearTimers(); handler = null; submitH = null;
    const g = current, prev = db.best[g.id];
    const better = prev == null || (g.low ? score < prev : score > prev);
    if (better && (win || !(g.low || g.winOnly))) db.best[g.id] = score;
    let bonus = '';
    if (win && !db.won[g.id] && window.addTrainerXp) { db.won[g.id] = true; window.addTrainerXp(g.xp); bonus = `<p class="g-tag">🎉 +${g.xp} XP bonus!</p>`; }
    saveDb();
    $('gArea').innerHTML = `<h3>${win ? '🏅 Great job!' : '🛰️ Good try!'}</h3><div class="g-big">${esc(fmt(g, score))}</div>
      ${extra ? `<p class="sub">${esc(extra)}</p>` : ''}
      <p class="sub">Best: ${db.best[g.id] != null ? esc(fmt(g, db.best[g.id])) : '-'} · Goal: ${esc(g.goal)}</p>${bonus}
      <div style="margin-top:12px"><button class="btn" data-g="${g.id}">Play again</button> <button class="btn ghost" data-act="hub">All games</button></div>`;
  }

  /* open the Games page from the side menu (runs before script.js's own handler) */
  nav.addEventListener('click', e => {
    const b = e.target.closest('button[data-view]');
    if (!b || b.dataset.view !== 'games') return;
    e.stopPropagation();
    document.querySelectorAll('#nav button').forEach(x => x.classList.toggle('active', x === b));
    hub();
  }, true);

  view.addEventListener('click', e => {
    if (!e.target.closest('#gamesPage')) return;
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.act === 'hub') return hub();
    if (b.dataset.g) return play(b.dataset.g);
    if (handler) handler(b);
  });

  view.addEventListener('submit', e => {
    if (e.target.id !== 'gForm') return;
    e.preventDefault();
    if (submitH) submitH();
  });
})();