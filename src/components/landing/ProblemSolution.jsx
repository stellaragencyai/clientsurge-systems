import { Clock, PhoneMissed, Users, AlertTriangle, Archive, ArrowRight, Zap, MessageSquare, PhoneCall, Send, RotateCcw } from "lucide-react";

const pairs = [
  {
    problemIcon: Clock,
    problem: "You're Too Slow to Respond",
    problemDesc: "The average business takes 47 hours to reply. By then, they've already booked your competitor.",
    solutionIcon: Zap,
    solution: "Instant Lead Response",
    solutionDesc: "Capture leads before competitors respond.",
  },
  {
    problemIcon: PhoneMissed,
    problem: "Missed Calls Are Missed Revenue",
    problemDesc: "Every unanswered call is a customer you paid to attract — walking straight to someone else.",
    solutionIcon: PhoneCall,
    solution: "Missed Call Text-Back",
    solutionDesc: "Recover revenue from every missed call.",
  },
  {
    problemIcon: Users,
    problem: "Your Team Can't Keep Up",
    problemDesc: "Front desks handle walk-ins, phones, and messages at once. Follow-up is an afterthought.",
    solutionIcon: Send,
    solution: "Automated Follow-Up",
    solutionDesc: "Turn more inquiries into booked appointments.",
  },
  {
    problemIcon: AlertTriangle,
    problem: "No System Means No Follow-Up",
    problemDesc: "A warm lead left without contact for 24 hours is a cold lead. Without automation, that's most of your pipeline.",
    solutionIcon: MessageSquare,
    solution: "Booking Flow Automation",
    solutionDesc: "Guide leads directly to scheduling without friction.",
  },
  {
    problemIcon: Archive,
    problem: "Old Leads Are Sitting Untouched",
    problemDesc: "You already paid to get them. Without a reactivation system, that investment is rotting in a spreadsheet.",
    solutionIcon: RotateCcw,
    solution: "Lead Reactivation",
    solutionDesc: "Turn old leads into new revenue.",
  },
];

export default function ProblemSolution() {
  return (
    <section id="services" className="py-24 md:py-32 px-6 bg-background">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Problem & The Fix</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-tight">
            You Don't Have a Lead Problem.
            <br />
            <span className="text-primary">You Have a Follow-Up Problem.</span>
          </h2>
          <p className="mt-5 text-muted-foreground text-lg leading-relaxed">
            Every delayed response is lost revenue. Here's where it breaks — and exactly how we fix it.
          </p>
        </div>

        {/* Column labels */}
        <div className="hidden md:grid grid-cols-[1fr_40px_1fr] gap-4 mb-6 px-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">The Problem</p>
          <div />
          <p className="text-xs font-bold uppercase tracking-widest text-primary/70 text-center">The Fix</p>
        </div>

        {/* Paired rows */}
        <div className="space-y-4">
          {pairs.map((pair, i) => {
            const ProblemIcon = pair.problemIcon;
            const SolutionIcon = pair.solutionIcon;
            return (
              <div key={i} className="grid md:grid-cols-[1fr_40px_1fr] gap-3 md:gap-4 items-center">

                {/* Problem */}
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-border hover:border-destructive/20 hover:shadow-sm transition-all">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                    <ProblemIcon className="w-5 h-5 text-destructive/80" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{pair.problem}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{pair.problemDesc}</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div className="md:hidden flex justify-center">
                  <ArrowRight className="w-4 h-4 text-primary rotate-90" />
                </div>

                {/* Solution */}
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-primary/8 border border-primary/20 hover:border-primary/40 hover:shadow-sm transition-all">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <SolutionIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{pair.solution}</h3>
                    <p className="text-xs text-primary/80 font-medium leading-relaxed">{pair.solutionDesc}</p>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}