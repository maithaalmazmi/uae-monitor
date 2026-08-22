// ---------------------------------------------------------------------------
// Configuration: sources + keyword filters for UAE security & political focus
// ---------------------------------------------------------------------------

// News outlet RSS feeds. These are free and legal to poll.
// Add/remove any feed URL here — the aggregator reads whatever is listed.
const gnews = (q) =>
  "https://news.google.com/rss/search?q=" + encodeURIComponent(q) + "&hl=en-US&gl=US&ceid=US:en";

export const RSS_FEEDS = [
  // ===================== TOPIC SEARCHES (broad sweep) =====================
  { name: "Google News", url: gnews("UAE (security OR military OR defense OR intelligence) when:7d"), region: "uae" },
  { name: "Google News", url: gnews("UAE (political OR diplomacy OR minister OR foreign policy) when:7d"), region: "uae" },
  { name: "Google News", url: gnews("(Gulf OR GCC OR Emirates) (security OR conflict OR sanctions) when:7d"), region: "me" },
  { name: "Google News", url: gnews("(Middle East) (security OR conflict OR diplomacy) when:3d"), region: "me" },
  { name: "Google News", url: gnews("(world OR global) (security OR geopolitics OR military) when:2d"), region: "gl" },

  // Critical / negative coverage about the UAE (reputation monitoring)
  { name: "Google News", url: gnews("(UAE OR Emirates OR Dubai OR \"Abu Dhabi\") (criticism OR condemned OR accused OR allegations) when:7d"), region: "uae" },
  { name: "Google News", url: gnews("(UAE OR Emirates) (\"human rights\" OR violations OR abuses OR crackdown OR detained) when:7d"), region: "uae" },
  { name: "Google News", url: gnews("(UAE OR Emirates OR Dubai) (scandal OR investigation OR probe OR lawsuit OR corruption OR laundering) when:7d"), region: "uae" },
  { name: "Google News", url: gnews("(UAE OR Emirates) (\"under fire\" OR backlash OR controversy OR denounced OR sanctions) when:7d"), region: "uae" },
  { name: "Google News", url: gnews("(UAE OR Emirates OR Dubai) (\"migrant workers\" OR \"forced labour\" OR exploitation OR censorship OR surveillance) when:7d"), region: "uae" },

  // --- Environmental crime ---
  { name: "Google News", url: gnews("(UAE OR Emirates OR Gulf) (\"environmental crime\" OR pollution OR \"toxic waste\" OR \"oil spill\") when:7d"), region: "uae" },
  { name: "Google News", url: gnews("(\"wildlife trafficking\" OR poaching OR \"illegal fishing\" OR \"illegal logging\" OR \"illegal dumping\") when:7d"), region: "gl" },
  { name: "Google News", url: gnews("(\"environmental crime\" OR \"ecological damage\" OR \"hazardous waste\") (Middle East OR Gulf OR UAE) when:7d"), region: "me" },

  // --- Child safety, assault and trafficking ---
  { name: "Google News", url: gnews("(UAE OR Emirates OR Gulf) (\"child abuse\" OR \"child protection\" OR \"child trafficking\" OR \"child labour\") when:7d"), region: "uae" },
  { name: "Google News", url: gnews("(\"human trafficking\" OR \"child exploitation\" OR abduction OR kidnapping) (Middle East OR Gulf OR UAE) when:7d"), region: "me" },
  { name: "Google News", url: gnews("(\"crimes against children\" OR \"child soldiers\" OR \"sexual assault\") when:3d"), region: "gl" },
  { name: "Google News", url: gnews("(\"child abuse\" OR \"child sexual abuse\" OR molestation OR \"indecent assault\") when:3d"), region: "gl" },
  { name: "Google News", url: gnews("(\"child exploitation\" OR \"online grooming\" OR \"child predator\" OR \"child pornography\" arrest) when:7d"), region: "gl" },
  { name: "Google News", url: gnews("(\"missing child\" OR \"child abduction\" OR \"kidnapped child\") when:3d"), region: "gl" },
  { name: "Google News", url: gnews("(\"school violence\" OR \"school attack\" OR bullying OR cyberbullying) children when:3d"), region: "gl" },
  { name: "Google News", url: gnews("(\"child protection\" OR \"child rights\" OR \"child welfare\") (policy OR law OR report) when:7d"), region: "gl" },

  // ===================== UNITED ARAB EMIRATES =====================
  { name: "The National",       url: "https://www.thenationalnews.com/arc/outboundfeeds/rss/?outputType=xml", region: "uae" },
  { name: "Khaleej Times",      url: gnews("site:khaleejtimes.com (UAE OR security OR government) when:3d"), region: "uae" },
  { name: "Gulf News",          url: gnews("site:gulfnews.com (UAE OR security OR government) when:3d"),      region: "uae" },
  { name: "WAM (state agency)", url: gnews("site:wam.ae when:3d"),                                            region: "uae" },

  // ===================== MIDDLE EAST =====================
  { name: "Al Jazeera",      url: "https://www.aljazeera.com/xml/rss/all.xml",        region: "me" },
  { name: "Arab News",       url: "https://www.arabnews.com/rss.xml",                 region: "me" },
  { name: "Middle East Eye", url: "https://www.middleeasteye.net/rss",                region: "me" },
  { name: "Al Arabiya",      url: gnews("site:english.alarabiya.net when:2d"),        region: "me" },
  { name: "Times of Israel", url: "https://www.timesofisrael.com/feed/",              region: "me" },

  // ===================== AMERICAS =====================
  { name: "New York Times — World",       url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",      region: "am" },
  { name: "New York Times — Middle East", url: "https://rss.nytimes.com/services/xml/rss/nyt/MiddleEast.xml", region: "me" },
  { name: "Washington Post — World",      url: "https://feeds.washingtonpost.com/rss/world",                  region: "am" },
  { name: "CNN — World",                  url: "http://rss.cnn.com/rss/edition_world.rss",                    region: "am" },
  { name: "Associated Press",             url: gnews("site:apnews.com (security OR diplomacy OR military) when:2d"), region: "am" },
  { name: "Reuters",                      url: gnews("site:reuters.com (security OR diplomacy OR military) when:2d"), region: "am" },
  { name: "Politico",                     url: gnews("site:politico.com (foreign policy OR security) when:3d"),      region: "am" },

  // ===================== EUROPE =====================
  { name: "BBC — World",   url: "https://feeds.bbci.co.uk/news/world/rss.xml",   region: "eu" },
  { name: "Sky News",      url: "https://feeds.skynews.com/feeds/rss/world.xml", region: "eu" },
  { name: "The Guardian",  url: "https://www.theguardian.com/world/rss",         region: "eu" },
  { name: "Deutsche Welle",url: "https://rss.dw.com/rdf/rss-en-world",           region: "eu" },
  { name: "France 24",     url: "https://www.france24.com/en/rss",               region: "eu" },
  { name: "Euronews",      url: "https://www.euronews.com/rss",                  region: "eu" },
  { name: "Financial Times", url: gnews("site:ft.com (Gulf OR Middle East OR security) when:3d"), region: "eu" },

  // ===================== ASIA =====================
  { name: "South China Morning Post", url: "https://www.scmp.com/rss/91/feed",                                  region: "as" },
  { name: "Times of India — World",   url: "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms",        region: "as" },
  { name: "Nikkei Asia",              url: gnews("site:asia.nikkei.com (security OR diplomacy) when:3d"),       region: "as" },
  { name: "Japan Times",              url: "https://www.japantimes.co.jp/feed/",                               region: "as" },

  // ===================== AFRICA =====================
  { name: "Africanews", url: "https://www.africanews.com/feed/rss",                                  region: "af" },
  { name: "AllAfrica",  url: "https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf",       region: "af" },

  // ===================== AUSTRALIA & PACIFIC =====================
  { name: "ABC Australia",       url: "https://www.abc.net.au/news/feed/51120/rss.xml", region: "oc" },
  { name: "Sydney Morning Herald", url: "https://www.smh.com.au/rss/world.xml",         region: "oc" }
];

// Reddit subreddits polled via the free public JSON endpoint.
export const REDDIT_SUBS = ["UAE", "dubai", "geopolitics", "worldnews"];

// ---------------------------------------------------------------------------
// SOCIAL MEDIA — open platforms that work server-side with no paid key
// ---------------------------------------------------------------------------

// Bluesky: public AppView search. Fully open, no authentication required.
export const BLUESKY_QUERIES = [
  "UAE security", "UAE politics", "Emirates government",
  "Abu Dhabi policy", "Dubai security", "UAE human rights",
  "environmental crime Gulf", "wildlife trafficking", "child protection Gulf"
];

// Mastodon: public hashtag timelines across the largest instances. No auth.
export const MASTODON_INSTANCES = ["mastodon.social", "mstdn.social", "techhub.social"];
export const MASTODON_TAGS = ["UAE", "Emirates", "Dubai", "AbuDhabi", "MiddleEast",
  "EnvironmentalCrime", "ChildProtection"];

// YouTube: per-channel RSS (free, no key). Add channel IDs you care about.
// Find an ID from a channel page's source, or leave the list empty to disable.
export const YOUTUBE_CHANNELS = [
  { name: "Al Jazeera English", id: "UCNye-wNBqNL5ZzHSJj3l8Bg" },
  { name: "Sky News",           id: "UCoMdktPbSTixAyNGwb-UYkQ" },
  { name: "DW News",            id: "UCknLrEdhRCp1aegoMqRaCZg" }
];

// Only items matching these keywords are kept (case-insensitive).
// Tune this list to sharpen the security/political focus.
export const KEYWORDS = [
  // UAE / Gulf
  "uae", "emirates", "abu dhabi", "dubai", "sharjah", "gulf", "gcc",
  // Security
  "security", "military", "defense", "defence", "attack", "missile", "drone",
  "terror", "cyber", "intelligence", "sanction", "conflict", "war", "troops",
  "border", "airstrike", "navy", "coast guard", "hostage", "piracy",
  // Political
  "diplomat", "minister", "president", "summit", "treaty", "election",
  "parliament", "foreign policy", "embassy", "government", "policy", "alliance",
  // Environmental crime
  "environmental crime", "pollution", "toxic waste", "hazardous waste", "oil spill",
  "wildlife trafficking", "poaching", "endangered", "illegal fishing", "illegal logging",
  "deforestation", "illegal dumping", "illegal mining", "contamination", "ecological",
  // Child safety, assault and trafficking
  "child abuse", "child exploitation", "child trafficking", "child labour", "child labor",
  "child protection", "children", "minors", "underage", "abduction", "kidnapping",
  "human trafficking", "sexual assault", "domestic violence", "child soldiers", "grooming"
];

// Poll interval. "*/2 * * * *" = every 2 minutes.
export const CRON_SCHEDULE = process.env.CRON_SCHEDULE || "*/2 * * * *";

// ---------------------------------------------------------------------------
// APIFY — X / Instagram / TikTok / Facebook via hosted scrapers.
// Set APIFY_TOKEN in Railway to switch on. Free plan = $5 credit per month.
//
// COST CONTROL (important):
//   items per month  =  (60 / APIFY_INTERVAL_MIN) * 24 * 30 * APIFY_MAX_ITEMS * <#platforms>
//   Defaults below  =  every 6h * 15 items * 3 platforms  ≈ 5,400 items/month
//   Blended price   ≈  $1.20 per 1,000  →  roughly $5–6/month (inside the free credit)
//   Raise APIFY_INTERVAL_MIN to spend less; lower it to collect more often.
// ---------------------------------------------------------------------------
export const APIFY_TOKEN = process.env.APIFY_TOKEN || "";
export const APIFY_INTERVAL_MIN = Number(process.env.APIFY_INTERVAL_MIN || 360); // 6 hours
export const APIFY_MAX_ITEMS = Number(process.env.APIFY_MAX_ITEMS || 15);        // per platform per run

// Turn individual platforms on/off (set to "0" in Railway to disable one)
export const APIFY_PLATFORMS = {
  x:         (process.env.APIFY_X         ?? "1") !== "0",
  instagram: (process.env.APIFY_INSTAGRAM ?? "1") !== "0",
  tiktok:    (process.env.APIFY_TIKTOK    ?? "1") !== "0",
  facebook:  (process.env.APIFY_FACEBOOK  ?? "0") !== "0"  // off by default (needs page URLs)
};

// What to look for on each platform
export const APIFY_X_QUERIES  = ["UAE security", "UAE politics", "Emirates government"];
export const APIFY_HASHTAGS   = ["UAE", "Dubai", "AbuDhabi"];
export const APIFY_FB_PAGES   = []; // e.g. ["https://www.facebook.com/AlJazeera"]

// Optional paid modules — leave blank to disable.
export const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN || "";
export const X_QUERY = process.env.X_QUERY || "(UAE OR Emirates) (security OR political OR military) -is:retweet lang:en";

// Meta Graph API (for Instagram accounts YOU own/manage). Leave blank to disable.
export const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN || "";
export const IG_USER_ID = process.env.IG_USER_ID || "";

export const MAX_ITEMS = 900; // rolling store cap
