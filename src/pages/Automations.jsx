import { useEffect, useRef, useState } from "react";
import { ArrowRight, Zap, Mail, Calendar, Star, RefreshCw, X, Play, CheckCircle, Headphones } from "lucide-react";
import { Link } from "react-router-dom";
import { setPageMetadata } from "@/lib/seo";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MobileCallBar from "@/components/landing/MobileCallBar";
import SectionHeader from "@/components/design-system/SectionHeader";

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
    title: "AI Scheduling & Appointment Automation",
    tagline: "Moves qualified leads from interest to confirmed appointments.",
    description:
      "AI-powered scheduling that converts interested leads into confirmed appointments with reminders, confirmations, qualification, and calendar sync.",
    stats: [
      { value: "Less", label: "back-and-forth before scheduling", source: "AI scheduling workflow" },
      { value: "Auto", label: "confirmation and reminder messages", source: "Calendar automation" },
      { value: "Clear", label: "handoff when the lead is ready", source: "Lead qualification" },
    ],
    whatYouGet: [
      "Reduces scheduling friction",
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
  color: "#00AEEF",
  gradientFrom: "#00AEEF",
  gradientTo: "#003B8F",
};

function VideoPlaceholder({ service, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    // Focus the close button on mount
    const closeBtn = dialogRef.current?.querySelector("button[aria-label]");
    closeBtn?.focus();
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${service.title} preview`}
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
          aria-label="Close automation preview"
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
            <h3 className="font-titles text-2xl font-bold mb-2">{service.title}</h3>
            <p className="text-sm text-white/60 max-w-md mb-6">
              Explore this workflow — see how it captures and converts leads for businesses like yours.
            </p>
            <Link
              to="/book"
              className="cs-btn-primary"
              onClick={onClose}
            >
              Build My AI Automation Stack <ArrowRight className="w-4 h-4" />
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
        className="flex flex-col rounded-xl overflow-hidden transition-all duration-300"
        style={{
          background: "rgba(8, 20, 44, 0.6)",
          border: hovered ? `1.5px solid rgba(53, 189, 241, 0.4)` : "1.5px solid rgba(53, 189, 241, 0.15)",
          boxShadow: hovered
            ? `0 24px 64px rgba(53, 189, 241, 0.15), 0 0 0 1px rgba(53, 189, 241, 0.1)`
            : "0 4px 16px rgba(0, 0, 0, 0.3)",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
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
              <span className="text-white text-sm font-semibold">Automation Preview</span>
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
          <h2 className="font-titles text-lg font-bold mb-1" style={{ color: "#FFFFFF" }}>
            {service.title}
          </h2>
          <p className="text-xs font-semibold mb-3" style={{ color: "#35BDF1" }}>
            {service.tagline}
          </p>
          <p className="text-sm leading-relaxed mb-5" style={{ color: "#AEB8C8" }}>
            {service.description}
          </p>

          {/* Stats */}
          <div className="rounded-lg p-4 mb-5" style={{ border: "1px solid rgba(53, 189, 241, 0.2)", background: "rgba(53, 189, 241, 0.06)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#7F8DA3" }}>System Signals</p>
            <div className="space-y-3">
              {service.stats.map((stat) => (
                <div key={stat.label} className="flex items-start gap-3">
                  <span className="text-base font-titles font-black flex-shrink-0" style={{ minWidth: "56px", color: "#35BDF1" }}>
                    {stat.value}
                  </span>
                  <div>
                    <p className="text-xs font-medium leading-tight" style={{ color: "#FFFFFF" }}>{stat.label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#7F8DA3" }}>Source: {stat.source}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What you get */}
          <div className="mb-6 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#7F8DA3" }}>What's included</p>
            <ul className="space-y-2">
              {service.whatYouGet.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#35BDF1" }} />
                  <span className="text-xs leading-snug" style={{ color: "#AEB8C8" }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <Link
            to={`/book?service=${service.id}`}
            className="cs-btn-primary w-full"
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
      title: "Included Automation Modules | ClientSurge Systems",
      description:
        "Automation modules included across ClientSurge packages — lead capture, instant response, missed-call recovery, follow-up, booking, reviews, and reactivation.",
      canonicalPath: "/automations",
      ogTitle: "Included Automation Modules | ClientSurge Systems",
      ogDescription:
        "See the automation modules included inside ClientSurge Starter, Growth, and Pro packages for local service businesses.",
    });
  }, []);

  return (
    <DemoBookingProvider>
      <div className="min-h-screen" style={{ background: "#061025" }}>
      <Navbar />

      {/* Hero */}
      <main className="pt-[var(--cs-nav-height)]">
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <SectionHeader
          eyebrow="Automation Modules"
          title="Six Automations Included Across Every Package"
          subtitle="Each module is designed to capture, respond, qualify, book, review, and reactivate leads for your service business."
          align="center"
          variant="dark"
        />
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        {/* Bottom CTA Section */}
        <div
          className="mt-16 rounded-2xl p-10 md:p-14 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(0,79,156,0.12), rgba(0,59,143,0.08))",
            border: "1px solid rgba(53, 189, 241, 0.2)",
            backdropFilter: "blur(12px)",
          }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#35BDF1" }}>
            Compare Packages
          </p>
          <h2 className="font-titles text-3xl md:text-4xl font-bold mb-4" style={{ color: "#FFFFFF" }}>
            Pick the System That Fits Your Business
          </h2>
          <p className="text-base max-w-xl mx-auto mb-8 leading-relaxed" style={{ color: "#AEB8C8" }}>
            These automation modules are included across our Starter, Growth, and Pro packages. Compare to see exactly what each one includes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/pricing"
              className="cs-btn-primary"
              style={{ padding: "0 40px", height: "56px", fontSize: "1rem" }}
            >
              Compare Packages <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/book"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold transition-all"
              style={{
                color: "#FFFFFF",
                border: "1.5px solid rgba(53, 189, 241, 0.3)",
                background: "rgba(8, 20, 44, 0.5)",
              }}
            >
              Get Help Choosing
            </Link>
          </div>
          <p className="mt-5 text-xs" style={{ color: "#7F8DA3" }}>
            No credit card required · Typical setup time: 24–48 hours
          </p>
        </div>
      </section>
      </main>
      <Footer />
      <MobileCallBar />
    </div>
    </DemoBookingProvider>
  );
}