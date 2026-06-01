import { useEffect, useState } from "react";
import { ArrowRight, Zap, Mail, Calendar, Star, RefreshCw, X, Play, CheckCircle, Headphones } from "lucide-react";
import { Link } from "react-router-dom";
import { setPageMetadata } from "@/lib/seo";

const SERVICES = [
  {
    id: "ai-voice-agent",
    icon: Headphones,
    title: "AI Voice Agent & Missed-Call Recovery",
    tagline: "Answers, triages, and recovers phone leads before they disappear.",
    description:
      "Answers or triages missed calls, after-hours calls, and inbound inquiries so fewer leads disappear before your team can respond.",
    stats: [
      { value: "24/7", label: "coverage for calls and after-hours inquiries", source: "System capability" },
      { value: "Fast", label: "missed-call recovery before competitors respond", source: "Speed-to-lead goal" },
      { value: "Clean", label: "handoff into follow-up and booking workflows", source: "ClientSurge routing" },
    ],
    whatYouGet: [
      "Captures caller details",
      "Handles common questions",
      "Routes urgent or qualified leads into follow-up",
    ],
    poster: "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=800&q=80",
  },
  {
    id: "lead-capture-automation",
    icon: Zap,
    title: "Lead Capture Automation",
    tagline: "Turns every inquiry into a trackable lead.",
    description:
      "Turns website visitors, form fills, ad traffic, and phone inquiries into organized leads inside your CRM or pipeline.",
    stats: [
      { value: "1", label: "organized pipeline for calls, forms, and ads", source: "ClientSurge workflow" },
      { value: "Source", label: "lead attribution tags for cleaner follow-up", source: "CRM routing" },
      { value: "Instant", label: "notification to the right person", source: "Automation trigger" },
    ],
    whatYouGet: [
      "Captures every inquiry",
      "Tags lead source",
      "Notifies the right person instantly",
    ],
    poster: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80",
  },
  {
    id: "ai-lead-follow-up",
    icon: Mail,
    title: "AI Lead Follow-Up Automation",
    tagline: "Keeps new prospects warm until there is a clear outcome.",
    description:
      "Automatically follows up with new leads by SMS and email until they reply, book, or opt out.",
    stats: [
      { value: "Fast", label: "speed-to-lead support for every new inquiry", source: "Automation trigger" },
      { value: "Consistent", label: "follow-up even when staff are busy", source: "ClientSurge sequence" },
      { value: "Warm", label: "prospects kept engaged until they respond", source: "Nurture workflow" },
    ],
    whatYouGet: [
      "Improves speed-to-lead",
      "Prevents forgotten follow-up",
      "Keeps prospects warm",
    ],
    poster: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80",
  },
  {
    id: "appointment-booking-automation",
    icon: Calendar,
    title: "Appointment Booking Automation",
    tagline: "Moves qualified leads from interest to confirmed appointments.",
    description:
      "Helps convert interested leads into booked appointments with reminders, confirmations, qualification, and calendar sync.",
    stats: [
      { value: "Less", label: "back-and-forth before booking", source: "Booking workflow" },
      { value: "Auto", label: "confirmation and reminder messages", source: "Calendar automation" },
      { value: "Clear", label: "handoff when the lead is ready", source: "Lead qualification" },
    ],
    whatYouGet: [
      "Reduces booking friction",
      "Confirms appointments",
      "Sends reminders automatically",
    ],
    poster: "https://images.unsplash.com/photo-1633613286991-611fe299c4be?w=800&q=80",
  },
  {
    id: "review-reputation-automation",
    icon: Star,
    title: "Review & Reputation Automation",
    tagline: "Builds stronger local trust after completed jobs.",
    description:
      "Requests reviews after completed jobs and helps build stronger Google reputation over time.",
    stats: [
      { value: "Timely", label: "review requests after the right customer moment", source: "Post-job trigger" },
      { value: "More", label: "consistent Google review opportunities", source: "Reputation workflow" },
      { value: "Earlier", label: "visibility into unhappy customer signals", source: "Feedback routing" },
    ],
    whatYouGet: [
      "Triggers review requests",
      "Improves review volume",
      "Surfaces unhappy customers earlier",
    ],
    poster: "https://images.unsplash.com/photo-1531973576160-7125cd663d86?w=800&q=80",
  },
  {
    id: "reactivation-win-back-automation",
    icon: RefreshCw,
    title: "Reactivation / Win-Back Automation",
    tagline: "Turns dormant leads and old opportunities back into conversations.",
    description:
      "Re-engages old leads, past customers, no-shows, unbooked quotes, and cold opportunities with targeted campaigns.",
    stats: [
      { value: "Old", label: "quotes and past inquiries brought back", source: "CRM segment" },
      { value: "Targeted", label: "campaigns based on lead context", source: "Win-back workflow" },
      { value: "Existing", label: "revenue from contacts already in your database", source: "Client list" },
    ],
    whatYouGet: [
      "Revives old opportunities",
      "Books past inquiries",
      "Creates revenue from existing contacts",
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
            width="960"
            height="540"
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
              to="/book"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${BRAND.gradientFrom}, ${BRAND.gradientTo})` }}
              onClick={onClose}
            >
              Book a Free Audit <ArrowRight className="w-4 h-4" />
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
            width="640"
            height="360"
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
            to="/book"
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

export default function Automations() {
  useEffect(() => {
    return setPageMetadata({
      title: "AI Automation Systems for Local Service Businesses | ClientSurge",
      description:
        "ClientSurge installs AI automation systems that capture, follow up with, qualify, book, and reactivate leads for local service businesses.",
      canonicalPath: "/automations",
      ogTitle: "AI Automations That Turn Local Leads Into Booked Jobs",
      ogDescription:
        "Voice agents, missed-call recovery, instant response, follow-up, booking, review, and reactivation automation for local service businesses.",
    });
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Header */}
      <div
        className="px-6 py-5 flex items-center justify-between"
        style={{ background: "#ffffff", borderBottom: "1px solid rgba(10,22,40,0.08)" }}
      >
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/clientsurge-logo.svg"
            alt="ClientSurge Systems"
            width="192"
            height="48"
            style={{ height: "48px", width: "auto", objectFit: "contain", display: "block" }}
          />
        </Link>
        <Link
          to="/book"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${BRAND.gradientFrom}, #0050A0)` }}
        >
          Book Free Audit <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <div
          className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full mb-5 uppercase tracking-widest"
          style={{ background: "rgba(0,136,204,0.08)", border: "1px solid rgba(0,136,204,0.2)", color: BRAND.color }}
        >
          AI Lead Conversion Systems
        </div>
        <h1
          className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-5"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          AI Automation Systems for
          <br />
          <span style={{ color: BRAND.color }}>Local Service Businesses</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-8">
          ClientSurge installs automation systems that capture, follow up with, qualify, book, and reactivate leads so fewer local service opportunities fall through the cracks.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          {[
            { icon: "AI", text: "Voice agents + lead follow-up" },
            { icon: "60s", text: "Instant response workflows" },
            { icon: "DFY", text: "Fully done-for-you setup" },
            { icon: "ROI", text: "Results tracked in your dashboard" },
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
          style={{ background: "linear-gradient(135deg,#eaf8ff 0%,#dff5ff 60%,#f8fbff 100%)", border: "1px solid rgba(0,136,204,0.14)" }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,80,160,0.62)" }}>Ready to Begin?</p>
          <h2
            className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Activate Your Systems in 24–48 Hours
          </h2>
          <p className="text-slate-600 text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Book a free automation audit and our team will map the right voice, lead response, follow-up, and booking systems for your business.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/book"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-base font-bold text-white transition-colors shadow-lg"
              style={{ background: `linear-gradient(135deg, ${BRAND.gradientFrom}, ${BRAND.gradientTo})` }}
            >
              Get Your Free Audit <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/book"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-slate-700 border-2 border-slate-200 hover:border-blue-300 transition-colors"
            >
              Book a Live Demo
            </Link>
          </div>
          <p className="mt-5 text-xs text-slate-500">No credit card required · Typical setup time: 24–48 hours</p>
        </div>
      </div>
    </div>
  );
}
