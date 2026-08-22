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
  APIFY_TOKEN, APIFY_MAX_ITEMS, APIFY_LIMITS, APIFY_PLATFORMS,
  APIFY_X_QUERIES, APIFY_X_ROYALS, APIFY_X_REGIONS,
  APIFY_HASHTAGS, APIFY_FB_PAGES, KEYWORDS
} from "./config.js";

const lim = (k) => APIFY_LIMITS?.[k] ?? APIFY_MAX_ITEMS;
const hash = (s) => crypto.createHash("sha1").update(String(s)).digest("hex").slice(0, 16);

// Same topic filter used by the news collectors — kept in step with them so a
// post about environmental crime or child safety is not thrown away by a gate
// that only knows about security and politics.
const has = (t, list) => list.some((k) => t.includes(k));
const T_SEC = ["security","military","defense","defence","attack","missile","drone","terror",
  "cyber","intelligence","conflict","war","troops","airstrike","navy","border","espionage",
  "smuggling","militia","hostage","piracy"];
const T_POL = ["diplomat","minister","president","summit","treaty","election","parliament",
  "foreign policy","embassy","government","policy","alliance","ambassador","sheikh","ruler"];
const T_ECO = ["sanction","embargo","tariff","trade","economy","economic","investment","fund",
  "laundering","fatf","grey list","corruption","bribery","export control","oil","opec"];
const T_ENV = ["environmental crime","pollution","toxic waste","hazardous waste","oil spill",
  "wildlife trafficking","poaching","endangered","illegal fishing","illegal logging",
  "deforestation","illegal dumping","illegal mining","contamination","ecological","climate"];
const T_KID = ["child abuse","child exploitation","child trafficking","child labour","child labor",
  "child protection","children","minors","underage","abduction","kidnapping","human trafficking",
  "sexual assault","grooming","child soldiers","school violence"];

function classify(text) {
  const t = (text || "").toLowerCase();
  if (!KEYWORDS.some((k) => t.includes(k))) return null;
  const topics = [];
  if (has(t, T_SEC)) topics.push("security");
  if (has(t, T_POL)) topics.push("political");
  if (has(t, T_ECO)) topics.push("economy");
  if (has(t, T_ENV)) topics.push("environment");
  if (has(t, T_KID)) topics.push("childsafety");
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
    maxItems: lim("x"),
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

// ------------------------------------------------- X: ruling families
// The handle is the filter, so these bypass the keyword gate entirely and are
// flagged royal:true for the positive/official tab.
async function fetchXRoyals() {
  if (!APIFY_X_ROYALS.length) return [];
  const byHandle = new Map(APIFY_X_ROYALS.map((r) => [r.handle.toLowerCase(), r]));
  const raw = await runActor("apidojo~tweet-scraper", {
    searchTerms: APIFY_X_ROYALS.map((r) => `from:${r.handle}`),
    maxItems: lim("xroyal"),
    sort: "Latest"
  }, "x-royal");

  return raw.map((p) => {
    const text = pick(p, ["text", "full_text", "content"]);
    const user = String(pick(p, ["author.userName", "author.username", "user.username", "username"], ""));
    const who  = byHandle.get(user.toLowerCase());
    const url  = pick(p, ["url", "twitterUrl", "tweetUrl"],
                  `https://x.com/${user}/status/${pick(p, ["id", "id_str"], "")}`);
    const when = pick(p, ["createdAt", "created_at", "date"]);
    return { text, author: `X · ${who ? who.name : "@" + user}`, url,
             ts: when ? Date.parse(when) : Date.now(),
             source: "x", plat: "x", royal: true, srcRegion: who ? who.region : "gl" };
  }).filter((i) => i.text);
}

// -------------------------------- X: political & economic, routed by region
async function fetchXRegions() {
  if (!APIFY_X_REGIONS.length) return [];
  const per = Math.max(3, Math.floor(lim("xregion") / APIFY_X_REGIONS.length));
  const runs = await Promise.all(APIFY_X_REGIONS.map(async (r) => {
    try {
      const raw = await runActor("apidojo~tweet-scraper", {
        searchTerms: [r.query], maxItems: per, sort: "Latest"
      }, `x-${r.region}`);
      return raw.map((p) => {
        const text = pick(p, ["text", "full_text", "content"]);
        const user = pick(p, ["author.userName", "author.username", "user.username", "username"], "user");
        const url  = pick(p, ["url", "twitterUrl", "tweetUrl"],
                      `https://x.com/${user}/status/${pick(p, ["id", "id_str"], "")}`);
        const when = pick(p, ["createdAt", "created_at", "date"]);
        return { text, author: `X · @${user}`, url, ts: when ? Date.parse(when) : Date.now(),
                 source: "x", plat: "x", srcRegion: r.region };
      });
    } catch (err) {
      console.warn(`[Apify:x-${r.region}] failed: ${err.message}`);
      return [];
    }
  }));
  return runs.flat();
}

// ---------------------------------------------------------------- Instagram
async function fetchInstagram() {
  const raw = await runActor("apify~instagram-scraper", {
    search: APIFY_HASHTAGS[0],
    searchType: "hashtag",
    resultsType: "posts",
    resultsLimit: lim("instagram"),
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
    resultsPerPage: lim("tiktok"),
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
    resultsLimit: lim("facebook")
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
// X is cheap per item and the only platform worth polling often, so it runs on
// its own fast schedule. Instagram / TikTok / Facebook cost far more per item
// and stay on the slow one. `group` selects which set to run.
const JOBS = {
  fast: [["x", fetchX], ["x-royal", fetchXRoyals], ["x-region", fetchXRegions]],
  slow: [["instagram", fetchInstagram], ["tiktok", fetchTikTok], ["facebook", fetchFacebook]]
};
const ENABLED = {
  "x": "x", "x-royal": "x", "x-region": "x",
  "instagram": "instagram", "tiktok": "tiktok", "facebook": "facebook"
};

export async function collectApify(group = "all") {
  if (!APIFY_TOKEN) return [];

  const picked = group === "all" ? [...JOBS.fast, ...JOBS.slow] : (JOBS[group] || []);
  const jobs = picked.filter(([name]) => APIFY_PLATFORMS[ENABLED[name]]);
  if (!jobs.length) return [];

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
    // A ruling-family account is its own credential: keep everything it posts.
    const topics = item.royal ? ["official"] : classify(item.text);
    if (!topics) continue;                 // keep only UAE / security / political matter
    out.push({
      id: hash(`apify_${item.url}_${(item.text || "").slice(0, 60)}`),
      source: item.source,
      kind: "social",
      author: item.author,
      title: (item.text || "").slice(0, 180),
      summary: (item.text || "").slice(0, 300),
      url: item.url,
      ts: Number.isFinite(item.ts) ? item.ts : Date.now(),
      topics,
      royal: !!item.royal,
      srcRegion: item.srcRegion || undefined
    });
  }
  console.log(`[Apify:${group}] kept ${out.length} relevant items`);
  return out;
}
