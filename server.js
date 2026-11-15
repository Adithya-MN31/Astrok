import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dns from 'node:dns';
import net from 'node:net';
import { openPlayerDb } from "./js/db.js";

dns.setDefaultResultOrder('ipv4first');
net.setDefaultAutoSelectFamilyAttemptTimeout(1000);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '20kb' }));

/* Serve only the public game files (never server.js, .env or package.json) */
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

/* ---------- settings ---------- */
const MODELS = [
  process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  process.env.GEMINI_FALLBACK_MODEL
].filter(Boolean);
const USE_SEARCH = process.env.USE_SEARCH === 'true';
const NASA_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const MAX_PER_MIN = Number(process.env.MAX_AI_PER_MIN) || 4;
const PORT = process.env.PORT || 3000;
const NASA_TTL = 15 * 60 * 1000;   // cache NASA data for 15 minutes

if (!process.env.GEMINI_API_KEY) console.warn('WARNING: GEMINI_API_KEY is missing in .env');

const urlFor = m => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const SYSTEM = `You are Astro, a friendly AI Mission Assistant in the
"Junior Astronaut Mission Trainer" game for students. Explain space topics
simply and accurately, in a short, encouraging way (under 120 words unless
asked for more). Use the web for current facts and news. For mission
questions, give hints rather than just the answer. Keep everything
age-appropriate and politely steer off-topic requests back to space and learning.`;

/* ---------- rate limit to protect the free Gemini quota ---------- */
const hits = [];
function waitSeconds() {
  const now = Date.now();
  while (hits.length && now - hits[0] > 60000) hits.shift();
  if (hits.length >= MAX_PER_MIN) return Math.ceil((60000 - (now - hits[0])) / 1000);
  hits.push(now);
  return 0;
}

/* ---------- Gemini ---------- */
async function callGemini(model, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const r = await fetch(urlFor(model), {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    return { ok: r.ok, status: r.status, data };
  } catch (e) {
    return { ok: false, status: 504, data: { error: { message: 'Google took too long to answer (timeout).' } } };
  } finally {
    clearTimeout(timer);
  }
}

app.post('/api/chat', async (req, res) => {
  try {
    const msgs = Array.isArray(req.body.messages) ? req.body.messages.slice(-10) : [];
    if (!msgs.length) return res.status(400).json({ error: 'No messages' });

    const wait = waitSeconds();
    if (wait) return res.status(429).json({ error: `Astro is resting (free limit). Try again in ${wait} seconds.` });

    const body = {
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: msgs.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: String(m.text).slice(0, 2000) }]
      }))
    };
    if (USE_SEARCH) body.tools = [{ google_search: {} }];

    let last;
    for (const model of MODELS) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        console.log(`Asking ${model} (try ${attempt}) search:${USE_SEARCH}`);
        last = await callGemini(model, body);
        console.log('Status:', last.status);
        if (last.ok) break;
        if (![500, 503].includes(last.status)) break;
        await sleep(1500);
      }
      if (last.ok) break;
    }

    if (!last.ok) {
      const msg = last.data?.error?.message || 'Gemini error';
      console.error('Gemini error:', msg);
      return res.status(last.status).json({ error: msg });
    }

    const cand = last.data.candidates?.[0];
    const text = (cand?.content?.parts || []).map(p => p.text || '').join('').trim();
    const sources = (cand?.groundingMetadata?.groundingChunks || [])
      .map(c => c.web).filter(Boolean)
      .map(w => ({ title: w.title, url: w.uri }))
      .slice(0, 4);

    res.json({ text: text || "I couldn't find an answer. Try asking another way!", sources });
  } catch (e) {
    console.error('Server error:', e);
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

/* ---------- NASA helpers ---------- */
async function nasaGet(url, ms = 15000) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(ms) });
    const raw = await r.text();
    let data = null;
    try { data = JSON.parse(raw); } catch { /* not JSON */ }
    return { ok: r.ok, status: r.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: null };
  }
}

const nasaMsg = r => r.data?.error?.message || r.data?.msg || (r.status ? `status ${r.status}` : 'no connection');
const toHttps = u => String(u || '').replace(/^http:\/\//, 'https://');

const cache = new Map();
async function cached(key, ttl, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < ttl) return hit.v;
  let v = null;
  try { v = await fn(); } catch (e) { console.error(`NASA ${key} failed:`, e.message); }
  if (v) cache.set(key, { v, t: Date.now() });
  return v;
}

