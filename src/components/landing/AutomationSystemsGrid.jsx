import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import CSSectionHeader from "@/components/design-system/CSSectionHeader";

// Premium custom SVG icons — each uniquely designed for its automation system
const IconLeadCapture = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
    <defs>
      <linearGradient id="lcGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00AEEF"/>
        <stop offset="1" stopColor="#005691"/>
      </linearGradient>
    </defs>
    <path d="M8 10h32l-6 10H14L8 10z" fill="url(#lcGrad)" opacity="0.9"/>
    <path d="M14 20h20l-5 10H19L14 20z" fill="url(#lcGrad)" opacity="0.75"/>
    <path d="M19 30h10l-5 8-5-8z" fill="url(#lcGrad)"/>
    <circle cx="24" cy="38" r="3" fill="#D4AF37"/>
  </svg>
);

const IconMissedCall = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
    <defs>
      <linearGradient id="mcGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00AEEF"/>
        <stop offset="1" stopColor="#005691"/>
      </linearGradient>
    </defs>
    <path d="M10 18c0-4.4 3.6-8 8-8h12c4.4 0 8 3.6 8 8v2c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-1h-8v1c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-2z" fill="url(#mcGrad)" opacity="0.8"/>
    <rect x="20" y="26" width="8" height="12" rx="2" fill="url(#mcGrad)"/>
    <path d="M37 8l4 4-4 4M41 12h-6" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="38" cy="36" r="4" fill="#D4AF37"/>
    <path d="M36 36l1.5 1.5L40 34" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconAIFollowUp = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
    <defs>
      <linearGradient id="afGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00AEEF"/>
        <stop offset="1" stopColor="#003B8F"/>
      </linearGradient>
    </defs>
    <rect x="6" y="10" width="26" height="20" rx="4" fill="url(#afGrad)" opacity="0.9"/>
    <path d="M6 30l4-5h22v5H6z" fill="url(#afGrad)" opacity="0.6"/>
    <circle cx="13" cy="20" r="2" fill="white" opacity="0.9"/>
    <circle cx="20" cy="20" r="2" fill="white" opacity="0.9"/>
    <circle cx="27" cy="20" r="2" fill="white" opacity="0.9"/>
    <path d="M36 18l3-3 3 3M39 15v10" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="39" cy="30" r="3" fill="#D4AF37" opacity="0.8"/>
  </svg>
);

const IconBooking = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
    <defs>
      <linearGradient id="bkGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00AEEF"/>
        <stop offset="1" stopColor="#005691"/>
      </linearGradient>
    </defs>
    <rect x="8" y="12" width="32" height="28" rx="4" fill="url(#bkGrad)" opacity="0.15" stroke="url(#bkGrad)" strokeWidth="1.5"/>
    <rect x="8" y="12" width="32" height="10" rx="4" fill="url(#bkGrad)"/>
    <line x1="16" y1="8" x2="16" y2="16" stroke="url(#bkGrad)" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="32" y1="8" x2="32" y2="16" stroke="url(#bkGrad)" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M17 30l4 4 10-8" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconReview = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
    <defs>
      <linearGradient id="rvGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#D4AF37"/>
        <stop offset="1" stopColor="#B8941F"/>
      </linearGradient>
    </defs>
    <path d="M24 8l4.2 8.5 9.4 1.4-6.8 6.6 1.6 9.3L24 29l-8.4 4.8 1.6-9.3-6.8-6.6 9.4-1.4L24 8z" fill="url(#rvGrad)"/>
    <circle cx="36" cy="36" r="7" fill="#00AEEF"/>
    <path d="M33 36l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconReactivation = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
    <defs>
      <linearGradient id="reGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00AEEF"/>
        <stop offset="1" stopColor="#003B8F"/>
      </linearGradient>
    </defs>
    <path d="M24 10A14 14 0 0110 24" stroke="url(#reGrad)" strokeWidth="3" strokeLinecap="round"/>
    <path d="M24 38A14 14 0 0138 24" stroke="url(#reGrad)" strokeWidth="3" strokeLinecap="round"/>
    <path d="M10 24A14 14 0 0124 38" stroke="url(#reGrad)" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
    <path d="M38 24A14 14 0 0124 10" stroke="url(#reGrad)" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
    <polygon points="8,20 14,24 8,28" fill="url(#reGrad)"/>
    <polygon points="40,28 34,24 40,20" fill="url(#reGrad)"/>
    <circle cx="24" cy="24" r="4" fill="#D4AF37"/>
    <circle cx="24" cy="24" r="2" fill="white"/>
  </svg>
);

