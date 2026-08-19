// ---------------------------------------------------------------------------
// Configuration: sources + keyword filters for UAE security & political focus
// ---------------------------------------------------------------------------

// News outlet RSS feeds. These are free and legal to poll.
// Add/remove any feed URL here — the aggregator reads whatever is listed.
const gnews = (q) =>
  "https://news.google.com/rss/search?q=" + encodeURIComponent(q) + "&hl=en-US&gl=US&ceid=US:en";

export const RSS_FEEDS = [
  // Google News topical queries (broad, reliable, fetched server-side)
  { name: "Google News", url: gnews("UAE (security OR military OR defense OR intelligence) when:7d"), region: "UAE" },
  { name: "Google News", url: gnews("UAE (political OR diplomacy OR minister OR foreign policy) when:7d"), region: "UAE" },
  { name: "Google News", url: gnews("(Gulf OR GCC OR Emirates) (security OR conflict OR sanctions) when:7d"), region: "Gulf" },
  { name: "Google News", url: gnews("(Middle East) (security OR conflict OR diplomacy) when:3d"), region: "World" },
  { name: "Google News", url: gnews("(world OR global) (security OR geopolitics OR military) when:2d"), region: "World" },
  // Direct outlet feeds
  { name: "Khaleej Times", url: "https://www.khaleejtimes.com/rss", region: "UAE" },
  { name: "The National", url: "https://www.thenationalnews.com/arc/outboundfeeds/rss/?outputType=xml", region: "UAE" },
  { name: "Gulf News", url: "https://gulfnews.com/rss?generatorName=uae", region: "UAE" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", region: "World" },
  { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml", region: "World" },
  { name: "Arab News", url: "https://www.arabnews.com/rss.xml", region: "Gulf" }
];

// Reddit subreddits polled via the free public JSON endpoint.
export const REDDIT_SUBS = ["UAE", "dubai", "geopolitics", "worldnews"];

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
  "parliament", "foreign policy", "embassy", "government", "policy", "alliance"
];

// Poll interval. "*/2 * * * *" = every 2 minutes.
export const CRON_SCHEDULE = process.env.CRON_SCHEDULE || "*/2 * * * *";

// Optional paid modules — leave blank to disable.
export const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN || "";
export const X_QUERY = process.env.X_QUERY || "(UAE OR Emirates) (security OR political OR military) -is:retweet lang:en";

// Meta Graph API (for Instagram accounts YOU own/manage). Leave blank to disable.
export const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN || "";
export const IG_USER_ID = process.env.IG_USER_ID || "";

export const MAX_ITEMS = 500; // rolling store cap
