import { Star, TrendingUp, ArrowRight, Quote, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "@/components/design-system/SectionHeader";

const MED_SPA_STORIES = [
  {
    headline: "From Empty Chairs to Fully Booked",
    metric: "92%",
    metricLabel: "No-Show Reduction",
    period: "First 60 Days",
    problem: "Med spa was losing $18K/month in open appointment slots from no-shows and last-minute cancellations.",
    solution: "Deployed automated SMS appointment reminders + AI voice callback 24h before visits.",
    result: "Schedule gaps eliminated. 6 additional appointments per week filled automatically.",
    revenue: "+$72K",
    revenueLabel: "Monthly revenue recovery",
    name: "Sarah T.",
    role: "Practice Manager, Scottsdale AZ",
    gradient: "from-pink-500/20 via-rose-400/10 to-transparent",
  },
  {
    headline: "New Patient Onboarding on Autopilot",
    metric: "3.2x",
    metricLabel: "New Consultation Bookings",
    period: "First 90 Days",
    problem: "Website leads went cold within hours. Manual follow-up took 2-3 days. Competitors were booking faster.",
    solution: "Instant lead response in 30 seconds + AI scheduling agent booked consultations 24/7.",
    result: "Every inquiry captured. Response time dropped from 4 hours to 30 seconds. Bookings tripled.",
    revenue: "+$89K",
    revenueLabel: "Revenue from new patients",
    name: "Dr. Patel",
    role: "Med Spa Owner, Phoenix AZ",
    gradient: "from-purple-500/20 via-indigo-400/10 to-transparent",
  },
];

const CLINIC_STORIES = [
  {
    headline: "Never Lose Another Patient to Voicemail",
    metric: "73",
    metricLabel: "Appointments Booked",
    period: "First 90 Days",
    problem: "Chiropractic clinic missed 40% of inbound calls during treatment hours. Leads went to competitors.",
    solution: "AI voice agent answered every call 24/7 + missed-call text-back triggered instant follow-up.",
    result: "Every missed call recovered. Response time: 30 seconds. 73 new patient appointments booked.",
    revenue: "+$127K",
    revenueLabel: "Revenue from recovered leads",
    name: "James M.",
    role: "Chiropractic Clinic Owner, Tucson AZ",
    gradient: "from-cyan-500/20 via-blue-400/10 to-transparent",
  },
  {
    headline: "Reactivating Dormant Patients Automatically",
    metric: "340+",
    metricLabel: "Patients Reactivated",
    period: "First 60 Days",
    problem: "Local clinic had 900+ inactive patients in their CRM who hadn't visited in 6+ months.",
    solution: "AI-powered reactivation campaigns across SMS + email targeting 90-day dormant patients.",
    result: "340+ patients returned for appointments. 38% reactivation rate from cold list.",
    revenue: "+$54K",
    revenueLabel: "Revenue from reactivated patients",
    name: "Marcus L.",
    role: "Clinic Director, Mesa AZ",
    gradient: "from-teal-500/20 via-emerald-400/10 to-transparent",
  },
];

const BENCHMARKS = [
  { label: "Response Time", before: "2–4 hours", after: "30 seconds", improvement: "99% faster" },
  { label: "Lead-to-Book Rate", before: "28%", after: "64%", improvement: "+129%" },
  { label: "Monthly Revenue Lift", before: "Baseline", after: "+$54K–$127K", improvement: "Verified" },
  { label: "Patient Satisfaction", before: "3.2★", after: "4.8★", improvement: "+50%" },
];

export default function IndustrySuccessGallery({ industry = {}, industrySlug = "" }) {
  const navigate = useNavigate();

  const isMedSpa = industrySlug === "med-spa" || industrySlug === "medspa";
  const isClinic = ["chiropractic", "dental", "personal-injury"].includes(industrySlug);
  const stories = isMedSpa ? MED_SPA_STORIES : isClinic ? CLINIC_STORIES : [...MED_SPA_STORIES, ...CLINIC_STORIES];

  const label = industry.shortName || (isMedSpa ? "Med Spas" : isClinic ? "Local Clinics" : "Local Businesses");

  return (
    <section className="py-20 px-4 md:px-6 bg-white relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(0,174,239,0.06) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(0,59,143,0.05) 0%, transparent 70%)" }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-14">
          <SectionHeader
            eyebrow="Verified Results"
            title={`Real ${label}. Real Revenue.`}
            subtitle={`These ${label.toLowerCase()} transformed their patient flow in 90 days. Here's exactly what happened.`}
            align="center"
          />
        </div>

        {/* Immersive Success Stories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {stories.map((story, idx) => (
            <div
              key={idx}
              className="group relative rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-1"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(245,250,255,0.95) 100%)",
                border: "1px solid rgba(0,174,239,0.12)",
                boxShadow: "0 4px 24px rgba(0,59,143,0.06), inset 0 1px 0 rgba(255,255,255,0.6)",
              }}
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${story.gradient} opacity-60 pointer-events-none`} />

              <div className="relative z-10 p-8 md:p-10">
                {/* Metric Hero */}
                <div className="flex items-end justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">{story.period}</p>
                    <p className="text-5xl md:text-6xl font-black text-foreground" style={{ fontFamily: "Montserrat, sans-serif", lineHeight: 1 }}>
                      {story.metric}
                    </p>
                    <p className="text-sm font-semibold text-muted-foreground mt-2">{story.metricLabel}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-green-600" style={{ fontFamily: "Montserrat, sans-serif" }}>{story.revenue}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight max-w-[120px]">{story.revenueLabel}</p>
                  </div>
                </div>

                {/* Headline */}
                <h3 className="text-xl font-bold text-foreground mb-6" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {story.headline}
                </h3>

                {/* Before/After Flow */}
                <div className="space-y-4">
                  {/* Problem */}
                  <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
                    <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider mb-1.5">The Problem</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{story.problem}</p>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="rounded-full p-2" style={{ background: "rgba(0,174,239,0.1)" }}>
                      <ArrowRight className="w-4 h-4 text-primary" />
                    </div>
                  </div>

                  {/* Solution */}
                  <div className="rounded-xl p-4" style={{ background: "rgba(0,174,239,0.05)", border: "1px solid rgba(0,174,239,0.12)" }}>
                    <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1.5">Our Solution</p>
                    <p className="text-sm text-foreground leading-relaxed">{story.solution}</p>
                  </div>

                  {/* Result */}
                  <div className="rounded-xl p-4" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}>
                    <p className="text-[11px] font-bold text-green-700 uppercase tracking-wider mb-1.5">After 90 Days</p>
                    <p className="text-sm text-foreground font-medium leading-relaxed">{story.result}</p>
                  </div>
                </div>

                {/* Attribution */}
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border/50">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{story.name}</p>
                    <p className="text-xs text-muted-foreground">{story.role}</p>
                  </div>
                  <Quote className="w-5 h-5 text-primary/30 flex-shrink-0" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ROI Benchmarks Bar */}
        <div className="rounded-2xl overflow-hidden mb-12" style={{ background: "linear-gradient(135deg, #003B8F 0%, #006BB0 50%, #00AEEF 100%)" }}>
          <div className="p-8 md:p-12">
            <h3 className="text-center text-white text-xl md:text-2xl font-bold mb-8" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Industry Benchmarks — Before vs After ClientSurge
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {BENCHMARKS.map((bench, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-3">{bench.label}</p>
                  <p className="text-sm text-white/50 line-through mb-1">{bench.before}</p>
                  <p className="text-2xl md:text-3xl font-black text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>{bench.after}</p>
                  <p className="text-xs font-semibold text-cyan-200 mt-1">{bench.improvement}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-6 max-w-xl mx-auto">
            Want to see what your {label.toLowerCase().replace(/s$/, "")} could achieve? Get a free automation audit — we'll show you your exact revenue opportunity.
          </p>
          <button
            onClick={() => navigate("/book")}
            className="cs-btn-primary"
            style={{ minHeight: "52px", borderRadius: "9999px", padding: "0 2.5rem", fontSize: "0.95rem" }}
          >
            Get Your Free Audit →
          </button>
        </div>
      </div>
    </section>
  );
}