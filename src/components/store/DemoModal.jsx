import { Play, X } from "lucide-react";

export default function DemoModal({ product, onClose }) {
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
          padding: "0",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "80vh",
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.1)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>
            {product.name} Demo
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

        <div
          style={{
            padding: "24px",
            minHeight: "300px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.02)",
          }}
        >
          {product.demo_video_url ? (
            <iframe
              width="100%"
              height="300"
              src={product.demo_video_url}
              title={product.name}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ borderRadius: "12px" }}
            />
          ) : (
            <div style={{ textAlign: "center", color: "#64748b" }}>
              <Play style={{ width: "48px", height: "48px", margin: "0 auto 16px", opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: "14px" }}>Demo coming soon</p>
            </div>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(0,0,0,0.65)", lineHeight: 1.6 }}>
            {product.demo_description || "Watch how this automation works in action."}
          </p>
        </div>
      </div>
    </div>
  );
}