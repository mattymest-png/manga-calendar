import { RELEASES, SERIES, getSeriesBySlug } from "@/lib/data";

const BASE_URL = "https://example.com"; // update to your real domain

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seriesParam = searchParams.get("series"); // comma-separated slugs, e.g. "one-piece,chainsaw-man"

  let requestedSlugs: string[] | null = null;
  if (seriesParam) {
    const knownSlugs = new Set(SERIES.map((s) => s.slug));
    requestedSlugs = seriesParam
      .split(",")
      .map((s) => s.trim())
      .filter((s) => knownSlugs.has(s));
  }

  const now = new Date();
  let upcoming = RELEASES.filter((r) => new Date(r.date + "T00:00:00") >= now);

  if (requestedSlugs) {
    const slugSet = new Set(requestedSlugs);
    upcoming = upcoming.filter((r) => slugSet.has(r.seriesSlug));
  }

  upcoming = upcoming.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 100);

  const items = upcoming
    .map((r) => {
      const series = getSeriesBySlug(r.seriesSlug);
      if (!series) return "";
      const title = `${series.title} Vol. ${r.volume}`;
      const link = `${BASE_URL}/series/${series.slug}`;
      const pubDate = new Date(r.date + "T00:00:00").toUTCString();
      return `
    <item>
      <title>${escapeXml(title)}</title>
      <link>${link}</link>
      <guid isPermaLink="false">${r.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(
        `${series.title} Volume ${r.volume} releases ${r.date}${r.confirmed ? "" : " (preorder listing, not yet publisher-confirmed)"}.`
      )}</description>
    </item>`;
    })
    .join("");

  const isPersonalized = requestedSlugs && requestedSlugs.length > 0;
  const feedTitle = isPersonalized
    ? "Next Volume — My Shelf Releases"
    : "Next Volume — Upcoming Manga Releases";
  const feedDescription = isPersonalized
    ? "Upcoming volume releases for the series you follow on Next Volume."
    : "Upcoming English manga volume release dates across Viz, Kodansha USA, Yen Press, Seven Seas, and Square Enix Manga.";
  const feedLink = isPersonalized
    ? `${BASE_URL}/feed.xml?series=${encodeURIComponent(requestedSlugs!.join(","))}`
    : `${BASE_URL}/feed.xml`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${BASE_URL}</link>
    <atom:link href="${feedLink}" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom" />
    <description>${escapeXml(feedDescription)}</description>
    <language>en-us</language>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}