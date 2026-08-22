import express from "express";
import cors from "cors";
import cron from "node-cron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { collectAll } from "./collectors.js";
import { collectApify } from "./apify.js";
import { upsertMany, getItems, stats } from "./store.js";
import { initDb, dbReady, saveItems, loadRecent, history, searchArchive, prune } from "./db.js";
import { CRON_SCHEDULE, APIFY_TOKEN, APIFY_INTERVAL_MIN, APIFY_X_INTERVAL_MIN } from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
// every file sits at the top level of this repo, so serve from here
app.use(express.static(__dirname));

// --- API ---
app.get("/api/feed", (req, res) => {
  const { source, topic, q, limit } = req.query;
  res.json({
    items: getItems({ source, topic, q, limit: Number(limit) || 200 }),
    stats: stats()
  });
});

app.get("/api/stats", (_req, res) => res.json({ ...stats(), db: dbReady() }));

// --- Archive: everything ever collected, not just what is in memory ---
app.get("/api/history", async (req, res) =>
  res.json({ days: await history(Number(req.query.days) || 30) }));

app.get("/api/archive", async (req, res) => {
  const { q, topic, from, to, limit } = req.query;
  res.json({ items: await searchArchive({ q, topic, from, to, limit }) });
});
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// --- News collection ---
let running = false;
async function cycle() {
  if (running) return;
  running = true;
  try {
    const items = await collectAll();
    const added = upsertMany(items);
    const kept = await saveItems(items);
    console.log(`[cycle] fetched ${items.length}, ${added} new, ${kept} stored, total ${stats().total}`);
  } catch (err) {
    console.error("[cycle] error:", err.message);
  } finally {
    running = false;
  }
}

// --- Social collection via Apify ---
// Two clocks, because the platforms differ enormously in price per item:
// X runs often (leaders' posts age badly), the rest run rarely (they are the
// expensive ones). A guard per group stops a slow run from stacking on itself.
const apifyRunning = { fast: false, slow: false };
async function apifyCycle(group) {
  if (!APIFY_TOKEN || apifyRunning[group]) return;
  apifyRunning[group] = true;
  try {
    const items = await collectApify(group);
    const added = upsertMany(items);
    const kept = await saveItems(items);
    console.log(`[apify-${group}] ${items.length} fetched, ${added} new, ${kept} stored`);
  } catch (err) {
    console.error(`[apify-${group}] error:`, err.message);
  } finally {
    apifyRunning[group] = false;
  }
}

const PORT = 3000;
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`UAE Monitor running on http://localhost:${PORT}`);

  // Refill memory from the archive first, so the dashboard has content the
  // instant it comes back up instead of waiting for the first fetch.
  if (await initDb()) {
    const back = await loadRecent();
    if (back.length) console.log(`Restored ${upsertMany(back)} items from the database`);
    prune();
    setInterval(prune, 24 * 60 * 60 * 1000);
  }

  cycle();
  cron.schedule(CRON_SCHEDULE, cycle);
  console.log(`Scheduled news collection: ${CRON_SCHEDULE}`);

  if (APIFY_TOKEN) {
    apifyCycle("fast");
    apifyCycle("slow");
    setInterval(() => apifyCycle("fast"), APIFY_X_INTERVAL_MIN * 60 * 1000);
    setInterval(() => apifyCycle("slow"), APIFY_INTERVAL_MIN * 60 * 1000);
    console.log(`X every ${APIFY_X_INTERVAL_MIN} min · Instagram/TikTok every ${APIFY_INTERVAL_MIN} min`);
  } else {
    console.log("Social (Apify) disabled — set APIFY_TOKEN to enable X/Instagram/TikTok");
  }
});
