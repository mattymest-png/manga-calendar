"use client";

import { useEffect, useState } from "react";
import { isFollowed, toggleFollowed, FOLLOWED_CHANGED_EVENT } from "@/lib/follows";

export default function FollowButton({
  slug,
  className = "",
}: {
  slug: string;
  className?: string;
}) {
  // Start false on both server and first client render to avoid a
  // hydration mismatch, then sync from localStorage right after mount.
  const [followed, setFollowed] = useState(false);

  useEffect(() => {
    setFollowed(isFollowed(slug));
    const onChange = () => setFollowed(isFollowed(slug));
    window.addEventListener(FOLLOWED_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(FOLLOWED_CHANGED_EVENT, onChange);
  }, [slug]);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setFollowed(toggleFollowed(slug));
      }}
      aria-label={followed ? "Unfollow this series" : "Follow this series"}
      aria-pressed={followed}
      className={`z-10 flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
        followed
          ? "bg-stamp-red text-white"
          : "bg-black/40 text-white/90 hover:bg-black/60"
      } ${className}`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={followed ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 21s-6.7-4.3-9.3-8.1C.8 10.1 1.4 6.6 4.3 5A5.4 5.4 0 0 1 12 6.8 5.4 5.4 0 0 1 19.7 5c2.9 1.6 3.5 5.1 1.6 7.9C18.7 16.7 12 21 12 21z" />
      </svg>
    </button>
  );
}