import { useState } from "react";
import { PlayCircle, Video, ArrowRight, Clapperboard } from "lucide-react";
import { getPublicDemoEntries, getDemoCoverageSummary } from "@/lib/demoVideoCatalog";
import DemoBookingModal from "@/components/forms/DemoBookingModal";

const premiumRing = "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)";
const premiumRingShadow = "0 4px 24px rgba(120,70,20,0.22), 0 2px 8px rgba(120,70,20,0.12)";
const cardSurface = "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,248,244,0.96) 100%)";
const cardBorder = "1.5px solid rgba(212,184,142,0.38)";
const cardShadow = "0 8px 28px rgba(111,67,31,0.07), 0 2px 8px rgba(111,67,31,0.04)";
const topText = "rgba(184, 129, 72, 0.92)";
const iconColor = "#9a5c2e";

function formatType(type) {
  if (type === "flagship_demo") return "Flagship demo";
  if (type === "service_clip") return "Service clip";
  if (type === "industry_cutdown") return "Industry cutdown";
  if (type === "operator_clip") return "Operator training clip";
  return type;
}

function DemoCard({ eyebrow, icon: Icon, title, body, badge, highlighted, href, external, onBookDemo }) {
  const [hovered, setHovered] = useState(false);

  const handleCTA = (e) => {
    if (!external && href === "/book") {
      e.preventDefault();
      onBookDemo();
    }
  };

  return (
    <div
      className="rounded-[24px] flex flex-col h-full transition-all duration-300"
      style={{
        padding: highlighted ? "2.5px" : "2px",
        background: highlighted
          ? "linear-gradient(135deg,#a0714f 0%,#e8c080 28%,#f5d9a8 50%,#d4a055 72%,#7a4f2e 100%)"
          : premiumRing,
        boxShadow: hovered
          ? "0 14px 44px rgba(120,70,20,0.26), 0 4px 16px rgba(120,70,20,0.16)"
          : highlighted
          ? "0 8px 40px rgba(120,70,20,0.32), 0 4px 16px rgba(120,70,20,0.18)"
          : premiumRingShadow,
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="rounded-[22px] overflow-hidden flex flex-col h-full"
        style={{ background: cardSurface }}
      >
        {/* Header — cream/beige top */}
        <div
          className="px-5 py-4 flex items-center justify-between gap-3 relative overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #f8ead8 0%, #f2e0c8 100%)",
            borderBottom: "1px solid rgba(154,92,46,0.15)",
          }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: topText }}>
              {eyebrow}
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground leading-snug line-clamp-2">
              {title}
            </p>
          </div>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(180deg, rgba(255,249,241,0.96) 0%, rgba(246,232,214,0.9) 100%)",
              border: "1px solid rgba(205,164,114,0.52)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.78), 0 0 0 1px rgba(255,255,255,0.18)",
            }}
          >
            <Icon className="w-4 h-4" style={{ color: iconColor }} />
          </div>
        </div>

        {/* Body — white/light */}
        <div className="px-5 py-5 flex flex-col flex-1 gap-4">
          <p className="text-sm leading-relaxed flex-1 text-foreground/70 line-clamp-3">{body}</p>

          {badge && (
            <span
              className="inline-flex w-fit items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{
                background: "rgba(154,92,46,0.08)",
                color: "#7a4825",
                border: "1px solid rgba(154,92,46,0.18)",
              }}
            >
              {badge}
            </span>
          )}

          {/* CTA — matches site-wide gold pill style */}
          {highlighted ? (
            <button
              type="button"
              onClick={() => onBookDemo()}
              style={{
                display: "inline-block",
                borderRadius: "9999px",
                padding: "2px",
                background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
                boxShadow: "0 4px 14px rgba(120,70,20,0.35)",
                border: "none",
                cursor: "pointer",
                width: "100%",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  height: "40px",
                  borderRadius: "9999px",
                  background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                  color: "#f5e6d0",
                  fontWeight: "700",
                  fontSize: "0.8rem",
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                Book Your Free Demo
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          ) : (
            <a
              href={href}
              onClick={handleCTA}
              {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
              className="inline-flex items-center justify-center gap-2 w-full h-10 rounded-full border border-primary/25 bg-primary/5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
              style={{ textDecoration: "none" }}
            >
              {external ? "Watch Demo" : "Book Your Free Demo"}
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <div
      className="rounded-2xl px-5 py-5 flex items-start gap-4"
      style={{
        background: cardSurface,
        border: cardBorder,
        boxShadow: cardShadow,
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: "linear-gradient(135deg,#9a5c2e,#7a4825)",
          boxShadow: "0 2px 8px rgba(154,92,46,0.3)",
        }}
      >
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none mb-1">{value}</p>
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: topText }}>{label}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{helper}</p>
      </div>
    </div>
  );
}

export default function DemoVideoSection() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const entries = getPublicDemoEntries();
  const summary = getDemoCoverageSummary();
  const featuredEntry = entries.find((entry) => Boolean(entry.public_url)) || entries[0];
  const supportingEntries = entries
    .filter((entry) => entry.demo_key !== featuredEntry?.demo_key)
    .slice(0, 3);

  return (
    <>
      <section
        id="demo-video-library"
        className="py-20 md:py-28 px-6 bg-gradient-to-b from-background to-card"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">
              See The System In Action
            </p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
              See Exactly How The System Works Before You Commit
            </h2>
            <p className="mt-5 text-muted-foreground text-lg leading-relaxed">
              Start with one strong overview, then explore focused clips that answer the most common questions buyers have before booking.
            </p>
          </div>

          {/* Stat cards row */}
          <div className="grid gap-4 md:grid-cols-3 mb-10">
            <StatCard
              icon={Video}
              label="Short Demo Clips"
              value={summary.public_total}
              helper="A focused library built around the services we install most often."
            />
            <StatCard
              icon={PlayCircle}
              label="Published Walkthroughs"
              value={summary.public_published}
              helper="Only live, usable demos are counted here."
            />
            <StatCard
              icon={Clapperboard}
              label="Service Views Covered"
              value={summary.service_coverage_keys.length}
              helper="Enough coverage to preview the main customer journey."
            />
          </div>

          {/* Demo cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[featuredEntry, ...supportingEntries].filter(Boolean).map((entry, i) => {
              const isFirst = i === 0;
              const published = Boolean(entry.public_url);
              const label = isFirst
                ? "Featured"
                : published
                ? "Published"
                : entry.status === "record_next"
                ? "Record next"
                : entry.status === "ready_for_recording"
                ? "Ready for recording"
                : "Planned";

              return (
                <DemoCard
                  key={entry.demo_key}
                  eyebrow={label}
                  icon={published ? PlayCircle : Video}
                  title={entry.title}
                  body={entry.goal}
                  badge={formatType(entry.type)}
                  highlighted={isFirst}
                  href={published ? entry.public_url : "/book"}
                  external={published}
                  onBookDemo={() => setShowBookingModal(true)}
                />
              );
            })}
          </div>
        </div>
      </section>

      {showBookingModal && (
        <DemoBookingModal onClose={() => setShowBookingModal(false)} />
      )}
    </>
  );
}