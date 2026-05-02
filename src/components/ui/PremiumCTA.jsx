import { ArrowRight } from "lucide-react";
import { useState } from "react";

export default function PremiumCTA({
  children,
  onClick,
  icon: Icon = ArrowRight,
  loading = false,
  disabled = false,
  type = "button",
  className = "",
  ...props
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e) => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    try {
      await onClick?.(e);
    } finally {
      setIsLoading(false);
    }
  };

  const isInactive = disabled || isLoading || loading;

  return (
    <button
      type={type}
      disabled={isInactive}
      onClick={handleClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        minHeight: "52px",
        padding: "0 32px",
        borderRadius: "9999px",
        border: "none",
        background: isInactive
          ? "linear-gradient(135deg, #9a7850 0%, #b89968 46%, #a08562 100%)"
          : "linear-gradient(135deg, #7a4825 0%, #9a5c2e 46%, #c8965c 100%)",
        color: "#fff8ee",
        fontSize: "1rem",
        fontWeight: "700",
        boxShadow: isInactive
          ? "0 10px 28px rgba(122,72,37,0.12)"
          : "0 16px 36px rgba(122,72,37,0.24)",
        cursor: isInactive ? "not-allowed" : "pointer",
        opacity: isInactive ? 0.7 : 1,
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        if (!isInactive) {
          e.currentTarget.style.boxShadow = "0 20px 48px rgba(122,72,37,0.32)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isInactive) {
          e.currentTarget.style.boxShadow = "0 16px 36px rgba(122,72,37,0.24)";
          e.currentTarget.style.transform = "translateY(0)";
        }
      }}
      {...props}
    >
      {isLoading || loading ? (
        <>
          <div
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff8ee",
              animation: "spin 0.8s linear infinite",
            }}
          />
          Loading...
        </>
      ) : (
        <>
          {children}
          {Icon && <Icon style={{ width: "18px", height: "18px" }} />}
        </>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}