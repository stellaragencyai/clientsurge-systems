import { ArrowRight, Zap, PhoneCall, Send, CalendarCheck, RotateCcw, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AUTOMATION_CARDS = [
  {
    id: "instant-lead-response",
    icon: Zap,
    title: "Instant Lead Response",
    problem: "Slow response lets competitors win.",
    trigger: "New lead comes in via form, call, or message.",
    does: "Replies within 60 seconds — answers basic questions, captures intent, and keeps the lead warm.",
    outcome: "More leads stay in your pipeline instead of calling competitors.",
    link: "/lead-capture-automation",
  },
  {
    id: "missed-call-text-back",
    icon: PhoneCall,
    title: "Missed Call Text-Back",
    problem: "Missed calls are lost revenue.",
    trigger: "Inbound call is missed, goes to voicemail, or rings after hours.",
    does: "Sends an instant text saying you'll get right back — captures who they are and what they need.",
    outcome: "Missed callers stay in your pipeline instead of calling the next listing.",
    link: "/missed-call-text-back",
  },
  {
    id: "nurture-sequence",
    icon: Send,
    title: "14-Day Nurture Sequence",
    problem: "Most leads aren't ready to book right away.",
    trigger: "Lead replied but hasn't scheduled or committed yet.",
    does: "Sends timed follow-up messages over 14 days — across SMS and email — keeping your business top of mind.",
    outcome: "Leads that would have gone cold stay warm until they're ready.",
    link: "/ai-lead-follow-up",
  },
  {
    id: "ai-scheduling",
    icon: CalendarCheck,
    title: "AI Scheduling Agent",
    problem: "Back-and-forth scheduling loses momentum.",
    trigger: "Lead shows interest and is ready to move forward.",
    does: "Offers available times, confirms the appointment, and sends automated reminders before the visit.",
    outcome: "More qualified prospects turn into booked appointments with less manual work.",
    link: "/appointment-booking-automation",
  },
  {
    id: "lead-reactivation",
    icon: RotateCcw,
    title: "Lead Reactivation",
    problem: "Old leads still have value — you already paid to get them.",
    trigger: "Lead went quiet 30–90 days ago, never booked, or quote expired.",
    does: "Sends a targeted re-engagement message based on their original interest and timing.",
    outcome: "Dormant leads turn back into active conversations and new revenue.",
    link: "/customer-reactivation",
  },
  {
    id: "review-request",
    icon: Star,
    title: "Review Request Automation",
    problem: "Happy customers forget to leave reviews.",
    trigger: "Job is completed, appointment is finished, or customer gives a positive signal.",
    does: "Sends a well-timed review request via SMS or email while the experience is fresh.",
    outcome: "More consistent Google reviews, stronger local reputation, and early warning on unhappy customers.",
    link: "/review-automation",
  },
];

export default function AutomationCatalog() {
  const navigate = useNavigate();

  return (
    <section
      id="automation-catalog"
      className="py-16 md:py-24 px-4 md:px-6"
      style={{ background: "linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="cs-eyebrow mb-3">AI Automation Systems</p>
          <h2
            className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Choose the AI automation system your business needs.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
            Six automated systems that capture leads, follow up intelligently, schedule appointments, and recover revenue — running 24/7.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AUTOMATION_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="flex flex-col rounded-lg p-6 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                style={{
                  background: "hsl(var(--card))",
                  border: "1px solid rgba(0,136,204,0.14)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
                }}
                onClick={() => navigate(card.link)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && navigate(card.link)}
              >
                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,136,204,0.12), rgba(0,174,239,0.06))",
                    border: "1px solid rgba(0,136,204,0.18)",
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: "#0088CC" }} />
                </div>

                {/* Title & problem */}
                <h3 className="font-bold text-foreground text-base mb-1.5" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {card.title}
                </h3>
                <p className="text-xs font-semibold mb-4" style={{ color: "#dc2626" }}>
                  Problem: {card.problem}
                </p>

                {/* Trigger */}
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Trigger</p>
                  <p className="text-xs text-foreground/75 leading-relaxed">{card.trigger}</p>
                </div>

                {/* What it does */}
                <div className="mb-3 flex-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">What it does</p>
                  <p className="text-xs text-foreground/75 leading-relaxed">{card.does}</p>
                </div>

                {/* Outcome */}
                <div className="rounded-lg p-3 mb-4" style={{ background: "rgba(0,174,239,0.06)", border: "1px solid rgba(0,174,239,0.12)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#0088CC" }}>Business outcome</p>
                  <p className="text-xs text-foreground/80 font-medium leading-relaxed">{card.outcome}</p>
                </div>

                {/* Link */}
                <div className="flex items-center gap-1.5 text-xs font-bold mt-auto" style={{ color: "#0088CC" }}>
                  Learn more <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/book")}
            className="cs-btn-primary"
            style={{ padding: "0 36px", height: "52px", fontSize: "0.9rem" }}
          >
            Get Free Automation Audit
          </button>
          <button
            type="button"
            onClick={() => navigate("/automations")}
            className="inline-flex items-center justify-center h-[52px] px-8 rounded-lg border-2 border-primary/25 bg-background/80 text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
          >
            View Automation Systems
          </button>
        </div>
      </div>
    </section>
  );
}