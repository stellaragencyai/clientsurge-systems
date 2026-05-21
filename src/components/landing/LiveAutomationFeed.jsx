import { useEffect, useState, useRef } from "react";

function timeAgo(ts) {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  return `${mins}m ago`;
}
import { Zap, MessageSquare, PhoneCall, CalendarCheck, RefreshCw, Mail, ArrowRight } from "lucide-react";
import DemoBookingModal from "../forms/DemoBookingModal";

const EVENT_POOL = [
  { icon: Zap, color: "#16a34a", bg: "rgba(22,163,74,0.1)", city: "Scottsdale, AZ", event: "New lead captured from Google Ads", detail: "Responded in 12 seconds" },
  { icon: PhoneCall, color: "#dc2626", bg: "rgba(220,38,38,0.08)", city: "Phoenix, AZ", event: "Missed call received", detail: "Text-back sent in 8 seconds" },
  { icon: CalendarCheck, color: "#9a5c2e", bg: "rgba(154,92,46,0.1)", city: "Austin, TX", event: "Consultation booked", detail: "Lead qualified via SMS in 4 min" },
  { icon: MessageSquare, color: "#7c3aed", bg: "rgba(124,58,237,0.08)", city: "Miami, FL", event: "Follow-up sequence triggered", detail: "Day 3 of 14-day nurture" },
  { icon: RefreshCw, color: "#0891b2", bg: "rgba(8,145,178,0.08)", city: "Denver, CO", event: "Dormant lead reactivated", detail: "Re-engagement sent after 21 days" },
  { icon: Mail, color: "#9a5c2e", bg: "rgba(154,92,46,0.08)", city: "Nashville, TN", event: "Booking confirmation sent", detail: "Email + SMS confirmed" },
  { icon: Zap, color: "#16a34a", bg: "rgba(22,163,74,0.1)", city: "Dallas, TX", event: "Lead captured from Facebook form", detail: "Responded in 9 seconds" },
  { icon: CalendarCheck, color: "#9a5c2e", bg: "rgba(154,92,46,0.1)", city: "Scottsdale, AZ", event: "Appointment confirmed", detail: "No-show reminder scheduled" },
  { icon: PhoneCall, color: "#dc2626", bg: "rgba(220,38,38,0.08)", city: "Phoenix, AZ", event: "After-hours inquiry received", detail: "Instant response sent at 11:43 PM" },
  { icon: MessageSquare, color: "#7c3aed", bg: "rgba(124,58,237,0.08)", city: "Peoria, AZ", event: "Quote request follow-up", detail: "2nd touchpoint in sequence" },
];

function randomBetween(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function randomEvent() { return EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)]; }

function FeedItem({ item, isNew }) {
  const Icon = item.icon;
  return (
    <div
      className="flex items-start gap-4 px-5 py-4 rounded-xl transition-all duration-500"
      style={{
        background: isNew ? "rgba(154,92,46,0.06)" : "transparent",
        border: isNew ? "1px solid rgba(154,92,46,0.2)" : "1px solid transparent",
        opacity: 1,
      }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: item.bg }}>
        <Icon className="w-4 h-4" style={{ color: item.color }} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground leading-snug">{item.event}</p>
          <span className="text-[10px] text-foreground/40 whitespace-nowrap flex-shrink-0 mt-0.5">{item.city} · {timeAgo(item.timestamp)}</span>
        </div>
        <p className="text-xs text-foreground/55 mt-0.5">{item.detail}</p>
      </div>
      {isNew && (
        <div className="flex-shrink-0 mt-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
        </div>
      )}
    </div>
  );
}

export default function LiveAutomationFeed() {
  const [feed, setFeed] = useState(() => Array.from({ length: 5 }, () => ({ ...randomEvent(), id: Math.random(), isNew: false, timestamp: Date.now() - Math.floor(Math.random() * 120000) })));
  const [counter, setCounter] = useState({ leads: 847, bookings: 312, recovered: 94 });
  const [showDemoModal, setShowDemoModal] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      const newItem = { ...randomEvent(), id: Math.random(), isNew: true, timestamp: Date.now() };
      setFeed(prev => {
        const updated = [newItem, ...prev.slice(0, 4)].map((item, i) => ({ ...item, isNew: i === 0 }));
        return updated;
      });
      setCounter(prev => ({
        leads: prev.leads + randomBetween(1, 3),
        bookings: prev.bookings + (Math.random() > 0.6 ? 1 : 0),
        recovered: prev.recovered + (Math.random() > 0.7 ? 1 : 0),
      }));
    }, 2400);
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <section className="py-20 md:py-28 px-4 md:px-6 bg-gradient-to-b from-background to-card">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Live System Activity</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
            Watch the Automation Run in Real Time
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            This simulated feed shows the kinds of events the installed system is designed to capture, route, and report.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Feed */}
          <div className="rounded-3xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(154,92,46,0.15)", boxShadow: "0 16px 48px rgba(0,0,0,0.07)" }}>
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                <span className="text-xs font-bold text-foreground/70 uppercase tracking-wide">Live Activity Feed</span>
              </div>
              <span className="text-[10px] font-semibold text-foreground/35 uppercase tracking-widest">Simulated demo data</span>
            </div>
            <div className="divide-y divide-border/30">
              {feed.map(item => <FeedItem key={item.id} item={item} isNew={item.isNew} />)}
            </div>
          </div>

          {/* Right panel — counters + CTA */}
          <div className="flex flex-col gap-4">
            {[
              { label: "Leads Captured", value: counter.leads, color: "#16a34a" },
              { label: "Bookings Generated", value: counter.bookings, color: "#9a5c2e" },
              { label: "Leads Recovered", value: counter.recovered, color: "#7c3aed" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex-1 rounded-2xl p-5 bg-white flex flex-col justify-between" style={{ border: "1px solid rgba(154,92,46,0.12)", boxShadow: "0 4px 16px rgba(0,0,0,0.05)" }}>
                <p className="text-xs font-bold uppercase tracking-widest text-foreground/45 mb-2">{label}</p>
                <p className="font-display text-3xl font-bold transition-all duration-500" style={{ color }}>{value.toLocaleString()}</p>
                <p className="text-[10px] text-foreground/35 mt-1">Simulated demo data</p>
              </div>
            ))}

            <button
              onClick={() => setShowDemoModal(true)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "52px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "700", fontSize: "0.9rem", border: "none", cursor: "pointer", boxShadow: "0 4px 18px rgba(120,70,20,0.35)" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(120,70,20,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 18px rgba(120,70,20,0.35)"; }}
            >
              Get This For My Business
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {showDemoModal && <DemoBookingModal onClose={() => setShowDemoModal(false)} />}
    </section>
  );
}