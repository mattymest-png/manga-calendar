import { RELEASES } from "@/lib/data";
import FilterableReleaseFeed from "@/components/FilterableReleaseFeed";

export default function Home() {
  return (
    <div>
      <div className="border-b hairline">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8">
          <p className="font-data text-xs uppercase tracking-widest text-stamp-red mb-3">
            Updated daily
          </p>
          <h1 className="font-display text-5xl sm:text-6xl text-ink leading-[0.95] max-w-2xl">
            Collect every volume the moment it drops.
          </h1>
          <p className="font-body text-ink-soft mt-4 max-w-xl">
            Stop checking five publisher sites for one release date. Browse what&apos;s
            landing this week, this month, and beyond — across Viz, Kodansha USA, Yen
            Press, Seven Seas, and Square Enix Manga.
          </p>
        </div>
      </div>

      <FilterableReleaseFeed releases={RELEASES} />
    </div>
  );
}