import { useState } from "react";
import MedSpaDemoModal from "./MedSpaDemoModal";

export default function MedSpaRevenueCalculator() {
  const [leadsPerMonth, setLeadsPerMonth] = useState(40);
  const [avgTreatmentValue, setAvgTreatmentValue] = useState(350);
  const [showModal, setShowModal] = useState(false);

  // Assumptions: current close rate ~15%, with system ~35%
  const currentRate = 0.15;
  const improvedRate = 0.35;
  const currentBookings = Math.round(leadsPerMonth * currentRate);
  const improvedBookings = Math.round(leadsPerMonth * improvedRate);
  const extraBookings = improvedBookings - currentBookings;
  const extraRevenue = extraBookings * avgTreatmentValue;
  const monthlyInvestment = 397;
  const roi = Math.round(((extraRevenue - monthlyInvestment) / monthlyInvestment) * 100);

  return (
    <section className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Math</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
            See What You're Currently Leaving on the Table
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Adjust the sliders to your numbers — we'll show you how much revenue the system could recover.
          </p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-primary/20 p-8 md:p-10 shadow-md">
          {/* Sliders */}
          <div className="space-y-8 mb-10">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-foreground">Monthly leads / inquiries</label>
                <span className="text-lg font-bold text-primary">{leadsPerMonth}</span>
              </div>
              <input
                type="range" min={10} max={200} step={5}
                value={leadsPerMonth}
                onChange={e => setLeadsPerMonth(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>10</span><span>200</span></div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-foreground">Average treatment value</label>
                <span className="text-lg font-bold text-primary">${avgTreatmentValue}</span>
              </div>
              <input
                type="range" min={150} max={1500} step={50}
                value={avgTreatmentValue}
                onChange={e => setAvgTreatmentValue(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>$150</span><span>$1,500</span></div>
            </div>
          </div>

          {/* Results grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center p-4 rounded-xl bg-muted/40 border border-border">
              <p className="text-2xl font-bold text-foreground/50">{currentBookings}</p>
              <p className="text-xs text-muted-foreground mt-1">Current bookings/mo</p>
              <p className="text-[10px] text-muted-foreground">~15% close rate</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-primary/6 border border-primary/15">
              <p className="text-2xl font-bold text-primary">{improvedBookings}</p>
              <p className="text-xs text-muted-foreground mt-1">With ApexFlow</p>
              <p className="text-[10px] text-muted-foreground">~35% close rate</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-green-50 border border-green-200">
              <p className="text-2xl font-bold text-green-700">+{extraBookings}</p>
              <p className="text-xs text-muted-foreground mt-1">Extra bookings/mo</p>
              <p className="text-[10px] text-muted-foreground">avg. improvement</p>
            </div>
            <div className="text-center p-4 rounded-xl border-2 border-primary/30 bg-primary/4">
              <p className="text-2xl font-bold text-primary">+${extraRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Extra revenue/mo</p>
              <p className="text-[10px] text-muted-foreground">recovered</p>
            </div>
          </div>

          {/* ROI Banner */}
          <div
            className="rounded-xl px-6 py-5 text-center mb-6"
            style={{ background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 60%,#c8965c 100%)" }}
          >
            <p className="text-xs font-bold text-amber-300/70 uppercase tracking-widest mb-1">Estimated Monthly ROI</p>
            <p className="text-3xl font-bold text-white">{roi > 0 ? `${roi}%` : "Calculating..."}</p>
            <p className="text-xs text-amber-100/60 mt-1">Based on ${monthlyInvestment}/mo Starter System investment</p>
          </div>

          <p className="text-xs text-muted-foreground text-center mb-6 italic">
            * Based on avg. results across active med spa clients. Your results may vary.
          </p>

          <div className="text-center">
            <button
              onClick={() => setShowModal(true)}
              style={{ display: "inline-block", borderRadius: "9999px", padding: "2px", background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)", boxShadow: "0 4px 18px rgba(120,70,20,0.35)", border: "none", cursor: "pointer" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px", height: "50px", padding: "0 32px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "700", fontSize: "1rem", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                Claim These Bookings — Book a Demo
              </span>
            </button>
          </div>
        </div>
      </div>
      {showModal && <MedSpaDemoModal onClose={() => setShowModal(false)} />}
    </section>
  );
}