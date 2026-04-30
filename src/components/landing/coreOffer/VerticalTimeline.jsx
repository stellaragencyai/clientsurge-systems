import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { systemsById, coreOfferSectionConfig, iconMap } from "./coreOfferData";
import HighlightedText from "./HighlightedText";

const orderedSystemIds = Object.keys(systemsById);

function DetailPill({ label, value, dark }) {
  return (
    <div
      style={{
        borderRadius: "14px",
        background: dark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.04)",
        border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(15,23,42,0.08)",
        padding: "12px 14px",
      }}
    >
      <p style={{ fontSize: "9px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.18em", color: dark ? "#93c5fd" : "#3b82f6", margin: "0 0 6px" }}>
        {label}
      </p>
      <p style={{ fontSize: "13px", color: dark ? "rgba(226,232,240,0.8)" : "rgba(15,23,42,0.65)", margin: 0, lineHeight: "1.55" }}>
        {value}
      </p>
    </div>
  );
}

function StepDots({ currentId, onSelect }) {
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      {orderedSystemIds.map((id, i) => {
        const active = id === currentId;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            style={{
              width: active ? "20px" : "6px",
              height: "6px",
              borderRadius: "3px",
              background: active ? "#3b82f6" : "rgba(15,23,42,0.15)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
              padding: 0,
            }}
            aria-label={`Step ${i + 1}`}
          />
        );
      })}
    </div>
  );
}