const SYSTEMS = [
  {
    SvgIcon: IconLeadCapture,
    title: "Lead Capture System",
    outcome: "Every website visitor, form fill, ad click, and phone inquiry lands in one organized pipeline — instantly.",
    impact: "0 leads lost",
    impactSub: "to the gap",
    cta: "View Lead Capture System",
    href: "/store",
    accentColor: "#00AEEF",
  },
  {
    SvgIcon: IconMissedCall,
    title: "Missed-Call Recovery System",
    outcome: "When a call goes unanswered, an instant automated text fires back — keeping the lead warm before they dial a competitor.",
    impact: "< 60 sec",
    impactSub: "response time",
    cta: "View Missed-Call System",
    href: "/store",
    accentColor: "#00AEEF",
  },
  {
    SvgIcon: IconAIFollowUp,
    title: "AI Follow-Up System",
    outcome: "Multi-step SMS and email sequences follow up automatically until leads reply, book, or opt out — no manual chasing.",
    impact: "5–12x",
    impactSub: "more replies",
    cta: "View Follow-Up System",
    href: "/store",
    accentColor: "#00AEEF",
  },
  {
    SvgIcon: IconBooking,
    title: "Booking Automation System",
    outcome: "Warm leads move straight into booked appointments with automated reminders, confirmations, and calendar sync.",
    impact: "+40%",
    impactSub: "show-up rate",
    cta: "View Booking System",
    href: "/store",
    accentColor: "#00AEEF",
  },
  {
    SvgIcon: IconReview,
    title: "Review Automation System",
    outcome: "After every completed job, the system automatically requests reviews from happy customers — and flags unhappy ones privately.",
    impact: "3–5★",
    impactSub: "avg. rating lift",
    cta: "View Review System",
    href: "/store",
    accentColor: "#D4AF37",
  },
  {
    SvgIcon: IconReactivation,
    title: "Reactivation System",
    outcome: "Re-engage old leads, past customers, no-shows, unbooked quotes, and cold opportunities still sitting in your pipeline.",
    impact: "Recover $$$",
    impactSub: "already paid for",
    cta: "View Reactivation System",
    href: "/store",
    accentColor: "#D4AF37",
  },
];

const PROCESS_STEPS = [
  "Choose System",
  "AI Intake",
  "Setup Plan",
  "Remote Build",
  "Testing",
  "Launch",
];

const BRAIN_BULLETS = [
  "Collects business details through guided intake",
  "Preserves package and service context from signup",
  "Organizes required access and setup inputs",
  "Helps prepare workflow logic, messages, routing, and follow-up structure",
  "Supports remote installation and testing",
  "Gives the client a clearer path from signup to activation",
];

const PROOF_POINTS = [
  "Package-based service selection",
  "Lead scoring and intake records",
  "Twilio SMS and Resend email support",
  "Client onboarding sequence",
  "Service install status tracking",
  "Communication event logging",
  "Outcome analytics foundation",
];

