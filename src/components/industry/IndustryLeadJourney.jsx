import { Phone, MessageSquare, Calendar, CheckCircle2, Star } from "lucide-react";

const JOURNEY_CONFIGS = {
  hvac: {
    title: "From Missed Call to Booked Service — In Under 60 Seconds",
    steps: [
      { icon: Phone, label: "Missed Call", desc: "Homeowner calls during peak hours or after hours", color: "#ef4444" },
      { icon: MessageSquare, label: "Instant AI Text-Back", desc: "AI sends personalized SMS within 60 seconds with availability", color: "#0088CC" },
      { icon: CheckCircle2, label: "Lead Qualifies", desc: "AI collects service type, urgency, and address details", color: "#6366f1" },
      { icon: Calendar, label: "Appointment Booked", desc: "Customer selects time slot — syncs to your dispatch calendar", color: "#0088CC" },
      { icon: Star, label: "Review Requested", desc: "Post-service review request sent automatically", color: "#f59e0b" },
    ],
  },
  roofing: {
    title: "Storm Lead to Signed Estimate — Automated Every Step",
    steps: [
      { icon: Phone, label: "Storm Damage Inquiry", desc: "Homeowner calls or fills web form about hail/wind damage", color: "#ef4444" },
      { icon: MessageSquare, label: "Instant AI Response", desc: "AI sends damage questionnaire and free inspection offer", color: "#0088CC" },
      { icon: CheckCircle2, label: "Lead Qualifies", desc: "AI collects property address, damage type, insurance carrier", color: "#6366f1" },
      { icon: Calendar, label: "Inspection Scheduled", desc: "Estimator visit confirmed with SMS reminder sequence", color: "#0088CC" },
      { icon: Star, label: "Job Signed & Review", desc: "Post-project review auto-requested on completion", color: "#f59e0b" },
    ],
  },
  contractors: {
    title: "Project Inquiry to Signed Contract — Automated",
    steps: [
      { icon: Phone, label: "Project Inquiry", desc: "Homeowner submits remodel/build request via call or form", color: "#ef4444" },
      { icon: MessageSquare, label: "Instant AI Response", desc: "AI sends project intake form with timeline and deposit info", color: "#0088CC" },
      { icon: CheckCircle2, label: "Lead Qualifies", desc: "AI collects scope, budget, preferred start date", color: "#6366f1" },
      { icon: Calendar, label: "Site Visit Booked", desc: "Estimator site visit confirmed with calendar sync", color: "#0088CC" },
      { icon: Star, label: "Contract & Review", desc: "Post-project review automatically requested", color: "#f59e0b" },
    ],
  },
  "med-spa": {
    title: "Consultation Inquiry to In-Chair Treatment — Automated",
    steps: [
      { icon: Phone, label: "Consultation Inquiry", desc: "Patient calls or submits web form about Botox, fillers, or body treatment", color: "#ec4899" },
      { icon: MessageSquare, label: "Instant AI Response", desc: "AI sends pricing, availability, and consultation booking link", color: "#8b5cf6" },
      { icon: CheckCircle2, label: "Patient Qualifies", desc: "AI collects treatment interest, medical history flag, preferred date", color: "#6366f1" },
      { icon: Calendar, label: "Consultation Booked", desc: "Appointment confirmed with prep instructions and deposit option", color: "#8b5cf6" },
      { icon: Star, label: "Review Requested", desc: "Post-treatment review request sent automatically", color: "#f59e0b" },
    ],
  },
  dental: {
    title: "Patient Inquiry to Confirmed Appointment — Automated",
    steps: [
      { icon: Phone, label: "Patient Inquiry", desc: "New patient calls or submits web form — emergency or routine", color: "#ef4444" },
      { icon: MessageSquare, label: "Instant AI Response", desc: "AI responds with availability, insurance info, and booking link", color: "#0088CC" },
      { icon: CheckCircle2, label: "Patient Qualifies", desc: "AI collects insurance, appointment type, and preferred time", color: "#6366f1" },
      { icon: Calendar, label: "Appointment Confirmed", desc: "Booking confirmed with prep instructions and reminders", color: "#0088CC" },
      { icon: Star, label: "Review Requested", desc: "Post-visit review request sent after appointment", color: "#f59e0b" },
    ],
  },
  chiropractic: {
    title: "New Patient Inquiry to Care Plan Enrollment — Automated",
    steps: [
      { icon: Phone, label: "New Patient Inquiry", desc: "Patient asks about insurance, rates, or intake process", color: "#ef4444" },
      { icon: MessageSquare, label: "Instant AI Response", desc: "AI sends accepted insurance list, rates, and next available slot", color: "#0088CC" },
      { icon: CheckCircle2, label: "Patient Qualifies", desc: "AI collects insurance, chief complaint, and preferred schedule", color: "#6366f1" },
      { icon: Calendar, label: "Exam Booked", desc: "Initial exam confirmed with intake forms and reminders", color: "#0088CC" },
      { icon: Star, label: "Care Plan & Review", desc: "Care plan compliance reminders + review request automated", color: "#f59e0b" },
    ],
  },
};

export default function IndustryLeadJourney({ industry }) {
  const cfg = JOURNEY_CONFIGS[industry] || JOURNEY_CONFIGS.hvac;

  return (
    <section className="px-4 py-14 md:px-6 md:py-20" style={{ background: "linear-gradient(180deg, #f7fbff 0%, #eef7ff 100%)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">Patient Journey</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">{cfg.title}</h2>
        </div>

        <div className="relative">
          {/* connector line desktop */}
          <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-0.5" style={{ background: "linear-gradient(90deg, rgba(0,136,204,0.15), rgba(0,136,204,0.4), rgba(0,136,204,0.15))" }} />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
            {cfg.steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center relative">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 relative z-10"
                    style={{
                      background: `${step.color}12`,
                      border: `2px solid ${step.color}30`,
                      boxShadow: `0 8px 24px ${step.color}20`,
                    }}
                  >
                    <Icon style={{ width: "26px", height: "26px", color: step.color }} />
                  </div>
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center z-20"
                    style={{ background: step.color, marginTop: "-4px" }}
                  >
                    <span className="text-white font-black" style={{ fontSize: "9px" }}>{i + 1}</span>
                  </div>
                  <p className="font-bold text-sm text-foreground mb-1">{step.label}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}