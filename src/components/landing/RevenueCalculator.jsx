import { useState } from "react";
import { ArrowRight, TrendingDown, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RevenueCalculator() {
  const [leads, setLeads] = useState(50);
  const [ticket, setTicket] = useState(500);
  const [convRate, setConvRate] = useState(15);

  const currentBookings = Math.round((leads * convRate) / 100);
  const improvedRate = Math.min(convRate + Math.round(convRate * 0.65), 62); // realistic lift estimate
  const potentialBookings = Math.round((leads * improvedRate) / 100);
  const currentRevenue = currentBookings * ticket;
  const potentialRevenue = potentialBookings * ticket;
  const monthlyLeak = potentialRevenue - currentRevenue;
  const yearlyLeak = monthlyLeak * 12;

  return (
    <section className="py-24 md:py-32 px-6 bg-gradient-to-b from-card to-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">
            Revenue Leak Calculator
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            How Much Are You <span className="text-red-500">Leaking</span> Every Month?
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Enter your numbers. See your loss in real time.
          </p>
        </div>

        <div
          className="rounded-3xl border border-border overflow-hidden shadow-xl backdrop-blur-sm"
          style={{ background: "rgba(255,255,255,0.65)" }}
        >
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="p-8 md:p-10 space-y-8">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-foreground">Monthly Leads</label>
                  <span className="text-sm font-bold text-primary">{leads}</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={500}
                  step={5}
                  value={leads}
                  onChange={(e) => setLeads(+e.target.value)}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>10</span>
                  <span>500</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-foreground">Avg. Appointment Value</label>
                  <span className="text-sm font-bold text-primary">${ticket.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={5000}
                  step={50}
                  value={ticket}
                  onChange={(e) => setTicket(+e.target.value)}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>$100</span>
                  <span>$5,000</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-foreground">Current Conversion Rate</label>
                  <span className="text-sm font-bold text-primary">{convRate}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  step={1}
                  value={convRate}
                  onChange={(e) => setConvRate(+e.target.value)}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>5%</span>
                  <span>40%</span>
                </div>
              </div>
            </div>

            <div
              className="p-8 md:p-10 flex flex-col justify-center"
              style={{ background: "linear-gradient(135deg, rgba(161,120,35,0.06) 0%, rgba(255,255,255,0.4) 100%)" }}
            >
              <div className="space-y-5 mb-8">
                <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-100">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-red-500 font-medium">You're losing monthly</p>
                      <p className="text-xs text-muted-foreground">
                        {currentBookings} bookings vs {potentialBookings} possible
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-red-500 tabular-nums">
                    ${monthlyLeak.toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-red-200 bg-red-50/50">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-400 font-medium">Annual revenue leak</p>
                  </div>
                  <p className="text-3xl font-bold text-red-600 tabular-nums">
                    ${yearlyLeak.toLocaleString()}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
                  <p className="text-xs text-primary font-semibold mb-1">
                    With ClientSurge Systems automation (avg. 61% conversion)
                  </p>
                  <p className="text-2xl font-bold text-primary tabular-nums">
                    +${potentialRevenue.toLocaleString()}
                    <span className="text-sm font-medium">/mo</span>
                  </p>
                </div>
              </div>

              <a href="/book">
                <Button className="rounded-full w-full font-semibold gap-2 h-12">
                  Stop the Leak - Make the Leap
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Based on average client results. Individual results vary.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

