import React from "react";

/**
 * Button — Unified button component using cs-btn- token classes.
 *
 * Props:
 *   variant  — "primary" | "secondary" | "outline" | "ghost" (default: "primary")
 *   children — button label
 *   onClick  — click handler
 *   className — extra classes
 *   ...rest  — any native button props (type, disabled, etc.)
 */
const VARIANT_MAP = {
  primary: "cs-btn-primary",
  secondary: "btn-secondary",
  outline: "btn-secondary",
  ghost: "btn-secondary",
};

export default function Button({ variant = "primary", children, className = "", ...rest }) {
  const base = VARIANT_MAP[variant] || VARIANT_MAP.primary;
  return (
    <button className={`${base} ${className}`} {...rest}>
      {children}
    </button>
  );
}