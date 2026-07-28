// Scraper for pulling upcoming volume dates (and cover images) from each
// publisher's catalog/upcoming-releases page.
//
// Usage:
//   node scripts/scrape.mjs seven-seas
//   node scripts/scrape.mjs viz
//   node scripts/scrape.mjs kodansha
//   node scripts/scrape.mjs yen-press
//   node scripts/scrape.mjs square-enix
//
// Two things happen on every run:
//   1. New releases get appended to data/releases.csv (never duplicates an
//      existing seriesSlug+volume).
//   2. For any matched series that doesn't have a coverImage yet in
//      data/series.csv, this fills it in automatically using that
//      publisher's own official cover image for that release — no manual
//      image-hunting needed, and it keeps working for every future series
//      you add, forever, since this runs on the daily automated schedule.
//
// Run `npm run build-data` afterward to regenerate the site's data.
//
// All five adapters below are CONFIRMED WORKING against real page HTML
// (2026-07) — not placeholders. Pages change over time, so if one stops
// matching, use `--file path/to/saved.html` to test against a saved copy
// while you fix the selectors (see DATA_WORKFLOW.md).

import * as cheerio from "cheerio";
import { readFileSync, writeFileSync, appendFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
const seriesCsvPath = path.join(dataDir, "series.csv");
const releasesCsvPath = path.join(dataDir, "releases.csv");

// Decodes \uXXXX escape sequences left over from extracting strings out of a
// JS-string-literal blob (used by the Square Enix adapter).
function unescapeUnicode(s) {
  return s.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

// ---------------------------------------------------------------------------
// PER-PUBLISHER ADAPTERS — each item can optionally include a `coverImage`
// URL (the publisher's own official cover art for that release), used to
// auto-backfill data/series.csv when a matched series has no cover yet.
// ---------------------------------------------------------------------------
const ADAPTERS = {
  "seven-seas": {
    // The page has two parallel views of the same releases: a visual
    // thumbnail grid (.thumb-list, has cover images, less structured data)
    // and a sortable table (#releasedates, clean structured data, no
    // images). We read both — the table drives the actual parsing, and a
    // title->image lookup built from the thumbnail grid supplies covers.
    url: "https://sevenseasentertainment.com/release-dates/",
    onlyFormats: ["Manga", "Manhwa", "Manhua"], // skip Novel/Light Novel/Audiobook/OEL
    extract($) {
      const imageByTitle = new Map();
      $(".thumb-list .thumb a[title]").each((_, a) => {
        const title = $(a).attr("title")?.trim();
        const src = $(a).find("img").attr("src");
        if (title && src) imageByTitle.set(title, src);
      });

      const results = [];
      $("table#releasedates tr#volumes").each((_, el) => {
        const tds = $(el).find("td");
        const rawDate = $(tds[0]).text().trim(); // already YYYY-MM-DD
        const rawTitleFull = $(tds[1]).find("strong").text().trim();
        const format = $(tds[2]).text().trim();
        if (!rawTitleFull || !rawDate) return;

        const cleaned = rawTitleFull
          .replace(/\s*\((Manga|Light Novel|Novel|Manhwa|Manhua|Audiobook)\)\s*/gi, " ")
          .replace(/\s*\[Ebook\]\s*/gi, "")
          .trim();

        const volMatch = cleaned.match(/^(.*?)\s+Vol\.\s*(\d+)/i);
        const rawTitle = volMatch ? volMatch[1].trim() : cleaned;
        const rawVolume = volMatch ? volMatch[2] : null;

        results.push({
          rawTitle,
          rawVolume,
          rawDate,
          format,
          coverImage: imageByTitle.get(rawTitleFull) || null,
        });
      });
      return results;
    },
  },

  viz: {
    // Same "two parallel views" situation as Seven Seas: the #m-grid shelf
    // cards carry cover images, the #m-table carries clean structured data.
    // The URL is computed fresh on every run for whatever the current month
    // actually is — a hardcoded month would eventually go stale and stop
    // finding new releases once that month passes.
    getUrl() {
      const now = new Date();
      return `https://www.viz.com/calendar/${now.getFullYear()}/${now.getMonth() + 1}`;
    },
    onlyFormats: ["Manga"], // skips Novel / Graphic Novel rows
    extract($) {
      const year = new Date().getFullYear();

      const imageByTitle = new Map();
      $("#m-grid article").each((_, article) => {
        const titleLink = $(article).find("a.color-off-black").first();
        const title = titleLink.text().trim();
        const src = $(article).find("img.lazy").attr("data-original");
        if (title && src) imageByTitle.set(title, src);
      });

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
          coverImage: imageByTitle.get(fullTitle) || null,
        });
      });
      return results;
    },
  },

  kodansha: {
    // The release calendar groups releases into weekly <section> blocks,
    // each with an <h2> header carrying the actual date and a grid of
    // items below — each item already has its own cover image inline.
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

            const coverImage = $(item).find("img.release-calendar__item-image").attr("src") || null;

            results.push({
              rawTitle: vm[1].trim(),
              rawVolume: vm[2],
              rawDate: dateStr,
              format: "Manga",
              coverImage,
            });
          });
      });
      return results;
    },
  },

  "yen-press": {
    // The calendar page mixes Manga / Novels / Audio / Comics in one feed.
    // Each release is an <a href="/titles/..."> card with a ".white-label"
    // format tag, a ".label-date", a cover image, and the title.
    url: "https://yenpress.com/calendar",
    onlyFormats: ["Manga"],
    extract($) {
      const year = new Date().getFullYear(); // page defaults to the current year
      const results = [];

      $('a[href^="/titles/"]').each((_, a) => {
        const dateEl = $(a).find(".label-date").first();
        if (dateEl.length === 0) return; // not a release card

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

        const coverImage = $(a).find("img.genre-col-img").attr("src") || null;

        results.push({
          rawTitle: name,
          rawVolume: vol,
          rawDate: `${month} ${day}, ${year}`,
          format,
          coverImage,
        });
      });
      return results;
    },
  },

  "square-enix": {
    // This site is a Next.js app — the release list is embedded as a JSON
    // blob inside a self.__next_f.push(...) script tag, backslash-escaped
    // as a JS string literal. We regex the raw HTML text directly rather
    // than fighting cheerio. Each product's coverArt.image is a relative
    // path that needs the CDN prefix below. NOTE: this site only publishes
    // month-level dates (no exact day) — every date defaults to the 1st.
    //
    // IMPORTANT: the embedded blob contains this publisher's ENTIRE catalog
    // history back to 2020, not just upcoming releases — so we filter out
    // anything more than ~45 days in the past, otherwise every run re-adds
    // years of old back volumes as if they were new.
    url: "https://squareenixmangaandbooks.square-enix-games.com/en-us/release-calendar",
    imageBaseUrl: "https://fyre.cdn.sewest.net/",
    extractRaw(html) {
      const results = [];
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 45);

      const re =
        /\\"title\\":\\"((?:[^\\]|\\.)*?)\\",\\"slug\\":\\"(.*?)\\",\\"coverArt\\":\{\\"image\\":\\"(.*?)\\"[\s\S]*?\\"releaseMonth\\":\\"([A-Za-z]+ \d{4})\\"/g;
      let m;
      while ((m = re.exec(html)) !== null) {
        const rawFullTitle = unescapeUnicode(m[1]);
        const imagePath = m[3];
        const releaseMonth = m[4]; // e.g. "July 2026"

        const vm = rawFullTitle.match(/^(.*),\s*Volume\s+(\d+)$/i);
        if (!vm) continue; // artbook / one-shot without a plain volume — skip for now

        const parsedMonth = new Date(`${releaseMonth} 1`);
        if (isNaN(parsedMonth.getTime()) || parsedMonth < cutoff) continue; // too old — part of the historical backlog, not an upcoming release

        results.push({
          rawTitle: vm[1].trim(),
          rawVolume: vm[2],
          rawDate: `${releaseMonth} 1`, // day defaults to the 1st — this site doesn't publish exact days
          format: "Manga",
          coverImage: imagePath ? `${this.imageBaseUrl}${imagePath}` : null,
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
  const raw = readFileSync(seriesCsvPath, "utf-8");
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
  const targetUrl = typeof adapter.getUrl === "function" ? adapter.getUrl() : adapter.url;
  if (localFile) {
    console.log(`Reading local test file ${localFile} (not hitting the live site) ...`);
    html = readFileSync(localFile, "utf-8");
  } else {
    console.log(`Fetching ${targetUrl} ...`);
    let res;
    try {
      res = await fetch(targetUrl, {
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

  let rawItems;
  if (adapter.extractRaw) {
    rawItems = adapter.extractRaw(html);
  } else {
    const $ = cheerio.load(html);
    rawItems = adapter.extract($);
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
  const existingReleasesRaw = readFileSync(releasesCsvPath, "utf-8");
  const existingReleases = parse(existingReleasesRaw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  const existingKeys = new Set(existingReleases.map((r) => `${r.seriesSlug}::${r.volume}`));

  const newRows = [];
  const coverUpdates = new Map(); // seriesSlug -> imageUrl, only for series currently missing one
  let nextId = existingReleases.length + 1;

  for (const parsed of rawItems) {
    const { rawTitle, rawVolume, rawDate, format, coverImage } = parsed || {};
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

    // Cover-image backfill runs for every matched series regardless of
    // whether this particular release turns out to be new or a duplicate —
    // we just need one good image per series, whenever we first see one.
    if (coverImage && !coverUpdates.has(seriesSlug)) {
      const seriesRow = seriesRows.find((s) => s.slug === seriesSlug);
      if (seriesRow && !(seriesRow.coverImage && seriesRow.coverImage.trim())) {
        coverUpdates.set(seriesSlug, coverImage);
      }
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

  if (newRows.length > 0) {
    const csvLines = newRows.map(
      (r) => `${r.id},${r.seriesSlug},${r.volume},${r.date},${r.format},${r.confirmed},${r.source}`
    );
    appendFileSync(releasesCsvPath, "\n" + csvLines.join("\n") + "\n");
    console.log(`✅ Appended ${newRows.length} new release(s) to data/releases.csv`);
  } else {
    console.log("No new releases found (either nothing new, or nothing matched).");
  }

  if (coverUpdates.size > 0) {
    for (const row of seriesRows) {
      if (coverUpdates.has(row.slug)) {
        row.coverImage = coverUpdates.get(row.slug);
      }
    }
    const columns = ["slug", "title", "publisher", "genre", "format", "status", "amazonQuery", "coverImage"];
    const csvOutput = stringify(seriesRows, { header: true, columns });
    writeFileSync(seriesCsvPath, csvOutput);
    console.log(`🖼️  Added cover images for ${coverUpdates.size} series in data/series.csv`);
  }

  if (newRows.length > 0 || coverUpdates.size > 0) {
    console.log('Run "npm run build-data" to regenerate the site data.');
  }
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