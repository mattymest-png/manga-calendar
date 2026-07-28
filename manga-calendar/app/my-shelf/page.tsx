"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SERIES, getReleasesForSeries } from "@/lib/data";
import { PUBLISHERS } from "@/lib/publishers";
import { formatDate } from "@/lib/dates";
import { getFollowed, FOLLOWED_CHANGED_EVENT } from "@/lib/follows";
import FollowButton from "@/components/FollowButton";
import SubscribeButton from "@/components/SubscribeButton";

export default function MyShelfPage() {
  const [followedSlugs, setFollowedSlugs] = useState<string[] | null>(null);

  useEffect(() => {
    const sync = () => setFollowedSlugs(getFollowed());
    sync();
    window.addEventListener(FOLLOWED_CHANGED_EVENT, sync);
    return () => window.removeEventListener(FOLLOWED_CHANGED_EVENT, sync);
  }, []);

  // Avoid a flash of "empty" before we've read localStorage on mount.
  if (followedSlugs === null) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="font-display text-4xl sm:text-5xl text-ink mb-2">My Shelf</h1>
        <p className="font-body text-ink-soft">Loading your shelf…</p>
      </div>
    );
  }

  const followedSeries = SERIES.filter((s) => followedSlugs.includes(s.slug));

  if (followedSeries.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="font-display text-4xl sm:text-5xl text-ink mb-4">My Shelf</h1>
        <p className="font-body text-ink-soft max-w-md mx-auto mb-6">
          You haven&apos;t followed any series yet. Tap the heart on any release card or
          series page to add it here — this is stored right in your browser, no account
          needed.
        </p>
        <Link
          href="/"
          className="font-data text-xs uppercase tracking-widest text-stamp-red hover:text-stamp-red-ink underline underline-offset-2"
        >
          Browse the shelf →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-display text-4xl sm:text-5xl text-ink mb-2">My Shelf</h1>
      <p className="font-body text-ink-soft mb-8">
        {followedSeries.length} series you&apos;re following — stored locally in this
        browser only.
      </p>

      <SubscribeButton slugs={followedSlugs} />

      <div className="grid gap-4 sm:grid-cols-2">
        {followedSeries.map((series) => {
          const pub = PUBLISHERS[series.publisher];
          const releases = getReleasesForSeries(series.slug);
          const now = new Date();
          const nextRelease = releases
            .filter((r) => new Date(r.date + "T00:00:00") >= now)
            .sort((a, b) => a.date.localeCompare(b.date))[0];

          return (
            <div
              key={series.slug}
              className="relative flex gap-4 p-4 border hairline rounded-[3px] bg-paper-raised"
            >
              <Link
                href={`/series/${series.slug}`}
                className="relative w-14 h-20 flex-shrink-0 rounded-[2px] overflow-hidden spine-shadow"
                style={{ backgroundColor: pub.color }}
              >
                {series.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={series.coverImage}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/series/${series.slug}`} className="hover:text-stamp-red">
                  <p className="font-display text-lg leading-tight">{series.title}</p>
                </Link>
                <p className="font-data text-[10px] uppercase tracking-widest text-ink-faint mt-1">
                  {pub.shortName}
                </p>
                {nextRelease ? (
                  <p className="font-data text-xs text-ink-soft mt-2">
                    Vol. {nextRelease.volume} — {formatDate(nextRelease.date)}
                  </p>
                ) : (
                  <p className="font-data text-xs text-ink-faint mt-2">
                    No upcoming volume tracked yet
                  </p>
                )}
              </div>

              <FollowButton
                slug={series.slug}
                className="!bg-transparent !text-ink-faint hover:!text-stamp-red"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}