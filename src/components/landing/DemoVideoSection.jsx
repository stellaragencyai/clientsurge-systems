import { PlayCircle, Video, Clapperboard, ArrowRight } from "lucide-react";
import { getPublicDemoEntries, getDemoCoverageSummary } from "@/lib/demoVideoCatalog";

const demoCream = "linear-gradient(180deg, rgba(252,247,241,0.99) 0%, rgba(246,238,228,0.97) 100%)";
const demoCreamStrong = "linear-gradient(180deg, rgba(255,250,245,1) 0%, rgba(248,240,230,0.99) 100%)";
const demoBrown =
  "linear-gradient(180deg, #4d2810 0%, #5d3416 18%, #74431d 42%, #926033 72%, #5b3113 100%)";
const demoBrownSoft =
  "linear-gradient(180deg, #573016 0%, #6a3c1a 18%, #825026 42%, #a36e3d 72%, #653617 100%)";
const demoBorder = "1.5px solid rgba(212, 184, 142, 0.42)";
const demoBorderStrong = "1.5px solid rgba(222, 194, 152, 0.72)";
const demoShadow = "0 16px 34px rgba(111,67,31,0.08), 0 2px 12px rgba(111,67,31,0.05)";
const demoShadowStrong =
  "0 20px 42px rgba(111,67,31,0.15), 0 4px 16px rgba(111,67,31,0.08)";
const demoTextLight = "rgba(252, 241, 222, 0.98)";
const demoTextMuted = "rgba(247, 225, 194, 0.92)";
const demoTopText = "rgba(184, 129, 72, 0.92)";
const demoChipBg = "rgba(245, 217, 168, 0.14)";
const demoChipBorder = "1px solid rgba(238, 204, 157, 0.4)";
const demoIconColor = "#9a5c2e";
const demoIconGlow = "0 0 0 1px rgba(255,255,255,0.18), 0 0 28px rgba(245,217,168,0.24)";
const demoDivider =
  "linear-gradient(90deg, rgba(245,217,168,0) 0%, rgba(245,217,168,0.86) 50%, rgba(245,217,168,0) 100%)";
const demoHeaderGlass =
  "linear-gradient(180deg, rgba(255,255,255,0.68) 0%, rgba(255,255,255,0.08) 42%, rgba(255,255,255,0) 100%)";
const demoBodyMesh =
  "radial-gradient(circle at 14% 18%, rgba(245,217,168,0.14) 0%, transparent 34%), radial-gradient(circle at 84% 18%, rgba(255,241,211,0.12) 0%, transparent 28%), radial-gradient(circle at 60% 72%, rgba(107,63,31,0.12) 0%, transparent 38%)";
const demoSpotlight =
  "linear-gradient(115deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 22%, rgba(255,255,255,0) 42%)";
const demoShine =
  "linear-gradient(138deg, rgba(255,255,255,0.24) 0%, rgba(255,245,226,0.12) 14%, rgba(255,255,255,0.02) 28%, rgba(255,255,255,0) 46%)";
const demoInnerFrame =
  "inset 0 1px 0 rgba(255,245,227,0.16), inset 0 0 0 1px rgba(95,52,20,0.12)";

function StatusPill({ label }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
      style={{
        background: demoChipBg,
        color: demoTextLight,
        border: demoChipBorder,
      }}
    >
      {label}
    </span>
  );
}

function DemoCTA({ href, children, external = false }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      style={{
        display: "inline-block",
        borderRadius: "9999px",
        padding: "2px",
        background:
          "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
        boxShadow: "0 4px 14px rgba(120,70,20,0.35)",
        transition: "box-shadow 0.3s ease, transform 0.3s ease",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          "0 8px 40px rgba(161,120,35,0.6), 0 4px 18px rgba(120,70,20,0.35)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 14px rgba(120,70,20,0.35)";
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          height: "36px",
          padding: "0 20px",
          borderRadius: "9999px",
          background:
            "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
          color: "#f5e6d0",
          fontWeight: "600",
          fontSize: "0.875rem",
          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
        }}
      >
        {children}
      </span>
    </a>
  );
}

