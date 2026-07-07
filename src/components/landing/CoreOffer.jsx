import { ArrowRight, CheckCircle2, MessageSquare, PhoneCall, Calendar, Star, RefreshCw, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CSSectionHeader from "@/components/design-system/CSSectionHeader";

const STEPS = [
  { icon: ClipboardList, title: "Choose the system", body: "Pick Starter, Growth, Pro, or an individual automation based on the lead flow gap you want fixed first." },
  { icon: MessageSquare, title: "Capture and respond", body: "New inquiries, missed calls, and website leads get routed into approved response paths." },
  { icon: PhoneCall, title: "Recover missed calls", body: "Missed callers receive a text-back and a next-step path instead of sitting in voicemail." },
  { icon: Calendar, title: "Move toward booking", body: "Interested prospects are guided toward booking, confirmation, or human handoff." },
  { icon: Star, title: "Request reviews", body: "Completed jobs or appointments can trigger review request workflows at the right time." },
  { icon: RefreshCw, title: "Reactivate old opportunities", body: "Dormant leads, no-shows, and old quotes can be re-engaged with controlled campaigns." },
];

const LAUNCH_STEPS = ["Choose System", "Guided Intake", "Access Checklist", "Configuration", "Testing", "Launch Review"];

export default function CoreOffer() {
  const navigate = useNavigate();

  return (
    <section id="how-it-works" className="pt-16 md:pt-24 pb-16 md:pb-24 px-4 md:px-6 bg-white relative" style={{ overflowX: "hidden" }}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{ background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(0,136,204,0.08) 0%, transparent 70%)" }} />
      <div className="max-w-6xl mx-auto relative z-10 pt-10">
        <CSSectionHeader
          eyebrow="How It Works"
          title="From System Selection to Launch Review"
          subtitle="ClientSurge turns buying AI automation into a clear setup path: choose the system, complete guided intake, configure the workflows, test the launch path, and go live with proof."
        />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className="rounded-xl border border-primary/15 bg-white p-6 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4"><Icon className="w-5 h-5 text-primary" /></div>
                <h3 className="font-titles text-lg font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-14 rounded-2xl border border-primary/15 bg-primary/5 p-6 md:p-8">
          <h2 className="font-titles text-2xl font-bold text-foreground mb-4 text-center">Launch Path</h2>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {LAUNCH_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="rounded-lg border border-primary/20 bg-white px-4 py-2 text-sm font-semibold text-foreground">{step}</div>
                {i < LAUNCH_STEPS.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 relative mx-auto flex max-w-4xl flex-col items-center overflow-hidden rounded-lg border border-primary/15 px-6 py-8 text-center shadow-sm md:px-10 md:py-10" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(232,246,255,0.78) 100%)", boxShadow: "0 22px 56px rgba(0,88,160,0.1)" }}>
          <CheckCircle2 className="w-8 h-8 text-primary mb-3" />
          <p className="font-display text-2xl md:text-3xl font-semibold text-foreground leading-tight">Start with a system instead of a guess.</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-foreground/70 md:text-base">Compare Starter, Growth, and Pro to choose how much of your lead flow ClientSurge should handle first.</p>
          <button type="button" onClick={() => navigate("/pricing")} className="cs-btn-primary mt-6" style={{ padding: "0 24px", height: "48px", fontSize: "0.9rem" }}>
            Compare Packages <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}