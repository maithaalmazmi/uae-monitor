// Simple in-memory rolling store, deduplicated by a stable id.
// Swap this for Postgres/Redis in production (see README "Scaling").
import { MAX_ITEMS } from "./config.js";

const items = new Map(); // id -> item
let lastUpdated = null;

export function upsertMany(newItems) {
  let added = 0;
  for (const it of newItems) {
    if (!items.has(it.id)) added++;
    items.set(it.id, it);
  }
  // Trim to newest MAX_ITEMS
  if (items.size > MAX_ITEMS) {
    const sorted = [...items.values()].sort((a, b) => b.ts - a.ts);
    items.clear();
    for (const it of sorted.slice(0, MAX_ITEMS)) items.set(it.id, it);
  }
  lastUpdated = new Date().toISOString();
  return added;
}

export function getItems({ source, topic, q, limit = 200 } = {}) {
  let list = [...items.values()].sort((a, b) => b.ts - a.ts);
  if (source && source !== "all") list = list.filter((i) => i.source === source);
  if (topic && topic !== "all") list = list.filter((i) => i.topics.includes(topic));
  if (q) {
    const needle = q.toLowerCase();
    list = list.filter(
      (i) =>
        i.title.toLowerCase().includes(needle) ||
        (i.summary || "").toLowerCase().includes(needle)
    );
  }
  return list.slice(0, limit);
}

export function stats() {
  const bySource = {};
  for (const i of items.values()) bySource[i.source] = (bySource[i.source] || 0) + 1;
  return { total: items.size, bySource, lastUpdated };
}
