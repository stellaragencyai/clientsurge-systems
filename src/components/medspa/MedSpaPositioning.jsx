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

        {/* Enhanced channels flow */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-y-1/2" />

          {/* Channels grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
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
                  <div className="hidden group-hover:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-5 h-5 text-primary/40" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unified lead point */}
          <div className="flex justify-center mb-8">
            <div className="px-6 py-2 rounded-full bg-primary/10 border border-primary/25">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">All lead to the same place</p>
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