// ---------------------------------------------------------------------------
// Collectors: one function per source. Each returns a normalized item array.
// Normalized item shape:
//   { id, source, author, title, summary, url, ts, topics: [] }
// ---------------------------------------------------------------------------
import Parser from "rss-parser";
import crypto from "node:crypto";
import {
  RSS_FEEDS, REDDIT_SUBS,
  BLUESKY_QUERIES, MASTODON_INSTANCES, MASTODON_TAGS, YOUTUBE_CHANNELS,
  X_BEARER_TOKEN, X_QUERY, IG_ACCESS_TOKEN, IG_USER_ID
} from "./config.js";

const UA = "Mozilla/5.0 (compatible; UAE-Monitor/1.0; +https://example.com/bot)";
const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml" }
});
const hash = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 16);

// ---------------------------------------------------------------------------
// Relevance gate.
// A place name alone is NOT enough — "Dubai opens a new metro line" is a place
// plus infrastructure, not intelligence. An item is kept only when it carries a
// real TOPIC signal (security / political / economic policy / environmental
// crime / child safety), and is dropped when it is clearly consumer, sport,
// lifestyle or business-expansion copy with no such signal.
// ---------------------------------------------------------------------------
const T_SECURITY = ["security","military","defense","defence","attack","missile","drone",
  "terror","cyber","intelligence","conflict","war","troops","airstrike","navy","border",
  "weapon","arms","espionage","spy","surveillance","hacking","mercenar","insurgen","militia",
  "hostage","piracy","coast guard","smuggling","arms transfer","proxy"];

const T_POLITICAL = ["diplomat","minister","president","summit","treaty","election","parliament",
  "foreign policy","embassy","government","policy","alliance","ambassador","sovereign",
  "resolution","united nations","cabinet","legislation","accord","envoy","talks","delegation",
  "geopolit","statecraft","recognition","normalisation","normalization"];

const T_ECONOMIC = ["sanction","embargo","blacklist","grey list","greylist","fatf",
  "money laundering","asset freeze","tariff","trade war","export control","divest",
  "sovereign wealth","oil policy","opec","energy security","investment screening",
  "economic pressure","currency","financial crime","illicit finance"];

const T_ENV = ["environmental crime","pollution","toxic waste","hazardous waste","oil spill",
  "wildlife trafficking","poaching","endangered species","illegal fishing","illegal logging",
  "deforestation","illegal dumping","illegal mining","contamination","ecological damage",
  "emissions violation","chemical spill"];

const T_CHILD = [
  // abuse and assault
  "child abuse","abuse of a child","child cruelty","child neglect","sexual assault",
  "sexual abuse","molest","indecent assault","harassment","sexual harassment","bullying",
  "cyberbullying",
  // exploitation and trafficking
  "child exploitation","child trafficking","trafficking of children","child labour",
  "child labor","child marriage","forced marriage","child soldier","child pornography",
  "csam","child sexual abuse material","online grooming","grooming","paedophil","pedophil",
  "child predator","exploitation of minors",
  // abduction and missing children
  "abduction","abducted","kidnapp","missing child","missing children","parental abduction",
  // protection, welfare, schooling
  "child protection","child welfare","child rights","children's rights","child victim",
  "crimes against children","against children","child safety","school violence",
  "school shooting","school attack","orphan","foster care","juvenile","minors","underage",
  "unaccompanied minor","child refugees"];

// Consumer / lifestyle / business-expansion copy — dropped unless a topic term is present.
const NOISE = ["metro line","rail network","railway","autonomous rail","new terminal",
  "airport expansion","real estate","property market","hotel","resort","tourism","tourist",
  "shopping","mall","retail","festival","concert","celebrity","fashion","cuisine","restaurant",
  "football","cricket","tennis","formula 1","f1 ","match","tournament","league","weather",
  "temperature","horoscope","lifestyle","launches new app","opens new store","ticket sales",
  "record profit","earnings beat","share price","ipo","quarterly results","product launch",
  // arts, culture and human-interest profiles
  "artist","artwork","painting","painter","exhibition","gallery","museum","biennale",
  "sculpture","poetry","poet","novel","filmmaker","film festival","movie","documentary",
  "album","singer","musician","actor","actress","recipe","coffee","fine dining",
  "interview with","life and work","spiritualism","wellness","travel guide","things to do"];

function hits(t, list) { return list.some((k) => t.includes(k)); }

// classify() is given the headline alone first. A story is about what its
// headline says; letting a long blurb supply the only topic word turned arts
// profiles into "security" whenever the body mentioned war or a minister.
export function classifyItem(title, summary) {
  const head = classify(title);
  if (!head) return null;                       // headline carries no signal → drop
  const full = classify(`${title} ${summary || ""}`);
  return full && full.length > head.length ? full : head;
}

