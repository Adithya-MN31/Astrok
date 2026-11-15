/* db.js - free player database using SQLite (built into Node 22.13+, no account, no extra packages).
   It keeps one file: data/astro.db. If SQLite is not available the game still works with browser-only saves.
   Registration is by astronaut name only: the same name always maps to the same player id. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NAME_OK = /^[\p{L}\p{N} _-]{2,24}$/u;
const cleanName = s => String(s ?? '').replace(/[<>&"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24);

/* the same name (any capital letters) always gives the same id, shaped like a UUID */
const idForName = name => {
  const h = crypto.createHash('sha256').update('astro-player:' + name.toLowerCase()).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
};

export async function openPlayerDb(dir, file = 'astro.db') {
  let DatabaseSync;
  try {
    ({ DatabaseSync } = await import('node:sqlite'));
  } catch (e) {
    console.warn('Database disabled: it needs Node 22.13 or newer. Progress stays in each browser.', `(${e.message})`);
    return null;
  }

  if (file !== ':memory:') fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(file === ':memory:' ? file : path.join(dir, file));
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      xp         INTEGER NOT NULL DEFAULT 0,
      data       TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_players_xp ON players (xp DESC);
  `);

  const upsert = db.prepare(`
    INSERT INTO players (id, name, xp, data, updated_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, xp = excluded.xp, data = excluded.data, updated_at = excluded.updated_at`);
  const getOne = db.prepare('SELECT name, xp, data, updated_at FROM players WHERE id = ?');
  const top = db.prepare('SELECT id, name, xp FROM players ORDER BY xp DESC, updated_at ASC LIMIT 10');
  const rankOf = db.prepare('SELECT COUNT(*) + 1 AS rank FROM players WHERE xp > ?');

  /* simple limit: 60 saves per minute per visitor, so nobody can flood the database */
  const hits = new Map();
  const limited = ip => {
    const now = Date.now();
    const list = (hits.get(ip) || []).filter(t => now - t < 60000);
    list.push(now);
    hits.set(ip, list);
    if (hits.size > 5000) hits.clear();
    return list.length > 60;
  };

  return {
    /* sign up or sign back in with just a name */
    login(rawName, ip = '?') {
      if (limited(ip)) return { status: 429, body: { error: 'Too many tries. Wait a minute and try again.' } };
      const name = cleanName(rawName);
      if (!NAME_OK.test(name)) return { status: 400, body: { error: 'Use 2 to 24 letters or numbers for your name.' } };
      const id = idForName(name);
      const row = getOne.get(id);
      if (!row) return { status: 200, body: { id, found: false, name } };
      let data = {};
      try { data = JSON.parse(row.data); } catch { /* keep empty */ }
      return { status: 200, body: { id, found: true, name: row.name, xp: row.xp, data, updated_at: row.updated_at } };
    },

    save(body, ip = '?') {
      if (limited(ip)) return { status: 429, body: { error: 'Too many saves. Try again in a minute.' } };
      if (!body || typeof body !== 'object' || !UUID.test(String(body.id))) return { status: 400, body: { error: 'Bad player id' } };
      const data = JSON.stringify(body.data && typeof body.data === 'object' ? body.data : {});
      if (data.length > 6000) return { status: 413, body: { error: 'Save is too big' } };
      const xp = Math.max(0, Math.min(1000000, Math.floor(Number(body.xp)) || 0));
      upsert.run(String(body.id).toLowerCase(), cleanName(body.name) || 'Student Explorer', xp, data, new Date().toISOString());
      return { status: 200, body: { ok: true } };
    },

    load(id) {
      if (!UUID.test(String(id))) return { status: 400, body: { error: 'Bad save code' } };
      const row = getOne.get(String(id).toLowerCase());
      if (!row) return { status: 200, body: { found: false } };
      let data = {};
      try { data = JSON.parse(row.data); } catch { /* keep empty */ }
      return { status: 200, body: { found: true, name: row.name, xp: row.xp, data, updated_at: row.updated_at } };
    },

    board(id) {
      const mine = UUID.test(String(id)) ? String(id).toLowerCase() : null;
      const rows = top.all().map(r => ({ name: r.name, xp: r.xp, me: r.id === mine }));
      let me = null;
      if (mine && !rows.some(r => r.me)) {
        const row = getOne.get(mine);
        if (row) me = { name: row.name, xp: row.xp, rank: rankOf.get(row.xp).rank };
      }
      return { status: 200, body: { rows, me } };
    }
  };
}
