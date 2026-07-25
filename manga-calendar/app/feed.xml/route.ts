import { RELEASES, getSeriesBySlug } from "@/lib/data";

const BASE_URL = "https://example.com"; // update to your real domain

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const now = new Date();
  const upcoming = RELEASES.filter((r) => new Date(r.date + "T00:00:00") >= now)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 50);

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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Next Volume — Upcoming Manga Releases</title>
    <link>${BASE_URL}</link>
    <description>Upcoming English manga volume release dates across Viz, Kodansha USA, Yen Press, Seven Seas, and Square Enix Manga.</description>
    <language>en-us</language>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
