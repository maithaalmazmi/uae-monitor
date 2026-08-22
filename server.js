import express from "express";
import cors from "cors";
import cron from "node-cron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { collectAll } from "./collectors.js";
import { collectApify } from "./apify.js";
import { upsertMany, getItems, stats } from "./store.js";
import { CRON_SCHEDULE, APIFY_TOKEN, APIFY_INTERVAL_MIN } from "./config.js";

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

app.get("/api/stats", (_req, res) => res.json(stats()));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// --- News collection ---
let running = false;
async function cycle() {
  if (running) return;
  running = true;
  try {
    const items = await collectAll();
    const added = upsertMany(items);
    console.log(`[cycle] fetched ${items.length}, ${added} new, total ${stats().total}`);
  } catch (err) {
    console.error("[cycle] error:", err.message);
  } finally {
    running = false;
  }
}

// --- Social collection via Apify, on a slower schedule to control spend ---
let apifyRunning = false;
async function apifyCycle() {
  if (!APIFY_TOKEN || apifyRunning) return;
  apifyRunning = true;
  try {
    const items = await collectApify();
    const added = upsertMany(items);
    console.log(`[apify-cycle] ${items.length} fetched, ${added} new`);
  } catch (err) {
    console.error("[apify-cycle] error:", err.message);
  } finally {
    apifyRunning = false;
  }
}

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`UAE Monitor running on http://localhost:${PORT}`);
  cycle();
  cron.schedule(CRON_SCHEDULE, cycle);
  console.log(`Scheduled news collection: ${CRON_SCHEDULE}`);

  if (APIFY_TOKEN) {
    apifyCycle();
    setInterval(apifyCycle, APIFY_INTERVAL_MIN * 60 * 1000);
    console.log(`Social (Apify) collection every ${APIFY_INTERVAL_MIN} min`);
  } else {
    console.log("Social (Apify) disabled — set APIFY_TOKEN to enable X/Instagram/TikTok");
  }
});
