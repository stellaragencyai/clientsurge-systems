import { CheckCircle2, X } from "lucide-react";

export default function DetailsModal({ product, onClose }) {
  const details = Array.isArray(product?.details) ? product.details : [];
  const setupFee = product?.setup_fee ?? "—";
  const monthlyFee = product?.monthly_fee ?? "—";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, rgba(245,251,255,0.72), rgba(5,54,92,0.34))",
        backdropFilter: "blur(12px) saturate(1.05)",
        WebkitBackdropFilter: "blur(12px) saturate(1.05)",
        padding: "24px",
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={product?.name ? `${product.name} details` : "Service details"}
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #f7fcff 58%, #f0f9ff 100%)",
          borderRadius: "24px",
          padding: "28px",
          maxWidth: "620px",
          width: "100%",
          maxHeight: "82vh",
          overflow: "auto",
          border: "1px solid rgba(0,174,239,0.24)",
          boxShadow: "0 34px 90px rgba(0,59,143,0.22), 0 14px 38px rgba(0,174,239,0.12), inset 0 1px 0 rgba(255,255,255,0.95)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            borderRadius: "24px 24px 0 0",
            background: "linear-gradient(90deg, #005691 0%, #00AEEF 48%, #8bdcff 100%)",
          }}
        />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "18px", marginBottom: "20px" }}>
          <div>
            <p style={{ margin: "0 0 7px", fontSize: "9px", fontWeight: "850", color: "#0079c1", letterSpacing: "0.16em", textTransform: "uppercase" }}>
              Service Details
            </p>
            <h3 style={{ margin: 0, fontSize: "22px", fontWeight: "850", color: "#0A1628", lineHeight: 1.15 }}>
              {product?.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close service details"
            style={{
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(0,136,204,0.18)",
              cursor: "pointer",
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 20px rgba(0,59,143,0.10)",
              flexShrink: 0,
            }}
          >
            <X style={{ width: "15px", height: "15px", color: "#0A1628" }} />
          </button>
        </div>

        <p style={{ fontSize: "13px", color: "rgba(10,22,40,0.68)", lineHeight: 1.75, margin: "0 0 20px" }}>
          {product?.full_description || product?.description}
        </p>

        {details.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "9px", fontWeight: "850", color: "#005f99", margin: "0 0 10px", letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Key Features
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {details.map((detail, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(240,249,255,0.90))",
                    border: "1px solid rgba(0,174,239,0.16)",
                    boxShadow: "0 5px 14px rgba(0,59,143,0.045)",
                  }}
                >
                  <CheckCircle2 style={{ width: "15px", height: "15px", color: "#16a34a", flexShrink: 0, marginTop: "1px" }} />
                  <span style={{ fontSize: "12px", color: "rgba(10,22,40,0.76)", fontWeight: "600", lineHeight: 1.5 }}>
                    {detail}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            padding: "17px 18px",
            background: "linear-gradient(135deg, rgba(0,174,239,0.08), rgba(255,255,255,0.96))",
            borderRadius: "16px",
            border: "1px solid rgba(0,136,204,0.16)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85), 0 8px 22px rgba(0,59,143,0.06)",
          }}
        >
          <p style={{ margin: "0 0 10px", fontSize: "9px", fontWeight: "850", color: "#0079c1", textTransform: "uppercase", letterSpacing: "0.16em" }}>
            Investment
          </p>
          <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
            <div style={{ minWidth: "120px" }}>
              <p style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: "900", color: "#0A1628", lineHeight: 1 }}>
                ${setupFee}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "#005f99", fontWeight: "700" }}>Setup</p>
            </div>
            <div style={{ minWidth: "120px" }}>
              <p style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: "900", color: "#0A1628", lineHeight: 1 }}>
                ${monthlyFee}<span style={{ fontSize: "11px", fontWeight: "700", color: "#005f99" }}>/mo</span>
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "#005f99", fontWeight: "700" }}>Monthly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
