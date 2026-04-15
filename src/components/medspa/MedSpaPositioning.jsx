import { Instagram, Globe, Phone, Zap, Facebook, Users, ArrowRight } from "lucide-react";

export default function MedSpaPositioning() {
  const channels = [
    { name: "Instagram", icon: Instagram },
    { name: "Website", icon: Globe },
    { name: "Phone Calls", icon: Phone },
    { name: "Google Ads", icon: Zap },
    { name: "Facebook", icon: Facebook },
    { name: "Referrals", icon: Users },
  ];

  return (
    <section className="py-16 md:py-20 px-6 bg-gradient-to-b from-primary/5 to-white border-y border-primary/10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-2">
            You're Not Losing Leads — <span className="text-primary">You're Losing Them After They Reach Out</span>
          </h2>
          <p className="text-base text-muted-foreground">
            Every missed lead is money you already paid for — and now lost.
          </p>
        </div>

        {/* Enhanced channels funnel flow */}
        <div className="relative mb-16">
          {/* Channels grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 relative z-10">
            {channels.map((c, i) => {
              const Icon = c.icon;
              return (
                <div
                  key={i}
                  className="relative group flex flex-col items-center gap-3 p-5 rounded-xl bg-white border border-primary/15 hover:border-primary/40 hover:shadow-md hover:scale-105 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-xs font-semibold text-foreground text-center leading-tight">{c.name}</p>
                </div>
              );
            })}
          </div>

          {/* SVG Funnel visualization with arrows */}
          <svg className="absolute inset-0 w-full h-96 pointer-events-none" style={{ top: '60px' }}>
            {/* Arrow from Instagram (0) to center */}
            <path d="M 80 60 Q 50% 150, 50% 280" stroke="#000" strokeWidth="2" fill="none" strokeDasharray="5,5" />
            <polygon points="50%,290 calc(50% - 6),275 calc(50% + 6),275" fill="#000" />

            {/* Arrow from Website (1) to center */}
            <path d="M 210 60 Q 48% 150, 50% 280" stroke="#000" strokeWidth="2" fill="none" strokeDasharray="5,5" />
            <polygon points="50%,290 calc(50% - 6),275 calc(50% + 6),275" fill="#000" />

            {/* Arrow from Phone (2) to center */}
            <path d="M 340 60 Q 52% 150, 50% 280" stroke="#000" strokeWidth="2" fill="none" strokeDasharray="5,5" />
            <polygon points="50%,290 calc(50% - 6),275 calc(50% + 6),275" fill="#000" />

            {/* Arrow from Ads (3) to center */}
            <path d="M 470 60 Q 52% 150, 50% 280" stroke="#000" strokeWidth="2" fill="none" strokeDasharray="5,5" />
            <polygon points="50%,290 calc(50% - 6),275 calc(50% + 6),275" fill="#000" />

            {/* Arrow from Facebook (4) to center */}
            <path d="M 600 60 Q 52% 150, 50% 280" stroke="#000" strokeWidth="2" fill="none" strokeDasharray="5,5" />
            <polygon points="50%,290 calc(50% - 6),275 calc(50% + 6),275" fill="#000" />

            {/* Arrow from Referrals (5) to center */}
            <path d="M 730 60 Q 52% 150, 50% 280" stroke="#000" strokeWidth="2" fill="none" strokeDasharray="5,5" />
            <polygon points="50%,290 calc(50% - 6),275 calc(50% + 6),275" fill="#000" />
          </svg>

          {/* Central convergence point - the med spa */}
          <div className="flex justify-center relative z-20 mt-12">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-3 shadow-lg">
                <span className="text-white font-bold text-sm text-center px-2">Your Med Spa</span>
              </div>
              <p className="text-xs font-semibold text-foreground">All leads funnel here</p>
            </div>
          </div>

          {/* Loss indicator */}
          <div className="flex justify-center mt-8 relative z-20">
            <div className="px-4 py-2 rounded-full bg-destructive/10 border border-destructive/30">
              <p className="text-xs font-semibold text-destructive">❌ But many are lost to poor follow-up</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground font-medium mb-2">
            You're already getting leads from these sources. <br />
          </p>
          <p className="text-base font-semibold text-foreground">
            <span className="text-primary">The problem is what happens after.</span>
          </p>
        </div>
      </div>
    </section>
  );
}