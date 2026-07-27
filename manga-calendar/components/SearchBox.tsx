"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SERIES } from "@/lib/data";
import { PUBLISHERS } from "@/lib/publishers";

export default function SearchBox() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const results =
    query.trim().length > 0
      ? SERIES.filter((s) => s.title.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
      : [];

  return (
    <div ref={containerRef} className="relative w-full max-w-[200px] sm:max-w-[240px]">
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search manga…"
        aria-label="Search manga"
        className="w-full font-data text-xs bg-paper-raised border hairline rounded-full px-3 py-1.5 text-ink placeholder:text-ink-faint focus:outline-none focus:border-stamp-red"
      />

      {open && query.trim().length > 0 && (
        <div className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto bg-paper-raised border hairline rounded-[3px] shadow-lg z-50">
          {results.length === 0 ? (
            <p className="font-data text-xs text-ink-faint px-4 py-3">No matches</p>
          ) : (
            <ul className="divide-y hairline">
              {results.map((s) => {
                const pub = PUBLISHERS[s.publisher];
                return (
                  <li key={s.slug}>
                    <Link
                      href={`/series/${s.slug}`}
                      onClick={() => {
                        setOpen(false);
                        setQuery("");
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-paper"
                    >
                      <span
                        className="w-2 h-8 rounded-[1px] flex-shrink-0"
                        style={{ backgroundColor: pub.color }}
                      />
                      <span className="min-w-0">
                        <span className="block font-body text-sm text-ink truncate">
                          {s.title}
                        </span>
                        <span className="block font-data text-[10px] uppercase tracking-wide text-ink-faint">
                          {pub.shortName}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}