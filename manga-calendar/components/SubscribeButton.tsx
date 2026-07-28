"use client";

import { useState } from "react";

export default function SubscribeButton({ slugs }: { slugs: string[] }) {
  const [copied, setCopied] = useState(false);

  if (slugs.length === 0) return null;

  const feedUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/feed.xml?series=${encodeURIComponent(slugs.join(","))}`
      : "";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be blocked in some browser contexts — the visible
      // link below still works as a fallback, so fail silently here.
    }
  }

  return (
    <div className="mb-8 p-4 border hairline rounded-[3px] bg-paper-raised">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="font-display text-lg text-ink">Subscribe to My Shelf</p>
          <p className="font-body text-sm text-ink-soft mt-1 max-w-md">
            Copy this link into an RSS reader (Feedly, Inoreader, NetNewsWire, etc.)
            to get notified whenever one of your followed series gets a new volume.
            This link is tied to what you follow right now — re-copy it after
            following more series.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button type="button" onClick={handleCopy} className="font-data text-xs uppercase tracking-wide bg-stamp-red text-white px-4 py-2 rounded-full hover:bg-stamp-red-ink transition-colors">
            {copied ? "Copied!" : "Copy RSS link"}
          </button>
          <a href={feedUrl} target="_blank" rel="noopener noreferrer" className="font-data text-xs uppercase tracking-wide text-ink-soft hover:text-ink underline underline-offset-2">
            Preview feed
          </a>
        </div>
      </div>
    </div>
  );
}