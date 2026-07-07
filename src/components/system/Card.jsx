import React from "react";

/**
 * Card — Unified card component.
 *
 * Props:
 *   interactive — boolean (if true, uses cs-glow-card with hover lift; else cs-card)
 *   children    — card content
 *   className   — extra classes
 *   ...rest     — any native div props
 */
export default function Card({ interactive = false, children, className = "", ...rest }) {
  const base = interactive ? "cs-glow-card" : "cs-card";
  return (
    <div className={`${base} ${className}`} {...rest}>
      {children}
    </div>
  );
}