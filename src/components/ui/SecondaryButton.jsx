import { ArrowRight } from "lucide-react";

export default function SecondaryButton({
  children,
  onClick,
  icon: Icon = null,
  disabled = false,
  type = "button",
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        minHeight: "48px",
        padding: "0 28px",
        borderRadius: "9999px",
        border: "1.5px solid rgba(154,92,46,0.35)",
        background: "rgba(255,255,255,0.82)",
        color: "#7a4825",
        fontSize: "14px",
        fontWeight: "700",
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: "0 10px 24px rgba(44,31,16,0.06)",
        opacity: disabled ? 0.6 : 1,
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = "rgba(154,92,46,0.55)";
          e.currentTarget.style.background = "rgba(255,255,255,0.95)";
          e.currentTarget.style.boxShadow = "0 14px 32px rgba(44,31,16,0.1)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = "rgba(154,92,46,0.35)";
          e.currentTarget.style.background = "rgba(255,255,255,0.82)";
          e.currentTarget.style.boxShadow = "0 10px 24px rgba(44,31,16,0.06)";
        }
      }}
      {...props}
    >
      {Icon && <Icon style={{ width: "14px", height: "14px" }} />}
      {children}
    </button>
  );
}