/* sync.js - saves your progress to the game database (data/astro.db) and shows the live leaderboard.
   If the server or database is not running, everything keeps working with browser-only saves. */
(() => {
  const ID_KEY = 'astro-player-id', TRAINER = 'astronaut-trainer-v1', GAMES = 'astro-games-v1';
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const readJson = k => { try { return JSON.parse(get(k) || 'null'); } catch (e) { return null; } };
  const rawSet = Storage.prototype.setItem;                       // original setItem (does not trigger a save)
  const set = (k, v) => { try { rawSet.call(localStorage, k, v); } catch (e) { /* ignore */ } };
  const uuid = () => (window.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); });

  /* every browser gets a private random save code the first time */
  let id = get(ID_KEY);
  if (!UUID.test(id || '')) { id = uuid(); set(ID_KEY, id); }
  window.astroPlayerId = id;

  async function api(url, opt) {
    const r = await fetch(url, { ...opt, signal: AbortSignal.timeout(8000) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Request failed');
    return d;
  }

  /* ---- save to the database a moment after the game saves to the browser ---- */
  let timer = null;
  async function push() {
    clearTimeout(timer); timer = null;
    const t = readJson(TRAINER);
    if (!t) return;
    try {
      await api('/api/player', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: t.name, xp: t.xp,
          data: { trainer: { modules: t.modules || {}, best: t.best || {}, outpost: t.outpost || 0 }, games: readJson(GAMES) || {} } })
      });
    } catch (e) { /* no server or database: progress stays in this browser */ }
  }
  Storage.prototype.setItem = function (k, v) {
    rawSet.call(this, k, v);
    if (this === window.localStorage && (k === TRAINER || k === GAMES)) { clearTimeout(timer); timer = setTimeout(push, 1500); }
  };

  /* ---- put a database save into this browser ---- */
  function apply(d) {
    const tr = (d.data && d.data.trainer) || {};
    set(TRAINER, JSON.stringify({ name: d.name, xp: d.xp, modules: tr.modules || {}, best: tr.best || {}, outpost: tr.outpost || 0 }));
    if (d.data && d.data.games) set(GAMES, JSON.stringify(d.data.games));
  }

  /* on start: if the database has more progress than this browser, load it (one reload) */
  async function restore() {
    try { if (sessionStorage.getItem('astro-restored')) return; } catch (e) { /* ignore */ }
    try {
      const d = await api('/api/player/' + id);
      if (!d.found) return push();
      const t = readJson(TRAINER);
      if (d.xp > (t ? t.xp : 0)) {
        apply(d);
        try { sessionStorage.setItem('astro-restored', '1'); } catch (e) { /* ignore */ }
        location.reload();
      } else push();
    } catch (e) { /* no server or database */ }
  }
  restore();

  /* ---- Settings: load a save code from another device ---- */
  document.addEventListener('click', async e => {
    if (!e.target.closest('#loadCode')) return;
    const msg = document.getElementById('codeMsg');
    const code = (document.getElementById('codeIn').value || '').trim().toLowerCase();
    if (!UUID.test(code)) { msg.textContent = 'That does not look like a save code.'; return; }
    try {
      const d = await api('/api/player/' + code);
      if (!d.found) { msg.textContent = 'No save found for that code.'; return; }
      set(ID_KEY, code); apply(d); location.reload();
    } catch (err) { msg.textContent = 'Could not reach the game server.'; }
  });

  /* ---- live leaderboard ---- */
  window.loadBoard = async () => {
    await push();
    try {
      const d = await api('/api/leaderboard?id=' + encodeURIComponent(id));
      const box = document.getElementById('lbList');
      if (!box || !d.rows.length) return;
      let rows = d.rows.map(r => ({ name: r.name, xp: r.xp, me: r.me }));
      if (rows.length < 5 && typeof RIVALS !== 'undefined') rows = rows.concat(RIVALS.map(r => ({ ...r, bot: true })));
      rows.sort((a, b) => b.xp - a.xp);
      rows = rows.slice(0, 10);
      if (d.me && !rows.some(r => r.me)) rows.push({ name: d.me.name, xp: d.me.xp, me: true, rank: d.me.rank });
      box.innerHTML = rows.map((r, i) => `
        <div class="card item ${r.me ? 'me' : ''}">
          <span class="rank">${r.rank || i + 1}</span><span class="ic">${r.me ? '🧑‍🚀' : r.bot ? '🤖' : '👩‍🚀'}</span>
          <div class="grow"><b>${esc(r.name)}</b></div><b>${Number(r.xp)} XP</b>
        </div>`).join('');
      const note = document.getElementById('lbNote');
      if (note) note.textContent = 'Live leaderboard from the game database. 🤖 are practice rivals.';
    } catch (e) { /* keep the offline list */ }
  };
})();
