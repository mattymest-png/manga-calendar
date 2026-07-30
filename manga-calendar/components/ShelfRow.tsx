import { Release, getSeriesBySlug } from "@/lib/data";
import SpineCard from "./SpineCard";
import ScrollableRow from "./ScrollableRow";

export default function ShelfRow({
  label,
  eyebrow,
  releases,
  labelColor,
}: {
  label: string;
  eyebrow?: string;
  releases: Release[];
  labelColor?: string;
}) {
  if (releases.length === 0) return null;

  return (
    <section className="py-8 border-b hairline last:border-b-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-baseline gap-3 mb-5">
          <h2
            className="font-display text-3xl sm:text-4xl"
            style={{ color: labelColor || "var(--ink)" }}
          >
            {label}
          </h2>
          {eyebrow && (
            <span className="font-data text-xs uppercase tracking-widest text-ink-faint">
              {eyebrow}
            </span>
          )}
          <span className="font-data text-xs text-ink-faint ml-auto">
            {releases.length} volume{releases.length !== 1 ? "s" : ""}
          </span>
        </div>
        <ScrollableRow>
          {releases.map((r) => {
            const series = getSeriesBySlug(r.seriesSlug);
            if (!series) return null;
            return <SpineCard key={r.id} release={r} series={series} />;
          })}
        </ScrollableRow>
      </div>
    </section>
  );
}