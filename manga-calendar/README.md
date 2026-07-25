# Next Volume — Manga Release Calendar

A Next.js site tracking upcoming English manga volume release dates across
Viz, Kodansha USA, Yen Press, Seven Seas, and Square Enix Manga.

## What's here (v1)

- **Homepage shelf feed** — releases grouped into This Week / This Month / Next Month / Later
- **Series pages** (`/series/[slug]`) — release history + upcoming volumes per title
- **Publisher pages** (`/publishers`, `/publishers/[slug]`) — browse by imprint
- **Amazon affiliate links** on every release card (swap in your real Associates tag — see below)
- **26 seed series** across the 5 publishers — a starter set, expand toward 30-50 (see below)

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000. (`npm run dev` automatically regenerates
site data from the CSVs first — see "Data model" below.)

## Deploy (free tier)

The fastest path is **Vercel** (built by the makers of Next.js, zero-config):

1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → import the repo
3. Deploy — no config needed, free tier covers this easily

## Before you launch — replace the placeholders

1. **Amazon affiliate tag**: in `lib/data.ts`, `amazonAffiliateLink()` — swap
   `"AFFILIATE_TAG"` for your real Amazon Associates tracking ID. Consider
   adding RightStuf/B&N affiliate links the same way once you have those
   accounts.
2. **Release dates are placeholders.** See `DATA_WORKFLOW.md` for the full
   process — manual spreadsheet entry to start, scraper templates once that
   gets tedious, and why Amazon is handled differently from publisher sites.
3. **Expand the series list** from 26 toward the 30–50 target — add rows to
   `data/series.csv`, everything else (pages, shelves, affiliate links)
   wires up automatically.

## Data model

Source of truth is `data/series.csv` and `data/releases.csv` — plain CSVs so
they're editable by hand or by a scraper. Running `npm run build-data`
(automatic before `dev`/`build`) converts them into `lib/data.generated.json`,
which the site actually imports. See `DATA_WORKFLOW.md` for the full data
collection process, and `scripts/scrape.mjs` for the scraper templates.

If you want a v2 with a "My List" notification feature, this is the point
where you'd move the CSVs into a real database (e.g. Supabase or Postgres) so
users can follow series and get notified — the CSV model is intentionally
simple for now.
