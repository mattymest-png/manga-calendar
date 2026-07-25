import { notFound } from "next/navigation";
import Link from "next/link";
import { PUBLISHERS, PUBLISHER_LIST } from "@/lib/publishers";
import { getSeriesForPublisher } from "@/lib/data";

export function generateStaticParams() {
  return PUBLISHER_LIST.map((p) => ({ slug: p.slug }));
}

export default async function PublisherPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pub = PUBLISHERS[slug as keyof typeof PUBLISHERS];
  if (!pub) notFound();

  const series = getSeriesForPublisher(slug);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Link href="/publishers" className="font-data text-xs uppercase tracking-widest text-ink-faint hover:text-ink">
        ← All Publishers
      </Link>
      <div className="flex items-center gap-3 mt-4 mb-8">
        <div className="w-3 h-8 rounded-[1px]" style={{ backgroundColor: pub.color }} />
        <h1 className="font-display text-4xl sm:text-5xl text-ink">{pub.name}</h1>
      </div>

      <ul className="divide-y hairline border-y hairline">
        {series.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/series/${s.slug}`}
              className="flex items-center justify-between py-4 group"
            >
              <span className="font-body text-ink group-hover:text-stamp-red">{s.title}</span>
              <span className="font-data text-[10px] uppercase tracking-wide text-ink-faint">
                {s.genre.join(" · ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
