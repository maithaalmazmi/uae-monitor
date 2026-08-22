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
  // New York Times — section feeds. The desk feeds are the fastest route to NYT
  // copy; the site: search below catches UAE stories filed to any other desk.
  { name: "New York Times — World",        url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",       region: "am" },
  { name: "New York Times — Middle East",  url: "https://rss.nytimes.com/services/xml/rss/nyt/MiddleEast.xml",  region: "me" },
  { name: "New York Times — Politics",     url: "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",    region: "am" },
  { name: "New York Times — Europe",       url: "https://rss.nytimes.com/services/xml/rss/nyt/Europe.xml",      region: "eu" },
  { name: "New York Times — Asia Pacific", url: "https://rss.nytimes.com/services/xml/rss/nyt/AsiaPacific.xml", region: "as" },
  { name: "New York Times — Africa",       url: "https://rss.nytimes.com/services/xml/rss/nyt/Africa.xml",      region: "af" },
  { name: "New York Times — Americas",     url: "https://rss.nytimes.com/services/xml/rss/nyt/Americas.xml",    region: "am" },
  { name: "New York Times — UAE watch",    url: gnews("site:nytimes.com (UAE OR Emirates OR Dubai OR \"Abu Dhabi\" OR Gulf) when:7d"), region: "uae" },
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
  "UAE sanctions", "UAE military", "UAE government", "UAE minister",
  "Emirates diplomacy", "Abu Dhabi policy", "Dubai security",
  "UAE human rights", "Gulf security", "Gulf conflict",
  "wildlife trafficking", "child protection"
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
// X costs a fraction of what the other platforms cost per item, so it gets its
// own faster clock. Everything else stays on APIFY_INTERVAL_MIN.
export const APIFY_X_INTERVAL_MIN = Number(process.env.APIFY_X_INTERVAL_MIN || 120);
export const APIFY_MAX_ITEMS = Number(process.env.APIFY_MAX_ITEMS || 25);        // default per run

// Per-platform limits. Real billing showed TikTok costing ~30x what X and
// Instagram cost for the same number of items, so it gets its own small cap.
export const APIFY_LIMITS = {
  x:         Number(process.env.APIFY_X_ITEMS         || APIFY_MAX_ITEMS),
  xroyal:    Number(process.env.APIFY_X_ROYAL_ITEMS   || 140), // heads of state / ruling families
  xregion:   Number(process.env.APIFY_X_REGION_ITEMS  || 35),  // political/economic by region
  instagram: Number(process.env.APIFY_INSTAGRAM_ITEMS || APIFY_MAX_ITEMS),
  tiktok:    Number(process.env.APIFY_TIKTOK_ITEMS    || 8),
  facebook:  Number(process.env.APIFY_FACEBOOK_ITEMS  || 10)
};

// Turn individual platforms on/off (set to "0" in Railway to disable one)
export const APIFY_PLATFORMS = {
  x:         (process.env.APIFY_X         ?? "1") !== "0",
  instagram: (process.env.APIFY_INSTAGRAM ?? "1") !== "0",
  tiktok:    (process.env.APIFY_TIKTOK    ?? "1") !== "0",
  facebook:  (process.env.APIFY_FACEBOOK  ?? "0") !== "0"  // off by default (needs page URLs)
};

// What to look for on each platform
export const APIFY_X_QUERIES  = [
  "UAE security", "UAE politics", "Emirates government",
  "الإمارات الأمن", "الإمارات سياسة", "أبوظبي حكومة"
];

// --- X: heads of state, governments and ruling families ----------------
// The account IS the filter: everything these handles post is collected and
// routed to the "positive / official" tab without a keyword gate.
//
// A NOTE ON HANDLES, because it decides how well this list ages:
// office accounts (@POTUS, @Elysee, @Bundeskanzler, @PresidencyZA) survive
// elections; personal accounts belong to whoever held the job when this was
// written and go quiet the day they leave. Office handles are preferred below
// wherever one exists. A handle that is wrong or retired simply returns
// nothing — it never breaks a run — so prune and add freely.
export const APIFY_X_LEADERS = [
  // ============================= MIDDLE EAST =============================
  { handle: "MohamedBinZayed", name: "Sheikh Mohamed bin Zayed",        region: "uae" },
  { handle: "HHShkMohd",       name: "Sheikh Mohammed bin Rashid",      region: "uae" },
  { handle: "HamdanMohammed",  name: "Sheikh Hamdan bin Mohammed",      region: "uae" },
  { handle: "MaktoumMohammed", name: "Sheikh Maktoum bin Mohammed",     region: "uae" },
  { handle: "ABZayed",         name: "Sheikh Abdullah bin Zayed",       region: "uae" },
  { handle: "UAEmediaoffice",  name: "UAE Media Office",                region: "uae" },
  { handle: "MoFAUAE",         name: "UAE Ministry of Foreign Affairs", region: "uae" },
  { handle: "wamnews",         name: "WAM",                             region: "uae" },
  { handle: "KingSalman",      name: "King Salman (Saudi Arabia)",      region: "me" },
  { handle: "KSAMOFA",         name: "Saudi Foreign Ministry",          region: "me" },
  { handle: "TamimBinHamad",   name: "Emir Tamim bin Hamad (Qatar)",    region: "me" },
  { handle: "AmiriDiwan",      name: "Amiri Diwan (Qatar)",             region: "me" },
  { handle: "KingAbdullahII",  name: "King Abdullah II (Jordan)",       region: "me" },
  { handle: "QueenRania",      name: "Queen Rania (Jordan)",            region: "me" },
  { handle: "RHCJO",           name: "Royal Hashemite Court (Jordan)",  region: "me" },
  { handle: "kuwaitmofa",      name: "Kuwait Foreign Ministry",         region: "me" },
  { handle: "FMofOman",        name: "Oman Foreign Ministry",           region: "me" },
  { handle: "bahdiplomatic",   name: "Bahrain Foreign Ministry",        region: "me" },
  { handle: "AlsisiOfficial",  name: "President el-Sisi (Egypt)",       region: "me" },
  { handle: "IsraeliPM",       name: "Prime Minister of Israel",        region: "me" },
  { handle: "RTErdogan",       name: "President Erdogan (Turkey)",      region: "me" },
  { handle: "trpresidency",    name: "Turkish Presidency",              region: "me" },
  { handle: "Iraqi_GOV",       name: "Government of Iraq",              region: "me" },

  // ============================== AMERICAS ===============================
  { handle: "POTUS",           name: "President of the United States",  region: "am" },
  { handle: "WhiteHouse",      name: "The White House",                 region: "am" },
  { handle: "StateDept",       name: "US State Department",             region: "am" },
  { handle: "CanadianPM",      name: "Prime Minister of Canada",        region: "am" },
  { handle: "PresidenciaMX",   name: "Presidency of Mexico",            region: "am" },
  { handle: "planalto",        name: "Presidency of Brazil",            region: "am" },
  { handle: "CasaRosada",      name: "Presidency of Argentina",         region: "am" },
  { handle: "GobiernodeChile", name: "Government of Chile",             region: "am" },
  { handle: "infopresidencia", name: "Presidency of Colombia",          region: "am" },
  { handle: "presidenciaperu", name: "Presidency of Peru",              region: "am" },

  // =============================== EUROPE ================================
  { handle: "10DowningStreet", name: "UK Prime Minister's Office",      region: "eu" },
  { handle: "RoyalFamily",     name: "The British Royal Family",        region: "eu" },
  { handle: "KensingtonRoyal", name: "Prince & Princess of Wales",      region: "eu" },
  { handle: "Elysee",          name: "Presidency of France",            region: "eu" },
  { handle: "Bundeskanzler",   name: "Chancellor of Germany",           region: "eu" },
  { handle: "Palazzo_Chigi",   name: "Prime Minister of Italy",         region: "eu" },
  { handle: "desdelamoncloa",  name: "Government of Spain",             region: "eu" },
  { handle: "CasaReal",        name: "Spanish Royal Household",         region: "eu" },
  { handle: "MonarchieBe",     name: "Belgian Monarchy",                region: "eu" },
  { handle: "MinPres",         name: "Prime Minister of the Netherlands", region: "eu" },
  { handle: "Statsmin",        name: "Prime Minister of Denmark",       region: "eu" },
  { handle: "SweMFA",          name: "Swedish Foreign Ministry",        region: "eu" },
  { handle: "Statsmin_kontor", name: "Prime Minister of Norway",        region: "eu" },
  { handle: "KPRM",            name: "Chancellery of Poland",           region: "eu" },
  { handle: "ZelenskyyUa",     name: "President Zelenskyy (Ukraine)",   region: "eu" },
  { handle: "APUkraine",       name: "Presidency of Ukraine",           region: "eu" },
  { handle: "KremlinRussia_E", name: "Kremlin (Russia)",                region: "eu" },
  { handle: "mfa_russia",      name: "Russian Foreign Ministry",        region: "eu" },
  { handle: "merrionstreet",   name: "Government of Ireland",           region: "eu" },
  { handle: "PrimeministerGR", name: "Prime Minister of Greece",        region: "eu" },
  { handle: "eucopresident",   name: "President of the European Council", region: "eu" },
  { handle: "EU_Commission",   name: "European Commission",             region: "eu" },
  { handle: "NATO",            name: "NATO",                            region: "eu" },

  // ================================ ASIA =================================
  { handle: "PMOIndia",        name: "Prime Minister's Office (India)", region: "as" },
  { handle: "MEAIndia",        name: "Indian Foreign Ministry",         region: "as" },
  { handle: "MFA_China",       name: "Chinese Foreign Ministry",        region: "as" },
  { handle: "JPN_PMO",         name: "Prime Minister's Office (Japan)", region: "as" },
  { handle: "MofaJapan_en",    name: "Japanese Foreign Ministry",       region: "as" },
  { handle: "MOFAkr_eng",      name: "Korean Foreign Ministry",         region: "as" },
  { handle: "PakPMO",          name: "Prime Minister's Office (Pakistan)", region: "as" },
  { handle: "Kemlu_RI",        name: "Indonesian Foreign Ministry",     region: "as" },
  { handle: "MFAsingapore",    name: "Singapore Foreign Ministry",      region: "as" },
  { handle: "MalaysiaMFA",     name: "Malaysian Foreign Ministry",      region: "as" },
  { handle: "MFAThai",         name: "Thai Foreign Ministry",           region: "as" },
  { handle: "pcogovph",        name: "Government of the Philippines",   region: "as" },
  { handle: "AkordaPress",     name: "Presidency of Kazakhstan",        region: "as" },

  // =============================== AFRICA ================================
  { handle: "_AfricanUnion",   name: "African Union",                   region: "af" },
  { handle: "PresidencyZA",    name: "Presidency of South Africa",      region: "af" },
  { handle: "NGRPresident",    name: "Presidency of Nigeria",           region: "af" },
  { handle: "StateHouseKenya", name: "State House Kenya",               region: "af" },
  { handle: "GhanaPresidency", name: "Presidency of Ghana",             region: "af" },
  { handle: "PaulKagame",      name: "President Kagame (Rwanda)",       region: "af" },
  { handle: "UrugwiroVillage", name: "Presidency of Rwanda",            region: "af" },
  { handle: "AbiyAhmedAli",    name: "Prime Minister of Ethiopia",      region: "af" },
  { handle: "PR_Senegal",      name: "Presidency of Senegal",           region: "af" },

  // ========================= AUSTRALIA & PACIFIC =========================
  { handle: "AustralianPM",    name: "Prime Minister of Australia",     region: "oc" },
  { handle: "dfat",            name: "Australian Foreign Affairs",      region: "oc" },
  { handle: "nzgovt",          name: "New Zealand Government",          region: "oc" },
  { handle: "beehivegovtnz",   name: "New Zealand Beehive",             region: "oc" },

  // ============================ GLOBAL BODIES ============================
  { handle: "UN",              name: "United Nations",                  region: "gl" },
  { handle: "antonioguterres", name: "UN Secretary-General",            region: "gl" },

  // ===================== PERSONAL ACCOUNTS OF SERVING LEADERS =============
  // These sit alongside the office handles above, not instead of them: a leader
  // writing in the first person says things a press office never posts.
  //
  // They are also the entries that go stale fastest — each one belongs to
  // whoever held the job when this file was written, and goes quiet the day
  // they leave office. Expect to prune this block after elections. A dead
  // handle returns nothing; it never breaks a run.
  { handle: "realDonaldTrump", name: "President Trump (United States)",  region: "am" },
  { handle: "VP",              name: "Vice President (United States)",   region: "am" },
  { handle: "MarkJCarney",     name: "PM Carney (Canada)",               region: "am" },
  { handle: "Claudiashein",    name: "President Sheinbaum (Mexico)",     region: "am" },
  { handle: "LulaOficial",     name: "President Lula (Brazil)",          region: "am" },
  { handle: "JMilei",          name: "President Milei (Argentina)",      region: "am" },
  { handle: "Keir_Starmer",    name: "PM Starmer (United Kingdom)",      region: "eu" },
  { handle: "EmmanuelMacron",  name: "President Macron (France)",        region: "eu" },
  { handle: "_FriedrichMerz",  name: "Chancellor Merz (Germany)",        region: "eu" },
  { handle: "GiorgiaMeloni",   name: "PM Meloni (Italy)",                region: "eu" },
  { handle: "sanchezcastejon", name: "PM Sanchez (Spain)",               region: "eu" },
  { handle: "donaldtusk",      name: "PM Tusk (Poland)",                 region: "eu" },
  { handle: "kmitsotakis",     name: "PM Mitsotakis (Greece)",           region: "eu" },
  { handle: "MichealMartinTD", name: "Taoiseach Martin (Ireland)",       region: "eu" },
  { handle: "jonasgahrstore",  name: "PM Store (Norway)",                region: "eu" },
  { handle: "SwedishPM",       name: "Prime Minister of Sweden",         region: "eu" },
  { handle: "vonderleyen",     name: "President von der Leyen (EU)",     region: "eu" },
  { handle: "netanyahu",       name: "PM Netanyahu (Israel)",            region: "me" },
  { handle: "narendramodi",    name: "PM Modi (India)",                  region: "as" },
  { handle: "CMShehbaz",       name: "PM Sharif (Pakistan)",             region: "as" },
  { handle: "prabowo",         name: "President Prabowo (Indonesia)",    region: "as" },
  { handle: "bongbongmarcos",  name: "President Marcos (Philippines)",   region: "as" },
  { handle: "CyrilRamaphosa",  name: "President Ramaphosa (South Africa)", region: "af" },
  { handle: "officialABAT",    name: "President Tinubu (Nigeria)",       region: "af" },
  { handle: "WilliamsRuto",    name: "President Ruto (Kenya)",           region: "af" },
  { handle: "AlboMP",          name: "PM Albanese (Australia)",          region: "oc" },
  { handle: "chrisluxonmp",    name: "PM Luxon (New Zealand)",           region: "oc" }
];

// X handles are at most 15 characters of [A-Za-z0-9_]. A typo would otherwise
// fail silently forever, so it is called out once at boot.
for (const l of APIFY_X_LEADERS) {
  if (!/^[A-Za-z0-9_]{1,15}$/.test(l.handle))
    console.warn(`[config] invalid X handle "${l.handle}" (${l.name}) — it will return nothing`);
}

// Kept for backward compatibility with earlier versions of this config.
export const APIFY_X_ROYALS = APIFY_X_LEADERS;

// --- X: political & economic reporting, routed by region -----------------
// Each entry's region decides which map area and filter chip the post lands in,
// so a post never has to name a country in its own text to be placed correctly.
export const APIFY_X_REGIONS = [
  { region: "me", query: "(Gulf OR GCC OR \"Middle East\") (politics OR economy OR sanctions OR summit)" },
  { region: "me", query: "(الخليج OR \"الشرق الأوسط\") (سياسة OR اقتصاد OR عقوبات OR قمة)" },
  { region: "am", query: "(\"United States\" OR Washington) (foreign policy OR sanctions OR economy) Gulf OR UAE" },
  { region: "eu", query: "(Europe OR Brussels OR EU) (foreign policy OR sanctions OR trade) Gulf OR UAE" },
  { region: "as", query: "(China OR India OR Asia) (trade OR economy OR security) Gulf OR UAE" },
  { region: "af", query: "(Africa OR Sudan OR Egypt OR Libya) (politics OR conflict OR economy) UAE OR Gulf" },
  { region: "gl", query: "(geopolitics OR \"global economy\" OR sanctions) (UAE OR Emirates OR Gulf)" }
];

export const APIFY_HASHTAGS   = ["UAE", "Dubai", "AbuDhabi"];
export const APIFY_FB_PAGES   = []; // e.g. ["https://www.facebook.com/AlJazeera"]

// Optional paid modules — leave blank to disable.
export const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN || "";
export const X_QUERY = process.env.X_QUERY || "(UAE OR Emirates) (security OR political OR military) -is:retweet lang:en";

// Meta Graph API (for Instagram accounts YOU own/manage). Leave blank to disable.
export const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN || "";
export const IG_USER_ID = process.env.IG_USER_ID || "";

export const MAX_ITEMS = 2000;
// Newest social posts protected from being evicted by the much faster news feed
export const SOCIAL_RESERVE = Number(process.env.SOCIAL_RESERVE || 400); // rolling store cap
