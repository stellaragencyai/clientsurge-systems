import { useState } from "react";
import { ArrowRight, Zap, Phone, Mail, Calendar, Star, RefreshCw, Play, X } from "lucide-react";
import { Link } from "react-router-dom";

const SERVICES = [
  {
    id: "instant-lead-response",
    icon: Zap,
    color: "#0088CC",
    gradientFrom: "#00AEEF",
    gradientTo: "#0050A0",
    emoji: "⚡",
    title: "Instant Lead Response",
    tagline: "Reply to every new lead in under 60 seconds",
    description:
      "The moment a lead submits a form, calls, or reaches out online — your AI fires a personalized SMS and email within 60 seconds. No manual work, no missed opportunities. Every lead hears from you first.",
    stats: [
      { value: "60s", label: "Response time" },
      { value: "5×", label: "More conversions" },
      { value: "24/7", label: "Always on" },
    ],
    videoUrl: null,
    poster: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80",
  },
  {
    id: "missed-call-textback",
    icon: Phone,
    color: "#7C3AED",
    gradientFrom: "#8B5CF6",
    gradientTo: "#5B21B6",
    emoji: "📞",
    title: "Missed Call Text-Back",
    tagline: "Every missed call becomes a live conversation",
    description:
      "When a call goes unanswered, the system automatically texts the caller back within seconds. Your leads get an instant response even when you're on another job, in a consultation, or after hours.",
    stats: [
      { value: "40%", label: "Calls recovered" },
      { value: "< 30s", label: "Text-back speed" },
      { value: "0", label: "Missed leads" },
    ],
    videoUrl: null,
    poster: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80",
  },
  {
    id: "nurture-sequence",
    icon: Mail,
    color: "#059669",
    gradientFrom: "#10B981",
    gradientTo: "#047857",
    emoji: "📧",
    title: "14-Day Nurture Sequence",
    tagline: "Automated follow-up that keeps leads warm for 2 weeks",
    description:
      "A multi-touch SMS + email sequence that runs on autopilot for 14 days. Each message is personalized to the lead's behavior — warming them up until they're ready to book, without any manual effort.",
    stats: [
      { value: "3×", label: "More bookings" },
      { value: "14", label: "Days automated" },
      { value: "8+", label: "Touchpoints" },
    ],
    videoUrl: null,
    poster: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=80",
  },
  {
    id: "ai-booking-agent",
    icon: Calendar,
    color: "#D97706",
    gradientFrom: "#F59E0B",
    gradientTo: "#B45309",
    emoji: "🤖",
    title: "AI Booking Agent",
    tagline: "Turns SMS conversations into confirmed appointments",
    description:
      "When a lead signals intent to book, the AI takes over — sends the booking link, follows up if they don't click, and confirms the appointment automatically. No staff needed, no back-and-forth.",
    stats: [
      { value: "40%", label: "More bookings" },
      { value: "100%", label: "Automated" },
      { value: "0", label: "No-shows reduced" },
    ],
    videoUrl: null,
    poster: "https://images.unsplash.com/photo-1633613286991-611fe299c4be?w=600&q=80",
  },
  {
    id: "review-request",
    icon: Star,
    color: "#EA580C",
    gradientFrom: "#F97316",
    gradientTo: "#C2410C",
    emoji: "⭐",
    title: "Review Request System",
    tagline: "Automatically collect 5-star reviews after every appointment",
    description:
      "After a job is done, the system sends a perfectly-timed review request via SMS. Happy customers leave reviews on autopilot — building your Google reputation while you focus on delivering great service.",
    stats: [
      { value: "4×", label: "More reviews" },
      { value: "4.9★", label: "Avg rating" },
      { value: "Auto", label: "Triggered" },
    ],
    videoUrl: null,
    poster: "https://images.unsplash.com/photo-1531973576160-7125cd663d86?w=600&q=80",
  },
  {
    id: "lead-reactivation",
    icon: RefreshCw,
    color: "#BE185D",
    gradientFrom: "#EC4899",
    gradientTo: "#9D174D",
    emoji: "🔥",
    title: "Lead Reactivation",
    tagline: "Wake up cold leads and turn them into paying clients",
    description:
      "Old leads who never booked get a targeted re-engagement campaign. A single reactivation blast can recover thousands in dormant revenue from leads you've already paid to acquire.",
    stats: [
      { value: "90d", label: "Leads recovered" },
      { value: "35%", label: "Reactivation rate" },
      { value: "$$$", label: "Dormant revenue" },
    ],
    videoUrl: null,
    poster: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
  },
];

