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
    <section className="py-24 md:py-32 px-6 bg-gradient-to-b from-primary/5 to-white border-y border-primary/10">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16 relative z-10">
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
                  
                  {/* Connecting lines from each source */}
                  <div className="absolute -bottom-16 left-1/2 w-0.5 h-16 bg-gradient-to-b from-black/30 to-black/5 -translate-x-1/2" />
                </div>
              );
            })}
          </div>

          {/* Central convergence point - the med spa */}
          <div className="flex justify-center relative z-20">
            <div className="text-center">
              {/* Sophisticated Med Spa Icon */}
              <div className="relative w-32 h-32 mb-6">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/40" />
                
                {/* Middle ring */}
                <div className="absolute inset-3 rounded-full bg-gradient-to-br from-primary to-primary/90 shadow-2xl flex items-center justify-center">
                  {/* Inner icon */}
                  <div className="text-center">
                    <div className="text-4xl mb-1">✨</div>
                    <p className="text-white font-bold text-xs">Your Med Spa</p>
                  </div>
                </div>
                
                {/* Animated glow */}
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
              </div>
              
              <p className="text-sm font-semibold text-foreground">All leads converge here</p>
            </div>
          </div>

          {/* Loss indicator */}
          <div className="flex justify-center mt-8 relative z-20">
            <div className="px-6 py-3 rounded-full bg-destructive/10 border border-destructive/30 backdrop-blur animate-pulse">
              <p className="text-sm font-bold text-destructive">❌ But many are lost to poor follow-up</p>
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