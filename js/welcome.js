/* welcome.js - registration with just an astronaut name.
   - First visit: a full-screen "Welcome" box asks for a name. No password, no email.
   - The same name on any device brings the saved progress back (stored in the game database).
   - After that, the site welcomes the child by name (banner + voice on the first click).
   - Settings has a "Switch astronaut" button that returns to this screen. */
(() => {
  'use strict';

  const ID_KEY = 'astro-player-id', USER_KEY = 'astro-user', TRAINER = 'astronaut-trainer-v1', GAMES = 'astro-games-v1';
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const NAME_OK = /^[\p{L}\p{N} _-]{2,24}$/u;

  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } };
  const del = k => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } };
  const readJson = k => { try { return JSON.parse(get(k) || 'null'); } catch (e) { return null; } };
  const ss = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
               set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } },
               del: k => { try { sessionStorage.removeItem(k); } catch (e) { /* ignore */ } } };
  const uuid = () => (window.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); });
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- styles ---------- */
  const style = document.createElement('style');
  style.textContent = `
    #welcome{position:fixed;inset:0;z-index:200;display:grid;place-items:center;padding:16px;
      background:radial-gradient(ellipse at 30% 0%,#12307a 0%,transparent 60%),rgba(2,6,20,.96)}
    .w-card{width:min(460px,100%);padding:28px 24px;text-align:center;border:1px solid var(--line);border-radius:22px;
      background:linear-gradient(180deg,#0d2656,#06122e);box-shadow:0 0 40px var(--glow)}
    .w-ic{font-size:4.5rem;filter:drop-shadow(0 0 20px var(--glow));animation:wbob 2.6s ease-in-out infinite}
    .w-card h2{font-size:1.5rem;margin:6px 0 8px}
    .w-card p{color:var(--muted);line-height:1.5;margin-bottom:14px}
    .w-card input{text-align:center;font-size:1.1rem;margin-bottom:14px}
    .w-card .btn{width:100%;font-size:1.05rem}
    .w-msg{min-height:1.3em;margin:12px 0 0!important;color:var(--gold)!important;font-weight:700}
    #welcomeBanner{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:150;padding:12px 24px;border-radius:99px;
      border:1px solid var(--gold);background:#0d2656;box-shadow:0 0 26px var(--glow);font-weight:800;font-size:1.1rem;
      animation:wbanner 4.5s ease forwards;pointer-events:none;white-space:nowrap;max-width:94vw;overflow:hidden;text-overflow:ellipsis}
    @keyframes wbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
    @keyframes wbanner{0%{opacity:0;transform:translate(-50%,-30px)}10%,80%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,-20px)}}
    @media(prefers-reduced-motion:reduce){.w-ic,#welcomeBanner{animation:none}}
  `;
  document.head.appendChild(style);

  /* ---------- welcome banner and spoken greeting ---------- */
  function greet(text) {
    const b = document.createElement('div');
    b.id = 'welcomeBanner'; b.setAttribute('role', 'status');
    b.textContent = '👩‍🚀 ' + text;
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 4600);
    /* browsers only allow speech after a click, so the voice greets on the first click */
    document.addEventListener('pointerdown', () => { if (window.astroSpeak) window.astroSpeak(text); }, { once: true });
  }

  /* ---------- already registered? ---------- */
  const user = get(USER_KEY);
  if (user) {
    const fromSignup = ss.get('astro-greet');
    ss.del('astro-greet');
    if (fromSignup) { ss.set('astro-greeted', '1'); greet(fromSignup); }
    else if (!ss.get('astro-greeted')) { ss.set('astro-greeted', '1'); greet(`Welcome back, ${user}!`); }
  } else {
    showRegistration();
  }

  /* ---------- registration screen ---------- */
  function showRegistration() {
    const box = document.createElement('div');
    box.id = 'welcome';
    box.innerHTML = `
      <form class="w-card" id="wForm" role="dialog" aria-modal="true" aria-labelledby="wTitle" autocomplete="off">
        <div class="w-ic" aria-hidden="true">🧑‍🚀</div>
        <h2 id="wTitle">Welcome to Junior Astronaut Mission Trainer!</h2>
        <p>Type your astronaut name to begin. Next time, type the same name to get your progress back, on any device.</p>
        <input type="text" id="wName" maxlength="24" placeholder="Your astronaut name" aria-label="Your astronaut name">
        <button class="btn" type="submit" id="wGo">Start my mission ➜</button>
        <p class="w-msg" id="wMsg" role="alert"></p>
      </form>`;
    document.body.appendChild(box);
    const input = document.getElementById('wName'), msg = document.getElementById('wMsg'), go = document.getElementById('wGo');
    input.focus();

    const fail = text => { msg.textContent = text; go.disabled = false; input.focus(); };

    document.getElementById('wForm').addEventListener('submit', async e => {
      e.preventDefault();
      const name = input.value.replace(/\s+/g, ' ').trim();
      if (!NAME_OK.test(name)) return fail('Use 2 to 24 letters or numbers for your name.');
      go.disabled = true;
      msg.textContent = 'Getting your space suit ready…';

      let d = null;
      try {
        const r = await fetch('/api/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }), signal: AbortSignal.timeout(8000)
        });
        d = await r.json();
        if (r.status === 400) return fail(d.error || 'Please try another name.');
        if (!r.ok) d = null;
      } catch (err) { d = null; }                      // no server or database: the name is saved in this browser only

      const id = d && d.id ? d.id : (UUID.test(get(ID_KEY) || '') ? get(ID_KEY) : uuid());
      set(ID_KEY, id);

      if (d && d.found) {                              // returning astronaut: bring the saved progress back
        const tr = (d.data && d.data.trainer) || {};
        set(TRAINER, JSON.stringify({ name: d.name, xp: d.xp, modules: tr.modules || {}, best: tr.best || {}, outpost: tr.outpost || 0 }));
        if (d.data && d.data.games) set(GAMES, JSON.stringify(d.data.games));
      } else {                                         // new astronaut: keep any progress from this browser
        const t = readJson(TRAINER) || {};
        set(TRAINER, JSON.stringify({ xp: 120, modules: {}, best: {}, ...t, name }));
      }
      set(USER_KEY, d && d.found ? d.name : name);
      ss.set('astro-greet', d && d.found ? `Welcome back, ${d.name}!` : `Welcome, ${name}!`);
      location.reload();
    });
  }

  /* ---------- Settings: switch astronaut ---------- */
  document.addEventListener('click', async e => {
    if (!e.target.closest('#logout')) return;
    const t = readJson(TRAINER), id = get(ID_KEY);
    if (t && UUID.test(id || '')) {                     // save the latest progress first
      try {
        await fetch('/api/player', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(4000),
          body: JSON.stringify({ id, name: t.name, xp: t.xp,
            data: { trainer: { modules: t.modules || {}, best: t.best || {}, outpost: t.outpost || 0 }, games: readJson(GAMES) || {} } })
        });
      } catch (err) { /* offline: keep going */ }
    }
    [USER_KEY, ID_KEY, TRAINER, GAMES].forEach(del);
    try { sessionStorage.clear(); } catch (err) { /* ignore */ }
    location.reload();
  });
})();