function DemoShell({ eyebrow, icon: Icon, title, body, badge, children, highlighted = false }) {
  return (
    <div
      className="rounded-[28px] overflow-hidden relative"
      style={{
        background: highlighted ? demoCreamStrong : demoCream,
        border: highlighted ? demoBorderStrong : demoBorder,
        boxShadow: highlighted ? demoShadowStrong : demoShadow,
      }}
    >
      <div
        className="px-6 md:px-8 py-5 md:py-6 flex items-center justify-between gap-4 relative overflow-hidden"
        style={{
          background: demoCreamStrong,
          borderBottom: "1px solid rgba(208,166,114,0.18)",
        }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-full pointer-events-none"
          style={{
            background: demoHeaderGlass,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.84), inset 0 -1px 0 rgba(255,255,255,0.22)",
          }}
        />
        <div>
          <p className="relative z-10 text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: demoTopText }}>
            {eyebrow}
          </p>
          <p className="relative z-10 mt-2 text-2xl md:text-3xl font-semibold text-foreground leading-tight">
            {title}
          </p>
        </div>
        <div className="relative z-10">
          <div
            aria-hidden="true"
            className="absolute inset-[-7px] rounded-[22px] pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(245,217,168,0.34) 0%, rgba(245,217,168,0.1) 48%, transparent 76%)",
              filter: "blur(4px)",
              opacity: highlighted ? 1 : 0.75,
            }}
          />
          <div
            className="relative w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,249,241,0.96) 0%, rgba(246,232,214,0.9) 100%)",
              border: "1px solid rgba(205,164,114,0.52)",
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.78), ${demoIconGlow}`,
            }}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{ background: demoHeaderGlass }}
            />
            <Icon className="w-5 h-5 relative z-10" style={{ color: demoIconColor }} />
          </div>
        </div>
      </div>

      <div
        className="px-6 md:px-8 py-6 md:py-7 relative overflow-hidden"
        style={{ background: highlighted ? demoBrownSoft : demoBrown }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: demoBodyMesh,
            opacity: highlighted ? 1 : 0.84,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-0 h-px pointer-events-none"
          style={{ background: demoDivider }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-[-18%] w-[70%] pointer-events-none"
          style={{
            background: demoSpotlight,
            opacity: highlighted ? 0.82 : 0.54,
            transform: highlighted ? "translateX(8%)" : "translateX(0)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[48%] pointer-events-none"
          style={{
            background: demoShine,
            opacity: highlighted ? 0.92 : 0.7,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "-10%",
            bottom: "-26%",
            width: "220px",
            height: "220px",
            borderRadius: "999px",
            background:
              "radial-gradient(circle, rgba(255,224,180,0.18) 0%, rgba(255,224,180,0.05) 42%, transparent 70%)",
          }}
        />
        <p className="text-base md:text-lg leading-relaxed relative z-10" style={{ color: demoTextMuted }}>
          {body}
        </p>
        {badge ? (
          <div className="mt-5 relative z-10">
            <StatusPill label={badge} />
          </div>
        ) : null}
        <div className="mt-6 relative z-10">{children}</div>
      </div>
    </div>
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
          <div className="mb-8">
            <DemoShell
              eyebrow="Featured Walkthrough"
              icon={PlayCircle}
              title={featuredEntry.title}
              body={featuredEntry.goal}
              badge={featuredEntry.public_url ? "Watch now" : "Live walkthrough"}
              highlighted
            >
              <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr] items-start">
                <div className="grid sm:grid-cols-2 gap-3">
                  <InfoTile label="Format" value={formatType(featuredEntry.type)} />
                  <InfoTile label="Length" value={featuredEntry.duration_target} />
                </div>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "rgba(255,245,230,0.08)",
                    border: demoChipBorder,
                  }}
                >
                  <div
                    className="px-4 py-3"
                    style={{
                      background: "rgba(255,248,240,0.08)",
                      borderBottom: "1px solid rgba(233,197,150,0.18)",
                    }}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "#f6ddb0" }}>
                      Why start here
                    </p>
                  </div>
                  <ul className="px-4 py-4 space-y-2">
                    <li className="text-sm" style={{ color: demoTextMuted }}>
                      Covers the clearest end-to-end buyer journey.
                    </li>
                    <li className="text-sm" style={{ color: demoTextMuted }}>
                      Shows what the system feels like when a new lead comes in.
                    </li>
                    <li className="text-sm" style={{ color: demoTextMuted }}>
                      Makes the live demo call shorter and more specific.
                    </li>
                  </ul>
                </div>
              </div>

              {featuredEntry.public_url ? (
                <DemoCTA href={featuredEntry.public_url} external>
                  Watch Featured Demo
                  <ArrowRight className="w-4 h-4" />
                </DemoCTA>
              ) : (
                <DemoCTA href="/book">
                  See It In A Live Walkthrough
                  <ArrowRight className="w-4 h-4" />
                </DemoCTA>
              )}
            </DemoShell>
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-3">
          {supportingEntries.map((entry) => {
            const published = Boolean(entry.public_url);
            const label = published
              ? "Published"
              : entry.status === "record_next"
              ? "Record next"
              : entry.status === "ready_for_recording"
              ? "Ready for recording"
              : "Planned";

            return (
              <DemoShell
                key={entry.demo_key}
                eyebrow={label}
                icon={published ? PlayCircle : Video}
                title={entry.title}
                body={entry.goal}
                badge={formatType(entry.type)}
              >
                <div className="space-y-4">
                  <InfoTile label="Target Length" value={entry.duration_target} />

                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: "rgba(255,245,230,0.08)",
                      border: demoChipBorder,
                    }}
                  >
                    <div
                      className="px-4 py-3"
                      style={{
                        background: "rgba(255,248,240,0.08)",
                        borderBottom: "1px solid rgba(233,197,150,0.18)",
                      }}
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "#f6ddb0" }}>
                        What this demo helps answer
                      </p>
                    </div>
                    <ul className="px-4 py-4 space-y-2">
                      {(entry.source_of_truth || ["Live operator walkthrough"]).map((source) => (
                        <li key={source} className="text-sm" style={{ color: demoTextMuted }}>
                          {source}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {published ? (
                    <DemoCTA href={entry.public_url} external>
                      Watch Demo
                      <ArrowRight className="w-4 h-4" />
                    </DemoCTA>
                  ) : (
                    <DemoCTA href="/book">
                      See It In A Live Walkthrough
                      <ArrowRight className="w-4 h-4" />
                    </DemoCTA>
                  )}
                </div>
              </DemoShell>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SummaryCard({ icon: Icon, label, value, helper }) {
  return (
    <div
      className="rounded-[24px] overflow-hidden"
      style={{
        background: demoCream,
        border: demoBorder,
        boxShadow: demoShadow,
      }}
    >
      <div
        className="px-5 py-4 flex items-center gap-3 relative overflow-hidden"
        style={{
          background: demoCreamStrong,
          borderBottom: "1px solid rgba(208,166,114,0.18)",
        }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-full pointer-events-none"
          style={{ background: demoHeaderGlass }}
        />
        <div
          className="relative flex h-11 w-11 items-center justify-center rounded-xl overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,249,241,0.96) 0%, rgba(246,232,214,0.9) 100%)",
            border: "1px solid rgba(205,164,114,0.5)",
            boxShadow: demoIconGlow,
          }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{ background: demoHeaderGlass }}
          />
          <Icon className="relative z-10 h-5 w-5" style={{ color: demoIconColor }} />
        </div>
        <div>
          <p className="relative z-10 text-xs font-semibold uppercase tracking-wide" style={{ color: demoTopText }}>
            {label}
          </p>
          <p className="relative z-10 mt-1 text-2xl font-bold text-foreground">{value}</p>
        </div>
      </div>
      <div className="px-5 py-5 relative overflow-hidden" style={{ background: demoBrown }}>
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ background: demoBodyMesh, opacity: 0.72 }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[46%] pointer-events-none"
          style={{ background: demoShine, opacity: 0.62 }}
        />
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-0 h-px pointer-events-none"
          style={{ background: demoDivider }}
        />
        <p className="relative z-10 text-sm leading-relaxed" style={{ color: demoTextMuted }}>
          {helper}
        </p>
      </div>
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,245,230,0.08)",
        border: demoChipBorder,
      }}
    >
      <div
        className="px-4 py-3"
        style={{
          background: "rgba(255,248,240,0.08)",
          borderBottom: "1px solid rgba(233,197,150,0.18)",
        }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#f6ddb0" }}>
          {label}
        </p>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm font-medium" style={{ color: demoTextLight }}>{value}</p>
      </div>
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
