"use client";

import { PUBLISHER_LIST, PublisherSlug } from "@/lib/publishers";

export default function PublisherFilter({
  active,
  onChange,
}: {
  active: PublisherSlug | "all";
  onChange: (value: PublisherSlug | "all") => void;
}) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2 flex items-center gap-2 flex-wrap">
      <span className="font-data text-[10px] uppercase tracking-widest text-ink-faint mr-1">
        Filter
      </span>
      <button
        type="button"
        onClick={() => onChange("all")}
        className={`font-data text-[11px] uppercase tracking-wide px-3 py-1 rounded-full border transition-colors ${
          active === "all"
            ? "bg-ink text-paper border-ink"
            : "border-rule text-ink-soft hover:border-ink"
        }`}
      >
        All
      </button>
      {PUBLISHER_LIST.map((pub) => {
        const isActive = active === pub.slug;
        return (
          <button
            key={pub.slug}
            type="button"
            onClick={() => onChange(pub.slug)}
            className="font-data text-[11px] uppercase tracking-wide px-3 py-1 rounded-full border transition-colors"
            style={
              isActive
                ? { backgroundColor: pub.color, borderColor: pub.color, color: "#fff" }
                : { borderColor: "var(--rule)", color: "var(--ink-soft)" }
            }
          >
            {pub.shortName}
          </button>
        );
      })}
    </div>
  );
}