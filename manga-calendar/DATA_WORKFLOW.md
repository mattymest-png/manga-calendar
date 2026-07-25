# Data Collection Workflow

This is the actual step-by-step process for keeping release dates current.
Three tiers, roughly in order of "do this first":

## Tier 1 — Manual spreadsheet entry (start here)

This is genuinely the right way to begin, not just a fallback. It's how the
doc's own v1 plan described it: hand-pick your series, check the publisher's
seasonal catalog every few weeks, update the sheet.

1. Open `data/series.csv` and `data/releases.csv` — they're plain CSVs, so
   you can edit them directly, or open in Google Sheets/Excel and export back
   to CSV when done.
2. Visit each publisher's "upcoming releases" or seasonal catalog page:
   - Viz: viz.com — look for their manga upcoming-releases listing
   - Kodansha USA: kodansha.us — solicitations/upcoming page
   - Yen Press: yenpress.com — browse by series or their upcoming page
   - Seven Seas: sevenseasentertainment.com — upcoming releases page
   - Square Enix Manga: square-enix-books.com — upcoming page
3. For each series you track, add/update a row in `releases.csv` with
   `source=publisher` and `confirmed=true`.
4. For early listings you find on Amazon/B&N before the publisher confirms,
   add them with `source=amazon` and `confirmed=false` — the site already
   renders these with a "preorder" stamp automatically.
5. Run `npm run build-data` to regenerate the site, then `npm run dev` (or
   redeploy) to see it live.

This alone gets you a real, accurate site. Budget maybe 20–30 minutes every
1–2 weeks once you're tracking 30–50 series.

## Tier 2 — Scraper templates (once manual entry gets tedious)

`scripts/scrape.mjs` has a per-publisher adapter pattern already wired up to
append straight into `releases.csv`. It is a **template, not a finished
scraper** — I can't fetch viz.com, kodansha.us, etc. from this environment to
find their real selectors, so you'll need to do that step once, locally:

1. Open the publisher's upcoming-releases page in your browser
2. Right-click a release listing → Inspect
3. Note the CSS class/selector wrapping one release "card," and the
   sub-elements for title, volume, and date
4. Edit the matching adapter block in `scripts/scrape.mjs` (search for
   `SELECTOR BELOW`)
5. Run `node scripts/scrape.mjs viz` (swap in the publisher slug) and check
   the console output — it tells you exactly what it matched, skipped, or
   couldn't parse
6. Once it looks right, `npm run build-data`

**If a page returns a 403 or looks empty when fetched:** that publisher's
site likely renders content with JavaScript or blocks simple bot requests.
The fix is swapping `fetch()` for a headless browser tool (Playwright or
Puppeteer) that actually runs the page's JS before reading the HTML — same
adapter pattern, different fetch mechanism. Worth doing only for the
publishers where the simple version fails.

**Etiquette/legal notes:**
- Check `robots.txt` on each site (e.g. `viz.com/robots.txt`) before
  scraping, and don't scrape pages it disallows.
- Keep requests infrequent (a few times a week, not continuously) — you're
  polling a catalog page, not a live feed.
- Identify your bot honestly in the `User-Agent` header (already set up in
  the template) rather than spoofing a browser.
- If a publisher offers an RSS feed, API, or partner program, prefer that
  over scraping entirely — worth emailing to ask once you have real traffic.

## Tier 3 — Amazon/B&N preorder listings

Deliberately **not** a scraper, for a few reasons: Amazon's ToS explicitly
prohibits scraping, their pages are JS-heavy and aggressively bot-detected
(frequent CAPTCHAs, IP blocks), and — as your own notes already flagged —
subscription/digital sources don't have Amazon-style affiliate programs
anyway, so the payoff is narrower than it looks.

Two better paths:
1. **Manual spot-check** (fine at this scale): when a publisher hasn't
   confirmed a date yet, search Amazon by hand for `"[series] volume [N]"`
   and copy any preorder date you find into `releases.csv` with
   `source=amazon`, `confirmed=false`.
2. **Amazon Product Advertising API**: once you have an approved Amazon
   Associates account with some sales history, this gives you legitimate,
   ToS-compliant programmatic access to listing data (including preorder
   dates) — worth switching to once the site has real affiliate traffic to
   qualify for it.

## Keeping it accurate over time

- Re-check `confirmed=false` rows periodically — publishers often confirm a
  date a few months out; flip them to `confirmed=true, source=publisher`
  once you see it on the official catalog.
- Dates shift constantly in this industry (delays are the norm, not the
  exception) — the "preorder" stamp on unconfirmed rows is there specifically
  so visitors don't treat a soft date as certain.
