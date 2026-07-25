import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b hairline sticky top-0 z-30 bg-paper/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl sm:text-3xl text-ink">NEXT VOLUME</span>
          <span className="font-data text-[10px] uppercase tracking-widest text-stamp-red hidden sm:inline">
            Release Calendar
          </span>
        </Link>
        <nav className="flex items-center gap-5 font-data text-xs uppercase tracking-wide">
          <Link href="/" className="text-ink-soft hover:text-ink">
            Shelf
          </Link>
          <Link href="/publishers" className="text-ink-soft hover:text-ink">
            Publishers
          </Link>
        </nav>
      </div>
    </header>
  );
}
