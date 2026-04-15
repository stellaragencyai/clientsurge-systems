import { ArrowRight } from "lucide-react";

export default function CTAButton({ onClick, children, disabled = false, className = "", size = "md", ...props }) {
  const sizes = {
    sm: "h-10 px-6 text-xs",
    md: "h-12 px-8 text-sm",
    lg: "h-14 px-10 text-base",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-block",
        borderRadius: "9999px",
        padding: "2px",
        background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
        boxShadow: "0 4px 18px rgba(120,70,20,0.35)",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "box-shadow 0.3s ease, transform 0.3s ease",
        opacity: disabled ? 0.6 : 1,
      }}
      className={`focus:ring-2 focus:ring-primary focus:outline-none ${className}`}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.boxShadow = "0 8px 40px rgba(161,120,35,0.6), 0 4px 18px rgba(120,70,20,0.35)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 18px rgba(120,70,20,0.35)";
      }}
      {...props}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          borderRadius: "9999px",
          background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
          color: "#f5e6d0",
          fontWeight: "700",
          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
          justifyContent: "center",
        }}
        className={sizes[size]}
      >
        {children}
        <ArrowRight className="w-4 h-4" />
      </span>
    </button>
  );
}