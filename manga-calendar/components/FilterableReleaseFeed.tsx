"use client";

import { useMemo, useState } from "react";
import { Release, getSeriesBySlug } from "@/lib/data";
import { groupReleasesByBucket } from "@/lib/dates";
import { PublisherSlug } from "@/lib/publishers";
import ShelfRow from "./ShelfRow";
import PublisherFilter from "./PublisherFilter";

export default function FilterableReleaseFeed({ releases }: { releases: Release[] }) {
  const [activePublisher, setActivePublisher] = useState<PublisherSlug | "all">("all");

  const filtered = useMemo(() => {
    if (activePublisher === "all") return releases;
    return releases.filter((r) => {
      const series = getSeriesBySlug(r.seriesSlug);
      return series?.publisher === activePublisher;
    });
  }, [releases, activePublisher]);

  const buckets = useMemo(() => groupReleasesByBucket(filtered), [filtered]);

  return (
    <div>
      <PublisherFilter active={activePublisher} onChange={setActivePublisher} />

      <ShelfRow
        label="This Week"
        eyebrow="On shelves now"
        releases={buckets["This Week"]}
        labelColor="#E71A0B"
      />
      <ShelfRow label="This Month" releases={buckets["This Month"]} labelColor="#0BE788" />
      <ShelfRow label="Next Month" releases={buckets["Next Month"]} labelColor="#0BE788" />
      <ShelfRow label="Later" releases={buckets["Later"]} labelColor="#0BD8E7" />
    </div>
  );
}