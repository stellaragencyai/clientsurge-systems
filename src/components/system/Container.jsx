import React from "react";

/**
 * Container — Standardized page-level container.
 *
 * Props:
 *   children  — content
 *   maxWidth  — "sm" | "md" | "lg" | "xl" | "full" (default: "xl")
 *   className — extra classes
 *
 * Maps to:
 *   sm  → max-w-3xl
 *   md  → max-w-4xl
 *   lg  → max-w-6xl
 *   xl  → max-w-7xl
 *   full → max-w-full
 */
const WIDTH_MAP = {
  sm: "max-w-3xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-full",
};

export default function Container({ children, maxWidth = "xl", className = "" }) {
  return (
    <div className={`${WIDTH_MAP[maxWidth] || WIDTH_MAP.xl} mx-auto px-4 md:px-8 ${className}`}>
      {children}
    </div>
  );
}