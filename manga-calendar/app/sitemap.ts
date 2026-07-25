import { MetadataRoute } from "next";
import { SERIES } from "@/lib/data";
import { PUBLISHER_LIST } from "@/lib/publishers";

// Set this to your real domain before deploying.
const BASE_URL = "https://example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/publishers`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const publisherPages: MetadataRoute.Sitemap = PUBLISHER_LIST.map((p) => ({
    url: `${BASE_URL}/publishers/${p.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const seriesPages: MetadataRoute.Sitemap = SERIES.map((s) => ({
    url: `${BASE_URL}/series/${s.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticPages, ...publisherPages, ...seriesPages];
}
