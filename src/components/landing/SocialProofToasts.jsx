import { useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";

const proofItems = [
  { name: "Mike R.", location: "Houston, TX", action: "just booked a demo", ago: "2 min ago", industry: "HVAC & Home Services" },
  { name: "Sarah M.", location: "Miami, FL", action: "signed up today", ago: "11 min ago", industry: "Med Spas & Aesthetic Clinics" },
  { name: "David L.", location: "Austin, TX", action: "just booked a demo", ago: "18 min ago", industry: "Roofing & Restoration" },
  { name: "Jessica T.", location: "Atlanta, GA", action: "signed up today", ago: "34 min ago", industry: "Chiropractic & Physical Therapy" },
  { name: "Carlos B.", location: "Phoenix, AZ", action: "just booked a demo", ago: "47 min ago", industry: "Contractors & Trades" },
  { name: "Amy W.", location: "Nashville, TN", action: "signed up today", ago: "1 hr ago", industry: "Dental & Orthodontics" },
];

export default function SocialProofToasts() {
  const [current, setCurrent] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let idx = 0;
    const show = () => {
      setCurrent(proofItems[idx % proofItems.length]);
      setVisible(true);
      idx++;
      setTimeout(() => setVisible(false), 4000);
    };

    // First one after 8s, then every 15s
    const first = setTimeout(() => {
      show();
      const interval = setInterval(show, 15000);
      return () => clearInterval(interval);
    }, 8000);

    return () => clearTimeout(first);
  }, []);

  if (!current) return null;

  return (
    <div
      className={`fixed bottom-24 left-5 z-50 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border border-border max-w-xs backdrop-blur-md"
        style={{ background: 'rgba(255,255,255,0.92)' }}
      >
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <CalendarCheck className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">
            {current.name} - {current.industry}
          </p>
          <p className="text-xs text-muted-foreground">{current.action} - {current.location}</p>
        </div>
        <div className="flex flex-col items-end flex-shrink-0">
          <p className="text-[10px] text-muted-foreground/60">{current.ago}</p>
          <p className="text-[9px] text-muted-foreground/40 italic">example</p>
        </div>
      </div>
    </div>
  );
}
