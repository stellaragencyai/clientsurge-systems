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
        aria-label={product?.name ? `${product.name} demo` : "Service demo"}
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #f7fcff 58%, #f0f9ff 100%)",
          borderRadius: "24px",
          padding: 0,
          maxWidth: "640px",
          width: "100%",
          maxHeight: "84vh",
          overflow: "hidden",
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
            background: "linear-gradient(90deg, #005691 0%, #00AEEF 48%, #8bdcff 100%)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "18px",
            padding: "24px 26px 20px",
            borderBottom: "1px solid rgba(0,136,204,0.12)",
          }}
        >
          <div>
            <p style={{ margin: "0 0 7px", fontSize: "9px", fontWeight: "850", color: "#0079c1", letterSpacing: "0.16em", textTransform: "uppercase" }}>
              Service Demo
            </p>
            <h3 style={{ margin: 0, fontSize: "22px", fontWeight: "850", color: "#0A1628", lineHeight: 1.15 }}>
              {product?.name} Demo
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close demo"
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

        <div
          style={{
            padding: "26px",
            minHeight: "320px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, rgba(0,174,239,0.07), rgba(255,255,255,0.92))",
          }}
        >
          {product?.demo_video_url ? (
            <iframe
              width="100%"
              height="320"
              src={product.demo_video_url}
              title={product?.name || "Service demo"}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ borderRadius: "16px", border: "1px solid rgba(0,136,204,0.14)", boxShadow: "0 14px 34px rgba(0,59,143,0.12)" }}
            />
          ) : (
            <div style={{ textAlign: "center", color: "rgba(10,22,40,0.68)" }}>
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  background: "linear-gradient(135deg, #00AEEF 0%, #005691 100%)",
                  boxShadow: "0 12px 28px rgba(0,121,193,0.28)",
                }}
              >
                <Play style={{ width: "30px", height: "30px", color: "#ffffff", marginLeft: "3px" }} />
              </div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0A1628" }}>Demo coming soon</p>
            </div>
          )}
        </div>

        <div style={{ padding: "18px 26px 22px", borderTop: "1px solid rgba(0,136,204,0.12)", background: "rgba(255,255,255,0.72)" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(10,22,40,0.68)", lineHeight: 1.65, fontWeight: 600 }}>
            {product?.demo_description || "Watch how this automation works in action."}
          </p>
        </div>
      </div>
    </div>
  );
}
