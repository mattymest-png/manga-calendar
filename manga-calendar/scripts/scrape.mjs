// Scraper template for pulling upcoming volume dates from a publisher's
// catalog/upcoming-releases page and appending them to data/releases.csv.
//
// IMPORTANT: This is a starting template, not a finished scraper. Each
// publisher's page has different HTML, and pages change over time. You'll
// need to:
//   1. Open the target URL in your browser
//   2. View source / inspect element on one release listing
//   3. Fill in the CSS selectors marked SELECTOR BELOW
//   4. Run `node scripts/scrape.mjs <publisher-slug>` and check the output
//
// Usage:
//   node scripts/scrape.mjs viz
//   node scripts/scrape.mjs kodansha
//
// This appends new rows to data/releases.csv (it will NOT create duplicate
// rows for a seriesSlug+volume that already exists). Run `npm run build-data`
// afterward to regenerate the site's data.

import * as cheerio from "cheerio";
import { readFileSync, writeFileSync, appendFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");

// ---------------------------------------------------------------------------
// PER-PUBLISHER CONFIG — fill in real selectors after inspecting the page.
// These are placeholders based on common catalog-page patterns; they will
// almost certainly need adjusting to match the real markup.
// ---------------------------------------------------------------------------
const ADAPTERS = {
  viz: {
    // Monthly calendar pages, e.g. /calendar/2026/8 for August 2026 — loop over
    // months to build a rolling window. This adapter fetches one month; call
    // it repeatedly with different months once you've confirmed selectors.
    url: "https://www.viz.com/calendar/2026/8",
    itemSelector: ".product-thumb, .upcoming-item", // SELECTOR BELOW: adjust
    parseItem($, el) {
      const title = $(el).find(".product-title, .title").first().text().trim();
      const volumeText = $(el).find(".volume, .subtitle").first().text().trim();
      const dateText = $(el).find(".release-date, .date").first().text().trim();
      return { rawTitle: title, rawVolume: volumeText, rawDate: dateText };
    },
  },
  kodansha: {
    url: "https://kodansha.us/calendar/",
    itemSelector: ".upcoming-title", // SELECTOR BELOW: adjust
    parseItem($, el) {
      const title = $(el).find(".title").first().text().trim();
      const volumeText = $(el).find(".volume-number").first().text().trim();
      const dateText = $(el).find(".pub-date").first().text().trim();
      return { rawTitle: title, rawVolume: volumeText, rawDate: dateText };
    },
  },
  "yen-press": {
    url: "https://yenpress.com/calendar",
    // NOTE: this calendar mixes Manga / Novels / Audio / Comics — filter to
    // items tagged "Manga" once you see the real markup.
    itemSelector: ".book-card", // SELECTOR BELOW: adjust
    parseItem($, el) {
      const title = $(el).find(".book-title").first().text().trim();
      const volumeText = $(el).find(".book-volume").first().text().trim();
      const dateText = $(el).find(".book-date").first().text().trim();
      return { rawTitle: title, rawVolume: volumeText, rawDate: dateText };
    },
  },
  "seven-seas": {
    url: "https://sevenseasentertainment.com/release-dates/",
    itemSelector: ".release-row", // SELECTOR BELOW: adjust
    parseItem($, el) {
      const title = $(el).find(".release-title").first().text().trim();
      const volumeText = $(el).find(".release-volume").first().text().trim();
      const dateText = $(el).find(".release-date").first().text().trim();
      return { rawTitle: title, rawVolume: volumeText, rawDate: dateText };
    },
  },
  "square-enix": {
    // No dedicated calendar page found for this one as of writing — the site
    // mixes news/product listings. This URL is the best starting point, but
    // expect to lean more on manual entry from their press-release blog
    // (press.na.square-enix.com) for this publisher specifically.
    url: "https://squareenixmangaandbooks.square-enix-games.com/en-us",
    itemSelector: ".book-listing", // SELECTOR BELOW: adjust — likely needs rework
    parseItem($, el) {
      const title = $(el).find(".book-listing-title").first().text().trim();
      const volumeText = $(el).find(".book-listing-vol").first().text().trim();
      const dateText = $(el).find(".book-listing-date").first().text().trim();
      return { rawTitle: title, rawVolume: volumeText, rawDate: dateText };
    },
  },
};

// ---------------------------------------------------------------------------
// Matching scraped titles to your existing series.csv slugs
// ---------------------------------------------------------------------------
function loadSeries() {
  const raw = readFileSync(path.join(dataDir, "series.csv"), "utf-8");
  return parse(raw, { columns: true, skip_empty_lines: true, trim: true });
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function findSeriesSlug(rawTitle, seriesRows) {
  const target = slugify(rawTitle);
  const exact = seriesRows.find((s) => s.slug === target);
  if (exact) return exact.slug;
  // fallback: loose contains-match on title text
  const loose = seriesRows.find((s) =>
    slugify(s.title).includes(target) || target.includes(slugify(s.title))
  );
  return loose ? loose.slug : null;
}

function extractVolumeNumber(text) {
  const match = text.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function normalizeDate(text) {
  // Attempts to parse common formats like "August 12, 2026" or "8/12/2026"
  const d = new Date(text);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function scrape(publisherSlug) {
  const adapter = ADAPTERS[publisherSlug];
  if (!adapter) {
    console.error(
      `No adapter for "${publisherSlug}". Options: ${Object.keys(ADAPTERS).join(", ")}`
    );
    process.exit(1);
  }

  console.log(`Fetching ${adapter.url} ...`);
  const res = await fetch(adapter.url, {
    headers: {
      // Identify your scraper honestly and respect robots.txt / rate limits.
      "User-Agent": "NextVolumeBot/0.1 (+contact: you@example.com)",
    },
  });
  if (!res.ok) {
    console.error(`Fetch failed: ${res.status} ${res.statusText}`);
    console.error(
      "If this is a 403/anti-bot response, this page likely needs a headless browser (Playwright/Puppeteer) instead of a plain fetch — see README notes."
    );
    process.exit(1);
  }
  const html = await res.text();
  const $ = cheerio.load(html);
  const items = $(adapter.itemSelector);

  console.log(`Found ${items.length} candidate items with selector "${adapter.itemSelector}"`);
  if (items.length === 0) {
    console.error(
      "0 matches — the selector is almost certainly wrong for the real page. Inspect the page HTML and update ADAPTERS in this file."
    );
    process.exit(1);
  }

  const seriesRows = loadSeries();
  const existingReleasesRaw = readFileSync(path.join(dataDir, "releases.csv"), "utf-8");
  const existingReleases = parse(existingReleasesRaw, { columns: true, skip_empty_lines: true, trim: true });
  const existingKeys = new Set(existingReleases.map((r) => `${r.seriesSlug}::${r.volume}`));

  const newRows = [];
  let nextId = existingReleases.length + 1;

  items.each((_, el) => {
    const { rawTitle, rawVolume, rawDate } = adapter.parseItem($, el);
    if (!rawTitle || !rawVolume || !rawDate) return;

    const seriesSlug = findSeriesSlug(rawTitle, seriesRows);
    if (!seriesSlug) {
      console.log(`  Skipping "${rawTitle}" — not in series.csv (add it first if you want to track it)`);
      return;
    }

    const volume = extractVolumeNumber(rawVolume);
    const date = normalizeDate(rawDate);
    if (!volume || !date) {
      console.log(`  Skipping "${rawTitle}" — couldn't parse volume/date ("${rawVolume}" / "${rawDate}")`);
      return;
    }

    const key = `${seriesSlug}::${volume}`;
    if (existingKeys.has(key)) return; // already have this one

    newRows.push({
      id: `r${nextId++}`,
      seriesSlug,
      volume,
      date,
      format: "physical",
      confirmed: "true",
      source: "publisher",
    });
    existingKeys.add(key);
  });

  if (newRows.length === 0) {
    console.log("No new releases found (either nothing new, or nothing matched).");
    return;
  }

  const csvLines = newRows.map(
    (r) => `${r.id},${r.seriesSlug},${r.volume},${r.date},${r.format},${r.confirmed},${r.source}`
  );
  appendFileSync(path.join(dataDir, "releases.csv"), "\n" + csvLines.join("\n") + "\n");

  console.log(`✅ Appended ${newRows.length} new release(s) to data/releases.csv`);
  console.log('Run "npm run build-data" to regenerate the site data.');
}

const publisherArg = process.argv[2];
if (!publisherArg) {
  console.error("Usage: node scripts/scrape.mjs <publisher-slug>");
  console.error(`Available: ${Object.keys(ADAPTERS).join(", ")}`);
  process.exit(1);
}
scrape(publisherArg);
