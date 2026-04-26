import { PlayCircle, Video, Clapperboard, ArrowRight } from "lucide-react";
import { getPublicDemoEntries, getDemoCoverageSummary } from "@/lib/demoVideoCatalog";

function StatusPill({ label, tone = "neutral" }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    planned: "bg-amber-50 text-amber-800 border-amber-200",
    ready: "bg-blue-50 text-blue-800 border-blue-200",
    live: "bg-green-50 text-green-800 border-green-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        tones[tone] || tones.neutral
      }`}
    >
      {label}
    </span>
  );
}

export default function DemoVideoSection() {
  const entries = getPublicDemoEntries();
  const summary = getDemoCoverageSummary();
  const featuredEntry = entries.find((entry) => Boolean(entry.public_url)) || entries[0];
  const supportingEntries = entries
    .filter((entry) => entry.demo_key !== featuredEntry?.demo_key)
    .slice(0, 3);

  return (
    <section
      id="demo-video-library"
      className="py-20 md:py-28 px-6 bg-gradient-to-b from-background to-card"
    >
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">
            See The System In Action
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Watch the clearest walkthrough before you book a live demo
          </h2>
          <p className="mt-5 text-muted-foreground text-lg leading-relaxed">
            Start with one strong overview, then skim a few focused examples that
            answer the most common buyer questions.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-10">
          <SummaryCard
            icon={Video}
            label="Short Demo Clips"
            value={summary.public_total}
            helper="A focused library built around the services we install most often."
          />
          <SummaryCard
            icon={PlayCircle}
            label="Published Walkthroughs"
            value={summary.public_published}
            helper="Only live, usable demos are counted here."
          />
          <SummaryCard
            icon={Clapperboard}
            label="Service Views Covered"
            value={summary.service_coverage_keys.length}
            helper="Enough coverage to preview the main customer journey."
          />
        </div>

        {featuredEntry ? (
          <div className="rounded-[28px] border border-border bg-white/88 p-6 md:p-8 shadow-sm mb-8">
            <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] items-start">
              <div>
                <p className="text-xs font-semibold text-primary tracking-[0.2em] uppercase mb-3">
                  Featured Walkthrough
                </p>
                <h3 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                  {featuredEntry.title}
                </h3>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                  {featuredEntry.goal}
                </p>
                <div className="mt-5 grid sm:grid-cols-2 gap-3">
                  <InfoTile label="Format" value={formatType(featuredEntry.type)} />
                  <InfoTile label="Length" value={featuredEntry.duration_target} />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-muted/15 p-5">
                <p className="text-sm font-semibold text-foreground">Why start here</p>
                <ul className="mt-3 space-y-2">
                  <li className="text-sm text-muted-foreground">
                    Covers the clearest end-to-end buyer journey.
                  </li>
                  <li className="text-sm text-muted-foreground">
                    Shows what the system feels like when a new lead comes in.
                  </li>
                  <li className="text-sm text-muted-foreground">
                    Makes the live demo call shorter and more specific.
                  </li>
                </ul>
                <div className="mt-5">
                  {featuredEntry.public_url ? (
                    <a
                      href={featuredEntry.public_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                    >
                      Watch Featured Demo
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  ) : (
                    <a
                      href="/book"
                      className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                    >
                      See It In A Live Walkthrough
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-3">
          {supportingEntries.map((entry) => {
            const published = Boolean(entry.public_url);
            const tone =
              entry.status === "record_next"
                ? "ready"
                : entry.status === "ready_for_recording"
                ? "ready"
                : entry.status === "planned"
                ? "planned"
                : published
                ? "live"
                : "neutral";

            const label = published
              ? "Published"
              : entry.status === "record_next"
              ? "Record next"
              : entry.status === "ready_for_recording"
              ? "Ready for recording"
              : "Planned";

            return (
              <div
                key={entry.demo_key}
                className="rounded-2xl border border-border bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{entry.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {entry.goal}
                    </p>
                  </div>
                  <StatusPill label={label} tone={tone} />
                </div>

                <div className="mt-4 grid gap-3">
                  <InfoTile label="Format" value={formatType(entry.type)} />
                  <InfoTile label="Target Length" value={entry.duration_target} />
                </div>

                <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    What this demo helps answer
                  </p>
                  <ul className="mt-2 space-y-1">
                    {(entry.source_of_truth || ["Live operator walkthrough"]).map((source) => (
                      <li key={source} className="text-xs text-muted-foreground">
                        • {source}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {published ? (
                    <a
                      href={entry.public_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                    >
                      Watch Demo
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  ) : (
                    <a
                      href="/book"
                      className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                    >
                      See It In A Live Walkthrough
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {published
                      ? "Hosted video is live."
                      : "Use the live walkthrough until this clip is published."}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SummaryCard({ icon: Icon, label, value, helper }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function formatType(type) {
  if (type === "flagship_demo") return "Flagship demo";
  if (type === "service_clip") return "Service clip";
  if (type === "industry_cutdown") return "Industry cutdown";
  if (type === "operator_clip") return "Operator training clip";
  return type;
}
