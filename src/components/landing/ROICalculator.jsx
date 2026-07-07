import React, { useState } from 'react';
import { Calculator, TrendingUp, RefreshCw, ShoppingCart } from 'lucide-react';

const INDUSTRY_MULTIPLIERS = {
  'Med Spa': { avg_ticket: 350, lead_value: 0.42 },
  'Dental': { avg_ticket: 450, lead_value: 0.38 },
  'HVAC': { avg_ticket: 850, lead_value: 0.45 },
  'Plumbing': { avg_ticket: 400, lead_value: 0.40 },
  'Roofing': { avg_ticket: 1200, lead_value: 0.35 },
  'Chiropractic': { avg_ticket: 250, lead_value: 0.40 },
  'Contractors': { avg_ticket: 600, lead_value: 0.38 },
  'Other': { avg_ticket: 350, lead_value: 0.35 },
};

export default function ROICalculator({ className = '' }) {
  const [industry, setIndustry] = useState('Med Spa');
  const [monthlyLeads, setMonthlyLeads] = useState(50);
  const [missedCallRate, setMissedCallRate] = useState(30);
  const [avgTicket, setAvgTicket] = useState(
    INDUSTRY_MULTIPLIERS['Med Spa'].avg_ticket
  );

  const config = INDUSTRY_MULTIPLIERS[industry] || INDUSTRY_MULTIPLIERS['Other'];

  // Calculate recovered leads and revenue
  const missedLeadsPerMonth = Math.round(monthlyLeads * (missedCallRate / 100));
  const aiRecoveredLeads = Math.round(missedLeadsPerMonth * 0.78); // 78% recovery rate
  const monthlyRevenueRecovered = aiRecoveredLeads * avgTicket;
  const annualRevenueRecovered = monthlyRevenueRecovered * 12;

  const handleIndustryChange = (val) => {
    setIndustry(val);
    setAvgTicket(INDUSTRY_MULTIPLIERS[val]?.avg_ticket || 350);
  };

  return (
    <div className={`bg-white rounded-2xl border border-border shadow-lg p-6 md:p-8 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#00AEEF]/10 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-[#00AEEF]" />
        </div>
        <div>
          <h3 className="font-titles text-xl font-bold text-foreground">
            Lead Recovery ROI Calculator
          </h3>
          <p className="text-sm text-muted-foreground">
            See how much revenue you're losing — then browse our store to fix it
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Your Industry
          </label>
          <select
            value={industry}
            onChange={(e) => handleIndustryChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm font-medium focus:ring-2 focus:ring-[#00AEEF] focus:border-[#00AEEF]"
          >
            {Object.keys(INDUSTRY_MULTIPLIERS).map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Monthly Leads / Inquiries: <span className="text-[#00AEEF]">{monthlyLeads}</span>
          </label>
          <input
            type="range"
            min="10"
            max="200"
            step="5"
            value={monthlyLeads}
            onChange={(e) => setMonthlyLeads(Number(e.target.value))}
            className="w-full accent-[#00AEEF]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Missed Call / No-Response Rate: <span className="text-[#00AEEF]">{missedCallRate}%</span>
          </label>
          <input
            type="range"
            min="10"
            max="60"
            step="5"
            value={missedCallRate}
            onChange={(e) => setMissedCallRate(Number(e.target.value))}
            className="w-full accent-[#00AEEF]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Average Job/Booking Value: <span className="text-[#00AEEF]">${avgTicket}</span>
          </label>
          <input
            type="range"
            min="100"
            max="3000"
            step="50"
            value={avgTicket}
            onChange={(e) => setAvgTicket(Number(e.target.value))}
            className="w-full accent-[#00AEEF]"
          />
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-red-50 rounded-xl p-5 border border-red-100 relative">
          <span className="absolute top-3 right-3 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold" aria-hidden="true">✕</span>
          <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-1">
            Leads Lost Monthly
          </p>
          <p className="text-3xl font-titles font-bold text-red-700">
            {missedLeadsPerMonth}
          </p>
          <p className="text-xs text-red-500 mt-1">
            Currently going unanswered
          </p>
        </div>

        <div className="bg-green-50 rounded-xl p-5 border border-green-100 relative">
          <span className="absolute top-3 right-3 inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold" aria-hidden="true">✓</span>
          <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-1">
            Leads Recovered
          </p>
          <p className="text-3xl font-titles font-bold text-green-700">
            {aiRecoveredLeads}
          </p>
          <p className="text-xs text-green-500 mt-1">
            With ClientSurge AI
          </p>
        </div>
      </div>

      {/* Revenue highlight */}
      <div className="bg-gradient-to-br from-[#00AEEF] to-[#006BB0] rounded-xl p-6 text-white text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider opacity-90">
            Annual Revenue Recovered
          </span>
        </div>
        <p className="text-4xl md:text-5xl font-titles font-bold">
          ${annualRevenueRecovered.toLocaleString()}
        </p>
        <p className="text-sm opacity-80 mt-2">
          ${monthlyRevenueRecovered.toLocaleString()} every month
        </p>
      </div>

      {/* Dynamic package recommendation — connects ROI to specific tier */}
      {annualRevenueRecovered > 0 && (
        <div className="mt-6 rounded-xl p-5 border-2" style={{ borderColor: "rgba(0,174,239,0.3)", background: "rgba(0,174,239,0.04)" }}>
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="w-4 h-4 text-[#00AEEF]" />
            <p className="text-xs font-bold uppercase tracking-wider text-[#006BB0]">
              Recommended System for Your Numbers
            </p>
          </div>
          {(() => {
            const recommended = annualRevenueRecovered > 60000
              ? { name: "Pro System", id: "pro_system", price: "$1,997/mo", reason: "Your revenue at stake justifies the full recovery layer — website, reactivation, and expanded automation." }
              : annualRevenueRecovered > 20000
              ? { name: "Growth System", id: "growth_system", price: "$997/mo", reason: "Your lead volume needs follow-up + booking + review automation to maximize recovery." }
              : { name: "Starter System", id: "starter_system", price: "$497/mo", reason: "Start with instant response and missed-call recovery — the foundation that stops the bleed." };
            return (
              <div>
                <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
                  <div>
                    <span className="font-titles font-black text-black" style={{ fontSize: "1.3rem" }}>{recommended.name}</span>
                    <span className="text-sm font-bold text-gray-500 ml-2">{recommended.price}</span>
                  </div>
                  <a
                    href={`/product-signup?package=${recommended.id}`}
                    className="cs-btn-primary inline-flex items-center gap-2 text-xs"
                    style={{ height: "38px", padding: "0 20px" }}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                  </a>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{recommended.reason}</p>
                <p className="text-[10px] text-gray-400 mt-2">
                  ROI: {monthlyRevenueRecovered > 0 ? `${Math.round((monthlyRevenueRecovered / (recommended.id === "pro_system" ? 1997 : recommended.id === "growth_system" ? 997 : 497)) * 100)}%` : "—"} monthly return on system cost
                </p>
              </div>
            );
          })()}
        </div>
      )}

      <div className="mt-6 text-center">
        <a
          href="/store"
          className="cs-btn-primary inline-flex items-center gap-2 text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Browse All AI Systems
        </a>
      </div>
    </div>
  );
}