import { lazy, Suspense } from "react";
import { SERVICE_NODES } from "@/lib/systemDiagramData";
import { useNavigate } from "react-router-dom";

const DiagramCanvas = lazy(() => import("./DiagramCanvas"));
const MobileFlowList = lazy(() => import("./MobileFlowList"));

export default function SystemDiagramSection() {
  const navigate = useNavigate();

  return (
    <section
      id="system-diagram"
      style={{
        padding: "clamp(48px, 6vw, 80px) 24px",
        background: "linear-gradient(180deg, #ffffff 0%, #f0f7ff 50%, #ffffff 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow orbs */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "-10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,174,239,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "-10%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span
            style={{
              display: "inline-block",
              fontSize: "10px",
              fontWeight: "800",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#00AEEF",
              background: "rgba(0,174,239,0.08)",
              border: "1px solid rgba(0,174,239,0.18)",
              padding: "5px 14px",
              borderRadius: "999px",
              marginBottom: "16px",
            }}
          >
            The Full System
          </span>
          <h2
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.8rem)",
              fontWeight: "900",
              letterSpacing: "-0.03em",
              color: "#0a0f1e",
              margin: "0 0 14px",
              lineHeight: 1.1,
            }}
          >
            One System.{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #00AEEF 0%, #009DFF 52%, #003B8F 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Six Automations.
            </span>{" "}
            Zero Leads Lost.
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "rgba(10,15,30,0.58)",
              maxWidth: "560px",
              margin: "0 auto",
              lineHeight: 1.65,
            }}
          >
            Every lead that enters your world is captured, qualified, nurtured, and converted —
            automatically. Click any node to explore how each piece works.
          </p>
        </div>

        {/* Desktop diagram */}
        <div className="hidden md:block">
          <Suspense
            fallback={
              <div
                style={{
                  height: "500px",
                  borderRadius: "24px",
                  background: "rgba(0,174,239,0.04)",
                  border: "1px solid rgba(0,174,239,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(0,174,239,0.5)",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                Loading diagram...
              </div>
            }
          >
            <DiagramCanvas />
          </Suspense>
        </div>

        {/* Mobile list */}
        <div className="block md:hidden">
          <Suspense fallback={null}>
            <MobileFlowList />
          </Suspense>
        </div>

        {/* Service legend strip */}
        <div
          style={{
            marginTop: "36px",
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            justifyContent: "center",
          }}
        >
          {SERVICE_NODES.map((node) => (
            <button
              key={node.id}
              onClick={() => navigate(`/store`)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "7px 14px",
                borderRadius: "999px",
                background: `${node.color}10`,
                border: `1.5px solid ${node.color}30`,
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: "700",
                color: "#0a0f1e",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${node.color}22`;
                e.currentTarget.style.borderColor = `${node.color}66`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${node.color}10`;
                e.currentTarget.style.borderColor = `${node.color}30`;
              }}
            >
              <span style={{ fontSize: "14px" }}>{node.icon}</span>
              {node.label}
            </button>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <button
            onClick={() => navigate("/store")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "2px",
              borderRadius: "999px",
              background: "linear-gradient(135deg, #00AEEF, #003B8F)",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(0,174,239,0.35)",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                height: "44px",
                padding: "0 24px",
                borderRadius: "999px",
                background: "linear-gradient(135deg, #0088CC, #003B8F)",
                color: "#fff",
                fontWeight: "700",
                fontSize: "14px",
              }}
            >
              Build Your Automation Stack →
            </span>
          </button>
          <p
            style={{
              fontSize: "11px",
              color: "rgba(10,15,30,0.35)",
              marginTop: "10px",
            }}
          >
            No contracts · Setup in 5–7 days · Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}