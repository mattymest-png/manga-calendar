// Converts data/series.csv + data/releases.csv into lib/data.generated.json
//
// Run this any time you hand-edit the CSVs OR after running a scraper that
// appends new rows to releases.csv. `npm run build-data` then `npm run dev`
// (or it runs automatically via `npm run build`, see package.json).

import { parse } from "csv-parse/sync";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");

function readCsv(file) {
  const raw = readFileSync(path.join(dataDir, file), "utf-8");
  // Normalize line endings: Windows editors/git often save CRLF, but our
  // own scripts append plain LF — a mix of the two in one file breaks
  // csv-parse's record-length detection. Stripping \r makes this immune
  // to whichever style is present, in any combination.
  const normalized = raw.replace(/\r\n/g, "\n");
  return parse(normalized, { columns: true, skip_empty_lines: true, trim: true });
}

const seriesRows = readCsv("series.csv");
const releaseRows = readCsv("releases.csv");

const series = seriesRows.map((r) => ({
  slug: r.slug,
  title: r.title,
  publisher: r.publisher,
  genre: r.genre.split("|").filter(Boolean),
  format: r.format,
  status: r.status,
  amazonQuery: r.amazonQuery,
  coverImage: r.coverImage && r.coverImage.trim() ? r.coverImage.trim() : undefined,
}));

const knownSlugs = new Set(series.map((s) => s.slug));

const releases = releaseRows
  .filter((r) => {
    if (!knownSlugs.has(r.seriesSlug)) {
      console.warn(
        `⚠️  releases.csv row "${r.id}" references unknown series "${r.seriesSlug}" — skipped. Add it to series.csv first.`
      );
      return false;
    }
    return true;
  })
  .map((r) => ({
    id: r.id,
    seriesSlug: r.seriesSlug,
    volume: Number(r.volume),
    date: r.date,
    format: r.format,
    confirmed: r.confirmed === "true",
    source: r.source || "unknown",
  }));

const out = { series, releases, generatedAt: new Date().toISOString() };

writeFileSync(
  path.join(__dirname, "..", "lib", "data.generated.json"),
  JSON.stringify(out, null, 2)
);

console.log(
  `✅ Generated lib/data.generated.json — ${series.length} series, ${releases.length} releases`
);