function classify(text) {
  const t = (text || "").toLowerCase();

  const security  = hits(t, T_SECURITY);
  const political = hits(t, T_POLITICAL);
  const economic  = hits(t, T_ECONOMIC);
  const env       = hits(t, T_ENV);
  const child     = hits(t, T_CHILD);

  // No topic signal at all → not intelligence, whatever place it names.
  if (!(security || political || economic || env || child)) return null;

  // Topic word present but the piece is plainly consumer/business copy → drop,
  // unless it also carries a hard security / crime signal.
  if (hits(t, NOISE) && !(security || env || child || economic)) return null;

  const topics = [];
  if (security)  topics.push("security");
  if (political) topics.push("political");
  if (economic)  topics.push("economy");
  if (env)       topics.push("environment");
  if (child)     topics.push("childsafety");
  return topics;
}

export async function collectRSS() {
  const out = [];
  await Promise.all(RSS_FEEDS.map(async (feed) => {
    try {
      const parsed = await parser.parseURL(feed.url);
      for (const e of parsed.items || []) {
        const topics = classifyItem(e.title || "", e.contentSnippet || e.content || "");
        if (!topics) continue;
        out.push({
          id: hash(e.link || e.guid || e.title),
          source: "news",
          kind: "news",
          srcRegion: feed.region || "",
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
          kind: "social",
          author: `Reddit · r/${sub} · u/${p.author}`,
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

// ---------------------------------------------------------------------------
// SOCIAL: Bluesky — public AppView search, no key, no auth.
// ---------------------------------------------------------------------------
export async function collectBluesky() {
  const out = [];
  await Promise.all(BLUESKY_QUERIES.map(async (q) => {
    try {
      const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(q)}&limit=25&sort=latest`;
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      for (const p of data?.posts || []) {
        const text = p?.record?.text || "";
        const topics = classify(text);
        if (!topics) continue;
        const handle = p?.author?.handle || "user";
        const rkey = (p.uri || "").split("/").pop();
        out.push({
          id: hash(`bsky_${p.uri}`),
          source: "bluesky",
          kind: "social",
          author: `Bluesky · @${handle}`,
          title: text.slice(0, 180),
          summary: text.slice(0, 300),
          url: `https://bsky.app/profile/${handle}/post/${rkey}`,
          ts: p?.record?.createdAt ? Date.parse(p.record.createdAt) : Date.now(),
          topics
        });
      }
    } catch (err) {
      console.warn(`[Bluesky] "${q}" failed: ${err.message}`);
    }
  }));
  return out;
}

// ---------------------------------------------------------------------------
// SOCIAL: Mastodon — public hashtag timelines, no key, no auth.
// ---------------------------------------------------------------------------
export async function collectMastodon() {
  const out = [];
  const jobs = [];
  for (const host of MASTODON_INSTANCES)
    for (const tag of MASTODON_TAGS) jobs.push({ host, tag });

  await Promise.all(jobs.map(async ({ host, tag }) => {
    try {
      const url = `https://${host}/api/v1/timelines/tag/${encodeURIComponent(tag)}?limit=20`;
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      for (const s of Array.isArray(data) ? data : []) {
        const text = (s.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const topics = classify(text);
        if (!topics) continue;
        out.push({
          id: hash(`masto_${s.uri || s.url}`),
          source: "mastodon",
          kind: "social",
          author: `Mastodon · @${s?.account?.acct || "user"}`,
          title: text.slice(0, 180),
          summary: text.slice(0, 300),
          url: s.url || s.uri,
          ts: s.created_at ? Date.parse(s.created_at) : Date.now(),
          topics
        });
      }
    } catch (err) {
      console.warn(`[Mastodon] ${host}#${tag} failed: ${err.message}`);
    }
  }));
  return out;
}

// ---------------------------------------------------------------------------
// SOCIAL: YouTube — per-channel RSS, free, no key.
// ---------------------------------------------------------------------------
export async function collectYouTube() {
  const out = [];
  await Promise.all(YOUTUBE_CHANNELS.map(async (ch) => {
    try {
      const feed = await parser.parseURL(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`);
      for (const e of feed.items || []) {
        const text = `${e.title || ""} ${e.contentSnippet || ""}`;
        const topics = classify(text);
        if (!topics) continue;
        out.push({
          id: hash(`yt_${e.link || e.id}`),
          source: "youtube",
          kind: "social",
          author: `YouTube · ${ch.name}`,
          title: e.title || "",
          summary: (e.contentSnippet || "").slice(0, 300),
          url: e.link,
          ts: e.isoDate ? Date.parse(e.isoDate) : Date.now(),
          topics
        });
      }
    } catch (err) {
      console.warn(`[YouTube] ${ch.name} failed: ${err.message}`);
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
    collectRSS(), collectReddit(),
    collectBluesky(), collectMastodon(), collectYouTube(),
    collectX(), collectInstagram()
  ]);
  return results.flat();
}
