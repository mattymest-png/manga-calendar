export const metadata = {
  title: "Privacy & Disclosure — Next Volume",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 prose-like">
      <h1 className="font-display text-4xl text-ink mb-6">Privacy & Disclosure</h1>

      <section className="mb-8">
        <h2 className="font-display text-2xl text-ink mb-2">Affiliate Disclosure</h2>
        <p className="font-body text-ink-soft leading-relaxed">
          Next Volume is a participant in the Amazon Services LLC Associates
          Program, an affiliate advertising program designed to provide a
          means for sites to earn advertising fees by advertising and linking
          to Amazon.com. As an Amazon Associate, this site earns from
          qualifying purchases. This comes at no additional cost to you.
        </p>
        <p className="font-body text-ink-soft leading-relaxed mt-3">
          [Add similar disclosure language here once you add RightStuf,
          Barnes & Noble, or other affiliate partners.]
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-display text-2xl text-ink mb-2">What We Collect</h2>
        <p className="font-body text-ink-soft leading-relaxed">
          [Fill in based on your actual analytics/hosting setup — e.g. "We use
          [Plausible/Google Analytics] to understand site traffic. We do not
          collect personal information beyond what's needed for basic
          analytics." Update this once you've picked an analytics tool.]
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-display text-2xl text-ink mb-2">Contact</h2>
        <p className="font-body text-ink-soft leading-relaxed">
          [Add a contact email here.]
        </p>
      </section>

      <p className="font-data text-xs text-ink-faint mt-10">
        Last updated: [date]
      </p>
    </div>
  );
}
