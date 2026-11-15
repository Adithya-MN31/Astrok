(() => {
  const form = document.getElementById('askForm');
  const input = document.getElementById('askInput');
  const log = document.getElementById('log');
  const chips = document.querySelector('.chips');
  const sendBtn = form.querySelector('button[type=submit]');
  const history = [];
  let busy = false;

  function addMsg(text, cls) {
    const p = document.createElement('p');
    p.className = cls;
    p.textContent = text;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
    return p;
  }

  function addSources(sources) {
    if (!sources || !sources.length) return;
    const box = document.createElement('div');
    box.className = 'astro-sources';
    box.innerHTML = '<strong>Sources</strong>';
    sources.forEach(s => {
      const a = document.createElement('a');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = s.title || s.url;
      box.appendChild(a);
    });
    log.appendChild(box);
    log.scrollTop = log.scrollHeight;
  }

  /* Quick offline answer from missions.js */
  function factFor(q) {
    q = q.toLowerCase();
    const facts = typeof ASTRO_FACTS !== 'undefined' ? ASTRO_FACTS : [];
    const hit = facts.find(f => f.k.some(k => q.includes(k)));
    return hit ? hit.a : '';
  }

  /* Questions that script.js already answers using the current mission or your XP */
  function isLocal(q) {
    q = q.toLowerCase();
    return /\bhint\b/.test(q)
      || /my (progress|xp|level|score)/.test(q)
      || /(show|check).{0,12}(progress|xp|level|score)/.test(q)
      || /(explain|describe).{0,10}(this|the|my) (current )?(mission|game)/.test(q);
  }

  function nasaType(q) {
    q = q.toLowerCase();
    const hasPic = /(photo|picture|image|pic)/.test(q);
    if (q.includes('mars') && (hasPic || q.includes('rover'))) return 'mars';
    if (q.includes('rover') || q.includes('curiosity')) return 'mars';
    if (q.includes('apod') || q.includes('picture of the day') || (q.includes('nasa') && hasPic)) return 'apod';
    if (q.includes('asteroid')) return 'asteroids';
    if (q.includes('space weather') || q.includes('solar flare')) return 'weather';
    return null;
  }

  function nasaUrl(type) {
    if (type === 'mars') return '/api/nasa/mars';
    if (type === 'weather') return '/api/nasa/weather';
    return '/api/nasa?type=' + type;
  }

  function friendly(msg, question, isNasa) {
    const m = String(msg).toLowerCase();
    let text;
    if (isNasa) text = 'NASA data problem: ' + msg;
    else if (m.includes('resting')) text = msg;
    else if (m.includes('quota') || m.includes('429')) text = 'I have used up my free AI questions for now. Please try again in a minute.';
    else if (m.includes('high demand') || m.includes('overloaded') || m.includes('503')) text = 'The AI service is very busy right now. Please try again in a minute.';
    else if (m.includes('timeout') || m.includes('timed out') || m.includes('took too long')) text = 'The AI took too long to answer. Please try again.';
    else if (m.includes('api key')) text = 'My AI key is not set up correctly. The developer needs to check the server settings.';
    else text = 'I could not reach my AI brain: ' + msg;

    const fact = isNasa ? '' : factFor(question);
    return fact ? `${text} Meanwhile: ${fact}` : text;
  }

  async function ask(question) {
    question = question.trim();
    if (!question || busy) return;
    busy = true;
    sendBtn.disabled = true;
    addMsg(question, 'u');
    history.push({ role: 'user', text: question });

    const typing = addMsg('Astro is thinking…', 'a typing');
    const slow = setTimeout(() => { typing.textContent = 'Still thinking… the AI is a little slow right now.'; }, 8000);
    const nt = nasaType(question);

    try {
      const r = nt
        ? await fetch(nasaUrl(nt), { signal: AbortSignal.timeout(60000) })
        : await fetch('/api/chat', {
            method: 'POST',
            signal: AbortSignal.timeout(60000),
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: history })
          });

      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Request failed');

      typing.remove();
      addMsg(data.text, 'a');
      addSources(data.sources);
      history.push({ role: 'model', text: data.text });
    } catch (err) {
      console.error('Astro error:', err);
      typing.remove();
      history.pop();                       // don't send failed turns to the AI next time
      addMsg(friendly(err.message, question, !!nt), 'a');
    } finally {
      clearTimeout(slow);
      busy = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  /* Typed questions: AI handles them, except mission/progress ones that script.js answers */
  form.addEventListener('submit', e => {
    const q = input.value.trim();
    if (!q || isLocal(q)) return;          // let script.js handle it
    e.preventDefault();
    e.stopImmediatePropagation();
    input.value = '';
    ask(q);
  }, true);

  /* Quick buttons: same rule */
  chips.addEventListener('click', e => {
    const b = e.target.closest('button[data-say]');
    if (!b || isLocal(b.dataset.say)) return;
    e.stopPropagation();
    ask(b.dataset.say);
  }, true);

  const clearBtn = document.getElementById('clearChat');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      history.length = 0;
      log.innerHTML = '';
    });
  }
})();