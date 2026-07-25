import Link from "next/link";
import { Release, Series, amazonAffiliateLink } from "@/lib/data";
import { PUBLISHERS } from "@/lib/publishers";
import { formatDate } from "@/lib/dates";

export default function SpineCard({
  release,
  series,
}: {
  release: Release;
  series: Series;
}) {
  const pub = PUBLISHERS[series.publisher];

  return (
    <div className="group relative flex-shrink-0 w-[132px] sm:w-[148px]">
      <Link
        href={`/series/${series.slug}`}
        className="block h-[210px] sm:h-[230px] relative overflow-hidden rounded-[3px] spine-shadow transition-transform duration-200 ease-out group-hover:-translate-y-1.5"
        style={{ backgroundColor: pub.color }}
      >
        {/* stamp corner: confirmed vs preorder-only */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
        />
        <div className="absolute inset-0 flex flex-col justify-between p-3">
          <div>
            <span className="font-data text-[10px] uppercase tracking-widest text-white/70">
              {pub.shortName}
            </span>
          </div>
          <div>
            <p className="font-display text-white text-lg leading-[1.05] mb-2 [text-wrap:balance]">
              {series.title}
            </p>
            <div className="flex items-baseline justify-between">
              <span className="font-data text-white/85 text-xs">Vol.</span>
              <span className="font-display text-white text-3xl leading-none">
                {release.volume}
              </span>
            </div>
          </div>
        </div>
        {!release.confirmed && (
          <div className="absolute top-3 right-3 rotate-6 border border-white/60 px-1.5 py-0.5">
            <span className="font-data text-[8px] uppercase tracking-wider text-white/80">
              preorder
            </span>
          </div>
        )}
      </Link>

      <div className="mt-2 flex items-center justify-between">
        <span className="font-data text-xs text-ink-soft">{formatDate(release.date)}</span>
        <a
          href={amazonAffiliateLink(`${series.amazonQuery} ${release.volume}`)}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="font-data text-[11px] uppercase tracking-wide text-stamp-red hover:text-stamp-red-ink underline underline-offset-2"
        >
          Preorder
        </a>
      </div>
    </div>
  );
}
