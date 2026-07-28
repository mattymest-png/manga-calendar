import { notFound } from "next/navigation";
import Link from "next/link";
import { SERIES, getSeriesBySlug, getReleasesForSeries, amazonAffiliateLink } from "@/lib/data";
import { PUBLISHERS } from "@/lib/publishers";
import { formatDateFull } from "@/lib/dates";
import FollowButton from "@/components/FollowButton";

export function generateStaticParams() {
  return SERIES.map((s) => ({ slug: s.slug }));
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const series = getSeriesBySlug(slug);
  if (!series) notFound();

  const releases = getReleasesForSeries(slug);
  const pub = PUBLISHERS[series.publisher];
  const now = new Date();
  const upcoming = releases.filter((r) => new Date(r.date + "T00:00:00") >= now);
  const past = releases.filter((r) => new Date(r.date + "T00:00:00") < now);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Link
        href={`/publishers/${pub.slug}`}
        className="font-data text-xs uppercase tracking-widest text-ink-faint hover:text-ink"
      >
        ← {pub.name}
      </Link>

      <div className="mt-4 flex items-start gap-5">
        <div
          className="w-16 h-24 rounded-[2px] flex-shrink-0 spine-shadow overflow-hidden relative"
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
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl sm:text-5xl text-ink leading-none">
              {series.title}
            </h1>
            <FollowButton slug={series.slug} />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {series.genre.map((g) => (
              <span
                key={g}
                className="font-data text-[10px] uppercase tracking-wide border hairline px-2 py-1 rounded-full text-ink-soft"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      {upcoming.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink mb-4">Upcoming</h2>
          <ul className="divide-y hairline border-y hairline">
            {upcoming.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <div>
                  <span className="font-data text-ink">Volume {r.volume}</span>
                  {!r.confirmed && (
                    <span className="font-data text-[10px] uppercase tracking-wide text-stamp-red ml-2">
                      Preorder listing
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-data text-sm text-ink-soft">{formatDateFull(r.date)}</span>
                  <a href={amazonAffiliateLink(`${series.amazonQuery} ${r.volume}`)} target="_blank" rel="noopener noreferrer sponsored" className="font-data text-xs uppercase tracking-wide text-stamp-red hover:text-stamp-red-ink underline underline-offset-2">
                    Preorder
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink mb-4">Release History</h2>
          <ul className="divide-y hairline border-y hairline">
            {past.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <span className="font-data text-ink-soft">Volume {r.volume}</span>
                <span className="font-data text-sm text-ink-faint">{formatDateFull(r.date)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}