export default function AutomationSystemsGrid() {
  const navigate = useNavigate();

  return (
    <>
      {/* ── Section 1: Browse Systems ── */}
      <section id="automation-systems" className="py-20 px-6 bg-white" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }}>
        <div className="max-w-6xl mx-auto">
          <CSSectionHeader
            eyebrow="AI Automation Marketplace"
            title="Browse Business AI Automation Systems"
            subtitle="Choose from practical automation systems that solve real business problems: missed calls, slow follow-up, unbooked leads, forgotten quotes, review gaps, and old opportunities sitting untouched."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SYSTEMS.map(({ SvgIcon, title, outcome, impact, impactSub, cta, href, accentColor }) => {
              const isGold = accentColor === "#D4AF37";
              return (
                <div
                  key={title}
                  className="group rounded-2xl bg-white flex flex-col gap-0 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 overflow-hidden"
                  style={{
                    border: "1px solid rgba(0,174,239,0.14)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                  }}
                >
                  {/* Top colored bar */}
                  <div
                    className="h-1 w-full flex-shrink-0 transition-all duration-300"
                    style={{
                      background: isGold
                        ? "linear-gradient(90deg, #D4AF37, #B8941F)"
                        : "linear-gradient(90deg, #00AEEF, #005691)",
                    }}
                  />

                  <div className="p-6 flex flex-col gap-4 flex-1">
                    {/* Icon + impact pill row */}
                    <div className="flex items-start justify-between gap-3">
                      {/* Icon container */}
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                        style={{
                          background: isGold
                            ? "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(184,148,31,0.08))"
                            : "linear-gradient(135deg, rgba(0,174,239,0.14), rgba(0,86,145,0.08))",
                          border: isGold
                            ? "1px solid rgba(212,175,55,0.3)"
                            : "1px solid rgba(0,174,239,0.25)",
                          boxShadow: isGold
                            ? "0 4px 16px rgba(212,175,55,0.2)"
                            : "0 4px 16px rgba(0,174,239,0.18)",
                        }}
                      >
                        <SvgIcon />
                      </div>

                      {/* Impact pill */}
                      <div
                        className="flex flex-col items-end text-right flex-shrink-0"
                        style={{
                          padding: "6px 12px",
                          borderRadius: "10px",
                          background: isGold
                            ? "rgba(212,175,55,0.1)"
                            : "rgba(0,174,239,0.08)",
                          border: isGold
                            ? "1px solid rgba(212,175,55,0.28)"
                            : "1px solid rgba(0,174,239,0.2)",
                        }}
                      >
                        <span
                          className="text-sm font-extrabold leading-none"
                          style={{ color: accentColor }}
                        >
                          {impact}
                        </span>
                        <span className="text-[10px] font-semibold text-foreground/75 mt-0.5 leading-none">
                          {impactSub}
                        </span>
                      </div>
                    </div>

                    {/* Text */}
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-foreground mb-2">{title}</h3>
                      <p className="text-sm text-foreground/80 leading-relaxed">{outcome}</p>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => {
                        trackCTA(cta.toLowerCase().replace(/\s+/g, "_"), "automation_systems_grid");
                        navigate(href);
                      }}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors self-start group-hover:gap-2.5"
                      style={{ color: isGold ? "#B8941F" : accentColor, minHeight: "unset", minWidth: "unset" }}
                    >
                      {cta} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => { trackCTA("browse_all_systems", "automation_systems_grid"); navigate("/store"); }}
              className="cs-btn-primary inline-flex items-center gap-2"
            >
              Browse All Automation Systems <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 2: How the AI Brain Works ── */}
      <section className="py-20 px-6 bg-white border-t border-border">
        <div className="max-w-6xl mx-auto">
          <CSSectionHeader
            eyebrow="Remote Setup Engine"
            title="How the ClientSurge AI Brain Works"
            subtitle="ClientSurge does not just sell automation ideas. After a business chooses a system, the ClientSurge AI brain helps collect business details, lead sources, phone and email requirements, booking links, CRM details, and automation goals. It turns that information into a setup plan so the automation can be remotely configured, tested, and launched."
          />

          {/* Horizontal process steps */}
          <div className="flex flex-wrap items-center justify-center mb-12">
            {PROCESS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center gap-2 px-3 py-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #0088CC, #005691)" }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-xs font-semibold text-foreground text-center whitespace-nowrap">{step}</span>
                </div>
                {i < PROCESS_STEPS.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-foreground/50 flex-shrink-0 mb-4" />
                )}
              </div>
            ))}
          </div>

          {/* Bullets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {BRAIN_BULLETS.map((bullet) => (
              <div key={bullet} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">{bullet}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => { trackCTA("start_remote_setup_brain", "ai_brain_section"); navigate("/book"); }}
              className="cs-btn-primary inline-flex items-center gap-2"
            >
              Start Remote Setup <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 3: Proof Strip ── */}
      <section className="py-12 px-6 bg-white border-t border-border">
        <div className="max-w-5xl mx-auto text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">Built Around a Real Automation Operating System</h3>
          <p className="text-sm text-foreground/80 mb-6">The ClientSurge platform is built on a real automation infrastructure foundation — not a collection of disconnected tools.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {PROOF_POINTS.map((point) => (
              <span
                key={point}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border"
                style={{ background: "rgba(0,174,239,0.06)", borderColor: "rgba(0,174,239,0.2)", color: "#006BB0" }}
              >
                <Check className="w-3.5 h-3.5 flex-shrink-0" />
                {point}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}