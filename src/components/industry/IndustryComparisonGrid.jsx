import { XCircle, CheckCircle2 } from "lucide-react";

const COMPARISON_DATA = {
  hvac: {
    title: "A Day Without vs. With ClientSurge",
    without: [
      "Technicians in the field — office phone rings to voicemail",
      "Emergency A/C call at 2pm goes unanswered, homeowner calls competitor",
      "After-hours service requests pile up until morning",
      "Dispatcher manually calls back leads the next day — most have moved on",
      "No visibility into how many calls were dropped during peak hours",
    ],
    with: [
      "Every missed call triggers instant AI text-back within 60 seconds",
      "Emergency leads receive availability options and book on the spot",
      "After-hours requests handled automatically 24/7",
      "All leads logged, scored, and nurtured with follow-up sequences",
      "Full pipeline visibility — every call, every booking, every revenue source",
    ],
    withoutLabel: "Manual Dispatch",
    withLabel: "ClientSurge AI",
  },
  roofing: {
    title: "Storm Season Without vs. With ClientSurge",
    without: [
      "Hail storm hits — 80 calls flood in, office can handle maybe 20",
      "Homeowners don't hear back, call competing roofers",
      "Estimators drive to properties with no confirmed appointment",
      "Old estimate leads sit uncontacted for weeks",
      "No follow-up on fence-sitter homeowners who said 'not yet'",
    ],
    with: [
      "AI handles unlimited simultaneous storm inquiries instantly",
      "Every lead receives damage questionnaire and booking prompt",
      "Estimator visits pre-confirmed with SMS reminders reducing no-shows",
      "Dormant leads automatically re-engaged with reactivation campaigns",
      "14-day automated nurture keeps interested homeowners warm",
    ],
    withoutLabel: "Manual Process",
    withLabel: "ClientSurge AI",
  },
  contractors: {
    title: "On the Job Site Without vs. With ClientSurge",
    without: [
      "Phone rings during active job site — missed, no callback",
      "Competitor answers the same customer 5 minutes later",
      "Estimate requests sit in email for 24+ hours",
      "Old quotes from 3 months ago never followed up",
      "No system to track which bids were sent and which closed",
    ],
    with: [
      "Every missed call gets instant AI text-back with project intake",
      "Bid inquiries acknowledged and qualified within 60 seconds",
      "Site visit scheduling automated and confirmed via SMS",
      "Old quote reactivation campaigns bring dormant opportunities back",
      "Full bid pipeline visibility from first contact to signed contract",
    ],
    withoutLabel: "No System",
    withLabel: "ClientSurge AI",
  },
  "med-spa": {
    title: "Clinic Day Without vs. With ClientSurge",
    without: [
      "Front desk busy with patients — Botox inquiry calls go to voicemail",
      "Website form leads sit in inbox for hours",
      "Interested patients book with the competitor who responded first",
      "No-shows cost $800–$2,000 per missed treatment slot",
      "Manual follow-up on fence-sitters never happens",
    ],
    with: [
      "Every inquiry gets an instant, personalized AI response in 60 seconds",
      "Consultations booked automatically with confirmation and prep info",
      "Nurture sequences keep warm leads engaged until they're ready",
      "SMS reminders and deposits reduce no-shows by up to 80%",
      "14-day automated follow-up sequence converts hesitant leads",
    ],
    withoutLabel: "Manual Front Desk",
    withLabel: "ClientSurge AI",
  },
  dental: [
    // handled via dental-specific object below
  ],
  chiropractic: [],
};

// dental & chiro overrides
COMPARISON_DATA.dental = {
  title: "A Practice Day Without vs. With ClientSurge",
  without: [
    "Patient calls during treatment — receptionist can't answer",
    "Emergency dental pain inquiry reaches voicemail, patient calls next dentist",
    "New patient intake forms scattered across email, phone, and web",
    "Treatment plan follow-up never sent — patient doesn't rebook",
    "Review requests forgotten after every appointment",
  ],
  with: [
    "Every missed call receives instant AI text-back with appointment options",
    "Emergency requests triaged, same-day slots offered automatically",
    "All intake centralized with instant confirmation and prep instructions",
    "Automated follow-up nurtures patients back for treatment completion",
    "Review requests auto-sent at the optimal moment post-appointment",
  ],
  withoutLabel: "No Automation",
  withLabel: "ClientSurge AI",
};

COMPARISON_DATA.chiropractic = {
  title: "Clinic Operations Without vs. With ClientSurge",
  without: [
    "Insurance question calls during adjustment — front desk overwhelmed",
    "New patient inquiry doesn't hear back for 3+ hours — calls 2 other clinics",
    "Care plan compliance drops as patients miss appointments with no reminder",
    "Workers comp patients confused about pre-auth — never book",
    "Old patients who stopped care never re-engaged",
  ],
  with: [
    "Insurance inquiries answered instantly with your accepted plans and rates",
    "New patients receive availability and booking link within 60 seconds",
    "SMS reminders reduce no-shows and keep care plans on track",
    "WC patients guided through pre-auth steps automatically",
    "Reactivation campaigns re-engage dormant patients with special offers",
  ],
  withoutLabel: "No Automation",
  withLabel: "ClientSurge AI",
};

export default function IndustryComparisonGrid({ industry }) {
  const data = COMPARISON_DATA[industry];
  if (!data || !data.without) return null;

  return (
    <section className="px-4 py-14 md:px-6 md:py-20" style={{ background: "#ffffff" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">Side by Side</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">{data.title}</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Without */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(185,28,28,0.2)", boxShadow: "0 10px 30px rgba(185,28,28,0.06)" }}>
            <div className="px-6 py-4" style={{ background: "linear-gradient(135deg, #fff5f5 0%, #fff 100%)", borderBottom: "1px solid rgba(185,28,28,0.12)" }}>
              <div className="flex items-center gap-2">
                <XCircle style={{ width: "18px", height: "18px", color: "#b91c1c" }} />
                <p className="font-bold text-sm" style={{ color: "#b91c1c" }}>{data.withoutLabel}</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              {data.without.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(185,28,28,0.08)" }}>
                    <span style={{ fontSize: "10px", color: "#b91c1c", fontWeight: "900" }}>✕</span>
                  </div>
                  <p className="text-sm text-foreground/75 leading-snug">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* With */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,136,204,0.22)", boxShadow: "0 10px 30px rgba(0,59,143,0.08)" }}>
            <div className="px-6 py-4" style={{ background: "linear-gradient(135deg, #f0f8ff 0%, #fff 100%)", borderBottom: "1px solid rgba(0,136,204,0.12)" }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 style={{ width: "18px", height: "18px", color: "#0088CC" }} />
                <p className="font-bold text-sm text-primary">{data.withLabel}</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              {data.with.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(0,136,204,0.1)" }}>
                    <span style={{ fontSize: "10px", color: "#0088CC", fontWeight: "900" }}>✓</span>
                  </div>
                  <p className="text-sm text-foreground/75 leading-snug">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}