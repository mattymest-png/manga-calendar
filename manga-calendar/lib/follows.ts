"use client";

const STORAGE_KEY = "next-volume:followed-series";

function readFollowed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFollowed(slugs: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  // Notify other components on this page (storage event only fires cross-tab)
  window.dispatchEvent(new CustomEvent("followed-changed"));
}

export function getFollowed(): string[] {
  return readFollowed();
}

export function isFollowed(slug: string): boolean {
  return readFollowed().includes(slug);
}

export function toggleFollowed(slug: string): boolean {
  const current = readFollowed();
  const isNowFollowed = !current.includes(slug);
  const next = isNowFollowed ? [...current, slug] : current.filter((s) => s !== slug);
  writeFollowed(next);
  return isNowFollowed;
}

export const FOLLOWED_CHANGED_EVENT = "followed-changed";
