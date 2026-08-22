// Rolling in-memory store, deduplicated by a stable id.
//
// News arrives every 2 minutes; social arrives every few hours. Trimming purely
// by recency therefore lets the news flood evict social posts almost as soon as
// they land. So the trim keeps a reserved block of the newest social items and
// fills the rest with everything else.
import { MAX_ITEMS, SOCIAL_RESERVE } from "./config.js";

const items = new Map(); // id -> item
let lastUpdated = null;

const isSocial = (i) => i.kind === "social";

export function upsertMany(newItems) {
  let added = 0;
  for (const it of newItems) {
    if (!items.has(it.id)) added++;
    items.set(it.id, it);
  }

  if (items.size > MAX_ITEMS) {
    const all = [...items.values()].sort((a, b) => b.ts - a.ts);
    const social = all.filter(isSocial).slice(0, SOCIAL_RESERVE);
    const keep = new Set(social.map((i) => i.id));

    for (const it of all) {                    // newest first
      if (keep.size >= MAX_ITEMS) break;
      keep.add(it.id);
    }

    for (const id of [...items.keys()]) {
      if (!keep.has(id)) items.delete(id);
    }
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
  let social = 0;
  for (const i of items.values()) {
    bySource[i.source] = (bySource[i.source] || 0) + 1;
    if (isSocial(i)) social++;
  }
  return { total: items.size, social, bySource, lastUpdated };
}
