// ---------------------------------------------------------------------------
// Collectors: one function per source. Each returns a normalized item array.
// Normalized item shape:
//   { id, source, author, title, summary, url, ts, topics: [] }
// ---------------------------------------------------------------------------
import Parser from "rss-parser";
import crypto from "node:crypto";
import {
  RSS_FEEDS, REDDIT_SUBS, KEYWORDS,
  X_BEARER_TOKEN, X_QUERY, IG_ACCESS_TOKEN, IG_USER_ID
} from "./config.js";

const UA = "Mozilla/5.0 (compatible; UAE-Monitor/1.0; +https://example.com/bot)";
const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml" }
});
const hash = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 16);

// Keep item only if it matches at least one keyword; also tag topics.
function classify(text) {
  const t = (text || "").toLowerCase();
  const matched = KEYWORDS.filter((k) => t.includes(k));
  if (matched.length === 0) return null;
  const security = ["security", "military", "defense", "defence", "attack", "missile",
    "drone", "terror", "cyber", "intelligence", "conflict", "war", "troops",
    "airstrike", "navy", "border"].some((k) => t.includes(k));
  const political = ["diplomat", "minister", "president", "summit", "treaty", "election",
    "parliament", "foreign policy", "embassy", "government", "policy", "sanction",
    "alliance"].some((k) => t.includes(k));
  const topics = [];
  if (security) topics.push("security");
  if (political) topics.push("political");
  if (topics.length === 0) topics.push("general");
  return topics;
}

export async function collectRSS() {
  const out = [];
  await Promise.all(RSS_FEEDS.map(async (feed) => {
    try {
      const parsed = await parser.parseURL(feed.url);
      for (const e of parsed.items || []) {
        const text = `${e.title || ""} ${e.contentSnippet || e.content || ""}`;
        const topics = classify(text);
        if (!topics) continue;
        out.push({
          id: hash(e.link || e.guid || e.title),
          source: "news",
          author: feed.name,
          title: e.title || "(untitled)",
          summary: (e.contentSnippet || "").slice(0, 300),
          url: e.link,
          ts: e.isoDate ? Date.parse(e.isoDate) : Date.now(),
          topics
        });
      }
    } catch (err) {
      console.warn(`[RSS] ${feed.name} failed: ${err.message}`);
    }
  }));
  return out;
}

export async function collectReddit() {
  const out = [];
  await Promise.all(REDDIT_SUBS.map(async (sub) => {
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub}/new.json?limit=25`, {
        headers: { "User-Agent": "uae-monitor/1.0" }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      for (const child of data?.data?.children || []) {
        const p = child.data;
        const text = `${p.title} ${p.selftext || ""}`;
        const topics = classify(text);
        if (!topics) continue;
        out.push({
          id: hash(p.id),
          source: "reddit",
          author: `r/${sub} · u/${p.author}`,
          title: p.title,
          summary: (p.selftext || "").slice(0, 300),
          url: `https://reddit.com${p.permalink}`,
          ts: (p.created_utc || 0) * 1000,
          topics
        });
      }
    } catch (err) {
      console.warn(`[Reddit] r/${sub} failed: ${err.message}`);
    }
  }));
  return out;
}

// --- Paid module: X / Twitter (needs a Bearer token). Disabled if empty. ---
export async function collectX() {
  if (!X_BEARER_TOKEN) return [];
  try {
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(X_QUERY)}&max_results=25&tweet.fields=created_at,author_id`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${X_BEARER_TOKEN}` } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data.data || []).map((tw) => {
      const topics = classify(tw.text) || ["general"];
      return {
        id: hash(`x_${tw.id}`),
        source: "x",
        author: `@${tw.author_id}`,
        title: tw.text.slice(0, 140),
        summary: tw.text,
        url: `https://x.com/i/web/status/${tw.id}`,
        ts: tw.created_at ? Date.parse(tw.created_at) : Date.now(),
        topics
      };
    });
  } catch (err) {
    console.warn(`[X] failed: ${err.message}`);
    return [];
  }
}

// --- Meta Graph module: Instagram (only accounts you manage). Disabled if empty. ---
export async function collectInstagram() {
  if (!IG_ACCESS_TOKEN || !IG_USER_ID) return [];
  try {
    const url = `https://graph.facebook.com/v20.0/${IG_USER_ID}/media?fields=caption,permalink,timestamp,username&access_token=${IG_ACCESS_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data.data || []).map((m) => {
      const topics = classify(m.caption) || ["general"];
      return {
        id: hash(`ig_${m.permalink}`),
        source: "instagram",
        author: `@${m.username || "ig"}`,
        title: (m.caption || "(no caption)").slice(0, 140),
        summary: (m.caption || "").slice(0, 300),
        url: m.permalink,
        ts: m.timestamp ? Date.parse(m.timestamp) : Date.now(),
        topics
      };
    });
  } catch (err) {
    console.warn(`[Instagram] failed: ${err.message}`);
    return [];
  }
}

export async function collectAll() {
  const results = await Promise.all([
    collectRSS(), collectReddit(), collectX(), collectInstagram()
  ]);
  return results.flat();
}
