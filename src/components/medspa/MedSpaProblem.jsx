import { X } from "lucide-react";

const problems = [
  { title: "If you're slow, someone else closes them", desc: "Leads shop around. First response wins." },
  { title: "Every missed call is a lost booking", desc: "They don't call back twice." },
  { title: "Your team is busy — your leads are not waiting", desc: "Front desk is with clients. Leads are booking elsewhere." },
  { title: "No system means no follow-up", desc: "Manual workflows fail. Leads slip through." },
  { title: "Old leads are losing value daily", desc: "Every day they wait, conversion probability drops." },
];

const channels = ["Instagram", "Website", "Phone Calls", "Google Ads", "Referrals", "Facebook"];

export default function MedSpaProblem() {
  return (
    <section className="py-24 md:py-32 px-6 bg-[#FAFAF8]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">The Real Problem</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground mb-4">
            <span className="text-primary">Here's what's really happening.</span>
          </h2>
        </div>

        {/* Two-column: image + problem list */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=85"
              alt="Med spa reception"
              className="w-full h-72 md:h-full object-cover"
            />
          </div>

          <div className="space-y-4">
            {problems.map((p, i) => (
              <div key={i} className="flex gap-4 p-5 bg-white rounded-xl border border-border hover:border-destructive/30 hover:shadow-sm transition-all">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-0.5">{p.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
            <div className="mt-6 pt-6 border-t border-border">
             <p className="text-sm font-semibold text-foreground mb-2">
               <span className="text-primary">One missed inquiry</span> can mean a lost high-value client.
             </p>
             <p className="text-xs text-muted-foreground">
               This is happening every day you don't fix it.
             </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}