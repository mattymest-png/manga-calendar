// Scraper for pulling upcoming volume dates from each publisher's
// catalog/upcoming-releases page and appending them to data/releases.csv.
//
// Usage:
//   node scripts/scrape.mjs seven-seas
//   node scripts/scrape.mjs viz
//   node scripts/scrape.mjs kodansha
//   node scripts/scrape.mjs yen-press
//   node scripts/scrape.mjs square-enix
//
// This appends new rows to data/releases.csv (it will NOT create duplicate
// rows for a seriesSlug+volume that already exists). Run `npm run build-data`
// afterward to regenerate the site's data.
//
// All five adapters below are CONFIRMED WORKING against real page HTML
// (2026-07) — not placeholders. Pages change over time, so if one stops
// matching, use `--file path/to/saved.html` to test against a saved copy
// while you fix the selectors (see DATA_WORKFLOW.md).

import * as cheerio from "cheerio";
import { readFileSync, appendFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");

// Decodes \uXXXX escape sequences left over from extracting strings out of a
// JS-string-literal blob (used by the Square Enix adapter).
function unescapeUnicode(s) {
  return s.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

// ---------------------------------------------------------------------------
// PER-PUBLISHER ADAPTERS
// ---------------------------------------------------------------------------
const ADAPTERS = {
  "seven-seas": {
    // The release-dates page has a sortable table (#releasedates) further
    // down from the visual thumbnail grid at the top; the table gives clean
    // ISO dates plus a format column (Manga / Light Novel / Manhwa / Novel /
    // Manhua / OEL / Audiobook), which is far easier to parse.
    url: "https://sevenseasentertainment.com/release-dates/",
    itemSelector: "table#releasedates tr#volumes",
    onlyFormats: ["Manga", "Manhwa", "Manhua"], // skip Novel/Light Novel/Audiobook/OEL
    parseItem($, el) {
      const tds = $(el).find("td");
      const rawDate = $(tds[0]).text().trim(); // already YYYY-MM-DD
      const rawTitleFull = $(tds[1]).find("strong").text().trim();
      const format = $(tds[2]).text().trim();

      const cleaned = rawTitleFull
        .replace(/\s*\((Manga|Light Novel|Novel|Manhwa|Manhua|Audiobook)\)\s*/gi, " ")
        .replace(/\s*\[Ebook\]\s*/gi, "")
        .trim();

      const volMatch = cleaned.match(/^(.*?)\s+Vol\.\s*(\d+)/i);
      const rawTitle = volMatch ? volMatch[1].trim() : cleaned;
      const rawVolume = volMatch ? volMatch[2] : null;

      return { rawTitle, rawVolume, rawDate, format };
    },
  },

  viz: {
    // Monthly calendar pages, e.g. /calendar/2026/8 for August 2026. The
    // page renders the same data twice (a card "shelf" and a #m-table) —
    // we only read the table, since it's cleanly structured with a format
    // column and a "Mon DD" date column (year comes from the URL itself).
    url: "https://www.viz.com/calendar/2026/7",
    onlyFormats: ["Manga"], // skips Novel / Graphic Novel rows
    extract($) {
      const yearMatch = this.url.match(/\/calendar\/(\d{4})\//);
      const year = yearMatch ? yearMatch[1] : new Date().getFullYear();
      const results = [];

      $("table#m-table tbody tr").each((_, tr) => {
        const tds = $(tr).find("td");
        const format = $(tds[2]).text().trim(); // Manga / Novel / Graphic Novel
        const fullTitle = $(tds[3]).find("a").first().text().trim();
        const dateText = $(tds[4]).text().trim(); // e.g. "Jul 07"
        if (!fullTitle || !dateText) return;

        // Titles look like "One Piece, Vol. 112"
        const m = fullTitle.match(/^(.*?),\s*Vol\.\s*(\d+)/i);
        if (!m) return; // one-shot / no plain volume number — skip for now

        results.push({
          rawTitle: m[1].trim(),
          rawVolume: m[2],
          rawDate: `${dateText}, ${year}`, // "Jul 07, 2026" — parseable
          format,
        });
      });
      return results;
    },
  },

  kodansha: {
    // The release calendar groups releases into weekly <section> blocks,
    // each with an <h2> header carrying the actual date (e.g. "Published on
    // Jul. 7, 2026" or "Releasing Aug. 18, 2026") and a grid of items below.
    url: "https://kodansha.us/calendar/",
    extract($) {
      const results = [];
      $("section.release-calendar__week").each((_, section) => {
        const headerText = $(section)
          .find("h2.release-calendar__week-header")
          .first()
          .text()
          .trim();
        const dm = headerText.match(/([A-Za-z]+)\.?\s+(\d{1,2}),\s*(\d{4})/);
        if (!dm) return;
        const dateStr = `${dm[1]} ${dm[2]}, ${dm[3]}`; // "Jul 7, 2026"

        $(section)
          .find(".release-calendar__item")
          .each((__, item) => {
            const titleText = $(item)
              .find("h3.release-calendar__item-title")
              .first()
              .text()
              .trim();
            if (!titleText) return;

            // Titles look like "WIND BREAKER Volume 25"
            const vm = titleText.match(/^(.*)\s+Volume\s+(\d+)$/i);
            if (!vm) return; // omnibus / no plain volume number — skip for now

            results.push({
              rawTitle: vm[1].trim(),
              rawVolume: vm[2],
              rawDate: dateStr,
              format: "Manga",
            });
          });
      });
      return results;
    },
  },

  "yen-press": {
    // The calendar page mixes Manga / Novels / Audio / Comics in one feed.
    // Each release is an <a href="/titles/..."> card with a ".white-label"
    // format tag, a ".label-date" (day number + month abbreviation, no
    // year), and the title in ".genre-col-txt h3".
    url: "https://yenpress.com/calendar",
    onlyFormats: ["Manga"],
    extract($) {
      const year = 2026; // page defaults to the current year — update if scraping a past/future year
      const results = [];

      $('a[href^="/titles/"]').each((_, a) => {
        const dateEl = $(a).find(".label-date").first();
        if (dateEl.length === 0) return; // not a release card

        // The day is a bare text node with a nested <span class="month">
        // right after it — strip the child span to isolate just the day.
        const day = dateEl.clone().children().remove().end().text().trim();
        const month = dateEl.find(".month").first().text().trim();
        if (!day || !month) return;

        const format = $(a).find(".white-label").first().text().trim();
        const titleText = $(a).find(".genre-col-txt h3").first().text().trim();
        if (!titleText) return;

        let name = null;
        let vol = null;
        let m = titleText.match(/^(.*?),?\s*Vol\.\s*(\d+)/i);
        if (m) {
          name = m[1].trim();
          vol = m[2];
        } else {
          m = titleText.match(/^(.*?):?\s*Volume\s+(\d+)/i);
          if (m) {
            name = m[1].replace(/\(.*?\)\s*$/, "").trim();
            vol = m[2];
          }
        }
        if (!vol) return; // chapter-only digital release / one-shot — skip for now

        results.push({
          rawTitle: name,
          rawVolume: vol,
          rawDate: `${month} ${day}, ${year}`,
          format,
        });
      });
      return results;
    },
  },

  "square-enix": {
    // This site is a Next.js app — the release list isn't in the rendered
    // HTML at all, it's embedded as a big JSON blob inside a
    // self.__next_f.push(...) script tag (React server-component payload),
    // backslash-escaped as a JS string literal. Rather than fight with
    // cheerio, we regex the raw HTML text directly for title/releaseMonth
    // pairs. NOTE: this site only publishes month-level dates (no exact
    // day), so every date defaults to the 1st of the month — verify/adjust
    // the actual day by hand once you know it.
    url: "https://squareenixmangaandbooks.square-enix-games.com/en-us/release-calendar",
    extractRaw(html) {
      const results = [];
      const re =
        /\\"title\\":\\"((?:[^\\]|\\.)*?)\\",\\"slug\\":\\"(.*?)\\"[\s\S]*?\\"releaseMonth\\":\\"([A-Za-z]+ \d{4})\\"/g;
      let m;
      while ((m = re.exec(html)) !== null) {
        const rawFullTitle = unescapeUnicode(m[1]);
        const releaseMonth = m[3]; // e.g. "July 2026"

        const vm = rawFullTitle.match(/^(.*),\s*Volume\s+(\d+)$/i);
        if (!vm) continue; // artbook / one-shot without a plain volume — skip for now

        results.push({
          rawTitle: vm[1].trim(),
          rawVolume: vm[2],
          rawDate: `${releaseMonth} 1`, // day defaults to the 1st — this site doesn't publish exact days
          format: "Manga",
        });
      }
      return results;
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
  const loose = seriesRows.find(
    (s) => slugify(s.title).includes(target) || target.includes(slugify(s.title))
  );
  return loose ? loose.slug : null;
}

function extractVolumeNumber(text) {
  const match = String(text).match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function normalizeDate(text) {
  const d = new Date(text);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function scrape(publisherSlug, localFile) {
  const adapter = ADAPTERS[publisherSlug];
  if (!adapter) {
    console.error(
      `No adapter for "${publisherSlug}". Options: ${Object.keys(ADAPTERS).join(", ")}`
    );
    process.exitCode = 1;
    return;
  }

  let html;
  if (localFile) {
    console.log(`Reading local test file ${localFile} (not hitting the live site) ...`);
    html = readFileSync(localFile, "utf-8");
  } else {
    console.log(`Fetching ${adapter.url} ...`);
    let res;
    try {
      res = await fetch(adapter.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
    } catch (err) {
      console.error(`Network error while fetching: ${err.message}`);
      process.exitCode = 1;
      return;
    }
    if (!res.ok) {
      console.error(`Fetch failed: ${res.status} ${res.statusText}`);
      console.error(
        "If this is a 403, the site's bot protection (e.g. Cloudflare) is blocking the request. Try again in a few minutes, or if it persists, this page likely needs a headless browser (Playwright/Puppeteer) instead of a plain fetch."
      );
      process.exitCode = 1;
      return;
    }
    html = await res.text();
  }

  // Three extraction styles depending on the adapter: raw-string regex
  // (Square Enix), a custom cheerio walk (Viz/Kodansha/Yen Press), or the
  // classic itemSelector + parseItem pattern (Seven Seas).
  let rawItems;
  if (adapter.extractRaw) {
    rawItems = adapter.extractRaw(html);
  } else if (adapter.extract) {
    const $ = cheerio.load(html);
    rawItems = adapter.extract($);
  } else {
    const $ = cheerio.load(html);
    rawItems = [];
    $(adapter.itemSelector).each((_, el) => {
      rawItems.push(adapter.parseItem($, el));
    });
  }

  console.log(`Found ${rawItems.length} candidate items for "${publisherSlug}"`);
  if (rawItems.length === 0) {
    console.error(
      "0 matches — the page structure has likely changed. Inspect the current HTML and update ADAPTERS in this file (or paste the new HTML back for help rebuilding the adapter)."
    );
    process.exitCode = 1;
    return;
  }

  const seriesRows = loadSeries();
  const existingReleasesRaw = readFileSync(path.join(dataDir, "releases.csv"), "utf-8");
  const existingReleases = parse(existingReleasesRaw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  const existingKeys = new Set(existingReleases.map((r) => `${r.seriesSlug}::${r.volume}`));

  const newRows = [];
  let nextId = existingReleases.length + 1;

  for (const parsed of rawItems) {
    const { rawTitle, rawVolume, rawDate, format } = parsed || {};
    if (!rawTitle || !rawDate) continue;

    if (adapter.onlyFormats && format && !adapter.onlyFormats.includes(format)) {
      continue;
    }
    if (!rawVolume) {
      console.log(
        `  Skipping "${rawTitle}" — one-shot with no volume number (not yet supported in schema)`
      );
      continue;
    }

    const seriesSlug = findSeriesSlug(rawTitle, seriesRows);
    if (!seriesSlug) {
      console.log(`  Skipping "${rawTitle}" — not in series.csv (add it first if you want to track it)`);
      continue;
    }

    const volume = extractVolumeNumber(rawVolume);
    const date = normalizeDate(rawDate);
    if (!volume || !date) {
      console.log(
        `  Skipping "${rawTitle}" — couldn't parse volume/date ("${rawVolume}" / "${rawDate}")`
      );
      continue;
    }

    const key = `${seriesSlug}::${volume}`;
    if (existingKeys.has(key)) continue;

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
  }

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
const fileFlagIndex = process.argv.indexOf("--file");
const localFile = fileFlagIndex !== -1 ? process.argv[fileFlagIndex + 1] : null;

if (!publisherArg) {
  console.error("Usage: node scripts/scrape.mjs <publisher-slug> [--file path/to/saved.html]");
  console.error(`Available: ${Object.keys(ADAPTERS).join(", ")}`);
  process.exit(1);
}
scrape(publisherArg, localFile);