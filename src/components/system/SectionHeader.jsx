import React from "react";

/**
 * SectionHeader — Unified section heading with blue vertical accent bar.
 * Uses the existing cs-section-header token classes from index.css.
 *
 * Props:
 *   title    — string (required)
 *   subtitle — string
 *   eyebrow  — string (small uppercase label above title)
 *   align    — "left" | "center" (default: "left")
 */
export default function SectionHeader({ title, subtitle, eyebrow, align = "left" }) {
  const center = align === "center";
  return (
    <div className={`cs-section-header ${center ? "cs-section-header--center" : "cs-section-header--left"}`}>
      {eyebrow && <p className="cs-section-eyebrow">{eyebrow}</p>}
      <div className="cs-section-title-row">
        <span className="cs-section-bar" />
        <h2 className="cs-section-title">{title}</h2>
      </div>
      {subtitle && <p className="cs-section-subtitle">{subtitle}</p>}
    </div>
  );
}