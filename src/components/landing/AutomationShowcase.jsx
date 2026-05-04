import { useState } from "react";
import { Play, ArrowRight, Zap, Phone, Mail, Calendar, Star, RefreshCw } from "lucide-react";

const AUTOMATIONS = [
  {
    id: "instant-lead-response",
    icon: Zap,
    color: "from-blue-500 to-cyan-400",
    title: "Instant Lead Response",
    tagline: "Reply to every new lead in under 60 seconds — automatically.",
    description:
      "The moment a lead fills out a form, calls, or submits online — your AI fires a personalized SMS and email within 60 seconds. No manual work. No missed opportunities.",
    videoPlaceholder: "YOUR_LOOM_OR_YOUTUBE_URL",
    diagramPlaceholder: true,
    stat: "5× more likely to convert",
  },
  {
    id: "missed-call-textback",
    icon: Phone,
    color: "from-violet-500 to-purple-400",
    title: "Missed Call Text-Back",
    tagline: "Every missed call gets an instant follow-up text.",
    description:
      "When a call goes unanswered, the system automatically texts the caller back within seconds. Your leads get a response even when you're on another job.",
    videoPlaceholder: "YOUR_LOOM_OR_YOUTUBE_URL",
    diagramPlaceholder: true,
    stat: "Recover 30–40% of missed calls",
  },
  {
    id: "nurture-sequence",
    icon: Mail,
    color: "from-emerald-500 to-teal-400",
    title: "14-Day Nurture Sequence",
    tagline: "Automated follow-up that keeps leads warm for 2 weeks.",
    description:
      "A multi-touch SMS + email sequence that runs on autopilot for 14 days. Each message is personalized to the lead's industry and behavior — warming them until they're ready to book.",
    videoPlaceholder: "YOUR_LOOM_OR_YOUTUBE_URL",
    diagramPlaceholder: true,
    stat: "3× more booked appointments",
  },
  {
    id: "ai-booking-agent",
    icon: Calendar,
    color: "from-orange-500 to-amber-400",
    title: "AI Booking Agent",
    tagline: "Turns conversations into confirmed appointments.",
    description:
      "When a lead signals intent to book, the AI takes over — sends the booking link, follows up if they don't click, and confirms the appointment automatically.",
    videoPlaceholder: "YOUR_LOOM_OR_YOUTUBE_URL",
    diagramPlaceholder: true,
    stat: "40% more confirmed bookings",
  },
  {
    id: "review-request",
    icon: Star,
    color: "from-yellow-500 to-orange-400",
    title: "Review Request Automation",
    tagline: "Automatically request 5-star reviews after every appointment.",
    description:
      "After a job is done, the system sends a perfectly-timed review request via SMS. Happy customers leave reviews. You build social proof on autopilot.",
    videoPlaceholder: "YOUR_LOOM_OR_YOUTUBE_URL",
    diagramPlaceholder: true,
    stat: "2–4× more Google reviews",
  },
  {
    id: "lead-reactivation",
    icon: RefreshCw,
    color: "from-rose-500 to-pink-400",
    title: "Lead Reactivation",
    tagline: "Wake up cold leads and turn them into paying clients.",
    description:
      "Old leads who never booked get a targeted re-engagement campaign. A single reactivation blast can recover thousands in dormant revenue.",
    videoPlaceholder: "YOUR_LOOM_OR_YOUTUBE_URL",
    diagramPlaceholder: true,
    stat: "Recover leads up to 90 days old",
  },
];

export default function AutomationShowcase() {
  const [activeId, setActiveId] = useState(AUTOMATIONS[0].id);
  const active = AUTOMATIONS.find((a) => a.id === activeId);
  const Icon = active.icon;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full mb-4">
            <Play className="w-4 h-4" />
            See Every Automation In Action
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Watch How Each System Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Click any automation below to see a short walkthrough and visual diagram of exactly how it works for your business.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar — automation list */}
          <div className="lg:w-72 flex-shrink-0 flex flex-col gap-2">
            {AUTOMATIONS.map((a) => {
              const Ico = a.icon;
              const isActive = a.id === activeId;
              return (
                <button
                  key={a.id}
                  onClick={() => setActiveId(a.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all border ${
                    isActive
                      ? "bg-primary text-white border-primary shadow-md"
                      : "bg-white text-foreground border-border hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? "bg-white/20" : "bg-muted"}`}>
                    <Ico className={`w-4 h-4 ${isActive ? "text-white" : "text-primary"}`} />
                  </div>
                  <span className="text-sm font-medium leading-tight">{a.title}</span>
                </button>
              );
            })}
          </div>

          {/* Main content panel */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Header */}
            <div className={`rounded-2xl p-6 bg-gradient-to-br ${active.color} text-white`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">{active.stat}</div>
              </div>
              <h3 className="text-2xl font-bold mb-1">{active.title}</h3>
              <p className="text-white/90 text-sm">{active.tagline}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Video placeholder */}
              <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center text-center p-8 min-h-[220px]">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Play className="w-6 h-6 text-primary ml-1" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">Video Walkthrough</p>
                <p className="text-xs text-muted-foreground">
                  Drop your Loom / YouTube link here for <span className="font-medium">{active.title}</span>
                </p>
                <div className="mt-3 text-[10px] bg-muted px-3 py-1 rounded-full text-muted-foreground font-mono">
                  {active.videoPlaceholder}
                </div>
              </div>

              {/* Diagram placeholder */}
              <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center text-center p-8 min-h-[220px]">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${active.color} flex items-center justify-center mb-4 opacity-30`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">Visual Diagram</p>
                <p className="text-xs text-muted-foreground">
                  Your custom flow diagram for <span className="font-medium">{active.title}</span> goes here
                </p>
                <div className="mt-3 text-[10px] bg-muted px-3 py-1 rounded-full text-muted-foreground">
                  Upload image or embed URL
                </div>
              </div>
            </div>

            {/* Description + CTA */}
            <div className="rounded-2xl border border-border bg-white p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <p className="text-muted-foreground text-sm flex-1">{active.description}</p>
              <a
                href="/store"
                className="flex-shrink-0 inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
              >
                Get This System <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}