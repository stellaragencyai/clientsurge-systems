import { Bot, CheckCircle2 } from "lucide-react";

const PERSONAS = {
  hvac: {
    name: "Tyler",
    role: "AI HVAC Dispatch Assistant",
    avatar: "🔧",
    color: "#0088CC",
    bgColor: "rgba(0,136,204,0.08)",
    capabilities: [
      "Handles emergency and routine service inquiries 24/7",
      "Provides transparent service fee and availability info",
      "Schedules and confirms technician dispatch visits",
      "Sends SMS reminders and post-service review requests",
      "Screens calls to prevent diagnostic drive-time waste",
    ],
    quote: "Hi! We saw your missed call. Rapid Response HVAC here — we can get a tech to you today. What's the issue?",
  },
  roofing: {
    name: "Derek",
    role: "AI Roofing Inspection Coordinator",
    avatar: "🏠",
    color: "#003B8F",
    bgColor: "rgba(0,59,143,0.07)",
    capabilities: [
      "Handles high-volume storm and hail damage inquiries",
      "Explains insurance claim process and deductible info",
      "Schedules free roof inspections and confirms visits",
      "Sends damage questionnaire to prep estimators",
      "Re-engages dormant storm leads automatically",
    ],
    quote: "Sorry about the hail damage! StormPro can help. We offer FREE inspections & direct insurance billing. Available this week?",
  },
  contractors: {
    name: "Alex",
    role: "AI Project Estimator Assistant",
    avatar: "📐",
    color: "#5B4FCF",
    bgColor: "rgba(91,79,207,0.07)",
    capabilities: [
      "Handles remodel and new build inquiries 24/7",
      "Sends project timeline, process, and deposit info",
      "Qualifies leads by scope, budget, and start date",
      "Schedules site visits and syncs to contractor calendar",
      "Reactivates old quotes and dormant opportunities",
    ],
    quote: "Hi! BuildRight Contracting here. We'd love to give you a free estimate. What type of project are you looking at?",
  },
  "med-spa": {
    name: "Sarah",
    role: "AI Spa Booking Concierge",
    avatar: "💆",
    color: "#8B5CF6",
    bgColor: "rgba(139,92,246,0.07)",
    capabilities: [
      "Handles consultation inquiries for all treatments 24/7",
      "Shares pricing, availability, and booking links instantly",
      "Collects treatment interest and preferred appointment time",
      "Sends prep instructions and optional deposit link",
      "Re-engages dormant patients with seasonal offers",
    ],
    quote: "Hi! Thanks for reaching out to Luminous. 💉 Standard Botox starts at $150. Would you like to see availability?",
  },
  dental: {
    name: "Emma",
    role: "AI Dental Patient Coordinator",
    avatar: "🦷",
    color: "#0088CC",
    bgColor: "rgba(0,136,204,0.08)",
    capabilities: [
      "Handles new patient and emergency inquiries 24/7",
      "Provides insurance acceptance and appointment info",
      "Books emergency and routine visits instantly",
      "Sends prep instructions and appointment reminders",
      "Triggers post-appointment review requests",
    ],
    quote: "Hi! Sorry to hear you're in pain. Bright Smile Dental can see you today. Our next emergency slot is 3 PM. Reply YES to confirm!",
  },
  chiropractic: {
    name: "Jordan",
    role: "AI Chiropractic Concierge",
    avatar: "🧘",
    color: "#0EA5E9",
    bgColor: "rgba(14,165,233,0.07)",
    capabilities: [
      "Handles insurance and new patient inquiries 24/7",
      "Shares accepted insurance plans, rates, and availability",
      "Books initial exams and syncs to clinic EHR",
      "Sends care plan reminders to reduce compliance drop-off",
      "Re-engages dormant patients with re-activation offers",
    ],
    quote: "Hi! Yes, we accept Blue Cross and 95+ other plans. Your first session is $125. Can you come in tomorrow at 10 AM?",
  },
};

export default function IndustryPersonaCard({ industry }) {
  const p = PERSONAS[industry] || PERSONAS.hvac;

  return (
    <section className="px-4 py-14 md:px-6 md:py-20" style={{ background: "#ffffff" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">Meet Your AI Assistant</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Your 24/7 AI Team Member
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Profile */}
          <div
            className="rounded-2xl p-8"
            style={{
              background: p.bgColor,
              border: `1px solid ${p.color}25`,
              boxShadow: `0 16px 48px ${p.color}12`,
            }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ background: `${p.color}18`, border: `2px solid ${p.color}30` }}
              >
                {p.avatar}
              </div>
              <div>
                <p className="font-black text-xl text-foreground">{p.name}</p>
                <p className="text-sm font-semibold" style={{ color: p.color }}>{p.role}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#34c759", boxShadow: "0 0 0 3px rgba(52,199,89,0.2)" }} />
                  <span className="text-xs font-semibold text-muted-foreground">Active 24/7</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {p.capabilities.map((cap, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 style={{ width: "15px", height: "15px", color: p.color, flexShrink: 0, marginTop: "2px" }} />
                  <p className="text-sm text-foreground/75">{cap}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sample message */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground mb-4">Example AI Response</p>
            <div
              className="rounded-2xl p-6"
              style={{ background: "#1c1c1e", border: "6px solid #2c2c2e", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}
            >
              <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: p.color }}>
                  <Bot style={{ width: "14px", height: "14px", color: "#fff" }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{p.name} · AI</p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>Responding now…</p>
                </div>
                <div className="ml-auto">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#34c759" }} />
                </div>
              </div>
              <div className="rounded-xl px-4 py-3" style={{ background: p.color, maxWidth: "85%" }}>
                <p className="text-white text-sm leading-relaxed">{p.quote}</p>
              </div>
              <p className="text-[10px] mt-3" style={{ color: "rgba(255,255,255,0.35)" }}>
                Delivered automatically · Trained on your business · Customizable
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}