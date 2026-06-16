import { ArrowRight, Clock, PhoneOff, TrendingUp, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const URGENCY_POINTS = [
  {
    icon: Clock,
    title: "Every slow response gives competitors time to win the lead.",
    body: "Most leads contact 2–3 businesses. The first one to respond credibly usually wins. If you respond in hours instead of seconds, you're giving your competitors a head start.",
  },
  {
    icon: PhoneOff,
    title: "Missed calls are often buyers ready to act now.",
    body: "Someone who calls your business already has intent. If that call goes to voicemail or rings unanswered, that lead often calls the next listing — and your revenue walks away.",
  },
  {
    icon: TrendingUp,
    title: "Old leads can still turn into revenue if followed up properly.",
    body: "Leads from 30, 60, or 90 days ago aren't dead — they just weren't ready then. A well-timed re-engagement message can reopen the conversation and create revenue from contacts you already paid to acquire.",
  },
  {
    icon: AlertCircle,
    title: "You don't need more traffic if you're losing the leads you already have.",
    body: "Spending more on ads, SEO, and marketing when your current lead flow is leaking revenue is throwing good money after bad. Fix the leak first — the ROI is immediate and measurable.",
  },
];

export default function RevenueUrgencySection() {
  const navigate = useNavigate();

  return (
    <section
      id="revenue-urgency"
      className="py-16 md:py-24 px-4 md:px-6"
      style={{ background: "#0A1628" }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.22em] mb-4" style={{ color: "rgba(0,174,239,0.7)" }}>
            The Cost of Waiting
          </p>
          <h2
            className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Revenue you're losing right now.
          </h2>
          <p className="mt-4 text-white/50 max-w-xl mx-auto text-sm leading-relaxed">
            Most local service businesses don't have a lead problem — they have a lead response problem. Here's what that costs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {URGENCY_POINTS.map((point) => {
            const Icon = point.icon;
            return (
              <div
                key={point.title}
                className="flex gap-5 p-6 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: "rgba(0,174,239,0.12)",
                    border: "1px solid rgba(0,174,239,0.2)",
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: "#00AEEF" }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-snug mb-2">{point.title}</h3>
                  <p className="text-xs text-white/45 leading-relaxed">{point.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <p className="text-white/40 text-sm mb-6 max-w-lg mx-auto leading-relaxed">
            Every day without automation is another day of lost revenue. Your competitors are already responding faster — don't give them any more of your leads.
          </p>
          <button
            type="button"
            onClick={() => navigate("/book")}
            className="cs-btn-primary"
            style={{ padding: "0 36px", height: "52px", fontSize: "0.9rem" }}
          >
            Stop Losing Revenue — Build My AI Automation Stack <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}