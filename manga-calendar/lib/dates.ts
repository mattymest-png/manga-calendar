import { Release } from "./data";

export type Bucket = "This Week" | "This Month" | "Next Month" | "Later";

function startOfWeek(d: Date) {
  const day = d.getDay(); // 0 = Sun
  const diff = d.getDate() - day;
  const s = new Date(d);
  s.setDate(diff);
  s.setHours(0, 0, 0, 0);
  return s;
}

export function bucketFor(dateStr: string, now: Date = new Date()): Bucket | null {
  const date = new Date(dateStr + "T00:00:00");
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 1);

  if (date < weekStart) return null; // genuinely in the past — don't surface on the homepage feed
  if (date < weekEnd) return "This Week";
  if (date < monthEnd) return "This Month";
  if (date < nextMonthEnd) return "Next Month";
  return "Later";
}

export function groupReleasesByBucket(releases: Release[], now: Date = new Date()) {
  const buckets: Record<Bucket, Release[]> = {
    "This Week": [],
    "This Month": [],
    "Next Month": [],
    Later: [],
  };
  for (const r of releases) {
    const bucket = bucketFor(r.date, now);
    if (bucket) buckets[bucket].push(r);
  }
  (Object.keys(buckets) as Bucket[]).forEach((k) =>
    buckets[k].sort((a, b) => a.date.localeCompare(b.date))
  );
  return buckets;
}

export function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDateFull(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}