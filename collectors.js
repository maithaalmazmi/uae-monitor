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

/* ---------- environmental CRIME, by the internationally used categories ----------
   The old list matched any environmental word, so an air-quality index page
   ("Air Quality Index (AQI) and Croatia Air Pollution | IQAir") counted as a
   crime. Pollution is a condition; polluting unlawfully is the crime.

   So the vocabulary is split in three:
     HARD  — phrases that are criminal on their own ("wildlife trafficking")
     SOFT  — the domain, innocent by itself ("pollution", "emissions")
     CRIME — enforcement or illegality ("illegal", "arrested", "fined", "seized")
   A SOFT term only counts when a CRIME term appears with it. BLOCK kills the
   data-and-forecast pages outright, since those carry both by coincidence. */
const ENV_BLOCK = ["air quality index","(aqi)","aqi and","air quality map","pollution ranking",
  "weather forecast","pollen count","uv index","real-time air","live air quality",
  "most polluted cities ranking"];

/* Climate and environment DIPLOMACY — COP summits, treaties, pledges, finance.
   Not crime, but the UAE hosted COP28 and its climate positioning is watched
   closely, so it earns its own labelled sub-category instead of being dropped
   with the air-quality pages or mislabelled as an offence. */
const ENV_POLICY = ["cop28","cop29","cop30","cop 28","cop 29","cop 30","climate summit",
  "climate conference","climate talks","climate negotiations","unfccc","paris agreement",
  "climate finance","loss and damage","emissions target","net zero pledge","carbon market",
  "carbon credit","ipcc report","biodiversity cop","cites conference","unea","green transition",
  "climate pledge","climate accord","environment ministers","climate deal",
  "قمة المناخ","مؤتمر المناخ","مؤتمر الأطراف","اتفاق باريس","تمويل المناخ",
  "الخسائر والأضرار","الحياد الكربوني","أسواق الكربون","مفاوضات المناخ","اتفاق مناخي"];

const ENV_CRIME = ["illegal","illicit","unlawful","banned","prohibited","smuggl","traffick",
  "arrest","detain","convict","sentenc","jailed","prosecut","indict","charged with","fined",
  "fine of","penalty","seiz","confiscat","raid","crackdown","court","lawsuit","sued",
  "violation","breach","offence","offense","crime","criminal","scandal","probe","investigation",
  "negligence","cover-up","falsif","fraud","bribe","corrupt","dumping","poach","unreported",
  "unregulated","black market","syndicate","cartel","network","gang",
  /* Arabic */ "غير قانوني","غير مشروع","مهرب","تهريب","اعتقال","إدانة","محكمة","غرامة",
  "مصادرة","مداهمة","جريمة","انتهاك","مخالفة","فساد","تلاعب","إهمال"];

const ENV_CATS = {
  // 1. Wildlife crimes
  wildlife: {
    hard: ["wildlife trafficking","wildlife crime","wildlife smuggling","illegal wildlife trade",
      "poaching","poacher","ivory trade","rhino horn","pangolin scale","shark finning",
      "illegal pet trade","bushmeat","cites violation","endangered species trade",
      "الاتجار بالحياة البرية","الصيد الجائر","تهريب الحيوانات","العاج"],
    soft: ["wildlife","endangered species","protected species","falcon","rhino","elephant",
      "pangolin","tiger","turtle","الحياة البرية","الأنواع المهددة"]
  },
  // 2. Pollution and waste crimes
  pollution: {
    hard: ["illegal dumping","waste dumping","toxic waste","hazardous waste","waste trafficking",
      "e-waste dumping","illegal discharge","emissions cheating","emissions fraud",
      "dieselgate","illegal landfill","تهريب النفايات","النفايات السامة","دفن النفايات"],
    soft: ["pollution","polluting","polluted","emissions","effluent","oil spill","chemical spill",
      "contaminat","landfill","sewage","waste","التلوث","الانبعاثات","تسرب نفطي","النفايات"]
  },
  // 3. Forestry crimes
  forestry: {
    hard: ["illegal logging","timber trafficking","timber smuggling","illegal deforestation",
      "illegal land clearing","land grabbing","forest crime","قطع الأشجار غير القانوني",
      "تهريب الأخشاب","إزالة الغابات"],
    soft: ["logging","timber","deforestation","forest","rainforest","الغابات","الأخشاب"]
  },
  // 4. Fisheries crimes
  fisheries: {
    hard: ["illegal fishing","iuu fishing","illegal, unreported","overfishing violation",
      "fishing without licence","fishing without license","trawler seized","fish smuggling",
      "الصيد غير القانوني","الصيد الجائر للأسماك"],
    soft: ["fishing","fishery","fisheries","trawler","fish stock","الصيد","الثروة السمكية"]
  },
  // 5. Illegal mining
  mining: {
    hard: ["illegal mining","illegal gold mining","illegal sand mining","unlicensed mining",
      "mining without permit","blood gold","conflict minerals","التعدين غير القانوني",
      "التنقيب غير المشروع","الذهب المهرب"],
    soft: ["mining","quarry","gold mine","mercury","tailings","التعدين","المناجم"]
  },
  // 6. Transnational organised environmental crime
  organized: {
    hard: ["environmental crime network","transnational environmental crime","green crime",
      "eco-trafficking","environmental crime syndicate","interpol environmental",
      "unep environmental crime","الجريمة البيئية المنظمة","شبكة تهريب بيئية"],
    soft: ["organised crime","organized crime","transnational","syndicate","cartel"]
  },
  // 7. Corporate environmental crime
  corporate: {
    hard: ["environmental violation","environmental fine","environmental lawsuit",
      "pollution fine","epa fine","greenwashing lawsuit","corporate negligence",
      "environmental negligence","spill liability","permit violation",
      "مخالفة بيئية","غرامة بيئية","دعوى بيئية"],
    soft: ["company","firm","corporation","refinery","plant","factory","operator",
      "شركة","مصنع","مصفاة"]
  },
  // 8. Individual offences
  individual: {
    hard: ["illegal hunting","hunting without permit","littering fine","dumped waste illegally",
      "caught dumping","wildlife smuggler arrested","صيد بدون ترخيص","رمي النفايات"],
    soft: ["hunter","hunting","litter","dumped","الصيد","النفايات"]
  }
};

