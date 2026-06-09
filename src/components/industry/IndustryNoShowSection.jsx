import { Bell, Calendar, MessageSquare, CheckCircle2 } from "lucide-react";

const NOSHOW_CONFIGS = {
  hvac: {
    title: "Stop Losing Revenue to No-Show Service Calls",
    subtitle: "Every missed appointment wastes a technician's time and gas. Automated reminders keep customers committed.",
    steps: [
      { icon: Calendar, label: "Appointment Confirmed", desc: "Customer books via AI text-back", time: "Day 0" },
      { icon: Bell, label: "24-Hour Reminder", desc: "Automated SMS reminder sent the day before", time: "Day -1" },
      { icon: MessageSquare, label: "2-Hour Reminder", desc: "Final confirmation request with tech details", time: "2 hrs before" },
      { icon: CheckCircle2, label: "Tech Arrives Ready", desc: "Customer confirmed, zero wasted drive time", time: "Day of" },
    ],
    stat: "25% reduction in no-show service calls",
  },
  roofing: {
    title: "Ensure Homeowners Are Home for Inspections",
    subtitle: "Estimators showing up to empty houses waste hours. Our reminder sequence keeps inspection appointments locked in.",
    steps: [
      { icon: Calendar, label: "Inspection Scheduled", desc: "Homeowner selects inspection time slot", time: "Day 0" },
      { icon: Bell, label: "48-Hour Reminder", desc: "SMS reminder with inspector name and ETA", time: "Day -2" },
      { icon: MessageSquare, label: "Day-Of Reminder", desc: "Morning of: confirm homeowner is ready", time: "Morning of" },
      { icon: CheckCircle2, label: "Estimator Arrives", desc: "Confirmed visit, professional estimate delivered", time: "On arrival" },
    ],
    stat: "20% fewer rescheduled inspections",
  },
  contractors: {
    title: "Keep Project Consultation Appointments",
    subtitle: "Site visits that get skipped mean lost bids. Our confirmation sequence keeps clients committed and showing up.",
    steps: [
      { icon: Calendar, label: "Site Visit Booked", desc: "Client selects site consultation date", time: "Day 0" },
      { icon: Bell, label: "48-Hour Reminder", desc: "Pre-visit reminder with contractor details", time: "Day -2" },
      { icon: MessageSquare, label: "Day-Of Confirmation", desc: "Morning confirmation with estimator arrival window", time: "Morning of" },
      { icon: CheckCircle2, label: "Estimate Delivered", desc: "Client present, detailed quote provided on-site", time: "Visit day" },
    ],
    stat: "30% higher site visit show rate",
  },
  "med-spa": {
    title: "Eliminate High-Ticket No-Shows",
    subtitle: "A missed Botox or body contouring appointment costs $800–$2,000. Our sequence fills every slot and protects your revenue.",
    steps: [
      { icon: Calendar, label: "Consultation Booked", desc: "Patient selects treatment consultation slot", time: "Day 0" },
      { icon: Bell, label: "48-Hour Reminder", desc: "Reminder with prep instructions and parking", time: "Day -2" },
      { icon: MessageSquare, label: "Day-Of Reminder", desc: "Morning of: confirm patient is coming", time: "Morning of" },
      { icon: CheckCircle2, label: "Patient Arrives Ready", desc: "Prepped patient, smooth treatment experience", time: "Appointment" },
    ],
    stat: "Up to 80% no-show reduction with deposit + reminders",
  },
  dental: {
    title: "Reduce Appointment No-Shows by 20%",
    subtitle: "Empty appointment slots cost dental practices thousands per month. Our reminder system fills them automatically.",
    steps: [
      { icon: Calendar, label: "Appointment Confirmed", desc: "Patient books via AI or phone intake", time: "Day 0" },
      { icon: Bell, label: "24-Hour Reminder", desc: "Automated SMS with appointment time and address", time: "Day -1" },
      { icon: MessageSquare, label: "2-Hour Reminder", desc: "Final reminder with parking and check-in info", time: "2 hrs before" },
      { icon: CheckCircle2, label: "Patient Arrives", desc: "Prepared patient, smooth check-in experience", time: "Appointment" },
    ],
    stat: "20–25% reduction in patient no-shows",
  },
  chiropractic: {
    title: "Keep Care Plans on Track with Automated Reminders",
    subtitle: "Patients who miss adjustments drop care plans. Our reminder system keeps them on schedule and compliant.",
    steps: [
      { icon: Calendar, label: "Adjustment Scheduled", desc: "Patient's recurring care plan visit booked", time: "Day 0" },
      { icon: Bell, label: "24-Hour Reminder", desc: "SMS reminder with appointment time and intake notes", time: "Day -1" },
      { icon: MessageSquare, label: "2-Hour Reminder", desc: "Final reminder before appointment time", time: "2 hrs before" },
      { icon: CheckCircle2, label: "Patient Arrives", desc: "On-schedule visit, care plan progresses", time: "Appointment" },
    ],
    stat: "88% care plan compliance with automated check-ins",
  },
};

export default function IndustryNoShowSection({ industry }) {
  const cfg = NOSHOW_CONFIGS[industry] || NOSHOW_CONFIGS.hvac;

  return (
    <section className="px-4 py-14 md:px-6 md:py-20" style={{ background: "linear-gradient(180deg, #fff 0%, #f7fbff 100%)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">No-Show Prevention</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">{cfg.title}</h2>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">{cfg.subtitle}</p>
        </div>

        <div className="relative mb-8">
          <div className="hidden md:block absolute top-8 left-8 right-8 h-0.5" style={{ background: "linear-gradient(90deg, rgba(0,136,204,0.12), rgba(0,136,204,0.35), rgba(0,136,204,0.12))" }} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {cfg.steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 relative z-10"
                    style={{
                      background: "rgba(0,136,204,0.08)",
                      border: "2px solid rgba(0,136,204,0.2)",
                      boxShadow: "0 8px 24px rgba(0,136,204,0.1)",
                    }}
                  >
                    <Icon style={{ width: "24px", height: "24px", color: "#0088CC" }} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-primary mb-1">{step.time}</span>
                  <p className="font-bold text-sm text-foreground mb-1">{step.label}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5"
            style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)" }}
          >
            <CheckCircle2 style={{ width: "15px", height: "15px", color: "#16a34a" }} />
            <span className="text-sm font-semibold" style={{ color: "#15803d" }}>{cfg.stat}</span>
          </div>
        </div>
      </div>
    </section>
  );
}