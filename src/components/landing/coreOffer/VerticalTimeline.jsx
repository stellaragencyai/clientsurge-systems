import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { systemsById, coreOfferSectionConfig, iconMap } from "./coreOfferData";
import HighlightedText from "./HighlightedText";

const orderedSystemIds = Object.keys(systemsById);
const CONNECTOR_COLOR = "#c4a374"; // Golden brown

function StepBadge({ stepNumber }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "48px",
        height: "48px",
        borderRadius: "8px",
        background: "linear-gradient(135deg,#7a4825,#9a5c2e)",
        color: "#f5e6d0",
        fontWeight: "800",
        fontSize: "14px",
        boxShadow: "0 4px 12px rgba(154,92,46,0.3)",
      }}
    >
      STEP {stepNumber}
    </div>
  );
}

function TimelineConnector({ isLast }) {
  return (
    <div
      style={{
        position: "absolute",
        left: "24px",
        top: "64px",
        width: "2px",
        height: isLast ? "0px" : "180px",
        background: CONNECTOR_COLOR,
        zIndex: 0,
      }}
    />
  );
}

function DetailBlock({ label, value }) {
  return (
    <div
      style={{
        borderRadius: "16px",
        background: "rgba(255,255,255,0.82)",
        border: "1px solid rgba(148, 163, 184, 0.18)",
        padding: "16px",
      }}
    >
      <p
        style={{
          fontSize: "10px",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "#9a5c2e",
          margin: "0 0 8px",
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: "14px", color: "rgba(27,20,13,0.7)", margin: 0, lineHeight: "1.6" }}>
        {value}
      </p>
    </div>
  );
}

export default function VerticalTimeline({ selectedSystemId, onSystemSelect, onBookDemo }) {
  const system = systemsById[selectedSystemId];
  const currentIndex = orderedSystemIds.indexOf(selectedSystemId);
  const stepNumber = currentIndex + 1;

  if (!system) return null;

  const Icon = iconMap[system.icon];

  const handleNextSystem = () => {
    const nextIndex = (currentIndex + 1) % orderedSystemIds.length;
    onSystemSelect(orderedSystemIds[nextIndex]);
  };

  const handlePreviousSystem = () => {
    const prevIndex = (currentIndex - 1 + orderedSystemIds.length) % orderedSystemIds.length;
    onSystemSelect(orderedSystemIds[prevIndex]);
  };

  // Alternate layout: odd steps = content left/image right, even steps = image left/content right
  const isEvenStep = stepNumber % 2 === 0;

  return (
    <div style={{ marginTop: "60px", marginBottom: "60px" }}>
      <div
        style={{
          position: "relative",
          paddingLeft: "120px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "40px",
          alignItems: "center",
        }}
      >
        {/* Connector line */}
        <TimelineConnector isLast={currentIndex === orderedSystemIds.length - 1} />

        {/* Step badge */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            zIndex: 10,
          }}
        >
          <StepBadge stepNumber={stepNumber} />
        </div>

        {/* Content wrapper - reorder based on step parity */}
        {isEvenStep ? (
          <>
            {/* Image on left */}
            <div
              style={{
                width: "100%",
                height: "280px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, rgba(154,92,46,0.1), rgba(200,150,92,0.05))",
                border: "1px solid rgba(154,92,46,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9a5c2e",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              [Showcase Image]
            </div>
            {/* Content on right */}
            <div style={{ order: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg,#9a5c2e,#7a4825)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon style={{ width: "20px", height: "20px", color: "#fff" }} />
                </div>
              </div>
              <h3 style={{ fontSize: "28px", fontWeight: "700", color: "#1b140d", margin: "0 0 12px" }}>
                {system.title}
              </h3>
              <p style={{ fontSize: "16px", color: "rgba(27,20,13,0.7)", lineHeight: "1.6", margin: "0 0 20px" }}>
                <HighlightedText>{system.detail.summary}</HighlightedText>
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <DetailBlock label="Trigger" value={system.detail.trigger} />
                <DetailBlock label="Action" value={system.detail.action} />
                <DetailBlock label="Lead View" value={system.detail.leadView} />
                <DetailBlock label="Why" value={system.detail.businessValue} />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Content on left */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg,#9a5c2e,#7a4825)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon style={{ width: "20px", height: "20px", color: "#fff" }} />
                </div>
              </div>
              <h3 style={{ fontSize: "28px", fontWeight: "700", color: "#1b140d", margin: "0 0 12px" }}>
                {system.title}
              </h3>
              <p style={{ fontSize: "16px", color: "rgba(27,20,13,0.7)", lineHeight: "1.6", margin: "0 0 20px" }}>
                <HighlightedText>{system.detail.summary}</HighlightedText>
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <DetailBlock label="Trigger" value={system.detail.trigger} />
                <DetailBlock label="Action" value={system.detail.action} />
                <DetailBlock label="Lead View" value={system.detail.leadView} />
                <DetailBlock label="Why" value={system.detail.businessValue} />
              </div>
            </div>
            {/* Image on right */}
            <div
              style={{
                width: "100%",
                height: "280px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, rgba(154,92,46,0.1), rgba(200,150,92,0.05))",
                border: "1px solid rgba(154,92,46,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9a5c2e",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              [Showcase Image]
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: "12px", marginTop: "32px", justifyContent: "flex-start", paddingLeft: "120px" }}>
        <button
          onClick={handlePreviousSystem}
          style={{
            borderRadius: "9999px",
            padding: "10px 20px",
            fontSize: "13px",
            fontWeight: "600",
            border: "1px solid rgba(154,92,46,0.2)",
            background: "rgba(255,255,255,0.8)",
            color: "#1b140d",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          ← Previous
        </button>
        <button
          onClick={handleNextSystem}
          style={{
            borderRadius: "9999px",
            padding: "10px 20px",
            fontSize: "13px",
            fontWeight: "600",
            border: "1px solid rgba(154,92,46,0.2)",
            background: "rgba(255,255,255,0.8)",
            color: "#1b140d",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          Next →
        </button>
        <button
          onClick={onBookDemo}
          style={{
            borderRadius: "9999px",
            padding: "2px",
            background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
            boxShadow: "0 4px 14px rgba(120,70,20,0.28)",
            border: "none",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              height: "38px",
              paddingLeft: "20px",
              paddingRight: "20px",
              borderRadius: "9999px",
              background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
              color: "#f5e6d0",
              fontWeight: "700",
              fontSize: "13px",
            }}
          >
            {coreOfferSectionConfig.secondaryCta.label}
            <ArrowRight style={{ width: "14px", height: "14px" }} />
          </span>
        </button>
      </div>
    </div>
  );
}