function VideoModal({ service, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="aspect-video bg-slate-900 flex items-center justify-center">
          <img
            src={service.poster}
            alt={service.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-8">
            <span className="text-5xl mb-4">{service.emoji}</span>
            <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>{service.title}</h3>
            <p className="text-sm text-white/70 max-w-md">Demo video coming soon. Book a live demo to see this automation in action.</p>
            <Link
              to="/onboarding"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#0088CC,#003B8F)" }}
              onClick={onClose}
            >
              Start Onboarding <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ service }) {
  const [hovered, setHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const Icon = service.icon;

  return (
    <>
      <div
        className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
        style={{
          background: "rgba(255,255,255,0.9)",
          border: hovered ? `1.5px solid ${service.color}55` : "1.5px solid rgba(0,0,0,0.08)",
          boxShadow: hovered
            ? `0 20px 60px ${service.color}22, 0 4px 20px rgba(0,0,0,0.1)`
            : "0 2px 16px rgba(0,0,0,0.06)",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Video / Image Thumbnail */}
        <div
          className="relative overflow-hidden"
          style={{ height: "200px" }}
          onClick={() => setShowModal(true)}
        >
          <img
            src={service.poster}
            alt={service.title}
            className="w-full h-full object-cover transition-transform duration-500"
            style={{ transform: hovered ? "scale(1.06)" : "scale(1)" }}
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${service.gradientFrom}99 0%, ${service.gradientTo}bb 100%)`,
            }}
          />
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-300"
              style={{
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(8px)",
                border: "2px solid rgba(255,255,255,0.5)",
                transform: hovered ? "scale(1.12)" : "scale(1)",
              }}
            >
              <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
            </div>
          </div>
          {/* Icon badge */}
          <div className="absolute top-3 left-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.4)" }}
            >
              <Icon className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 flex flex-col flex-1">
          <div className="mb-3">
            <h3
              className="text-lg font-bold text-slate-900 mb-1 leading-tight"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {service.title}
            </h3>
            <p className="text-xs font-semibold" style={{ color: service.color }}>
              {service.tagline}
            </p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-5">
            {service.description}
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100">
            {service.stats.map((stat) => (
              <div key={stat.label} className="flex-1 text-center">
                <p className="text-lg font-black" style={{ color: service.color }}>{stat.value}</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link
            to="/onboarding"
            className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${service.gradientFrom}, ${service.gradientTo})` }}
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {showModal && <VideoModal service={service} onClose={() => setShowModal(false)} />}
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
            style={{ height: "48px", width: "auto", objectFit: "contain", mixBlendMode: "luminosity", filter: "brightness(10)" }}
          />
        </Link>
        <Link
          to="/onboarding"
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg,#00AEEF,#0050A0)" }}
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-4 py-2 rounded-full mb-5 uppercase tracking-widest">
          ⚙️ All 6 Core Automations
        </div>
        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-5"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          Done-For-You AI Systems
          <br />
          <span style={{ color: "#00AEEF" }}>That Run on Autopilot</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-8">
          Every system below is fully built and live in 24–48 hours. Click the video preview to see each automation in action, then get started when you're ready.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          {[
            { icon: "⚡", text: "Live in 24–48 hours" },
            { icon: "🔒", text: "No long-term contracts" },
            { icon: "🎯", text: "Done-for-you setup" },
          ].map((b) => (
            <span
              key={b.text}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold"
              style={{ background: "rgba(0,174,239,0.08)", border: "1px solid rgba(0,174,239,0.2)", color: "#0050A0" }}
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
          className="mt-16 rounded-3xl p-10 text-center"
          style={{ background: "linear-gradient(135deg,#003B8F 0%,#0088CC 60%,#00AEEF 100%)" }}
        >
          <h2
            className="text-3xl md:text-4xl font-bold text-white mb-3"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Ready to Activate All 6 Systems?
          </h2>
          <p className="text-blue-100 text-base max-w-xl mx-auto mb-8">
            Start your onboarding today. We'll set up and go live with your chosen systems in 24–48 hours.
          </p>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-base font-bold text-slate-900 bg-white hover:bg-blue-50 transition-colors shadow-lg"
          >
            Start Your Free Setup <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-xs text-blue-200/60">No credit card required to get started</p>
        </div>
      </div>
    </div>
  );
}