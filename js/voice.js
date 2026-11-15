/* voice.js - reads the game aloud with the browser's built-in voice (free, no server, no API key).
   - Questions, answer choices, lessons, explanations, game messages and Astro's replies are read automatically.
   - Click ANY sentence (paragraph, list item, heading, caption) to hear it again.
   - The 🗣️ button at the bottom-left turns the voice on or off. */
(() => {
  'use strict';

  const synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;   // browser has no voice support

  const $ = (s, r = document) => r.querySelector(s);
  const done = new WeakSet();            // elements already read aloud
  const lastText = new WeakMap();        // element -> last text read (for changing messages)

  let on = true;
  try { on = localStorage.getItem('astro-voice') !== 'off'; } catch (e) { /* ignore */ }

  /* ---------- choose a friendly English voice ---------- */
  let voice = null;
  const pickVoice = () => {
    const en = synth.getVoices().filter(v => /^en/i.test(v.lang));
    voice = en.find(v => /Google US English|Aria|Jenny|Samantha|Zira|Natural/i.test(v.name))
         || en.find(v => /en-US/i.test(v.lang)) || en[0] || null;
  };
  pickVoice();
  synth.onvoiceschanged = pickVoice;

  /* ---------- make text easy to say ---------- */
  const clean = t => String(t || '')
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '')
    .replace(/←\s*→/g, ' left and right arrow ')
    .replace(/[←→↑↓]/g, ' arrow ')
    .replace(/×/g, ' times ')
    .replace(/−/g, ' minus ')
    .replace(/\bkm\/h\b/g, ' kilometers per hour')
    .replace(/\bXP\b/g, ' X P ')
    .replace(/%/g, ' percent')
    .replace(/\s+/g, ' ')
    .trim();

  const sentences = t => (clean(t).match(/[^.!?]+[.!?]*/g) || []).map(s => s.trim()).filter(s => /[a-z0-9]/i.test(s));

  /* ---------- speak ---------- */
  function say(list, interrupt = true) {
    if (!on) return;
    const parts = list.flatMap(sentences);
    if (!parts.length) return;
    if (interrupt) synth.cancel();
    setTimeout(() => {
      parts.forEach(s => {
        const u = new SpeechSynthesisUtterance(s);   // one sentence at a time keeps long texts from cutting off
        u.lang = 'en-US'; u.rate = 0.95; u.pitch = 1.1;
        if (voice) u.voice = voice;
        synth.speak(u);
      });
    }, interrupt ? 60 : 0);
  }

  window.astroSpeak = t => say([t]);   // used by welcome.js for the spoken greeting

  /* ---------- on/off button ---------- */
  const style = document.createElement('style');
  style.textContent = `
    #voiceBtn{position:fixed;left:66px;bottom:14px;z-index:70;width:44px;height:44px;border-radius:50%;font-size:1.3rem;
      border:1px solid var(--line);background:#0a2257;box-shadow:0 0 14px var(--glow)}
    #voiceBtn:hover{background:#14388a}
    #voiceBtn.off{opacity:.6}
    .hear:hover{cursor:pointer}
    #view p:hover,#view li:hover,#modalBody p:hover,#modalBody li:hover,#modalBody h3:hover,#log p:hover{text-decoration:underline dotted #6fc0ff;text-underline-offset:3px}
  `;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'voiceBtn'; btn.type = 'button';
  const paint = () => {
    btn.textContent = on ? '🗣️' : '🤐';
    btn.classList.toggle('off', !on);
    btn.setAttribute('aria-label', on ? 'Voice on. Press to turn off' : 'Voice off. Press to turn on');
    btn.title = on ? 'Voice is on' : 'Voice is off';
  };
  paint();
  btn.addEventListener('click', () => {
    if (on) { synth.cancel(); on = false; } else { on = true; }
    try { localStorage.setItem('astro-voice', on ? 'on' : 'off'); } catch (e) { /* ignore */ }
    paint();
    if (on) say(['Voice is on. Click any sentence to hear it.']);
  });
  document.body.appendChild(btn);

  /* ---------- click any sentence to hear it ---------- */
  const READABLE = 'p,li,h2,h3,.why,.s-cap,small,.sub,.bubble,.nasa-note,.nasa-muted,.gl,.fc,.evt b,.grow b,summary';
  document.addEventListener('click', e => {
    if (e.target.closest('button,input,textarea,select,a,label,#voiceBtn,#soundBtn')) return;
    const scene = e.target.closest('.scene');
    if (scene) return say([scene.getAttribute('aria-label') || '']);
    const el = e.target.closest(READABLE);
    if (!el) return;
    const t = el.textContent.trim();
    if (t.length >= 3) say([t]);
  });

  /* stop talking when a page or window closes */
  $('#nav') && $('#nav').addEventListener('click', () => synth.cancel(), true);
  window.addEventListener('beforeunload', () => synth.cancel());

  /* ---------- automatic reading ---------- */
  const optionList = root => [...root.querySelectorAll('.opt')].map((o, i) => `Choice ${'ABCD'[i] || i + 1}. ${o.textContent}`);

  function readModal() {
    const body = $('#modalBody');
    if (!body) return;

    const h = body.querySelector('h3');
    if (h && !done.has(h)) {
      done.add(h);
      const list = [h.textContent];
      body.querySelectorAll('.sub').forEach(s => list.push(s.textContent));
      const opts = optionList(body);
      if (opts.length) list.push(...opts);
      else body.querySelectorAll('ul li').forEach(li => list.push(li.textContent));
      say(list);
    }
    /* the explanation after you answer */
    body.querySelectorAll('.why').forEach(w => {
      if (done.has(w)) return;
      done.add(w);
      say([w.textContent]);
    });
  }

  function readGame() {
    const a = $('#gArea');
    if (!a) return;

    const h = a.querySelector('h3');
    if (h && !done.has(h)) {
      done.add(h);
      const list = [h.textContent];
      a.querySelectorAll('.sub').forEach(s => list.push(s.textContent));
      const opts = optionList(a);
      if (opts.length) list.push(...opts);
      if (a.querySelector('.g-tf')) list.push('True or false?');
      say(list);
    } else if (!h) {
      /* games without a heading: read the instruction line once */
      const tag = a.querySelector('.g-tag');
      if (tag && !done.has(tag)) {
        done.add(tag);
        const first = tag.textContent.split('·')[0];
        if (!/^(Question|Statement|Word|Moves|Time|Round \d)/i.test(first.trim())) say([first]);
      }
    }

    a.querySelectorAll('.why').forEach(w => {
      if (done.has(w)) return;
      done.add(w);
      say([w.textContent], false);
    });

    /* short messages such as "Correct!" or "Higher!" */
    const msg = $('#gMsg', a);
    if (msg) {
      const t = msg.textContent.trim();
      if (t && lastText.get(msg) !== t) { lastText.set(msg, t); say([t]); }
    }
  }

  function readView() {
    /* Outpost Survival alerts */
    document.querySelectorAll('#view .evt').forEach(ev => {
      if (done.has(ev)) return;
      done.add(ev);
      const list = [];
      const b = ev.querySelector('b'); if (b) list.push(b.textContent);
      const p = ev.querySelector('p'); if (p) list.push(p.textContent);
      list.push(...optionList(ev));
      say(list);
    });
  }

  function readChat() {
    document.querySelectorAll('#log p.a:not(.typing)').forEach(p => {
      if (done.has(p)) return;
      done.add(p);
      say([p.textContent]);
    });
  }

  let queued = false;
  function run() {
    queued = false;
    try { readModal(); readGame(); readView(); readChat(); }
    catch (e) { console.error('voice.js:', e); }
  }
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(run); } };

  /* mark what is already on screen so the page does not start talking by itself */
  document.querySelectorAll('#log p').forEach(p => done.add(p));

  ['#view', '#modalBody', '#log'].forEach(sel => {
    const el = $(sel);
    if (el) new MutationObserver(schedule).observe(el, { childList: true, subtree: true, characterData: true });
  });

  /* closing the pop-up stops the voice */
  const modal = $('#modal');
  if (modal) new MutationObserver(() => { if (modal.hidden) synth.cancel(); }).observe(modal, { attributes: true, attributeFilter: ['hidden'] });
})();