/* NASA Image and Video Library (no key needed) */
async function nasaLibrary(query, limit = 8) {
  const r = await nasaGet(`https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image`);
  const items = r.ok ? (r.data?.collection?.items || []) : [];
  return items.slice(0, limit).map(it => {
    const d = it.data?.[0] || {};
    return {
      title: d.title || 'NASA image',
      date: String(d.date_created || '').slice(0, 10),
      description: String(d.description || ''),
      img: toHttps(it.links?.[0]?.href),
      id: d.nasa_id || ''
    };
  }).filter(x => x.img);
}

async function nasaImage(query, intro) {
  const [first] = await nasaLibrary(query, 1);
  if (!first) return null;
  return {
    text: `${intro}: ${first.title}. ${first.description.slice(0, 300)}`,
    sources: [{ title: 'NASA Image and Video Library', url: first.img }]
  };
}

/* ---------- NASA website page: all data in one call ---------- */
async function getApod() {
  const r = await nasaGet(`https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}`);
  if (r.ok && r.data?.title) {
    const d = r.data;
    return { title: d.title, date: d.date, explanation: d.explanation || '', mediaType: d.media_type,
             url: toHttps(d.url), hdurl: toHttps(d.hdurl || d.url), credit: d.copyright || 'NASA', source: 'apod' };
  }
  console.error('APOD failed:', nasaMsg(r));
  const [x] = await nasaLibrary('nebula galaxy', 1);
  if (!x) return null;
  return { title: x.title, date: x.date, explanation: x.description, mediaType: 'image',
           url: x.img, hdurl: x.img, credit: 'NASA', source: 'library' };
}

async function getAsteroids() {
  const today = new Date().toISOString().slice(0, 10);
  const r = await nasaGet(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_KEY}`);
  if (!r.ok || !r.data?.near_earth_objects) { console.error('Asteroids failed:', nasaMsg(r)); return null; }
  const list = (r.data.near_earth_objects[today] || []).map(a => {
    const c = a.close_approach_data?.[0] || {};
    return {
      name: String(a.name).replace(/[()]/g, ''),
      sizeM: Math.round(a.estimated_diameter?.meters?.estimated_diameter_max || 0),
      kmh: Math.round(Number(c.relative_velocity?.kilometers_per_hour) || 0),
      lunar: Number(c.miss_distance?.lunar) || 0,
      hazardous: !!a.is_potentially_hazardous_asteroid
    };
  }).sort((a, b) => a.lunar - b.lunar);
  return { date: today, count: list.length, hazardous: list.filter(a => a.hazardous).length, items: list.slice(0, 5) };
}

async function getMars() {
  const r = await nasaGet(`https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/latest_photos?api_key=${NASA_KEY}`);
  const p = r.ok ? (r.data?.latest_photos || [])[0] : null;
  if (p) {
    return { img: toHttps(p.img_src), earthDate: p.earth_date, sol: p.sol, camera: p.camera?.full_name || '',
             rover: p.rover?.name || 'Curiosity', title: '', source: 'rover' };
  }
  console.error('Mars photos failed:', nasaMsg(r));
  const [x] = await nasaLibrary('curiosity rover mars', 1);
  if (!x) return null;
  return { img: x.img, earthDate: x.date, sol: null, camera: '', rover: 'Mars', title: x.title, source: 'library' };
}

const flareRank = c => {
  const m = /^([ABCMX])\s*([\d.]+)?/i.exec(String(c || ''));
  return m ? 'ABCMX'.indexOf(m[1].toUpperCase()) * 100 + (parseFloat(m[2]) || 0) : -1;
};

async function getWeather() {
  const end = new Date();
  const start = new Date(end.getTime() - 7 * 24 * 3600 * 1000);
  const f = d => d.toISOString().slice(0, 10);
  let flares = null;

  /* 1) NASA DONKI (sometimes slow or rate limited). An empty answer means "no flares". */
  const r = await nasaGet(`https://api.nasa.gov/DONKI/FLR?startDate=${f(start)}&endDate=${f(end)}&api_key=${NASA_KEY}`, 10000);
  if (r.ok) {
    flares = (Array.isArray(r.data) ? r.data : []).map(x => ({ cls: x.classType || '', when: String(x.beginTime || '') }));
  } else {
    console.error('DONKI space weather failed:', nasaMsg(r), '- trying NOAA backup');
    /* 2) NOAA Space Weather Prediction Center (free, no key) */
    const n = await nasaGet('https://services.swpc.noaa.gov/json/goes/primary/xray-flares-7-day.json', 10000);
    if (n.ok && Array.isArray(n.data)) {
      flares = n.data
        .map(x => ({ cls: x.max_class || x.begin_class || x.classType || '', when: String(x.begin_time || x.max_time || x.time_tag || '') }))
        .filter(x => x.cls);
    } else {
      console.error('NOAA space weather failed:', nasaMsg(n));
    }
  }
  if (!flares) return null;

  flares.sort((a, b) => a.when.localeCompare(b.when));
  const strongest = flares.reduce((best, x) => (flareRank(x.cls) > flareRank(best?.cls) ? x : best), null);
  const latest = flares[flares.length - 1];
  return {
    count: flares.length,
    strongest: strongest?.cls || '',
    latestClass: latest?.cls || '',
    latestDate: latest ? latest.when.slice(0, 10) : ''
  };
}

