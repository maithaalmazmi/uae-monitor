// ---------------------------------------------------------------------------
// PostgreSQL persistence.
//
// The store stays in memory — that is what serves /api/feed fast. Postgres sits
// underneath it: every collected item is written there, and on boot the recent
// window is read back so a restart or a deploy no longer starts from nothing.
//
// If DATABASE_URL is absent the whole module turns itself off and the app runs
// exactly as before, in memory only. Nothing here is allowed to take the site
// down: every call is wrapped, and a database failure logs and returns.
// ---------------------------------------------------------------------------
import pg from "pg";

const URL = process.env.DATABASE_URL || "";

// Whether a URL was configured is NOT the same as whether the database actually
// works. Only a successful connection flips this, so the dashboard's "archive
// on" badge can never claim items are being saved when they are not.
let connected = false;
export const dbReady = () => connected;

// How much history to load back into memory at boot.
const BOOT_DAYS = Number(process.env.DB_BOOT_DAYS || 3);
// How long to keep rows at all. 0 = keep forever.
const KEEP_DAYS = Number(process.env.DB_KEEP_DAYS || 180);

let pool = null;

export async function initDb() {
  if (!URL) {
    console.log("Database off — set DATABASE_URL to persist items across restarts");
    return false;
  }
  try {
    pool = new pg.Pool({
      connectionString: URL,
      // Railway's internal certificate is self-signed; the connection is still
      // encrypted, it simply cannot be chain-verified from inside the network.
      ssl: URL.includes("railway.internal") ? false : { rejectUnauthorized: false },
      max: 4,
      idleTimeoutMillis: 30_000
    });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id          TEXT PRIMARY KEY,
        source      TEXT,
        kind        TEXT,
        author      TEXT,
        title       TEXT,
        summary     TEXT,
        url         TEXT,
        ts          BIGINT,
        topics      TEXT[],
        royal       BOOLEAN DEFAULT FALSE,
        src_region  TEXT,
        first_seen  TIMESTAMPTZ DEFAULT NOW()
      )`);
    // Sorting and trimming are both by time, so that is the index that matters.
    await pool.query(`CREATE INDEX IF NOT EXISTS items_ts_idx ON items (ts DESC)`);

    const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM items`);
    console.log(`Database connected — ${rows[0].n} items stored`);
    connected = true;
    return true;
  } catch (err) {
    console.error("[db] init failed, continuing in memory only:", err.message);
    pool = null;
    connected = false;
    return false;
  }
}

// Write a batch. ON CONFLICT keeps the first sighting of a story rather than
// letting a later re-crawl overwrite it, so first_seen stays meaningful.
export async function saveItems(items) {
  if (!pool || !items.length) return 0;
  const text = `
    INSERT INTO items (id, source, kind, author, title, summary, url, ts, topics, royal, src_region)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT (id) DO NOTHING`;
  let saved = 0;
  const client = await pool.connect().catch(() => null);
  if (!client) return 0;
  try {
    await client.query("BEGIN");
    for (const i of items) {
      try {
        const r = await client.query(text, [
          i.id, i.source, i.kind, i.author, i.title, i.summary, i.url,
          Number(i.ts) || Date.now(), i.topics || [], !!i.royal, i.srcRegion || null
        ]);
        saved += r.rowCount;
      } catch { /* one bad row must not lose the batch */ }
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[db] save failed:", err.message);
  } finally {
    client.release();
  }
  return saved;
}

// Read the recent window back into memory at boot.
export async function loadRecent() {
  if (!pool) return [];
  try {
    const since = Date.now() - BOOT_DAYS * 86400_000;
    const { rows } = await pool.query(
      `SELECT id, source, kind, author, title, summary, url, ts, topics, royal, src_region
         FROM items WHERE ts > $1 ORDER BY ts DESC LIMIT 4000`, [since]);
    return rows.map((r) => ({
      id: r.id, source: r.source, kind: r.kind, author: r.author,
      title: r.title, summary: r.summary, url: r.url,
      ts: Number(r.ts), topics: r.topics || [],
      royal: r.royal, srcRegion: r.src_region || undefined
    }));
  } catch (err) {
    console.error("[db] load failed:", err.message);
    return [];
  }
}

// Archive counts per day — what makes "this week vs last week" possible.
export async function history(days = 30) {
  if (!pool) return [];
  try {
    const { rows } = await pool.query(`
      SELECT to_char(to_timestamp(ts/1000), 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE kind = 'social')::int AS social,
             COUNT(*) FILTER (WHERE 'security'    = ANY(topics))::int AS security,
             COUNT(*) FILTER (WHERE 'political'   = ANY(topics))::int AS political,
             COUNT(*) FILTER (WHERE 'childsafety' = ANY(topics))::int AS childsafety,
             COUNT(*) FILTER (WHERE 'environment' = ANY(topics))::int AS environment
        FROM items
       WHERE ts > $1
       GROUP BY day ORDER BY day`, [Date.now() - days * 86400_000]);
    return rows;
  } catch (err) {
    console.error("[db] history failed:", err.message);
    return [];
  }
}

// Full-text-ish search across the whole archive, not just what is in memory.
export async function searchArchive({ q = "", topic = "", from = "", to = "", limit = 200 } = {}) {
  if (!pool) return [];
  try {
    const where = [], args = [];
    if (q)     { args.push(`%${q}%`); where.push(`(title ILIKE $${args.length} OR summary ILIKE $${args.length})`); }
    if (topic) { args.push(topic);    where.push(`$${args.length} = ANY(topics)`); }
    if (from)  { args.push(Date.parse(from) || 0); where.push(`ts >= $${args.length}`); }
    if (to)    { args.push(Date.parse(to) || Date.now()); where.push(`ts <= $${args.length}`); }
    args.push(Math.min(Number(limit) || 200, 1000));
    const { rows } = await pool.query(
      `SELECT id, source, kind, author, title, summary, url, ts, topics, royal, src_region
         FROM items ${where.length ? "WHERE " + where.join(" AND ") : ""}
        ORDER BY ts DESC LIMIT $${args.length}`, args);
    return rows.map((r) => ({ ...r, ts: Number(r.ts), srcRegion: r.src_region || undefined }));
  } catch (err) {
    console.error("[db] search failed:", err.message);
    return [];
  }
}

// Drop rows past the retention window. Off when DB_KEEP_DAYS is 0.
export async function prune() {
  if (!pool || !KEEP_DAYS) return;
  try {
    const r = await pool.query(`DELETE FROM items WHERE ts < $1`,
      [Date.now() - KEEP_DAYS * 86400_000]);
    if (r.rowCount) console.log(`[db] pruned ${r.rowCount} items older than ${KEEP_DAYS} days`);
  } catch (err) {
    console.error("[db] prune failed:", err.message);
  }
}
