import React from "react";

/**
 * ActionButton — pill-style buttons matching the reference design.
 * variant: "outline-blue" | "solid-purple" | "outline-gray"
 */
const VARIANTS = {
  "outline-blue":
    "text-blue-600 border border-blue-200 hover:bg-blue-50 bg-white",
  "solid-purple":
    "text-white border-none hover:opacity-90",
  "outline-gray":
    "text-gray-600 border border-gray-200 hover:bg-gray-50 bg-white",
};

export default function ActionButton({
  children,
  variant = "outline-blue",
  onClick,
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap";
  const variantClass = VARIANTS[variant] || VARIANTS["outline-blue"];
  const style =
    variant === "solid-purple"
      ? { background: "linear-gradient(135deg, #8A2BE2, #7B1FA2)" }
      : {};

  return (
    <button
      onClick={onClick}
      className={`${base} ${variantClass} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
}