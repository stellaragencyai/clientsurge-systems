import { X, ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";
import { CANONICAL_SERVICE_PRODUCTS } from "@/lib/salesCatalog";

const SERVICE_METADATA = {
  instant_lead_response: { setupTime: "Under 1 hour", difficulty: "Easy", roi: "High" },
  missed_call_text_back: { setupTime: "Under 1 hour", difficulty: "Easy", roi: "High" },
  nurture_sequence_14d: { setupTime: "1-2 hours", difficulty: "Medium", roi: "Very High" },
  ai_booking_agent: { setupTime: "1-2 hours", difficulty: "Medium", roi: "Very High" },
  lead_reactivation: { setupTime: "2-4 hours", difficulty: "Medium", roi: "High" },
  review_request: { setupTime: "1 hour", difficulty: "Easy", roi: "Medium" },
};

function formatMoney(amount) {
  return `$${Number(amount || 0).toLocaleString()}`;
}

const shellStyle = {
  position: "fixed",
  inset: 0,
  background: "linear-gradient(135deg, rgba(245,251,255,0.72), rgba(5,54,92,0.34))",
  backdropFilter: "blur(12px) saturate(1.05)",
  WebkitBackdropFilter: "blur(12px) saturate(1.05)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "24px",
};

const cardStyle = {
  background: "linear-gradient(180deg, #ffffff 0%, #f7fcff 58%, #f0f9ff 100%)",
  borderRadius: "24px",
  padding: "30px",
  maxWidth: "1200px",
  width: "100%",
  maxHeight: "90vh",
  overflow: "auto",
  border: "1px solid rgba(0,174,239,0.24)",
  boxShadow: "0 34px 90px rgba(0,59,143,0.22), 0 14px 38px rgba(0,174,239,0.12), inset 0 1px 0 rgba(255,255,255,0.95)",
  position: "relative",
};

export default function ServiceComparisonModal({ onClose }) {
  const [sortBy, setSortBy] = useState("setupFee");
  const [sortOrder, setSortOrder] = useState("asc");

  const comparisonData = useMemo(() => CANONICAL_SERVICE_PRODUCTS.map((product) => {
    const metadata = SERVICE_METADATA[product.service_key] || {};
    return {
      name: product.name,
      setupFee: Number(product.setup_fee || 0),
      monthlyFee: Number(product.monthly_fee || 0),
      setupTime: metadata.setupTime || "Managed setup",
      difficulty: metadata.difficulty || "Medium",
      roi: metadata.roi || "High",
      category: product.category,
    };
  }), []);

  const sortedData = [...comparisonData].sort((a, b) => {
    const numericFields = new Set(["setupFee", "monthlyFee"]);
    const left = numericFields.has(sortBy) ? a[sortBy] : String(a[sortBy]);
    const right = numericFields.has(sortBy) ? b[sortBy] : String(b[sortBy]);
    const comparison = left < right ? -1 : left > right ? 1 : 0;
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const toggleSort = (field) => {
    if (sortBy === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortOrder("asc"); }
  };

  return (
    <div style={shellStyle} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Compare all services" style={cardStyle} onClick={(event) => event.stopPropagation()}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", borderRadius: "24px 24px 0 0", background: "linear-gradient(90deg, #005691 0%, #00AEEF 48%, #8bdcff 100%)" }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "18px", marginBottom: "24px" }}>
          <div>
            <p style={{ margin: "0 0 7px", fontSize: "9px", fontWeight: 850, color: "#0079c1", letterSpacing: "0.16em", textTransform: "uppercase" }}>Service Comparison</p>
            <h2 style={{ margin: 0, fontSize: "26px", fontWeight: 850, color: "#0A1628", lineHeight: 1.15 }}>Compare All Services</h2>
          </div>
          <button onClick={onClose} aria-label="Close service comparison" style={{ background: "rgba(255,255,255,0.92)", border: "1px solid rgba(0,136,204,0.18)", cursor: "pointer", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(0,59,143,0.10)", flexShrink: 0 }}>
            <X style={{ width: "16px", height: "16px", color: "#0A1628" }} />
          </button>
        </div>
        <div style={{ overflowX: "auto", borderRadius: "16px", border: "1px solid rgba(0,136,204,0.15)", boxShadow: "0 8px 22px rgba(0,59,143,0.06)", background: "rgba(255,255,255,0.82)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg, rgba(0,136,204,0.10) 0%, rgba(0,174,239,0.05) 100%)" }}>
                {[["name", "Service"], ["setupFee", "Setup Fee"], ["monthlyFee", "Monthly"], ["setupTime", "Setup Time"], ["difficulty", "Difficulty"], ["roi", "ROI"]].map(([field, label], index) => (
                  <th key={field} onClick={() => toggleSort(field)} style={{ padding: "15px 16px", textAlign: index === 0 ? "left" : "center", fontWeight: 800, color: "#0A1628", borderBottom: "2px solid rgba(0,136,204,0.2)", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: index === 0 ? "flex-start" : "center" }}>
                      {label}{sortBy === field ? (sortOrder === "asc" ? <ArrowUp style={{ width: "12px", height: "12px" }} /> : <ArrowDown style={{ width: "12px", height: "12px" }} />) : null}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((service, index) => (
                <tr key={service.name} style={{ background: index % 2 === 0 ? "#ffffff" : "rgba(0,136,204,0.025)", borderBottom: index < sortedData.length - 1 ? "1px solid rgba(0,136,204,0.08)" : "none" }}>
                  <td style={{ padding: "15px 16px", fontWeight: 800, color: "#0A1628" }}>
                    {service.name}
                    <div style={{ display: "inline-flex", marginTop: "7px", padding: "4px 9px", borderRadius: "999px", color: "#0079c1", background: "rgba(0,174,239,0.08)", border: "1px solid rgba(0,174,239,0.14)", fontSize: "10px", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>{service.category}</div>
                  </td>
                  <td style={{ padding: "15px 16px", textAlign: "center", color: "rgba(10,22,40,0.74)", fontWeight: 700 }}>{formatMoney(service.setupFee)}</td>
                  <td style={{ padding: "15px 16px", textAlign: "center", color: "rgba(10,22,40,0.74)", fontWeight: 700 }}>{formatMoney(service.monthlyFee)}/mo</td>
                  <td style={{ padding: "15px 16px", textAlign: "center", color: "rgba(10,22,40,0.68)", fontWeight: 650 }}>{service.setupTime}</td>
                  <td style={{ padding: "15px 16px", textAlign: "center", color: "rgba(10,22,40,0.68)", fontWeight: 650 }}>{service.difficulty}</td>
                  <td style={{ padding: "15px 16px", textAlign: "center", color: "#16a34a", fontWeight: 850 }}>{service.roi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