// Returns the category key, or null when the text is not an environmental crime.
function envClass(text) {
  const t = (text || "").toLowerCase();
  if (ENV_BLOCK.some((b) => t.includes(b))) return null;   // data pages, not crimes
  const crime = ENV_CRIME.some((c) => t.includes(c));
  // Diplomacy first: a COP story that also mentions an investigation should read
  // as the summit it is, not as a crime report.
  if (!crime && ENV_POLICY.some((p) => t.includes(p))) return "policy";
  for (const [key, v] of Object.entries(ENV_CATS)) {
    if (v.hard.some((h) => t.includes(h))) return key;      // criminal on its own
    if (crime && v.soft.some((s) => t.includes(s))) return key;
  }
  return null;
}

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

/* Sensitive: hostile or damaging coverage of the UAE. Four existing axes
   (reputation, political, economic, security) plus two the user named
   explicitly: attacks aimed AT the UAE, and the Sudan file. */
const NEG_ADD = [
  /* --- attacks, smears and hostile campaigns aimed at the UAE --- */
  "anti-uae","anti uae","against the uae","targeting the uae","smear campaign","smear",
  "disinformation campaign","misinformation campaign","propaganda campaign","hostile campaign",
  "media campaign against","defamation","defame","slander","libel","insult","insulted",
  "mocked","ridicul","incitement","inciting","hate campaign","hashtag campaign","trolls",
  "boycott the uae","boycott uae","calls to boycott","blamed the uae","blames uae",
  "uae blamed","accuses the uae","accused the uae","uae accused","criticises the uae",
  "criticizes the uae","condemns the uae","condemned the uae","denounces the uae",
  "summoned the uae","expelled uae","protest against the uae","rally against the uae",
  "campaign against the uae","attacks on the uae","attacked the uae",
  "الإساءة للإمارات","إساءة إلى الإمارات","حملة ضد الإمارات","تشويه سمعة",
  "تحريض على الإمارات","اتهام الإمارات","اتهمت الإمارات","تتهم الإمارات",
  "إدانة الإمارات","انتقاد الإمارات","مقاطعة الإمارات","تشهير",

  /* --- the Sudan file: named by the user, and the single most active
         reputational front for the UAE at the moment --- */
  "sudan","sudanese","khartoum","darfur","el fasher","al fashir","nyala","port sudan",
  "rapid support forces","rsf","hemedti","hemeti","dagalo","janjaweed",
  "sudanese armed forces","burhan","genocide in darfur","sudan war","sudan conflict",
  "arms to sudan","weapons to sudan","arming the rsf","gold smuggling","sudanese gold",
  "un panel of experts","icj case","international court of justice","icc",
  "السودان","السوداني","الخرطوم","دارفور","الفاشر","نيالا","بورتسودان",
  "الدعم السريع","حميدتي","دقلو","الجنجويد","الجيش السوداني","البرهان",
  "حرب السودان","تسليح الدعم السريع","ذهب السودان","محكمة العدل الدولية"
];

const UAE_T = ["uae","emirates","emirati","abu dhabi","dubai","sharjah","ajman","fujairah",
  "الإمارات","الامارات","أبوظبي","ابوظبي","دبي","الشارقة"];

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
  const env       = envClass(t);                 // now a category, or null
  const child     = hits(t, T_CHILD);
  // Hostile coverage of the UAE — including the Sudan file — is intelligence in
  // its own right, even when the wording trips none of the topic lists above.
  const sensitive = hits(t, UAE_T) && hits(t, NEG_ADD);

  if (!(security || political || economic || env || child || sensitive)) return null;

  // Topic word present but the piece is plainly consumer/business copy → drop,
  // unless it also carries a hard security / crime signal.
  if (hits(t, NOISE) && !(security || env || child || economic || sensitive)) return null;

  const topics = [];
  if (sensitive) topics.push("critical");
  if (security)  topics.push("security");
  if (political) topics.push("political");
  if (economic)  topics.push("economy");
  if (env)     { topics.push("environment"); topics.push("env:" + env);
                 if (env === "policy") topics.push("diplomacy"); }
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
