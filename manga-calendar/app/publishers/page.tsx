import Link from "next/link";
import { PUBLISHER_LIST } from "@/lib/publishers";
import { getSeriesForPublisher } from "@/lib/data";

export default function PublishersPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-display text-4xl sm:text-5xl text-ink mb-8">Publishers</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        {PUBLISHER_LIST.map((pub) => {
          const count = getSeriesForPublisher(pub.slug).length;
          return (
            <Link
              key={pub.slug}
              href={`/publishers/${pub.slug}`}
              className="group block p-6 rounded-[3px] transition-transform duration-200 ease-out hover:-translate-y-1 spine-shadow"
              style={{ backgroundColor: pub.color }}
            >
              <h2 className="font-display text-2xl text-white">{pub.name}</h2>
              <p className="font-data text-xs uppercase tracking-wide text-white/75 mt-2">
                {count} series tracked
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
