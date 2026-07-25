import { PublisherSlug } from "./publishers";

export interface Series {
  slug: string;
  title: string;
  publisher: PublisherSlug;
  genre: string[];
  format: "physical" | "digital" | "both";
  status: "ongoing" | "hiatus";
  amazonQuery: string; // used to build affiliate search links until per-volume ASINs are collected
}

export interface Release {
  id: string;
  seriesSlug: string;
  volume: number;
  date: string; // ISO yyyy-mm-dd — release dates shift; verify against publisher catalogs regularly
  format: "physical" | "digital" | "omnibus";
  confirmed: boolean; // false = pulled from a preorder listing, not an official publisher catalog yet
  source?: string; // "publisher" | "amazon" | "manual" — provenance of the date
}

/**
 * Source of truth is now data/series.csv + data/releases.csv, converted to
 * lib/data.generated.json by `npm run build-data`. Edit the CSVs (by hand or
 * via a scraper — see scripts/) rather than this file. See README.md.
 */
import generated from "./data.generated.json";

export const SERIES: Series[] = generated.series as Series[];
export const RELEASES: Release[] = generated.releases as Release[];

export function getSeriesBySlug(slug: string) {
  return SERIES.find((s) => s.slug === slug);
}

export function getReleasesForSeries(slug: string) {
  return RELEASES.filter((r) => r.seriesSlug === slug).sort((a, b) => a.date.localeCompare(b.date));
}

export function getSeriesForPublisher(pub: string) {
  return SERIES.filter((s) => s.publisher === pub);
}

export function getReleasesForPublisher(pub: string) {
  const slugs = new Set(getSeriesForPublisher(pub).map((s) => s.slug));
  return RELEASES.filter((r) => slugs.has(r.seriesSlug));
}

export function amazonAffiliateLink(query: string) {
  // Swap AFFILIATE_TAG for your real Amazon Associates tag before launch.
  const tag = "AFFILIATE_TAG";
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${tag}`;
}
