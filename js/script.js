/* script.js — navigation, rendering, mission runner, progress and Astro chat. */
(() => {
  'use strict';

  const KEY = 'astronaut-trainer-v1';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- state ---------- */
  const fresh = () => ({ name: 'Student Explorer', xp: 120, modules: {}, best: {} });
  let state = fresh();
  try { state = { ...fresh(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { /* storage unavailable */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } };

  const level = () => Math.floor(state.xp / XP_PER_LEVEL) + 1;
  const levelXp = () => state.xp % XP_PER_LEVEL;
  const addXp = n => { state.xp += n; save(); renderHeader(); };
  window.addTrainerXp = addXp;   // lets the Games page award bonus XP

  let current = 'home';
  let run = null; // active mission runner: { mission, i, score }

  /* ---------- header ---------- */
  function renderHeader() {
    $('#pName').textContent = state.name;
    $('#pLevel').textContent = level();
    $('#pXp').textContent = state.xp;
    $('#pBar').style.width = (levelXp() / XP_PER_LEVEL * 100) + '%';
  }

  /* ---------- views ---------- */
  const moduleCard = m => `
    <button class="mod" style="--c:${m.color}" data-module="${m.id}">
      <span class="ic">${m.icon}</span>
      <span><b>${esc(m.title)}</b>${state.modules[m.id] ? '<small>✔ Completed</small>' : ''}</span>
    </button>`;

  const views = {
    home() {
      const m = MISSIONS[0];
      return `
      <section class="hero">
        <h2>Welcome, ${esc(state.name)}!</h2>
        <p class="sub">Your journey to becoming a junior astronaut starts here.</p>
        <div class="astro" aria-hidden="true">🧑‍🚀</div>
      </section>
      <section class="card mission">
        <div class="pic" aria-hidden="true">${m.icon}</div>
        <div>
          <span class="tag">🚀 Current mission</span>
          <h3>Operation: ${esc(m.title)}</h3>
          <p>${esc(m.brief)}</p>
          <button class="btn" data-mission="${m.id}">Start mission ➜</button>
        </div>
      </section>
      <section class="card mission">
        <div class="pic" aria-hidden="true">🌙</div>
        <div>
          <span class="tag">🆕 New game</span>
          <h3>Outpost Survival</h3>
          <p>Run an outpost on the Moon, Mars or Ceres: life support, radiation shielding, power, food and slow messages from Earth. Every choice is a trade-off.</p>
          <button class="btn" data-view="outpost">Play now ➜</button>
        </div>
      </section>
      <h2 class="mod-title">🪐 Training modules</h2>
      <div class="grid">${MODULES.map(moduleCard).join('')}</div>
      <section class="card progress-card">
        <div class="row"><b>Astronaut progress</b><span class="lvl">Level ${level()}</span></div>
        <div class="bar"><i style="width:${levelXp() / XP_PER_LEVEL * 100}%"></i></div>
        <p class="sub" style="text-align:center">${levelXp()} / ${XP_PER_LEVEL} XP</p>
      </section>`;
    },

    modules() {
      return `<h2>Training modules</h2><p class="sub">Finish a module for +${MODULE_XP} XP.</p>
        <div class="grid" style="margin-top:14px">${MODULES.map(moduleCard).join('')}</div>`;
    },

    missions() {
      return `<h2>Missions</h2><p class="sub">Each correct answer earns ${STEP_XP} XP.</p>
        <div class="list">${MISSIONS.map(m => `
          <div class="card item">
            <span class="ic">${m.icon}</span>
            <div class="grow"><b>${esc(m.title)}</b><br><small>${esc(m.brief)}</small></div>
            <small>${state.best[m.id] != null ? `Best: ${state.best[m.id]}/${m.steps.length}` : 'Not tried yet'}</small>
            <button class="btn" data-mission="${m.id}">${state.best[m.id] != null ? 'Replay' : 'Start'}</button>
          </div>`).join('')}</div>`;
    },

    progress() {
      const doneM = Object.keys(state.modules).length;
      const doneMs = Object.keys(state.best).length;
      return `<h2>Your progress</h2>
        <div class="stat">
          <div class="card"><b>${level()}</b>Level</div>
          <div class="card"><b>${state.xp}</b>Total XP</div>
          <div class="card"><b>${doneM}/${MODULES.length}</b>Modules</div>
          <div class="card"><b>${doneMs}/${MISSIONS.length}</b>Missions tried</div>
        </div>
        <section class="card progress-card">
          <div class="row"><b>Next level</b><span class="lvl">${levelXp()} / ${XP_PER_LEVEL} XP</span></div>
          <div class="bar"><i style="width:${levelXp() / XP_PER_LEVEL * 100}%"></i></div>
        </section>`;
    },

    leaderboard() {
      const rows = [...RIVALS, { name: state.name, xp: state.xp, me: true }].sort((a, b) => b.xp - a.xp);
      return `<h2>Leaderboard</h2><p class="sub" id="lbNote">Practice more to climb the ranks.</p>
        <div class="list" id="lbList">${rows.map((r, i) => `
          <div class="card item ${r.me ? 'me' : ''}">
            <span class="rank">${i + 1}</span><span class="ic">${r.me ? '🧑‍🚀' : '👩‍🚀'}</span>
            <div class="grow"><b>${esc(r.name)}</b></div><b>${r.xp} XP</b>
          </div>`).join('')}</div>`;
    },

    outpost() { return outpostHTML(); },

    settings() {
      return `<h2>Settings</h2>
        <div class="card item" style="margin-top:14px;display:block">
          <b>Your astronaut name</b>
          <p class="sub" style="margin:6px 0 12px">You are signed in as <b>${esc(state.name)}</b>. Type this same name on any device to get your progress back.</p>
          <button class="btn" id="logout">Switch astronaut</button>
          <button class="btn ghost" id="reset">Reset progress</button>
        </div>`;
    }
  };

  function go(name) {
    current = name;
    document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    if (!views[name]) {
      $('#view').innerHTML = `<h2>${esc(name)}</h2><p class="sub">This page's script did not load. Make sure <b>js/${esc(name)}.js</b> exists in your js folder, then hard-refresh with Ctrl+Shift+R.</p>`;
      return;
    }
    $('#view').innerHTML = views[name]();
    if (name === 'leaderboard' && window.loadBoard) window.loadBoard();
  }

  /* ---------- modal ---------- */
  const modal = $('#modal');
  const openModal = html => { $('#modalBody').innerHTML = html; modal.hidden = false; $('#closeModal').focus(); };
  const closeModal = () => { modal.hidden = true; run = null; go(current); };

  /* ---------- training module ---------- */
  function openModule(id) {
    const m = MODULES.find(x => x.id === id);
    const done = state.modules[id];
    openModal(`
      <h3>${m.icon} ${esc(m.title)}</h3>
      <ul>${m.lesson.map(l => `<li>${esc(l)}</li>`).join('')}</ul>
      ${done ? '<p class="sub">✔ Already completed.</p>'
             : `<button class="btn" id="finishModule" data-id="${id}">Mark complete (+${MODULE_XP} XP)</button>`}`);
  }

  /* ---------- mission runner ---------- */
  function startMission(id) {
    run = { mission: MISSIONS.find(m => m.id === id), i: 0, score: 0 };
    renderStep();
  }

  function renderStep() {
    const { mission, i } = run, s = mission.steps[i];
    openModal(`
      <span class="stepno">${mission.icon} ${esc(mission.title)} — Step ${i + 1} of ${mission.steps.length}</span>
      <h3>${esc(s.q)}</h3>
      <div class="opts">${s.options.map((o, n) => `<button class="opt" data-pick="${n}">${esc(o)}</button>`).join('')}</div>
      <div id="feedback"></div>`);
  }

  function pick(n) {
    const s = run.mission.steps[run.i];
    const ok = n === s.answer;
    if (ok) run.score++;
    document.querySelectorAll('.opt').forEach((b, idx) => {
      b.disabled = true;
      if (idx === s.answer) b.classList.add('good');
      else if (idx === n) b.classList.add('bad');
    });
    const last = run.i === run.mission.steps.length - 1;
    $('#feedback').innerHTML = `
      <div class="why">${ok ? '✅ Correct! ' : '❌ Not quite. '}${esc(s.why)}</div>
      <button class="btn" id="nextStep">${last ? 'Finish mission' : 'Next step ➜'}</button>`;
    $('#nextStep').focus();
  }

  function finishMission() {
    const { mission, score } = run, total = mission.steps.length;
    const prev = state.best[mission.id] ?? 0;
    const gain = Math.max(0, score - prev) * STEP_XP;
    state.best[mission.id] = Math.max(prev, score);
    addXp(gain);
    const verdict = score === total ? 'Perfect! Mission accomplished.' : score >= total / 2 ? 'Good work, Commander. Try again for a perfect score.' : 'Mission needs another attempt. Review the training modules and try again.';
    openModal(`
      <h3>${score === total ? '🏅' : '🛰️'} Mission report</h3>
      <p class="sub">${esc(verdict)}</p>
      <div class="stat"><div class="card"><b>${score}/${total}</b>Correct</div><div class="card"><b>+${gain}</b>XP earned</div></div>
      <button class="btn" data-mission="${mission.id}">Replay</button>
      <button class="btn ghost" id="doneBtn">Back to base</button>`);
    astroSay(`Mission report: ${score} of ${total} correct, +${gain} XP.`);
  }

  /* ---------- Outpost Survival: manage a Moon or Mars outpost ---------- */
  const O = OUTPOST;
  const newGame = () => ({
    phase: 'site', site: null, day: 1, ev: null, paused: false,
    load: { bat: 0, sol: 0, ox: 0, wat: 0, food: 0, shield: 0 },
    cap: 0, power: 0, o2: 0, water: 0, food: 0, dose: 0, sci: 0, start: {},
    lv: { life: 1, farm: 0, lab: 1 }, log: [], flags: { asked: 0, late: 0 }, result: null
  });
  let g = newGame();

  const site = () => O.sites[g.site];
  const massUsed = () => O.items.reduce((s, i) => s + i.mass * g.load[i.id], 0);
  const shieldMult = () => 1 - 0.2 * g.load.shield;
  const totals = () => {
    const t = { ...O.base };
    O.items.forEach(i => { if (i.res) t[i.res] += i.amt * g.load[i.id]; });
    return t;
  };
  const lvCost = (s, l) => (g.paused && s.pause ? 0 : s.power[l]);
  const needPower = () => O.systems.reduce((n, s) => n + lvCost(s, g.lv[s.id]), 0);
  const startDay = () => { g.paused = false; g.ev = O.events.find(e => e.day[g.site] === g.day) || null; };

  const meter = (label, icon, val, max, inv) => {
    const p = Math.max(0, Math.min(100, val / max * 100));
    const bad = inv ? p > 75 : p < 25;
    return `<div class="gm ${bad ? 'low' : ''}"><span>${icon} ${label}</span><div class="bar"><i style="width:${p}%"></i></div><b>${Math.max(0, Math.round(val))}</b></div>`;
  };

  function siteHTML() {
    return `
      <h2>🚀 Outpost Survival</h2>
      <p class="sub">Run an outpost for ${O.days} days. You will juggle life support, radiation shielding, power, food and slow messages from Earth. Pick your destination.</p>
      <div class="sites">${Object.values(O.sites).map(s => `
        <div class="card site">
          <h3>${s.icon} ${s.name}</h3>
          <ul>${s.facts.map(f => `<li>${f}</li>`).join('')}</ul>
          <button class="btn" data-site="${s.id}">Choose ${s.short || s.name.split(' ')[0]}</button>
        </div>`).join('')}</div>`;
  }

  function packHTML() {
    const used = massUsed(), left = O.mass - used, t = totals();
    return `
      <h2>${site().icon} Pack the ${site().name.toLowerCase()}</h2>
      <p class="sub">${site().sunNote}</p>
      <div class="card gbox">
        <b>Launch mass: ${left} of ${O.mass} left</b>
        <div class="bar" style="margin-top:8px"><i style="width:${used / O.mass * 100}%"></i></div>
      </div>
      <p class="why">Why so tight? Rockets burn most of their fuel just lifting fuel, so every extra kilogram needs even more. Engineers fight over every gram.</p>
      <div class="list">${O.items.map(it => `
        <div class="card item">
          <span class="ic">${it.icon}</span>
          <div class="grow"><b>${it.name}</b><br><small>${it.text}. Mass ${it.mass} each.</small></div>
          <div class="qty">
            <button class="btn ghost" data-load="${it.id}" data-d="-1" aria-label="Remove ${it.name}" ${g.load[it.id] < 1 ? 'disabled' : ''}>−</button>
            <b>${g.load[it.id]}</b>
            <button class="btn ghost" data-load="${it.id}" data-d="1" aria-label="Add ${it.name}" ${g.load[it.id] >= it.max || it.mass > left ? 'disabled' : ''}>+</button>
          </div>
        </div>`).join('')}</div>
      <p class="gl">You will start with ${t.cap} power storage, ${t.o2} oxygen, ${t.water} water and ${t.food} food. The crew uses ${O.crew.o2} oxygen, ${O.crew.water} water and ${O.crew.food} food every day. Radiation limit: ${O.doseLimit}.</p>
      <button class="btn" id="launch">Launch ➜</button>`;
  }

  function liveHTML() {
    const s0 = g.start, st = site(), sun = st.sun(g.day), gen = g.load.sol * O.panelPower * sun;
    const need = needPower(), left = O.days - g.day + 1, short = need > g.power;
    const net = need - gen, lasts = net > 0 ? Math.floor(g.power / net) : Infinity;
    return `
      <h2>${st.icon} Day ${g.day} of ${O.days}</h2>
      <div class="strip"><span>☀️ Sunlight ${Math.round(sun * 100)}%, panels make ${gen.toFixed(1).replace('.0', '')}</span><span>📡 Message delay to Earth: ${st.delay} each way</span></div>
      <div class="card gbox">
        ${meter('Power', '🔋', g.power, g.cap)}${meter('Oxygen', '🫧', g.o2, s0.o2)}${meter('Water', '💧', g.water, s0.water)}
        ${meter('Food', '🍎', g.food, s0.food)}${meter('Radiation', '☢️', g.dose, O.doseLimit, true)}
        <p class="gl">🔬 Science: ${g.sci} of ${O.sciGoal} needed for full mission success</p>
      </div>
      ${g.ev ? `
        <div class="evt"><b>${g.ev.title}</b><p>${g.ev.text}</p>
          <div class="opts">${g.ev.choices.map((c, i) => `<button class="opt" data-ev="${i}">${c.t}</button>`).join('')}
            <button class="opt" data-ev="ask">📡 Ask Mission Control (reply in ${st.delay})</button></div>
        </div>` : ''}
      <div class="list">${O.systems.map(s => `
        <div class="card sys">
          <div><b>${s.icon} ${s.name}</b><small>${g.paused && s.pause ? 'Paused while the crew shelters from the storm' : s.tips[g.lv[s.id]]}</small></div>
          <div class="seg">${[0, 1, 2].map(l => `
            <button class="${g.lv[s.id] === l ? 'on' : ''}" data-lv="${s.id}" data-v="${l}">${['Off', 'Eco', 'Full'][l]}<small>⚡ ${lvCost(s, l)}</small></button>`).join('')}
          </div>
        </div>`).join('')}</div>
      <div class="fc ${short || lasts < left ? 'warn' : ''}">
        ${short ? 'Not enough stored power for this plan. Turn something down.'
                : `Today uses ${need} power and your panels make ${gen.toFixed(1).replace('.0', '')}. ${lasts === Infinity ? 'Your power is holding steady.' : `At this rate your power lasts ${lasts} more day${lasts === 1 ? '' : 's'}, and you need ${left}.`}`}
      </div>
      <button class="btn" id="runDay" ${short || g.ev ? 'disabled' : ''}>${g.ev ? 'Deal with the alert first' : `Run day ${g.day} ➜`}</button>
      ${g.log.length ? `<p class="gl">${g.log.slice(-3).reverse().map(esc).join('<br>')}</p>` : ''}`;
  }

  function resolveEvent(k) {
    const e = g.ev, m = shieldMult(), st = site();
    let c, pre = '';
    if (k === 'ask') {
      g.flags.asked++;
      if (!e.fast) { c = e.expert; pre = 'Earth replied; there was time to wait. '; }
      else if (st.late) { c = e.choices[1 - e.best]; g.flags.late++; pre = 'Earth\'s reply took ${st.delay} each way, far too late to help. '; }
      else { c = e.choices[e.best]; pre = `Earth answered in ${st.delay}. `; }
    } else c = e.choices[+k];
    g.log.push(`Day ${g.day}: ${pre}${c.fx(g, m)}`);
    g.ev = null;
    go('outpost');
  }

  function launch() {
    const t = totals();
    Object.assign(g, { phase: 'live', cap: t.cap, power: t.cap, o2: t.o2, water: t.water, food: t.food, start: t });
    startDay();
    go('outpost');
  }

  function runNight() {
    const cost = needPower();
    if (cost > g.power || g.ev) return;
    const st = site(), gen = g.load.sol * O.panelPower * st.sun(g.day);
    const b = { power: g.power, o2: g.o2, water: g.water, food: g.food, dose: g.dose, sci: g.sci };
    g.power -= cost;
    O.systems.forEach(s => {
      if (g.paused && s.pause) return;
      Object.keys(s.fx).forEach(k => { g[k] += s.fx[k][g.lv[s.id]]; });
    });
    g.o2 -= O.crew.o2; g.water -= O.crew.water; g.food -= O.crew.food;
    g.dose += st.rad * shieldMult();
    g.power = Math.max(0, Math.min(g.cap, g.power + gen));
    const d = k => { const v = Math.round(g[k] - b[k]); return (v >= 0 ? '+' : '') + v; };
    g.log.push(`Day ${g.day}: power ${d('power')}, oxygen ${d('o2')}, water ${d('water')}, food ${d('food')}, radiation ${d('dose')}.`);

    const dead = g.o2 <= 0 ? 'oxygen' : g.water <= 0 ? 'water' : g.food <= 0 ? 'food' : g.dose >= O.doseLimit ? 'radiation' : null;
    if (dead) return endGame(0, dead);
    if (g.day >= O.days) return endGame(g.sci >= O.sciGoal ? 2 : 1);
    g.day++; startDay();
    go('outpost');
  }

  function endGame(rank, dead) {
    ['o2', 'water', 'food', 'power'].forEach(k => { g[k] = Math.max(0, g[k]); });
    const gain = Math.max(0, O.xpByRank[rank] - O.xpByRank[state.outpost || 0]);
    state.outpost = Math.max(state.outpost || 0, rank);
    addXp(gain);
    g.phase = 'end'; g.result = { rank, dead, gain };
    astroSay(rank ? `Outpost report: the crew survived! +${gain} XP.` : `The crew was lost to ${dead}. Read the report and try a new plan.`);
    go('outpost');
  }

  function endHTML() {
    const { rank, dead, gain } = g.result, L = [], st = site();
    const fix = {
      oxygen: 'Carry another oxygen tank or run life support at Full more often.',
      water: 'Water is shared: life support recycles it and the greenhouse uses it. Carry more or balance them.',
      food: 'Grow food in the greenhouse or carry more crates. Crops need power and water.',
      radiation: 'Radiation builds up every day. Shield layers cut the dose, and sheltering during storms avoids big spikes.'
    };
    if (dead) L.push(`The crew was lost to ${dead} on day ${g.day}. ${fix[dead]}`);
    L.push('Mass limits what you can bring, so every battery, panel, tank or shield layer meant less room for something else.');
    L.push('Power is a budget: life support, the greenhouse and the lab all draw from the same batteries.');
    L.push(st.late
      ? `At the ${st.name}, replies from Earth take ${st.delay} each way. Fast emergencies must be handled by the crew, while slow problems can wait for engineers.`
      : 'The Moon is close, so Earth can answer in about a second. Places like Mars and Ceres are much farther, which makes crews far more independent.');
    if (g.flags.late) L.push('You asked Earth during a fast emergency and the answer came too late. On Mars the crew must know the emergency plan in advance.');
    if (!dead && g.dose > O.doseLimit * 0.8) L.push('You finished close to the radiation limit. Without enough shielding the dose adds up quickly.');
    if (!dead && g.power >= 25) L.push(`You finished with ${g.power} stored power, about ${Math.floor(g.power / 25)} battery pack${g.power >= 50 ? 's' : ''} you could have swapped for other gear.`);
    if (!dead) L.push(g.sci >= O.sciGoal ? `You collected ${g.sci} science points, so the mission goal was met.` : `You collected ${g.sci} of ${O.sciGoal} science points. The lab costs power, so something else had to give.`);
    return `
      <h2>${rank === 2 ? '🏅 Mission success!' : rank === 1 ? '🛰️ Crew survived' : '🚨 Mission failed'}</h2>
      <div class="stat">
        <div class="card"><b>${dead ? g.day - 1 : O.days}/${O.days}</b>Days survived</div>
        <div class="card"><b>${g.sci}</b>Science</div>
        <div class="card"><b>+${gain}</b>XP earned</div>
      </div>
      <div class="card gbox"><b>What you learned</b><ul class="lesson">${L.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <p class="gl">${st.name}. Your plan: ${O.items.map(i => `${g.load[i.id]} × ${i.name.toLowerCase()}`).join(', ')}.</p></div>
      <button class="btn" id="again">Try a new plan ➜</button>`;
  }

  const outpostHTML = () => ({ site: siteHTML, pack: packHTML, live: liveHTML, end: endHTML }[g.phase])();

  const outpostHint = () => g.phase === 'site' ? 'The Moon has stronger radiation and no sunlight at night. The lunar pole has almost constant sunlight. Mars has weak sunlight, dust storms and a long delay. Ceres is very dim and very far, so pack batteries.'
    : g.phase === 'pack' ? 'Every item costs mass. Ask what your outpost needs most: power, supplies or protection. Leave room for surprises!'
    : g.phase === 'end' ? 'Play again and try a different plan, or the other destination!'
    : g.ev ? (g.ev.fast && site().late ? 'This is urgent and Earth is minutes away. Decide yourselves!' : 'Think about who knows best. Is this urgent, and how long would Earth take to answer?')
    : g.o2 < 12 ? 'Oxygen is getting low. Run life support more often.'
    : g.water < 12 ? 'Water is getting low. Remember the greenhouse uses water.'
    : g.food < 12 ? 'Food is getting low. Run the greenhouse or you will run out.'
    : g.dose > O.doseLimit * 0.7 ? 'Radiation is high. You cannot remove it, so avoid big spikes and shelter in storms.'
    : 'Compare how many days your power lasts with the days you have left. If it falls short, turn something down.';

  /* ---------- Astro assistant ---------- */
  const log = $('#log');
  function addMsg(text, cls) {
    const p = document.createElement('p');
    p.className = cls; p.textContent = text;
    log.appendChild(p); log.scrollTop = log.scrollHeight;
  }
  const astroSay = t => addMsg(t, 'a');

  function reply(raw) {
    const t = raw.toLowerCase();
    if (/hint/.test(t)) {
      if (run) return run.mission.steps[run.i].hint;
      if (current === 'outpost') return outpostHint();
      return 'Start a mission first, then ask me for a hint on any step!';
    }
    if (/progress|xp|level|score/.test(t) && /show|my|how/.test(t))
      return `You are Level ${level()} with ${state.xp} XP. ${levelXp()}/${XP_PER_LEVEL} XP to the next level. ${Object.keys(state.modules).length}/${MODULES.length} modules done.`;
    if (current === 'outpost' && /explain|mission|play/.test(t)) return 'Outpost Survival: choose a destination, pack within the mass limit, then each day set life support, the greenhouse and the lab to Off, Eco or Full. They share one battery, and radiation, storms and slow messages from Earth make you trade power, supplies and protection.';
    if (/explain|mission/.test(t)) {
      const m = run ? run.mission : MISSIONS[0];
      return `${m.title}: ${m.brief} Read each question, pick the safest response, and learn from the explanation.`;
    }
    const f = ASTRO_FACTS.find(x => x.k.some(k => t.includes(k)));
    if (f) return f.a;
    return 'Great question! I know about spacewalks, the ISS, emergencies, fitness, XP and missions. Try asking about one of those.';
  }

  function ask(text) {
    const t = text.trim();
    if (!t) return;
    addMsg(t, 'u');
    setTimeout(() => astroSay(reply(t)), 250);
  }

  /* ---------- events ---------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.view) return go(t.dataset.view);
    if (t.dataset.module) return openModule(t.dataset.module);
    if (t.dataset.mission) return startMission(t.dataset.mission);
    if (t.dataset.pick) return pick(+t.dataset.pick);
    if (t.dataset.say) return ask(t.dataset.say);
    if (t.dataset.load) {
      const it = O.items.find(i => i.id === t.dataset.load), d = +t.dataset.d;
      const n = g.load[it.id] + d;
      if (n >= 0 && n <= it.max && (d < 0 || it.mass <= O.mass - massUsed())) g.load[it.id] = n;
      return go('outpost');
    }
    if (t.dataset.lv) { g.lv[t.dataset.lv] = +t.dataset.v; return go('outpost'); }
    if (t.dataset.site) { g.site = t.dataset.site; g.phase = 'pack'; return go('outpost'); }
    if (t.dataset.ev) return resolveEvent(t.dataset.ev);
    switch (t.id) {
      case 'launch': return launch();
      case 'runDay': return runNight();
      case 'again': g = newGame(); return go('outpost');
      case 'closeModal': case 'doneBtn': return closeModal();
      case 'nextStep': run.i++; return run.i < run.mission.steps.length ? renderStep() : finishMission();
      case 'finishModule':
        state.modules[t.dataset.id] = true; addXp(MODULE_XP);
        astroSay(`Module complete! +${MODULE_XP} XP.`);
        return closeModal();
      case 'saveName':
        state.name = ($('#nameIn').value.trim() || 'Student Explorer').slice(0, 24);
        save(); renderHeader(); return go('settings');
      case 'reset':
        if (confirm('Reset all progress?')) { state = { ...fresh(), name: state.name }; save(); renderHeader(); go('home'); }
    }
  });

  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
  $('#askForm').addEventListener('submit', e => {
    e.preventDefault();
    const i = $('#askInput'); ask(i.value); i.value = '';
  });

  /* ---------- start ---------- */
  renderHeader();
  go('home');
})();