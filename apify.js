// ---------------------------------------------------------------------------
// Apify collectors — X / Instagram / TikTok / Facebook through hosted scrapers.
//
// Each actor is called with run-sync-get-dataset-items, which starts the run and
// returns the results in a single request (no polling needed).
//
// Actor field names vary between scrapers, so every value is read through a
// list of likely keys and falls back gracefully rather than throwing.
// ---------------------------------------------------------------------------
import crypto from "node:crypto";
import {
  APIFY_TOKEN, APIFY_MAX_ITEMS, APIFY_PLATFORMS,
  APIFY_X_QUERIES, APIFY_HASHTAGS, APIFY_FB_PAGES, KEYWORDS
} from "./config.js";

const hash = (s) => crypto.createHash("sha1").update(String(s)).digest("hex").slice(0, 16);

// Same topic filter used by the news collectors.
function classify(text) {
  const t = (text || "").toLowerCase();
  if (!KEYWORDS.some((k) => t.includes(k))) return null;
  const security = ["security","military","defense","defence","attack","missile","drone",
    "terror","cyber","intelligence","conflict","war","troops","airstrike","navy","border"]
    .some((k) => t.includes(k));
  const political = ["diplomat","minister","president","summit","treaty","election",
    "parliament","foreign policy","embassy","government","policy","sanction","alliance"]
    .some((k) => t.includes(k));
  const topics = [];
  if (security) topics.push("security");
  if (political) topics.push("political");
  return topics.length ? topics : ["general"];
}

// Read the first key that actually has a value.
const pick = (obj, keys, dflt = "") => {
  for (const k of keys) {
    const v = k.split(".").reduce((o, p) => (o == null ? o : o[p]), obj);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return dflt;
};

async function runActor(actor, input, label) {
  const url = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items`
            + `?token=${encodeURIComponent(APIFY_TOKEN)}&timeout=120&memory=1024`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 140)}`);
  const data = await res.json();
  const items = Array.isArray(data) ? data : [];
  console.log(`[Apify:${label}] ${items.length} raw items`);
  return items;
}

// ---------------------------------------------------------------- X / Twitter
async function fetchX() {
  const raw = await runActor("apidojo~tweet-scraper", {
    searchTerms: APIFY_X_QUERIES,
    maxItems: APIFY_MAX_ITEMS,
    sort: "Latest",
    tweetLanguage: "en"
  }, "x");

  return raw.map((p) => {
    const text = pick(p, ["text", "full_text", "content"]);
    const user = pick(p, ["author.userName", "author.username", "user.username", "username"], "user");
    const url  = pick(p, ["url", "twitterUrl", "tweetUrl"],
                  `https://x.com/${user}/status/${pick(p, ["id", "id_str"], "")}`);
    const when = pick(p, ["createdAt", "created_at", "date"]);
    return { text, author: `X · @${user}`, url, ts: when ? Date.parse(when) : Date.now(),
             source: "x", plat: "x" };
  });
}

// ---------------------------------------------------------------- Instagram
async function fetchInstagram() {
  const raw = await runActor("apify~instagram-scraper", {
    search: APIFY_HASHTAGS[0],
    searchType: "hashtag",
    resultsType: "posts",
    resultsLimit: APIFY_MAX_ITEMS,
    addParentData: false
  }, "instagram");

  return raw.map((p) => {
    const text = pick(p, ["caption", "text", "description"]);
    const user = pick(p, ["ownerUsername", "owner.username", "username"], "user");
    const url  = pick(p, ["url", "postUrl", "displayUrl"], "https://instagram.com");
    const when = pick(p, ["timestamp", "takenAt", "createdAt"]);
    return { text, author: `Instagram · @${user}`, url, ts: when ? Date.parse(when) : Date.now(),
             source: "instagram", plat: "instagram" };
  });
}

// ---------------------------------------------------------------- TikTok
async function fetchTikTok() {
  const raw = await runActor("clockworks~tiktok-scraper", {
    hashtags: APIFY_HASHTAGS,
    resultsPerPage: APIFY_MAX_ITEMS,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false
  }, "tiktok");

  return raw.map((p) => {
    const text = pick(p, ["text", "description", "desc"]);
    const user = pick(p, ["authorMeta.name", "author.uniqueId", "authorMeta.nickName"], "user");
    const url  = pick(p, ["webVideoUrl", "url", "videoUrl"], "https://tiktok.com");
    const when = pick(p, ["createTimeISO", "createTime", "createdAt"]);
    const ts = typeof when === "number" ? when * 1000 : (when ? Date.parse(when) : Date.now());
    return { text, author: `TikTok · @${user}`, url, ts, source: "tiktok", plat: "tiktok" };
  });
}

// ---------------------------------------------------------------- Facebook
async function fetchFacebook() {
  if (!APIFY_FB_PAGES.length) return [];
  const raw = await runActor("apify~facebook-posts-scraper", {
    startUrls: APIFY_FB_PAGES.map((u) => ({ url: u })),
    resultsLimit: APIFY_MAX_ITEMS
  }, "facebook");

  return raw.map((p) => {
    const text = pick(p, ["text", "message", "postText"]);
    const user = pick(p, ["pageName", "user.name", "authorName"], "page");
    const url  = pick(p, ["url", "postUrl", "topLevelUrl"], "https://facebook.com");
    const when = pick(p, ["time", "timestamp", "date"]);
    return { text, author: `Facebook · ${user}`, url, ts: when ? Date.parse(when) : Date.now(),
             source: "facebook", plat: "facebook" };
  });
}

// ---------------------------------------------------------------- entry point
export async function collectApify() {
  if (!APIFY_TOKEN) return [];

  const jobs = [];
  if (APIFY_PLATFORMS.x)         jobs.push(["x", fetchX]);
  if (APIFY_PLATFORMS.instagram) jobs.push(["instagram", fetchInstagram]);
  if (APIFY_PLATFORMS.tiktok)    jobs.push(["tiktok", fetchTikTok]);
  if (APIFY_PLATFORMS.facebook)  jobs.push(["facebook", fetchFacebook]);

  const results = await Promise.all(jobs.map(async ([name, fn]) => {
    try {
      return await fn();
    } catch (err) {
      console.warn(`[Apify:${name}] failed: ${err.message}`);
      return [];
    }
  }));

  const out = [];
  for (const item of results.flat()) {
    const topics = classify(item.text);
    if (!topics) continue;                 // keep only UAE / security / political matter
    out.push({
      id: hash(`apify_${item.url}_${item.text.slice(0, 60)}`),
      source: item.source,
      kind: "social",
      author: item.author,
      title: (item.text || "").slice(0, 180),
      summary: (item.text || "").slice(0, 300),
      url: item.url,
      ts: Number.isFinite(item.ts) ? item.ts : Date.now(),
      topics
    });
  }
  console.log(`[Apify] kept ${out.length} relevant items`);
  return out;
}
