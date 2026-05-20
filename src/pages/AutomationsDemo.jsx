import { useState } from "react";
import { ArrowRight, Zap, Phone, Mail, Calendar, Star, RefreshCw, X, Play, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const SERVICES = [
  {
    id: "instant-lead-response",
    icon: Zap,
    emoji: "⚡",
    title: "Instant Lead Response",
    tagline: "Contact every inbound lead within 60 seconds — automatically.",
    description:
      "Research consistently shows that the probability of qualifying a lead drops by over 80% if contact is delayed beyond five minutes. Our Instant Lead Response system eliminates that risk entirely. The moment a lead submits a form, calls your number, or reaches out through any connected channel, a personalized SMS and email are dispatched within 60 seconds — without any manual intervention.",
    stats: [
      { value: "78%", label: "of buyers choose the first responder", source: "Harvard Business Review" },
      { value: "60s", label: "average response time with our system", source: "Typical result" },
      { value: "5×", label: "higher conversion vs. 5-min response", source: "MIT / InsideSales study" },
    ],
    whatYouGet: [
      "Personalized SMS sent within 60 seconds of lead submission",
      "Branded email confirmation dispatched simultaneously",
      "Works 24 hours a day, 7 days a week — including holidays",
      "Integrates with your existing web forms and ad platforms",
    ],
    poster: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80",
  },
  {
    id: "missed-call-textback",
    icon: Phone,
    emoji: "📞",
    title: "Missed Call Text-Back",
    tagline: "Every unanswered call triggers an automatic, personalized follow-up.",
    description:
      "A missed call is not a lost lead — it is a lead in motion. When a prospect calls and no one answers, they rarely call back. Our Missed Call Text-Back system sends a professional, branded SMS to the caller within 30 seconds, opening a two-way conversation before they have a chance to reach a competitor. This system operates continuously, regardless of your business hours.",
    stats: [
      { value: "62%", label: "of callers won't call back if unanswered", source: "Invoca Call Intelligence" },
      { value: "30s", label: "typical text-back delivery time", source: "Typical result" },
      { value: "3 in 10", label: "missed-call leads recovered on average", source: "Industry benchmark" },
    ],
    whatYouGet: [
      "Automatic SMS reply within 30 seconds of a missed call",
      "Two-way SMS conversation initiated from your business number",
      "After-hours coverage with configurable messaging",
      "Full conversation log in your dashboard",
    ],
    poster: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
  },
  {
    id: "nurture-sequence",
    icon: Mail,
    emoji: "📧",
    title: "14-Day Nurture Sequence",
    tagline: "A structured, multi-touch follow-up system that works while you focus on your business.",
    description:
      "Most leads require between five and twelve touchpoints before making a buying decision. Our 14-Day Nurture Sequence delivers a precisely timed series of SMS and email messages that maintain professional contact over two weeks. Each message is contextually relevant, non-intrusive, and designed to move the lead toward a booking — without requiring any manual effort from your team.",
    stats: [
      { value: "80%", label: "of sales require 5+ follow-up contacts", source: "Marketing Donut" },
      { value: "14 days", label: "of automated, structured follow-up", source: "Our system" },
      { value: "2–3×", label: "more booked appointments vs. no follow-up", source: "Industry benchmark" },
    ],
    whatYouGet: [
      "8+ touchpoints across SMS and email over 14 days",
      "Sequence pauses automatically when a lead replies or books",
      "Messaging personalized to the lead's source and industry",
      "Fully managed — no manual scheduling required",
    ],
    poster: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80",
  },
  {
    id: "ai-booking-agent",
    icon: Calendar,
    emoji: "🤖",
    title: "AI Booking Agent",
    tagline: "Converts SMS conversations into confirmed appointments without staff involvement.",
    description:
      "When a lead signals readiness to book, our AI Booking Agent takes over the conversation. It sends the booking link, follows up if the link goes unclicked, confirms the appointment once scheduled, and sends a reminder before the appointment date. The entire booking workflow runs autonomously — your team is notified only when a confirmed appointment is on the calendar.",
    stats: [
      { value: "40%", label: "increase in appointment conversion rates", source: "Industry benchmark" },
      { value: "100%", label: "of booking follow-ups handled automatically", source: "Our system" },
      { value: "30%", label: "reduction in no-show rates with reminders", source: "Acuity Scheduling data" },
    ],
    whatYouGet: [
      "Automated booking link delivery via SMS when lead intent is detected",
      "Follow-up sent if link is not clicked within a set window",
      "Appointment confirmation message sent immediately after booking",
      "Pre-appointment reminder to reduce no-shows",
    ],
    poster: "https://images.unsplash.com/photo-1633613286991-611fe299c4be?w=800&q=80",
  },
  {
    id: "review-request",
    icon: Star,
    emoji: "⭐",
    title: "Review Request System",
    tagline: "Systematically build your online reputation after every completed appointment.",
    description:
      "The optimal window for requesting a review is within two hours of a completed appointment, when client satisfaction is at its highest. Our Review Request System sends a professionally worded, perfectly timed SMS request to every client after their visit. This consistent, automated approach generates a steady stream of authentic reviews — the single most important driver of new patient and client acquisition in local service markets.",
    stats: [
      { value: "88%", label: "of consumers trust online reviews as much as personal referrals", source: "BrightLocal" },
      { value: "3–4×", label: "more reviews generated vs. manual requests", source: "Industry benchmark" },
      { value: "4.7+", label: "average star rating achieved by active users", source: "Typical result" },
    ],
    whatYouGet: [
      "Automated review request sent via SMS after each appointment",
      "Timing optimized for maximum response rates",
      "Direct link to your Google Business or preferred review platform",
      "Works for any appointment type or service category",
    ],
    poster: "https://images.unsplash.com/photo-1531973576160-7125cd663d86?w=800&q=80",
  },
  {
    id: "lead-reactivation",
    icon: RefreshCw,
    emoji: "🔁",
    title: "Lead Reactivation",
    tagline: "Recover revenue from leads you've already acquired but never converted.",
    description:
      "Every business has a database of leads that expressed interest, engaged briefly, and then went quiet. These prospects represent paid acquisition costs with zero return. Our Lead Reactivation system deploys a targeted re-engagement campaign to dormant contacts, using proven messaging frameworks to revive interest. A single reactivation campaign regularly converts leads that went cold 30, 60, or even 90 days ago.",
    stats: [
      { value: "20–35%", label: "of dormant leads can be reactivated with the right message", source: "Industry benchmark" },
      { value: "90 days", label: "lookback window for reactivation campaigns", source: "Our system" },
      { value: "$0", label: "additional acquisition cost — these leads are already yours", source: "Our system" },
    ],
    whatYouGet: [
      "Targeted SMS and email re-engagement sequence",
      "Segmented by lead age, source, and previous interaction",
      "A/B tested messaging frameworks for maximum reactivation rates",
      "Can be run as a one-time campaign or on a recurring schedule",
    ],
    poster: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
  },
];

const BRAND = {
  color: "#0088CC",
  gradientFrom: "#00AEEF",
  gradientTo: "#003B8F",
};

function VideoPlaceholder({ service, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="aspect-video bg-slate-900 relative">
          <img
            src={service.poster}
            alt={service.title}
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
              style={{ background: `linear-gradient(135deg, ${BRAND.gradientFrom}, ${BRAND.gradientTo})` }}
            >
              <Play className="w-7 h-7 text-white ml-1" fill="white" />
            </div>
            <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>{service.title}</h3>
            <p className="text-sm text-white/60 max-w-md mb-6">
              Full walkthrough video coming soon. Book a live demo to see this system in action with a real-world example from your industry.
            </p>
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${BRAND.gradientFrom}, ${BRAND.gradientTo})` }}
              onClick={onClose}
            >
              Book a Live Demo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ service }) {
  const [showVideo, setShowVideo] = useState(false);
  const [hovered, setHovered] = useState(false);
  const Icon = service.icon;

  return (
    <>
      <div
        className="flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: "white",
          border: hovered ? `1.5px solid ${BRAND.color}44` : "1.5px solid rgba(0,0,0,0.07)",
          boxShadow: hovered
            ? `0 24px 64px rgba(0,136,204,0.14), 0 4px 20px rgba(0,0,0,0.08)`
            : "0 2px 16px rgba(0,0,0,0.05)",
          transform: hovered ? "translateY(-5px)" : "translateY(0)",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Video thumbnail */}
        <div
          className="relative overflow-hidden cursor-pointer"
          style={{ height: "210px" }}
          onClick={() => setShowVideo(true)}
        >
          <img
            src={service.poster}
            alt={service.title}
            className="w-full h-full object-cover transition-transform duration-500"
            style={{ transform: hovered ? "scale(1.05)" : "scale(1)" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${BRAND.gradientFrom}aa, ${BRAND.gradientTo}cc)` }}
          />
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(8px)",
                border: "1.5px solid rgba(255,255,255,0.45)",
                transform: hovered ? "scale(1.06)" : "scale(1)",
              }}
            >
              <Play className="w-5 h-5 text-white" fill="white" />
              <span className="text-white text-sm font-semibold">Watch Demo</span>
            </div>
          </div>
          {/* Icon */}
          <div className="absolute top-3 left-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.35)" }}
            >
              <Icon className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-lg font-bold text-slate-900 mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
            {service.title}
          </h3>
          <p className="text-xs font-semibold mb-3" style={{ color: BRAND.color }}>
            {service.tagline}
          </p>
          <p className="text-sm text-slate-600 leading-relaxed mb-5">
            {service.description}
          </p>

          {/* Stats */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "#f0f8ff", border: "1px solid rgba(0,136,204,0.12)" }}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Industry Benchmarks</p>
            <div className="space-y-3">
              {service.stats.map((stat) => (
                <div key={stat.label} className="flex items-start gap-3">
                  <span className="text-base font-black flex-shrink-0" style={{ color: BRAND.color, minWidth: "56px" }}>
                    {stat.value}
                  </span>
                  <div>
                    <p className="text-xs text-slate-700 font-medium leading-tight">{stat.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Source: {stat.source}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What you get */}
          <div className="mb-6 flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">What's included</p>
            <ul className="space-y-2">
              {service.whatYouGet.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: BRAND.color }} />
                  <span className="text-xs text-slate-600 leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <Link
            to="/onboarding"
            className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${BRAND.gradientFrom}, ${BRAND.gradientTo})` }}
          >
            Get This System <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {showVideo && <VideoPlaceholder service={service} onClose={() => setShowVideo(false)} />}
    </>
  );
}

export default function AutomationsDemo() {
  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Header */}
      <div
        className="px-6 py-5 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg,#0A1628 0%,#003B8F 100%)" }}
      >
        <Link to="/" className="flex items-center gap-2">
          <img
            src="https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png"
            alt="ClientSurge Systems"
            style={{ height: "48px", width: "auto", objectFit: "contain", filter: "brightness(10)" }}
          />
        </Link>
        <Link
          to="/onboarding"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${BRAND.gradientFrom}, #0050A0)` }}
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <div
          className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full mb-5 uppercase tracking-widest"
          style={{ background: "rgba(0,136,204,0.08)", border: "1px solid rgba(0,136,204,0.2)", color: BRAND.color }}
        >
          6 Core Automation Systems
        </div>
        <h1
          className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-5"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          The Complete Lead Conversion
          <br />
          <span style={{ color: BRAND.color }}>Infrastructure for Service Businesses</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-8">
          Each system below addresses a specific, documented failure point in the lead-to-booking journey. Together, they form a fully automated revenue engine — installed and operational within 24 to 48 hours.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          {[
            { icon: "⚡", text: "Live in 24–48 hours" },
            { icon: "🔒", text: "No long-term contracts" },
            { icon: "🎯", text: "Fully done-for-you setup" },
            { icon: "📊", text: "Results tracked in your dashboard" },
          ].map((b) => (
            <span
              key={b.text}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-xs"
              style={{ background: "rgba(0,136,204,0.07)", border: "1px solid rgba(0,136,204,0.18)", color: "#0050A0" }}
            >
              {b.icon} {b.text}
            </span>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          className="mt-16 rounded-3xl p-10 md:p-14 text-center"
          style={{ background: "linear-gradient(135deg,#003B8F 0%,#0070B8 60%,#00AEEF 100%)" }}
        >
          <p className="text-xs font-bold text-blue-200/70 uppercase tracking-widest mb-3">Ready to Begin?</p>
          <h2
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Activate Your Systems in 24–48 Hours
          </h2>
          <p className="text-blue-100/80 text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Complete our onboarding form and our team will configure, test, and launch your selected automation systems — no technical knowledge required on your end.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-base font-bold text-slate-900 bg-white hover:bg-blue-50 transition-colors shadow-lg"
            >
              Start Onboarding <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/book"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-white border-2 border-white/30 hover:border-white/60 transition-colors"
            >
              Book a Live Demo
            </Link>
          </div>
          <p className="mt-5 text-xs text-blue-200/50">No credit card required · Typical setup time: 24–48 hours</p>
        </div>
      </div>
    </div>
  );
}