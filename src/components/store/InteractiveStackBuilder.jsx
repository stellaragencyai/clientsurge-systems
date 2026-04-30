import { Trash2, Package2 } from "lucide-react";
import { useMemo } from "react";
import { useCart } from "@/lib/cartContext";
import { formatCurrency, getPackageDisplayLabel } from "@/lib/aiProducts";

export default function InteractiveStackBuilder() {
  const { items, removeItem, pricingSummary } = useCart();
  const reduceMotion = useMemo(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
        alignItems: "start",
        marginTop: "32px",
      }}
    >
      <div
        style={{
          perspective: "1200px",
          minHeight: "300px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: "24px",
          borderRadius: "16px",
          border: "1.5px solid rgba(154,92,46,0.15)",
          background: "linear-gradient(135deg, rgba(154,92,46,0.05) 0%, rgba(200,150,92,0.03) 100%)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", perspective: "1000px" }}>
          {items.length === 0 ? (
            <p style={{ fontSize: "13px", color: "rgba(26,18,9,0.4)", textAlign: "center", padding: "32px 16px" }}>
              Add canonical services from the catalog or load a packaged system.
            </p>
          ) : (
            items.map((item, index) => (
              <div
                key={item.product_id}
                style={{
                  transform: reduceMotion
                    ? `translateY(${index * -2}px)`
                    : `rotateX(${index * 2}deg) scale(${1 - index * 0.02})`,
                  transformOrigin: "bottom center",
                  transformStyle: reduceMotion ? "flat" : "preserve-3d",
                  background: `linear-gradient(135deg, rgba(154,92,46,0.${15 + index * 8}), rgba(200,150,92,0.${8 + index * 6}))`,
                  borderRadius: "10px",
                  padding: "10px 16px",
                  border: "1px solid rgba(154,92,46,0.2)",
                  minWidth: "200px",
                  boxShadow: `0 ${4 + index * 2}px ${12 + index * 4}px rgba(0,0,0,0.${8 + index * 3})`,
                  transition: reduceMotion ? "none" : "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#1a1209" }}>
                    {item.icon} {item.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.product_id)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "rgba(26,18,9,0.4)", transition: "color 0.2s" }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.color = "#e53e3e";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.color = "rgba(26,18,9,0.4)";
                    }}
                  >
                    <Trash2 style={{ width: "12px", height: "12px" }} />
                  </button>
                </div>
                <div style={{ fontSize: "10px", color: "rgba(26,18,9,0.55)", marginTop: "4px" }}>
                  ${formatCurrency(item.setup_fee)} setup · ${formatCurrency(item.monthly_fee)}/mo
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.8)",
          border: "1.5px solid rgba(154,92,46,0.2)",
          borderRadius: "16px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          height: "fit-content",
        }}
      >
        <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#1a1209", margin: 0 }}>Bundle Pricing Summary</h3>

        <div
          style={{
            borderRadius: "12px",
            border: "1px solid rgba(154,92,46,0.14)",
            background: "rgba(154,92,46,0.06)",
            padding: "12px 14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Package2 style={{ width: "14px", height: "14px", color: "#9a5c2e" }} />
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#1a1209" }}>
              {getPackageDisplayLabel(pricingSummary)}
            </p>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: "11px", color: "rgba(26,18,9,0.55)" }}>
            {pricingSummary.package_offer
              ? `${pricingSummary.package_offer.included_services.length} services matched to an explicit package price.`
              : "Current selection is priced as a custom bundle of canonical services."}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid rgba(154,92,46,0.1)" }}>
            <span style={{ fontSize: "11px", color: "rgba(26,18,9,0.55)" }}>Setup total</span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#1a1209" }}>
              ${formatCurrency(pricingSummary.total_setup)}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid rgba(154,92,46,0.1)" }}>
            <span style={{ fontSize: "11px", color: "rgba(26,18,9,0.55)" }}>Monthly total</span>
            <span style={{ fontSize: "16px", fontWeight: "800", color: "#9a5c2e" }}>
              ${formatCurrency(pricingSummary.total_monthly)}/mo
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", color: "rgba(26,18,9,0.55)" }}>A la carte comparison</span>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "rgba(26,18,9,0.7)" }}>
              ${formatCurrency(pricingSummary.total_setup_before_discount)} setup · ${formatCurrency(pricingSummary.total_monthly_before_discount)}/mo
            </span>
          </div>
        </div>

        {(pricingSummary.setup_discount_total > 0 || pricingSummary.monthly_discount_total > 0) ? (
          <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "10px", padding: "12px" }}>
            <p style={{ fontSize: "10px", fontWeight: "700", color: "#22c55e", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Explicit Bundle Discount
            </p>
            <p style={{ fontSize: "11px", color: "rgba(26,18,9,0.55)", margin: 0 }}>
              Saves ${formatCurrency(pricingSummary.setup_discount_total)} setup and ${formatCurrency(pricingSummary.monthly_discount_total)}/mo.
            </p>
          </div>
        ) : null}

        <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "10px", padding: "12px" }}>
          <p style={{ fontSize: "10px", fontWeight: "700", color: "#22c55e", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Install Flow
          </p>
          <p style={{ fontSize: "10px", color: "rgba(26,18,9,0.5)", margin: 0 }}>
            Checkout creates one canonical Order, and `/admin` still receives individual installable services in the install queue.
          </p>
        </div>
      </div>
    </div>
  );
}
