# 🇦🇪 UAE Security & Political Monitor

A real-time dashboard that aggregates news and social posts about the UAE — focused on **security** and **political** topics worldwide — into one web page that refreshes **every 2 minutes**.

This repo is a working starter you can deploy today. News outlets and Reddit work out of the box for free. X/Twitter and Instagram are optional modules you switch on by adding API keys.

---

## What you get

- A Node/Express backend that polls sources on a schedule (`*/2 * * * *`), filters items by UAE + security/political keywords, deduplicates them, and serves a JSON API.
- A self-contained dashboard (`public/index.html`) that reads the API, auto-refreshes every 2 minutes, and lets you filter by source, topic, and keyword.
- Plug-in collectors for News (RSS), Reddit, X/Twitter, and Instagram.

---

## Run locally

```bash
npm install
npm start
# open http://localhost:3000
```

The first collection runs on boot; new items appear within ~2 minutes.

---

## Deploy (pick one — all have free tiers)

The dashboard needs a backend that stays awake to poll every 2 minutes, so it deploys to an app host, not static hosting.

### Railway (easiest)
1. Push this folder to a GitHub repo.
2. On railway.app → **New Project → Deploy from GitHub repo**.
3. Railway auto-detects Node and runs `npm start`. Done — you get a public URL.

### Render
1. Push to GitHub.
2. render.com → **New → Web Service** → pick the repo.
3. Build command `npm install`, start command `npm start`.

### Vercel (uses Cron instead of node-cron)
Vercel's serverless model sleeps between requests, so use **Vercel Cron** to hit a collection endpoint every 2 minutes instead of `node-cron`. Ask me and I'll adapt the code for it.

Set environment variables (below) in your host's dashboard.

---

## Sources & honest constraints

| Source | Status | Cost | Notes |
|---|---|---|---|
| **News (RSS)** | ✅ On by default | Free | Edit the feed list in `src/config.js`. |
| **Reddit** | ✅ On by default | Free | Public JSON. High volume may need a Reddit OAuth app to avoid rate limits. |
| **X / Twitter** | ⚙️ Optional | Paid (~$100/mo Basic tier) | No free auto-feed exists anymore. Add `X_BEARER_TOKEN`. |
| **Instagram** | ⚙️ Optional | Free API, restricted | Instagram **blocks scraping**. The only compliant route is Meta's Graph API for accounts **you own or manage** (`IG_ACCESS_TOKEN` + `IG_USER_ID`). It cannot legally pull arbitrary public UAE posts. |

For broad Instagram/TikTok "listening" across accounts you don't own, the realistic route is a paid social-listening provider (Brandwatch, Meltwater, Talkwalker) via their API — I can wire one in if you get a key.

## Environment variables

```
PORT=3000
CRON_SCHEDULE=*/2 * * * *      # change cadence here
X_BEARER_TOKEN=                # enable X module
X_QUERY=(UAE OR Emirates) (security OR political) -is:retweet lang:en
IG_ACCESS_TOKEN=               # enable Instagram (Graph API) module
IG_USER_ID=
```

## Tuning the focus

- **Sources:** edit `RSS_FEEDS` and `REDDIT_SUBS` in `src/config.js`.
- **Topic filter:** edit `KEYWORDS`. Only items matching a keyword are kept; items are auto-tagged `security` / `political`.

## Scaling to production

The starter uses an in-memory store (resets on restart). For persistence, add Postgres or Redis and replace `src/store.js` — the interface is only three functions (`upsertMany`, `getItems`, `stats`). Ask me and I'll drop in a Postgres version with historical search and charts.

## Files

```
src/config.js       sources, keywords, schedule, API keys
src/collectors.js   one function per source, normalized output
src/store.js        rolling dedup store (swap for a DB)
src/server.js       Express API + cron scheduler
public/index.html   the dashboard
```
