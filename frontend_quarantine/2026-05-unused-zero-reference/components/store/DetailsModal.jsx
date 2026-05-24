import { X } from "lucide-react";

export default function DetailsModal({ product, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        padding: "24px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "24px",
          padding: "24px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "80vh",
          overflow: "auto",
          border: "1px solid rgba(0,0,0,0.1)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>
            {product.name}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X style={{ width: "20px", height: "20px", color: "#64748b" }} />
          </button>
        </div>

        <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.7)", lineHeight: 1.7, margin: "0 0 18px" }}>
          {product.full_description || product.description}
        </p>

        {product.details && (
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: "700", color: "#1b140d", margin: "16px 0 10px" }}>
              Key Features
            </h4>
            <ul style={{ margin: "0 0 18px", paddingLeft: "20px" }}>
              {product.details.map((detail, i) => (
                <li key={i} style={{ fontSize: "13px", color: "rgba(0,0,0,0.65)", margin: "6px 0", lineHeight: 1.5 }}>
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ padding: "16px", background: "rgba(154,92,46,0.05)", borderRadius: "12px" }}>
          <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: "700", color: "#9a5c2e", textTransform: "uppercase" }}>
            Investment
          </p>
          <div style={{ display: "flex", gap: "16px" }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: "800", color: "#1b140d" }}>
                ${product.setup_fee}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "rgba(0,0,0,0.5)" }}>Setup</p>
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: "800", color: "#9a5c2e" }}>
                ${product.monthly_fee}/mo
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "rgba(0,0,0,0.5)" }}>Monthly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}