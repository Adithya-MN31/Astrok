/* visuals.js - adds a picture to every question, lesson and game screen,
   and makes every click fun for children (sparkles, cheers, sounds).
   It needs NO changes to script.js, games.js or missions.js: it watches the page and decorates it.

   PICTURES
   - By default each picture is a big animated emoji scene (works right away, no files needed).
   - To use REAL photos: put image files in an "images" folder (jpg), named like  iss-0.jpg, array-2.jpg,
     mod-ops.jpg ... (the names are listed in the scene tables below), then set USE_PHOTOS = true.
     If a photo is missing, the emoji scene is shown instead. */
(() => {
  'use strict';

  const USE_PHOTOS = false;          // set to true after you add photos to the images folder
  const PHOTO_EXT = 'jpg';

  const $ = (s, r = document) => r.querySelector(s);
  const rnd = n => Math.floor(Math.random() * n);
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

  const GRADS = [
    'radial-gradient(circle at 80% 20%,#2f8cff55,transparent 50%),linear-gradient(135deg,#1d4fb8,#0b1f4d)',
    'radial-gradient(circle at 20% 80%,#b46bff55,transparent 50%),linear-gradient(135deg,#6a2bd1,#1b1060)',
    'radial-gradient(circle at 80% 80%,#37d67a44,transparent 50%),linear-gradient(135deg,#0f8a6a,#06284a)',
    'radial-gradient(circle at 20% 20%,#ffc83d44,transparent 50%),linear-gradient(135deg,#d1572b,#4a1230)',
    'radial-gradient(circle at 50% 100%,#6fc0ff44,transparent 55%),linear-gradient(135deg,#1b7fd1,#071a45)'
  ];

  /* ================= SCENE TABLES (edit these to change the pictures) ================= */

  /* mission questions: mission id -> one [emojis, caption] per step. Photo name: <id>-<step>.jpg */
  const STEP_DATA = {
    iss:     [[['🚨', '🛰️'], 'Alarm on the station!'], [['🚪', '🛰️'], 'Close the hatch'], [['🔍', '🛰️'], 'Find the leak']],
    array:   [[['🧑‍🚀', '🔗'], 'Clip on your tethers'], [['🔧', '🌌'], 'A tool floats away'], [['🧑‍🚀', '🧑‍🚀'], 'Buddy system']],
    fire:    [[['🔥', '🚨'], 'Fire alarm!'], [['🔌', '⚡'], 'Switch off the power'], [['😷', '🧯'], 'Masks on']],
    dock:    [[['📡', '📦'], 'Talk to Mission Control'], [['⚠️', '📦'], 'Sensor warning'], [['🦾', '📦'], 'Robot arm catch']],
    debris:  [[['☄️', '🛰️'], 'Debris coming'], [['🚀', '💨'], 'Fire the thrusters'], [['🧑‍🚀', '🚀'], 'Stay near your lifeboat']],
    storm:   [[['☀️', '📡'], 'Watching the Sun'], [['🛡️', '🧑‍🚀'], 'Shielded shelter'], [['🚫', '🧑‍🚀'], 'No spacewalk today']],
    medical: [[['🩺', '🤒'], 'Help your crewmate'], [['👩‍⚕️', '📡'], 'Doctor on Earth'], [['🗣️', '🎧'], 'Read it back']],
    power:   [[['🫧', '🔋'], 'Keep life support on'], [['💡', '🔌'], 'Save power'], [['🌑', '🔋'], 'Batteries at night']],
    mars:    [[['🔴', '🚨'], 'Far from Earth'], [['🍎', '💧'], 'Pack everything'], [['🛡️', '🔴'], 'Radiation shelter']]
  };

  /* training modules: module id -> [emojis, caption]. Photo name: mod-<id>.jpg */
  const MOD_DATA = {
    ops:    [['🛰️', '🌅', '🌍'], 'Orbiting Earth'],
    walk:   [['🧑‍🚀', '🌍', '🔗'], 'Spacewalk!'],
    sci:    [['🌱', '🔬', '🧪'], 'Science in space'],
    robot:  [['🦾', '🤖', '🔧'], 'Robots to the rescue'],
    emerg:  [['🚨', '🔥', '🧯'], 'Stay calm, follow the checklist'],
    team:   [['🎧', '🗣️', '🤝'], 'Teamwork'],
    fit:    [['🏋️', '🚴', '💪'], 'Strong astronauts']
  };

  /* Fact or Fiction (and any other text): first matching word wins. Photo name: kw-<key>.jpg */
  const KW = [
    [/sound|air to carry/i,        ['🔇', '🌌'],        'Silent space',        'sound'],
    [/gravity|free fall|float/i,   ['🧑‍🚀', '🌍'],       'Floating astronaut',  'gravity'],
    [/venus/i,                     ['🪐', '🔥'],        'Venus',               'venus'],
    [/\bsun\b|star\b|sunlight/i,   ['☀️', '⭐'],         'The Sun',             'sun'],
    [/moon/i,                      ['🌙', '👨‍🚀'],       'The Moon',            'moon'],
    [/mars|rusty|iron/i,           ['🔴', '🚜'],        'Mars',                'mars'],
    [/taller|spine/i,              ['📏', '🧑‍🚀'],       'Growing taller',      'taller'],
    [/saturn|rings/i,              ['🪐', '💍'],        'Rings',               'rings'],
    [/space station|90 minutes|sunrise/i, ['🛰️', '🌅'], 'Space station',       'station'],
    [/radio|message/i,             ['📡', '⏳'],        'Slow messages',       'radio'],
    [/jupiter|largest planet/i,    ['🪐', '🌍'],        'Giant Jupiter',       'jupiter'],
    [/twinkle|wind/i,              ['✨', '🌬️'],        'Twinkling stars',     'twinkle'],
    [/tether|spacewalk/i,          ['🧑‍🚀', '🔗'],       'Tethered!',           'tether']
  ];
  const DEFAULT_SCENE = { key: 'space', art: ['🚀', '🌟'], cap: 'Space time!' };

  /* Word Scramble: the picture is a clue (sorted letters -> picture) */
  const WORD_PICS = { ROCKET: '🚀', ORBIT: '🔄', COMET: '☄️', GALAXY: '🌌', PLANET: '🪐', ASTRONAUT: '🧑‍🚀',
                      GRAVITY: '🍎', NEBULA: '🌫️', METEOR: '🌠', SATELLITE: '🛰️' };
  const SCRAMBLE = {};
  Object.entries(WORD_PICS).forEach(([w, e]) => { SCRAMBLE[[...w].sort().join('')] = { key: 'word-' + w.toLowerCase(), art: [e], cap: 'Picture clue' }; });

  /* Planet Order buttons and Launch Sequence buttons get a small picture in front */
  const PLANET_PIC = { Mercury: '🌑', Venus: '🟡', Earth: '🌍', Mars: '🔴', Jupiter: '🟠', Saturn: '🪐', Uranus: '🔵', Neptune: '🌀' };
  const LAUNCH_PIC = [[/spacesuit/i, '🧑‍🚀'], [/checklist/i, '✅'], [/fuel/i, '⛽'], [/countdown/i, '⏱️'], [/ignite/i, '🔥'], [/liftoff/i, '🚀']];

  /* Outpost Survival emergencies and destinations */
  const EVENT_PIC = [[/storm/i, ['☀️', '🛡️'], 'Solar storm', 'evt-storm'], [/leak/i, ['🚨', '🫧'], 'Air leak', 'evt-leak'],
                     [/converter|power/i, ['⚡', '🔧'], 'Power fault', 'evt-power']];
  const SITE_PIC = [[/south pole|pole/i, ['🏔️', '☀️'], 'Peaks of light', 'site-pole'], [/lunar outpost|moon/i, ['🌙', '🧑‍🚀'], 'The Moon', 'site-moon'],
                    [/mars/i, ['🔴', '🌪️'], 'Mars', 'site-mars'], [/ceres/i, ['🪨', '🛰️'], 'Ceres', 'site-ceres']];

  /* ================= helpers ================= */
  const findStep = text => {
    if (typeof MISSIONS === 'undefined') return null;
    for (const m of MISSIONS) {
      const i = m.steps.findIndex(s => s.q === text);
      if (i >= 0) return { m, i };
    }
    return null;
  };
  const stepScene = (m, i) => {
    const d = (STEP_DATA[m.id] || [])[i];
    return d ? { key: `${m.id}-${i}`, art: d[0], cap: d[1] } : { key: `${m.id}-${i}`, art: [m.icon, '🌟'], cap: m.title };
  };
  const kwScene = text => {
    const hit = KW.find(k => k[0].test(text));
    return hit ? { key: 'kw-' + hit[3], art: hit[1], cap: hit[2] } : DEFAULT_SCENE;
  };
  const pickScene = (table, text) => {
    const hit = table.find(t => t[0].test(text));
    return hit ? { key: hit[3], art: hit[1], cap: hit[2] } : null;
  };

  /* ================= styles ================= */
  const style = document.createElement('style');
  style.textContent = `
    .scene{position:relative;display:flex;align-items:center;justify-content:center;min-height:130px;margin:10px 0 14px;
      border-radius:18px;overflow:hidden;border:1px solid var(--line);background:var(--g);cursor:pointer;user-select:none;
      box-shadow:0 0 18px rgba(47,123,255,.3)}
    .scene::before{content:"";position:absolute;inset:0;pointer-events:none;
      background:radial-gradient(1.5px 1.5px at 12% 25%,#fff,transparent),radial-gradient(1.5px 1.5px at 78% 18%,#fff,transparent),
        radial-gradient(2px 2px at 60% 78%,#fff,transparent),radial-gradient(1px 1px at 30% 70%,#fff,transparent),
        radial-gradient(1.5px 1.5px at 90% 60%,#fff,transparent);animation:vtwinkle 3s ease-in-out infinite}
    .scene.small{min-height:90px;margin:8px 0}
    .scene .s-art{position:relative;z-index:1;display:flex;gap:16px;align-items:center;font-size:3.8rem}
    .scene.small .s-art{font-size:2.6rem}
    .scene .s-art i{font-style:normal;display:inline-block;animation:vbob 2.4s ease-in-out infinite;
      filter:drop-shadow(0 0 12px rgba(255,255,255,.4))}
    .scene .s-art i:nth-child(2){animation-delay:.5s}
    .scene .s-art i:nth-child(3){animation-delay:1s}
    .scene .s-cap{position:absolute;left:10px;bottom:8px;z-index:2;padding:3px 12px;border-radius:99px;
      background:rgba(2,6,20,.7);font-size:.8rem;font-weight:700}
    .scene img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}
    .scene.photo .s-art{opacity:0}
    .scene.photo::before{display:none}
    .scene:hover{box-shadow:0 0 26px var(--glow)}
    .scene.pop{animation:vpop .45s}
    .pic-anim i{font-style:normal;display:inline-block;animation:vbob 2.4s ease-in-out infinite}
    .pic-anim i:nth-child(2){animation-delay:.6s}

    .opt[data-pic]::before{content:attr(data-pic);margin-right:10px;font-size:1.4rem;vertical-align:middle}
    .opt,.btn,.mod,.g-cell,.item{transition:transform .15s,box-shadow .15s,background .15s}
    .opt:hover:not(:disabled){transform:translateX(5px)}
    .opt:active:not(:disabled),.btn:active,.mod:active,.g-cell:active{transform:scale(.95)}
    .mod:hover .ic{animation:vwiggle .5s}
    .shake{animation:vshake .45s}

    #fxLayer{position:fixed;inset:0;pointer-events:none;z-index:60;overflow:hidden}
    .fx{position:absolute;transform:translate(-50%,-50%);animation:vfly .85s ease-out forwards;will-change:transform,opacity}
    .fx-toast{position:absolute;transform:translate(-50%,-50%);font-weight:800;font-size:1.5rem;color:var(--gold);
      text-shadow:0 0 12px #000,0 0 18px var(--gold);animation:vtoast 1.1s ease-out forwards;white-space:nowrap}
    #soundBtn{position:fixed;left:14px;bottom:14px;z-index:70;width:44px;height:44px;border-radius:50%;font-size:1.3rem;
      border:1px solid var(--line);background:#0a2257;box-shadow:0 0 14px var(--glow)}
    #soundBtn:hover{background:#14388a}

    @keyframes vbob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-9px) rotate(3deg)}}
    @keyframes vtwinkle{0%,100%{opacity:.35}50%{opacity:1}}
    @keyframes vpop{0%{transform:scale(1)}40%{transform:scale(1.04) rotate(-1deg)}100%{transform:scale(1)}}
    @keyframes vwiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-14deg) scale(1.15)}75%{transform:rotate(14deg) scale(1.15)}}
    @keyframes vshake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}
    @keyframes vfly{0%{opacity:1;transform:translate(-50%,-50%) scale(.4) rotate(0)}
      100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1.2) rotate(var(--r))}}
    @keyframes vtoast{0%{opacity:0;transform:translate(-50%,-30%) scale(.5)}20%{opacity:1;transform:translate(-50%,-70%) scale(1.15)}
      100%{opacity:0;transform:translate(-50%,-190%) scale(1)}}
    @media(prefers-reduced-motion:reduce){
      .scene .s-art i,.pic-anim i,.scene::before{animation:none!important}
      .fx,.fx-toast{display:none}
    }
  `;
  document.head.appendChild(style);

  /* ================= sound (small chimes, can be muted) ================= */
  let ac = null, soundOn = true;
  try { soundOn = localStorage.getItem('astro-sound') !== 'off'; } catch (e) { /* ignore */ }
  function tone(seq, type = 'sine') {
    if (!soundOn) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      let t = ac.currentTime;
      seq.forEach(([f, d]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0.001, t);
        g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + d);
        o.connect(g); g.connect(ac.destination);
        o.start(t); o.stop(t + d + 0.02);
        t += d * 0.8;
      });
    } catch (e) { /* audio not available */ }
  }

  const soundBtn = document.createElement('button');
  soundBtn.id = 'soundBtn'; soundBtn.type = 'button';
  const paintSound = () => { soundBtn.textContent = soundOn ? '🔊' : '🔇'; soundBtn.setAttribute('aria-label', soundOn ? 'Sound on' : 'Sound off'); };
  paintSound();
  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn; paintSound();
    try { localStorage.setItem('astro-sound', soundOn ? 'on' : 'off'); } catch (e) { /* ignore */ }
    if (soundOn) tone([[660, 0.1], [880, 0.15]]);
  });
  document.body.appendChild(soundBtn);

  /* ================= click effects ================= */
  const layer = document.createElement('div');
  layer.id = 'fxLayer'; layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  function burst(x, y, list, n, spread) {
    if (reduce) return;
    for (let k = 0; k < n; k++) {
      const s = document.createElement('span');
      const a = Math.random() * Math.PI * 2, d = spread * (0.4 + Math.random() * 0.6);
      s.className = 'fx';
      s.textContent = list[rnd(list.length)];
      s.style.left = x + 'px'; s.style.top = y + 'px';
      s.style.fontSize = (14 + Math.random() * 18) + 'px';
      s.style.setProperty('--dx', Math.cos(a) * d + 'px');
      s.style.setProperty('--dy', Math.sin(a) * d - 20 + 'px');
      s.style.setProperty('--r', (Math.random() * 360 - 180) + 'deg');
      layer.appendChild(s);
      setTimeout(() => s.remove(), 900);
    }
  }
  function toast(x, y, text) {
    if (reduce) return;
    const t = document.createElement('div');
    t.className = 'fx-toast'; t.textContent = text;
    t.style.left = x + 'px'; t.style.top = y + 'px';
    layer.appendChild(t);
    setTimeout(() => t.remove(), 1200);
  }
  const center = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

  const PRAISE = ['Awesome! 🚀', 'Great job! ⭐', 'Super! 🌟', 'Space star! 🎉', 'Brilliant! ✨', 'You got it! 🏅'];
  function cheer(el) {
    const [x, y] = center(el);
    burst(x, y, ['⭐', '🌟', '🎉', '✨', '🚀', '💫'], 22, 140);
    toast(x, y - 10, PRAISE[rnd(PRAISE.length)]);
    tone([[523, 0.12], [659, 0.12], [784, 0.22]]);
  }
  function oops(el) {
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 500);
    tone([[220, 0.15], [180, 0.22]], 'triangle');
  }

  /* every click or tap sparkles */
  document.addEventListener('pointerdown', e => {
    if (e.target.closest('input,textarea,#soundBtn')) return;
    burst(e.clientX, e.clientY, ['✨', '⭐', '💫', '🌟'], 6, 60);
  });

  /* ================= scene builder ================= */
  function makeScene(sc, small) {
    const el = document.createElement('div');
    el.className = 'scene' + (small ? ' small' : '');
    el.style.setProperty('--g', GRADS[hash(sc.key) % GRADS.length]);
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', sc.cap);

    const art = document.createElement('span');
    art.className = 's-art';
    sc.art.forEach(e => { const i = document.createElement('i'); i.textContent = e; art.appendChild(i); });
    const cap = document.createElement('span');
    cap.className = 's-cap'; cap.textContent = sc.cap;
    el.append(art, cap);

    if (USE_PHOTOS) {
      const img = new Image();
      img.alt = ''; img.loading = 'lazy';
      img.onload = () => el.classList.add('photo');
      img.onerror = () => img.remove();
      img.src = `images/${sc.key}.${PHOTO_EXT}`;
      el.prepend(img);
    }

    el.addEventListener('click', e => {
      el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
      burst(e.clientX, e.clientY, [...sc.art, '⭐', '✨'], 12, 110);
      tone([[440, 0.08], [660, 0.1], [880, 0.14]]);
    });
    return el;
  }

  /* ================= decorate the page ================= */
  function decorateModal() {
    const body = $('#modalBody');
    if (!body || body.querySelector('.scene')) return;
    const h3 = body.querySelector('h3');
    if (!h3) return;
    const t = h3.textContent.trim();
    const f = findStep(t);
    if (f) return h3.before(makeScene(stepScene(f.m, f.i)));
    if (typeof MODULES !== 'undefined') {
      const mod = MODULES.find(m => t.includes(m.title));
      if (mod) {
        const d = MOD_DATA[mod.id] || [[mod.icon, '🌟'], mod.title];
        return h3.after(makeScene({ key: 'mod-' + mod.id, art: d[0], cap: d[1] }));
      }
    }
    if (/Mission report/i.test(t)) h3.after(makeScene({ key: 'report', art: ['🏅', '🎉', '🚀'], cap: 'Mission report' }));
  }

  function decorateGames() {
    const area = $('#gArea');
    if (!area) return;

    /* little pictures on the "put in order" buttons */
    area.querySelectorAll('.g-order .opt:not([data-pic])').forEach(b => {
      const txt = b.textContent;
      const planet = Object.keys(PLANET_PIC).find(p => txt.includes(p));
      const launch = LAUNCH_PIC.find(l => l[0].test(txt));
      const pic = planet ? PLANET_PIC[planet] : launch ? launch[1] : '';
      if (pic) b.dataset.pic = pic;
    });

    if (area.querySelector('.scene')) return;
    const h3 = area.querySelector('h3');
    if (h3) {
      const t = h3.textContent.trim();
      if (/Great job/i.test(t)) return h3.after(makeScene({ key: 'win', art: ['🏅', '🎉', '🚀'], cap: 'Great job!' }, true));
      if (/Good try/i.test(t)) return h3.after(makeScene({ key: 'try', art: ['🛰️', '💪'], cap: 'Try again!' }, true));
      const f = findStep(t);
      return h3.before(makeScene(f ? stepScene(f.m, f.i) : kwScene(t), true));
    }
    /* Word Scramble: picture clue above the scrambled letters */
    const big = area.querySelector('.g-big');
    if (big && !$('#gQ', area) && $('#gIn', area)) {
      const sc = SCRAMBLE[[...big.textContent.trim()].sort().join('')];
      if (sc) big.before(makeScene(sc, true));
    }
  }

  function decorateView() {
    /* home page mission cards */
    document.querySelectorAll('#view .mission .pic:not([data-vis])').forEach(p => {
      p.dataset.vis = '1';
      const icon = p.textContent.trim();
      const art = icon === '🌙' ? ['🌙', '🧑‍🚀', '🪨'] : [icon, '🚨', '🧑‍🚀'];
      p.classList.add('pic-anim');
      p.style.fontSize = '3rem'; p.style.gap = '8px'; p.style.gridAutoFlow = 'column'; p.style.cursor = 'pointer';
      p.textContent = '';
      art.forEach(e => { const i = document.createElement('i'); i.textContent = e; p.appendChild(i); });
    });

    /* Outpost Survival: emergencies and destinations */
    document.querySelectorAll('#view .evt:not([data-vis])').forEach(ev => {
      ev.dataset.vis = '1';
      const b = ev.querySelector('b');
      const sc = b && pickScene(EVENT_PIC, b.textContent);
      if (sc) b.after(makeScene(sc, true));
    });
    document.querySelectorAll('#view .site:not([data-vis])').forEach(s => {
      s.dataset.vis = '1';
      const h = s.querySelector('h3');
      const sc = h && pickScene(SITE_PIC, h.textContent);
      if (sc) h.after(makeScene(sc, true));
    });
  }

  /* celebrate right answers, shake wrong ones */
  const state = new WeakMap();
  function checkAnswers() {
    document.querySelectorAll('.opt, .g-cell').forEach(el => {
      const st = el.classList.contains('bad') ? 'bad' : (el.classList.contains('good') || el.classList.contains('ok')) ? 'good' : '';
      if (state.get(el) === st) return;
      state.set(el, st);
      if (st === 'bad') oops(el);
      else if (st === 'good' && !document.querySelector('.opt.bad')) cheer(el);   // green after a wrong pick is just the answer reveal
    });
  }

  let queued = false;
  function run() {
    queued = false;
    try { decorateModal(); decorateGames(); decorateView(); checkAnswers(); }
    catch (e) { console.error('visuals.js:', e); }
  }
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(run); } };

  ['#view', '#modalBody'].forEach(sel => {
    const el = $(sel);
    if (el) new MutationObserver(schedule).observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  });
  schedule();
})();