app.get('/api/nasa/dashboard', async (req, res) => {
  const [apod, asteroids, mars, weather] = await Promise.all([
    cached('apod', NASA_TTL, getApod),
    cached('asteroids', NASA_TTL, getAsteroids),
    cached('mars', NASA_TTL, getMars),
    cached('weather', NASA_TTL, getWeather)
  ]);
  res.json({ apod, asteroids, mars, weather, updated: new Date().toISOString() });
});

app.get('/api/nasa/search', async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 60);
  if (q.length < 2) return res.status(400).json({ error: 'Type at least 2 letters.' });
  const items = await cached('search:' + q.toLowerCase(), 10 * 60 * 1000, async () => {
    const list = await nasaLibrary(q, 8);
    return list.length ? list : null;
  });
  res.json({ items: items || [] });
});

/* ---------- NASA answers for the chatbot ---------- */
app.get('/api/nasa', async (req, res) => {
  try {
    if (req.query.type === 'apod') {
      const a = await cached('apod', NASA_TTL, getApod);
      if (!a) return res.status(502).json({ error: 'NASA picture service is not answering. Try again later.' });
      const intro = a.source === 'library' ? "NASA's daily picture service is busy, so here is a picture from NASA's image library" : "Today's NASA picture";
      return res.json({
        text: `${intro}: ${a.title}. ${a.explanation.slice(0, 450)}…`,
        sources: [{ title: 'NASA picture', url: a.hdurl || a.url }]
      });
    }

    if (req.query.type === 'asteroids') {
      const a = await cached('asteroids', NASA_TTL, getAsteroids);
      if (!a) return res.status(502).json({ error: 'NASA asteroid data is not available right now.' });
      const names = a.items.slice(0, 3).map(x => `${x.name} (up to ${x.sizeM} m wide)`);
      return res.json({
        text: `NASA is tracking ${a.count} near-Earth asteroids passing by today.` + (names.length ? ` For example: ${names.join(', ')}.` : ''),
        sources: [{ title: 'NASA NeoWs asteroid data', url: 'https://api.nasa.gov' }]
      });
    }

    res.status(400).json({ error: 'Unknown NASA request' });
  } catch (e) {
    console.error('NASA error:', e);
    res.status(500).json({ error: 'Could not reach NASA' });
  }
});

app.get('/api/nasa/mars', async (req, res) => {
  const m = await cached('mars', NASA_TTL, getMars);
  if (!m) return res.status(502).json({ error: 'NASA Mars photo service is not answering. Try again later.' });
  res.json({
    text: m.source === 'rover'
      ? `The newest photo from the ${m.rover} rover was taken on ${m.earthDate} (Mars day ${m.sol}) with the ${m.camera}.`
      : `The live rover photo service is busy, so here is a Mars image from NASA's image library: ${m.title}.`,
    sources: [{ title: 'Mars photo', url: m.img }]
  });
});

app.get('/api/nasa/weather', async (req, res) => {
  const w = await cached('weather', NASA_TTL, getWeather);
  if (!w) return res.status(502).json({ error: 'NASA space weather is not available right now.' });
  res.json({
    text: w.count
      ? `NASA recorded ${w.count} solar flares in the last 7 days. The latest was class ${w.latestClass} on ${w.latestDate}.`
      : 'NASA recorded no solar flares in the last 7 days. The Sun is calm!',
    sources: [{ title: 'NASA DONKI space weather', url: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/' }]
  });
});

/* ---------- free player database (SQLite file: data/astro.db) ---------- */
const players = await openPlayerDb(path.join(__dirname, 'data'));
const noDb = res => res.status(503).json({ error: 'Database is not available on this server.' });

app.post('/api/player', (req, res) => {
  if (!players) return noDb(res);
  const r = players.save(req.body, req.ip);
  res.status(r.status).json(r.body);
});
app.get('/api/player/:id', (req, res) => {
  if (!players) return noDb(res);
  const r = players.load(req.params.id);
  res.status(r.status).json(r.body);
});
app.get('/api/leaderboard', (req, res) => {
  if (!players) return noDb(res);
  const r = players.board(String(req.query.id || ''));
  res.status(r.status).json(r.body);
});

app.listen(PORT, () => console.log(`Open http://localhost:${PORT}`));