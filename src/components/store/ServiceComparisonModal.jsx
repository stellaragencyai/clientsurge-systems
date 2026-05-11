import { X, ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";
import { CANONICAL_SERVICE_PRODUCTS } from "@/lib/salesCatalog";

const SERVICE_METADATA = {
  instant_lead_response: {
    setupTime: "Under 1 hour",
    difficulty: "Easy",
    roi: "High",
  },
  missed_call_text_back: {
    setupTime: "Under 1 hour",
    difficulty: "Easy",
    roi: "High",
  },
  nurture_sequence_14d: {
    setupTime: "1-2 hours",
    difficulty: "Medium",
    roi: "Very High",
  },
  ai_booking_agent: {
    setupTime: "1-2 hours",
    difficulty: "Medium",
    roi: "Very High",
  },
  lead_reactivation: {
    setupTime: "2-4 hours",
    difficulty: "Medium",
    roi: "High",
  },
  review_request: {
    setupTime: "1 hour",
    difficulty: "Easy",
    roi: "Medium",
  },
};

function formatMoney(amount) {
  return `$${Number(amount || 0).toLocaleString()}`;
}

export default function ServiceComparisonModal({ onClose }) {
  const [sortBy, setSortBy] = useState("setupFee");
  const [sortOrder, setSortOrder] = useState("asc");

  const comparisonData = useMemo(
    () =>
      CANONICAL_SERVICE_PRODUCTS.map((product) => {
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
      }),
    []
  );

  const sortedData = [...comparisonData].sort((a, b) => {
    const numericFields = new Set(["setupFee", "monthlyFee"]);
    const left = numericFields.has(sortBy) ? a[sortBy] : String(a[sortBy]);
    const right = numericFields.has(sortBy) ? b[sortBy] : String(b[sortBy]);
    const comparison = left < right ? -1 : left > right ? 1 : 0;
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
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
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
              <tr
                style={{
                  background:
                    "linear-gradient(135deg, rgba(154,92,46,0.08) 0%, rgba(200,150,92,0.04) 100%)",
                }}
              >
                {[
                  ["name", "Service"],
                  ["setupFee", "Setup Fee"],
                  ["monthlyFee", "Monthly"],
                  ["setupTime", "Setup Time"],
                  ["difficulty", "Difficulty"],
                  ["roi", "ROI"],
                ].map(([field, label], index) => (
                  <th
                    key={field}
                    onClick={() => toggleSort(field)}
                    style={{
                      padding: "14px 16px",
                      textAlign: index === 0 ? "left" : "center",
                      fontWeight: "700",
                      color: "#1b140d",
                      borderBottom: "2px solid rgba(154,92,46,0.2)",
                      cursor: "pointer",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        justifyContent: index === 0 ? "flex-start" : "center",
                      }}
                    >
                      {label}
                      {sortBy === field ? (
                        sortOrder === "asc" ? (
                          <ArrowUp style={{ width: "12px", height: "12px" }} />
                        ) : (
                          <ArrowDown
                            style={{ width: "12px", height: "12px" }}
                          />
                        )
                      ) : null}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sortedData.map((service, index) => (
                <tr
                  key={service.name}
                  style={{
                    background:
                      index % 2 === 0 ? "#ffffff" : "rgba(154,92,46,0.02)",
                    borderBottom:
                      index < sortedData.length - 1
                        ? "1px solid rgba(154,92,46,0.08)"
                        : "none",
                  }}
                >
                  <td
                    style={{
                      padding: "14px 16px",
                      fontWeight: "700",
                      color: "#1b140d",
                    }}
                  >
                    {service.name}
                    <div
                      style={{
                        color: "#8a6b52",
                        fontSize: "11px",
                        fontWeight: "600",
                        marginTop: "4px",
                      }}
                    >
                      {service.category}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    {formatMoney(service.setupFee)}
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    {formatMoney(service.monthlyFee)}/mo
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    {service.setupTime}
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    {service.difficulty}
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    {service.roi}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
