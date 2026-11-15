(() => {
  const view = document.getElementById('view');
  const nav = document.getElementById('nav');

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = u => (/^https?:\/\//i.test(u) ? esc(u) : '');
  const num = n => Number(n).toLocaleString('en-US');

  /* page styles (kept here so style.css needs no change) */
  const style = document.createElement('style');
  style.textContent = `
    .nasa-grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));margin-top:14px}
    .nasa-card{padding:16px;overflow:hidden}
    .nasa-card.wide{grid-column:1/-1}
    .nasa-card h3{font-size:1.15rem;margin:2px 0 4px}
    .nasa-tag{color:#6fc0ff;font-weight:700;font-size:.8rem}
    .nasa-img{width:100%;max-height:440px;object-fit:cover;border-radius:12px;margin:10px 0;background:#04102e;display:block}
    .nasa-note{color:var(--muted);font-size:.85rem;line-height:1.55;margin-top:8px}
    .nasa-big{font-size:2.6rem;font-weight:800;color:var(--gold);line-height:1.1}
    .nasa-wrap{overflow-x:auto}
    .nasa-table{width:100%;border-collapse:collapse;font-size:.85rem;margin-top:8px}
    .nasa-table th,.nasa-table td{text-align:left;padding:6px 8px;border-bottom:1px solid #1d3f8f;white-space:nowrap}
    .nasa-table th{color:var(--muted);font-weight:600}
    .nasa-hz{color:var(--red);font-weight:700}
    .nasa-search{display:flex;gap:8px;margin:10px 0}
    .nasa-results{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));margin-top:8px}
    .nasa-results a{display:block;color:var(--text);text-decoration:none;font-size:.78rem}
    .nasa-results img{width:100%;height:110px;object-fit:cover;border-radius:10px;display:block;margin-bottom:4px;background:#04102e}
    .nasa-muted{color:var(--muted)}
    .nasa-card details{margin-top:8px;color:var(--muted);line-height:1.55;font-size:.9rem}
    .nasa-card summary{cursor:pointer;color:#9ed5ff}
    .nasa-foot{color:var(--muted);font-size:.78rem;margin:14px 0 4px}
  `;
  document.head.appendChild(style);

  function pageHTML() {
    return `
      <div id="nasaPage">
        <h2>🛰️ NASA Live</h2>
        <p class="sub">Real space data straight from NASA. It refreshes every 15 minutes.</p>
        <div class="nasa-grid">
          <section class="card nasa-card wide" id="cApod"><p class="nasa-muted">Loading the picture of the day…</p></section>
          <section class="card nasa-card" id="cAst"><p class="nasa-muted">Loading asteroids…</p></section>
          <section class="card nasa-card" id="cWx"><p class="nasa-muted">Loading space weather…</p></section>
          <section class="card nasa-card wide" id="cMars"><p class="nasa-muted">Loading a Mars photo…</p></section>
          <section class="card nasa-card wide">
            <span class="nasa-tag">🔎 Explore</span>
            <h3>Search NASA's image library</h3>
            <form class="nasa-search" id="nasaSearch">
              <input type="text" id="nasaQ" placeholder="Try: Jupiter, Apollo, black hole…" maxlength="60" aria-label="Search NASA images">
              <button class="btn" type="submit">Search</button>
            </form>
            <div id="nasaResults" class="nasa-muted"></div>
          </section>
        </div>
        <p class="nasa-foot" id="nasaFoot"></p>
      </div>`;
  }

  const unavailable = what =>
    `<p class="nasa-muted">${what} is not available right now.</p>
     <button class="btn ghost" id="nasaRetry" type="button">Try again</button>`;

  function apodHTML(a) {
    if (!a) return `<span class="nasa-tag">🌌 Picture of the day</span>${unavailable('The picture of the day')}`;
    const isImg = a.mediaType === 'image' && safeUrl(a.url);
    const media = isImg
      ? `<a href="${safeUrl(a.hdurl || a.url)}" target="_blank" rel="noopener noreferrer"><img class="nasa-img" src="${safeUrl(a.url)}" alt="${esc(a.title)}" loading="lazy"></a>`
      : `<p style="margin:10px 0"><a class="btn" href="${safeUrl(a.url)}" target="_blank" rel="noopener noreferrer">▶ Open today's video</a></p>`;
    const text = String(a.explanation || '');
    const body = text.length > 380
      ? `<p class="nasa-note">${esc(text.slice(0, 380))}…</p><details><summary>Read the full story</summary><p>${esc(text)}</p></details>`
      : `<p class="nasa-note">${esc(text)}</p>`;
    const note = a.source === 'library' ? ' (from NASA\'s image library)' : '';
    return `<span class="nasa-tag">🌌 Picture of the day${esc(note)}</span>
      <h3>${esc(a.title)}</h3><small class="nasa-muted">${esc(a.date)} · Credit: ${esc(a.credit)}</small>
      ${media}${body}`;
  }

  function astHTML(a) {
    if (!a) return `<span class="nasa-tag">☄️ Asteroids today</span>${unavailable('Asteroid data')}`;
    const rows = a.items.map(x => `
      <tr><td>${esc(x.name)}</td><td>${num(x.sizeM)} m</td><td>${num(x.kmh)} km/h</td>
      <td>${x.lunar.toFixed(1)} LD</td><td>${x.hazardous ? '<span class="nasa-hz">Watch list</span>' : 'No'}</td></tr>`).join('');
    return `<span class="nasa-tag">☄️ Asteroids today</span>
      <div class="nasa-big">${a.count}</div>
      <p class="nasa-muted">near-Earth asteroids pass by on ${esc(a.date)}. ${a.hazardous} on NASA's watch list.</p>
      ${rows ? `<div class="nasa-wrap"><table class="nasa-table">
        <tr><th>Name</th><th>Size</th><th>Speed</th><th>Miss distance</th><th>Watch list</th></tr>${rows}</table></div>` : ''}
      <p class="nasa-note">1 LD (lunar distance) is the distance from Earth to the Moon. "Watch list" means big and fairly close, so NASA tracks it, not that it will hit us.</p>`;
  }

  function wxHTML(w) {
    if (!w) return `<span class="nasa-tag">☀️ Space weather</span>${unavailable('Space weather')}`;
    return `<span class="nasa-tag">☀️ Space weather</span>
      <div class="nasa-big">${w.count}</div>
      <p class="nasa-muted">solar flares in the last 7 days${w.strongest ? `. Strongest: class <b>${esc(w.strongest)}</b>` : ''}.</p>
      ${w.latestDate ? `<p class="nasa-muted">Latest: class ${esc(w.latestClass)} on ${esc(w.latestDate)}.</p>` : '<p class="nasa-muted">The Sun is calm.</p>'}
      <p class="nasa-note">A solar flare is a burst of energy from the Sun. Classes go A, B, C, M, X, and X is the strongest. Big flares can disturb radios and satellites, and astronauts must shelter from the radiation.</p>`;
  }

  function marsHTML(m) {
    if (!m) return `<span class="nasa-tag">🔴 Mars</span>${unavailable('The Mars photo')}`;
    const cap = m.source === 'rover'
      ? `${esc(m.rover)} rover · ${esc(m.camera)} · taken ${esc(m.earthDate)} (Mars day ${esc(m.sol)})`
      : `${esc(m.title)} · from NASA's image library`;
    return `<span class="nasa-tag">🔴 Latest from Mars</span>
      <img class="nasa-img" src="${safeUrl(m.img)}" alt="Photo from Mars" loading="lazy">
      <p class="nasa-muted">${cap}</p>`;
  }

  async function load() {
    const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
    try {
      const r = await fetch('/api/nasa/dashboard', { signal: AbortSignal.timeout(45000) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Request failed');
      if (!document.getElementById('nasaPage')) return;      // user already left this page
      set('cApod', apodHTML(d.apod));
      set('cAst', astHTML(d.asteroids));
      set('cWx', wxHTML(d.weather));
      set('cMars', marsHTML(d.mars));
      const foot = document.getElementById('nasaFoot');
      if (foot) foot.textContent = 'Data: NASA Open APIs and the NASA Image and Video Library. Updated ' + new Date(d.updated).toLocaleTimeString() + '.';
    } catch (err) {
      console.error('NASA page error:', err);
      if (!document.getElementById('nasaPage')) return;
      set('cApod', apodHTML(null)); set('cAst', astHTML(null)); set('cWx', wxHTML(null)); set('cMars', marsHTML(null));
    }
  }

  async function search(q) {
    const box = document.getElementById('nasaResults');
    if (!box) return;
    box.textContent = 'Searching…';
    try {
      const r = await fetch('/api/nasa/search?q=' + encodeURIComponent(q), { signal: AbortSignal.timeout(30000) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Search failed');
      if (!document.getElementById('nasaResults')) return;
      box.innerHTML = d.items.length
        ? `<div class="nasa-results">${d.items.map(i => `
            <a href="https://images.nasa.gov/details/${encodeURIComponent(i.id)}" target="_blank" rel="noopener noreferrer">
              <img src="${safeUrl(i.img)}" alt="${esc(i.title)}" loading="lazy">${esc(i.title)}</a>`).join('')}</div>`
        : 'No images found. Try another word.';
    } catch (err) {
      box.textContent = 'Search problem: ' + err.message;
    }
  }

  function showNasa() {
    document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('active', b.dataset.view === 'nasa'));
    view.innerHTML = pageHTML();
    load();
  }

  /* Open the page from the side menu (runs before script.js's own click handler) */
  nav.addEventListener('click', e => {
    const b = e.target.closest('button[data-view]');
    if (!b || b.dataset.view !== 'nasa') return;
    e.stopPropagation();
    showNasa();
  }, true);

  /* Search form and retry buttons inside the page */
  view.addEventListener('submit', e => {
    if (e.target.id !== 'nasaSearch') return;
    e.preventDefault();
    const q = document.getElementById('nasaQ').value.trim();
    if (q.length >= 2) search(q);
  });
  view.addEventListener('click', e => {
    if (e.target.id === 'nasaRetry') showNasa();
  });
})();