export default function VerticalTimeline({ selectedSystemId, onSystemSelect, onBookDemo }) {
  const system = systemsById[selectedSystemId];
  const currentIndex = orderedSystemIds.indexOf(selectedSystemId);
  const stepNumber = currentIndex + 1;
  const isFirst = currentIndex === 0;
  const isFeatured = isFirst;

  if (!system) return null;

  const Icon = iconMap[system.icon];

  const handleNext = () => {
    onSystemSelect(orderedSystemIds[(currentIndex + 1) % orderedSystemIds.length]);
  };

  const handlePrev = () => {
    onSystemSelect(orderedSystemIds[(currentIndex - 1 + orderedSystemIds.length) % orderedSystemIds.length]);
  };

  return (
    <div style={{ marginTop: "48px", marginBottom: "48px" }}>
      {/* Step progress indicator */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <StepDots currentId={selectedSystemId} onSelect={onSystemSelect} />
        <p style={{ fontSize: "11px", fontWeight: "700", color: "rgba(15,23,42,0.35)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
          System {stepNumber} of {orderedSystemIds.length}
        </p>
      </div>

      {/* Main card */}
      <div
        style={{
          borderRadius: "24px",
          overflow: "hidden",
          background: isFeatured
            ? "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f1f35 100%)"
            : "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(248,250,255,0.98) 100%)",
          border: isFeatured
            ? "1px solid rgba(100,160,255,0.25)"
            : "1px solid rgba(200,210,230,0.6)",
          boxShadow: isFeatured
            ? "0 24px 64px rgba(15,23,42,0.3), 0 0 0 1px rgba(100,160,255,0.08)"
            : "0 8px 32px rgba(15,23,42,0.07)",
          transition: "all 0.4s ease",
          position: "relative",
        }}
      >
        {/* Top accent line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "3px",
          background: isFeatured
            ? "linear-gradient(90deg, transparent, #3b82f6, #818cf8, transparent)"
            : "linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)",
        }} />

        {/* Featured badge */}
        {isFeatured && (
          <div style={{
            position: "absolute", top: "16px", right: "16px",
            display: "inline-flex", alignItems: "center", gap: "6px",
            borderRadius: "9999px", padding: "4px 12px",
            background: "rgba(59,130,246,0.15)", border: "1px solid rgba(100,160,255,0.3)",
            fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.18em", color: "#93c5fd",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#60a5fa", display: "inline-block", animation: "pulse 2s infinite" }} />
            Start Here
          </div>
        )}

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0",
        }} className="vtl-grid">
          {/* Left panel — content */}
          <div style={{ padding: "32px 28px 28px", borderRight: isFeatured ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(15,23,42,0.07)" }}>
            {/* Step badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              borderRadius: "9999px", padding: "5px 14px", marginBottom: "20px",
              background: isFeatured ? "rgba(100,160,255,0.1)" : "rgba(15,23,42,0.05)",
              border: isFeatured ? "1px solid rgba(100,160,255,0.2)" : "1px solid rgba(15,23,42,0.08)",
            }}>
              <div style={{
                width: "20px", height: "20px", borderRadius: "6px", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isFeatured ? "linear-gradient(135deg, #3b82f6, #6366f1)" : "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.1))",
              }}>
                <Icon style={{ width: "11px", height: "11px", color: isFeatured ? "#fff" : "#3b82f6" }} />
              </div>
              <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.2em", color: isFeatured ? "#93c5fd" : "rgba(15,23,42,0.4)" }}>
                Step {stepNumber < 10 ? `0${stepNumber}` : stepNumber}
              </span>
            </div>

            <h3 style={{
              fontSize: "clamp(22px, 3vw, 30px)", fontWeight: "700", lineHeight: 1.2, margin: "0 0 12px",
              color: isFeatured ? "#f1f5f9" : "#0f172a",
            }}>
              {system.title}
            </h3>

            <p style={{
              fontSize: "15px", lineHeight: "1.65", margin: "0 0 20px",
              color: isFeatured ? "rgba(148,163,184,0.9)" : "rgba(15,23,42,0.6)",
            }}>
              <HighlightedText>{system.detail.summary}</HighlightedText>
            </p>

            {/* Result badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              borderRadius: "9999px", padding: "6px 14px",
              background: isFeatured ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.06)",
              border: isFeatured ? "1px solid rgba(100,160,255,0.2)" : "1px solid rgba(59,130,246,0.15)",
              fontSize: "11px", fontWeight: "700", color: isFeatured ? "#93c5fd" : "#3b82f6",
            }}>
              {system.badge}
            </div>
          </div>

          {/* Right panel — detail blocks */}
          <div style={{ padding: "32px 28px 28px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <p style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.18em", color: isFeatured ? "rgba(148,163,184,0.5)" : "rgba(15,23,42,0.3)", margin: "0 0 4px" }}>
              How It Works
            </p>
            <DetailPill label="Trigger" value={system.detail.trigger} dark={isFeatured} />
            <DetailPill label="Action" value={system.detail.action} dark={isFeatured} />
            <DetailPill label="Result" value={system.detail.businessValue} dark={isFeatured} />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
        <button
          onClick={handlePrev}
          style={{
            display: "flex", alignItems: "center", gap: "4px",
            borderRadius: "9999px", padding: "9px 16px",
            fontSize: "13px", fontWeight: "600",
            border: "1px solid rgba(15,23,42,0.12)",
            background: "rgba(255,255,255,0.9)",
            color: "rgba(15,23,42,0.6)",
            cursor: "pointer", transition: "all 0.2s",
          }}
        >
          <ChevronLeft style={{ width: "14px", height: "14px" }} /> Previous
        </button>
        <button
          onClick={handleNext}
          style={{
            display: "flex", alignItems: "center", gap: "4px",
            borderRadius: "9999px", padding: "9px 16px",
            fontSize: "13px", fontWeight: "600",
            border: "1px solid rgba(15,23,42,0.12)",
            background: "rgba(255,255,255,0.9)",
            color: "rgba(15,23,42,0.6)",
            cursor: "pointer", transition: "all 0.2s",
          }}
        >
          Next <ChevronRight style={{ width: "14px", height: "14px" }} />
        </button>
        <button
          onClick={onBookDemo}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            borderRadius: "9999px", padding: "10px 22px",
            fontSize: "13px", fontWeight: "700",
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            color: "#fff", border: "none", cursor: "pointer",
            boxShadow: "0 6px 20px rgba(59,130,246,0.3)",
            transition: "all 0.2s",
          }}
        >
          {coreOfferSectionConfig.secondaryCta.label}
          <ArrowRight style={{ width: "13px", height: "13px" }} />
        </button>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .vtl-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}