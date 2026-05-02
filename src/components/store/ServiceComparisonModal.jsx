import { X, ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";

const comparisonData = [
  {
    name: "Instant Lead Response",
    setupFee: "$297",
    monthlyFee: "$97",
    setupTime: "Under 1 hour",
    difficulty: "Easy",
    roi: "High",
    category: "Response",
  },
  {
    name: "Missed Call Text-Back",
    setupFee: "$197",
    monthlyFee: "$67",
    setupTime: "Under 1 hour",
    difficulty: "Easy",
    roi: "High",
    category: "Response",
  },
  {
    name: "14-Day Nurture Sequence",
    setupFee: "$397",
    monthlyFee: "$127",
    setupTime: "1-2 hours",
    difficulty: "Medium",
    roi: "Very High",
    category: "Follow-Up",
  },
  {
    name: "AI Booking Agent",
    setupFee: "$497",
    monthlyFee: "$147",
    setupTime: "1-2 hours",
    difficulty: "Medium",
    roi: "Very High",
    category: "Booking",
  },
  {
    name: "Old Lead Reactivation",
    setupFee: "$297",
    monthlyFee: "$97",
    setupTime: "2-4 hours",
    difficulty: "Medium",
    roi: "High",
    category: "Revenue",
  },
  {
    name: "Review Request Automation",
    setupFee: "$197",
    monthlyFee: "$67",
    setupTime: "1 hour",
    difficulty: "Easy",
    roi: "Medium",
    category: "Reputation",
  },
];

export default function ServiceComparisonModal({ onClose }) {
  const [sortBy, setSortBy] = useState("setupFee");
  const [sortOrder, setSortOrder] = useState("asc");

  const sortedData = [...comparisonData].sort((a, b) => {
    let aVal, bVal;
    if (sortBy === "setupFee" || sortBy === "monthlyFee") {
      aVal = parseInt(a[sortBy]);
      bVal = parseInt(b[sortBy]);
    } else {
      aVal = a[sortBy];
      bVal = b[sortBy];
    }

    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "24px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "28px",
          maxWidth: "1200px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          border: "1px solid rgba(154,92,46,0.15)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: "800",
              color: "#1b140d",
              fontFamily: "'Playfair Display', serif",
            }}
          >
            Compare All Services
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X style={{ width: "24px", height: "24px", color: "#9a5c2e" }} />
          </button>
        </div>

        <div
          style={{
            overflowX: "auto",
            borderRadius: "12px",
            border: "1px solid rgba(154,92,46,0.15)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr style={{ background: "linear-gradient(135deg, rgba(154,92,46,0.08) 0%, rgba(200,150,92,0.04) 100%)" }}>
                <th
                  onClick={() => toggleSort("name")}
                  style={{
                    padding: "14px 16px",
                    textAlign: "left",
                    fontWeight: "700",
                    color: "#1b140d",
                    borderBottom: "2px solid rgba(154,92,46,0.2)",
                    cursor: "pointer",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    Service
                    {sortBy === "name" && (
                      sortOrder === "asc" ? <ArrowUp style={{ width: "12px", height: "12px" }} /> : <ArrowDown style={{ width: "12px", height: "12px" }} />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("setupFee")}
                  style={{
                    padding: "14px 16px",
                    textAlign: "center",
                    fontWeight: "700",
                    color: "#1b140d",
                    borderBottom: "2px solid rgba(154,92,46,0.2)",
                    cursor: "pointer",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
                    Setup Fee
                    {sortBy === "setupFee" && (
                      sortOrder === "asc" ? <ArrowUp style={{ width: "12px", height: "12px" }} /> : <ArrowDown style={{ width: "12px", height: "12px" }} />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("monthlyFee")}
                  style={{
                    padding: "14px 16px",
                    textAlign: "center",
                    fontWeight: "700",
                    color: "#1b140d",
                    borderBottom: "2px solid rgba(154,92,46,0.2)",
                    cursor: "pointer",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
                    Monthly
                    {sortBy === "monthlyFee" && (
                      sortOrder === "asc" ? <ArrowUp style={{ width: "12px", height: "12px" }} /> : <ArrowDown style={{ width: "12px", height: "12px" }} />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("setupTime")}
                  style={{
                    padding: "14px 16px",
                    textAlign: "center",
                    fontWeight: "700",
                    color: "#1b140d",
                    borderBottom: "2px solid rgba(154,92,46,0.2)",
                    cursor: "pointer",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
                    Setup Time
                    {sortBy === "setupTime" && (
                      sortOrder === "asc" ? <ArrowUp style={{ width: "12px", height: "12px" }} /> : <ArrowDown style={{ width: "12px", height: "12px" }} />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("difficulty")}
                  style={{
                    padding: "14px 16px",
                    textAlign: "center",
                    fontWeight: "700",
                    color: "#1b140d",
                    borderBottom: "2px solid rgba(154,92,46,0.2)",
                    cursor: "pointer",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
                    Difficulty
                    {sortBy === "difficulty" && (
                      sortOrder === "asc" ? <ArrowUp style={{ width: "12px", height: "12px" }} /> : <ArrowDown style={{ width: "12px", height: "12px" }} />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("roi")}
                  style={{
                    padding: "14px 16px",
                    textAlign: "center",
                    fontWeight: "700",
                    color: "#1b140d",
                    borderBottom: "2px solid rgba(154,92,46,0.2)",
                    cursor: "pointer",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
                    Est. ROI
                    {sortBy === "roi" && (
                      sortOrder === "asc" ? <ArrowUp style={{ width: "12px", height: "12px" }} /> : <ArrowDown style={{ width: "12px", height: "12px" }} />
                    )}
                  </div>
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    textAlign: "center",
                    fontWeight: "700",
                    color: "#1b140d",
                    borderBottom: "2px solid rgba(154,92,46,0.2)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Category
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((service, index) => (
                <tr
                  key={service.name}
                  style={{
                    background: index % 2 === 0 ? "rgba(255,255,255,0.5)" : "rgba(154,92,46,0.03)",
                    borderBottom: "1px solid rgba(154,92,46,0.1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = index % 2 === 0 ? "rgba(200,150,92,0.08)" : "rgba(200,150,92,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = index % 2 === 0 ? "rgba(255,255,255,0.5)" : "rgba(154,92,46,0.03)";
                  }}
                >
                  <td style={{ padding: "12px 16px", fontWeight: "600", color: "#1b140d" }}>
                    {service.name}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center", color: "#9a5c2e", fontWeight: "700" }}>
                    {service.setupFee}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center", color: "#1b140d", fontWeight: "700" }}>
                    {service.monthlyFee}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center", color: "rgba(27,20,13,0.7)" }}>
                    {service.setupTime}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center", color: "rgba(27,20,13,0.7)" }}>
                    {service.difficulty === "Easy" ? (
                      <span style={{ color: "#22c55e", fontWeight: "600" }}>Easy</span>
                    ) : (
                      <span style={{ color: "#f59e0b", fontWeight: "600" }}>Medium</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center", color: "rgba(27,20,13,0.7)" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        background: service.roi === "Very High" ? "rgba(34,197,94,0.15)" : "rgba(154,92,46,0.15)",
                        color: service.roi === "Very High" ? "#22c55e" : "#9a5c2e",
                        fontWeight: "600",
                        fontSize: "11px",
                      }}
                    >
                      {service.roi}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center", color: "rgba(27,20,13,0.7)", fontSize: "12px" }}>
                    {service.category}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            background: "rgba(154,92,46,0.05)",
            borderRadius: "12px",
            border: "1px solid rgba(154,92,46,0.1)",
            fontSize: "12px",
            color: "rgba(27,20,13,0.65)",
            lineHeight: 1.6,
          }}
        >
          💡 <strong>Tip:</strong> Click any column header to sort. Most businesses start with Instant Lead Response + Booking Agent, then add nurture and reactivation as they scale.
        </div>
      </div>
    </div>
  );
}