/**
 * RevenueLeakageCalculator Component
 * Shows estimated hourly revenue loss without automation
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function RevenueLeakageCalculator() {
  const [avgRevenuePerLead, setAvgRevenuePerLead] = useState(300);
  const [monthlyLeads, setMonthlyLeads] = useState(30);
  const [leakageHourly, setLeakageHourly] = useState(0);

  useEffect(() => {
    // Industry benchmark: ~50% of leads are lost due to slow response
    const lostLeadsPerMonth = monthlyLeads * 0.5;
    const lostRevenuePerMonth = lostLeadsPerMonth * avgRevenuePerLead;
    const lostRevenuePerHour = lostRevenuePerMonth / (30 * 24); // Approximate hourly rate

    setLeakageHourly(Math.round(lostRevenuePerHour));
  }, [avgRevenuePerLead, monthlyLeads]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        borderRadius: "20px",
        padding: "24px",
        background: "linear-gradient(135deg, rgba(0,174,239,0.08), rgba(255,255,255,0.95))",
        border: "1px solid rgba(0,174,239,0.16)",
        boxShadow: "0 12px 32px rgba(0,59,143,0.08)",
        maxWidth: "520px",
        margin: "0 auto",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          fontWeight: "800",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#00AEEF",
          margin: "0 0 12px",
        }}
      >
        💰 Revenue Leakage Calculator
      </p>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#0A1628", marginBottom: "6px" }}>
          Avg Revenue per Lead
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <input
            type="range"
            min="100"
            max="2000"
            step="50"
            value={avgRevenuePerLead}
            onChange={(e) => setAvgRevenuePerLead(Number(e.target.value))}
            style={{ flex: 1, height: "6px", borderRadius: "3px", cursor: "pointer" }}
          />
          <span style={{ fontSize: "14px", fontWeight: "800", color: "#003B8F", minWidth: "60px" }}>
            ${avgRevenuePerLead}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#0A1628", marginBottom: "6px" }}>
          Monthly Leads
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <input
            type="range"
            min="5"
            max="200"
            step="5"
            value={monthlyLeads}
            onChange={(e) => setMonthlyLeads(Number(e.target.value))}
            style={{ flex: 1, height: "6px", borderRadius: "3px", cursor: "pointer" }}
          />
          <span style={{ fontSize: "14px", fontWeight: "800", color: "#003B8F", minWidth: "40px" }}>
            {monthlyLeads}
          </span>
        </div>
      </div>

      <div
        style={{
          borderRadius: "12px",
          padding: "14px",
          background: "rgba(185,28,28,0.08)",
          border: "1px solid rgba(185,28,28,0.16)",
        }}
      >
        <p style={{ fontSize: "10px", color: "rgba(10,22,40,0.6)", margin: "0 0 4px", fontWeight: "600" }}>
          You're losing approximately:
        </p>
        <p style={{ fontSize: "28px", fontWeight: "900", color: "#b91c1c", margin: 0 }}>
          ${leakageHourly}/hr
        </p>
        <p style={{ fontSize: "11px", color: "rgba(185,28,28,0.7)", margin: "4px 0 0", fontWeight: "600" }}>
          without instant response automation
        </p>
      </div>
    </motion.div>
  );
}