import express from "express";
import cors from "cors";
import cron from "node-cron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { collectAll } from "./collectors.js";
import { upsertMany, getItems, stats } from "./store.js";
import { CRON_SCHEDULE } from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
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

// --- Collection cycle ---
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`UAE Monitor running on http://localhost:${PORT}`);
  cycle(); // initial fill
  cron.schedule(CRON_SCHEDULE, cycle);
  console.log(`Scheduled collection: ${CRON_SCHEDULE}`);
});
