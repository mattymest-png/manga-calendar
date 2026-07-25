export default function Footer() {
  return (
    <footer className="border-t hairline mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="font-data text-[11px] text-ink-faint uppercase tracking-wide">
          Next Volume — English manga release calendar
        </p>
        <div className="flex items-center gap-4">
          <a
            href="/feed.xml"
            className="font-data text-[11px] text-ink-faint hover:text-ink underline underline-offset-2"
          >
            RSS
          </a>
          <a
            href="/privacy"
            className="font-data text-[11px] text-ink-faint hover:text-ink underline underline-offset-2"
          >
            Privacy & Disclosure
          </a>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
        <p className="font-data text-[11px] text-ink-faint">
          As an Amazon Associate, this site earns from qualifying purchases. Dates may shift — always confirm with the publisher.
        </p>
      </div>
    </footer>
  );
}
