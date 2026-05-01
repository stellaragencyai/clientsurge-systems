import { Trash2, Package2 } from "lucide-react";
import { useCart } from "@/lib/cartContext";
import { formatCurrency, getPackageDisplayLabel } from "@/lib/aiProducts";

export default function InteractiveStackBuilder() {
  const { items, removeItem, pricingSummary } = useCart();

  return (
    <div
      className="store-builder-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.05fr) minmax(320px, 0.95fr)",
        gap: "24px",
        alignItems: "start",
        marginTop: "32px",
      }}
    >
      <style>{`
        @media (max-width: 900px) {
          .store-builder-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div
        style={{
          perspective: "1200px",
          minHeight: "280px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: "24px",
          borderRadius: "18px",
          border: "1.5px solid rgba(154,92,46,0.15)",
          background:
            "linear-gradient(135deg, rgba(26,18,9,0.3) 0%, rgba(200,150,92,0.06) 100%)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            perspective: "1000px",
            width: "100%",
            maxWidth: "360px",
          }}
        >
          {items.length === 0 ? (
            <p
              style={{
                fontSize: "13px",
                color: "rgba(255,232,193,0.6)",
                textAlign: "center",
                padding: "32px 16px",
              }}
            >
              Add services from the catalog and we will build your stack preview here.
            </p>
          ) : (
            [...items].reverse().map((item, index) => (
              <div
                key={item.product_id}
                style={{
                  transform: `rotateX(${index * 1.1}deg) scale(${1 - index * 0.015})`,
                  transformOrigin: "bottom center",
                  transformStyle: "preserve-3d",
                  background:
                    "linear-gradient(135deg, rgba(255,248,240,0.86), rgba(241,224,202,0.78))",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  border: "1px solid rgba(154,92,46,0.16)",
                  boxShadow: `0 ${4 + index * 2}px ${12 + index * 3}px rgba(0,0,0,0.08)`,
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <span
                    style={{ fontSize: "12px", fontWeight: "600", color: "#1a1209" }}
                  >
                    {item.icon} {item.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.product_id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px",
                      color: "rgba(26,18,9,0.4)",
                    }}
                  >
                    <Trash2 style={{ width: "12px", height: "12px" }} />
                  </button>
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "rgba(26,18,9,0.58)",
                    marginTop: "4px",
                  }}
                >
                  ${formatCurrency(item.setup_fee)} one-time setup · $
                  {formatCurrency(item.monthly_fee)}/month
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.82)",
          border: "1.5px solid rgba(154,92,46,0.16)",
          borderRadius: "18px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          height: "fit-content",
          boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
        }}
      >
        <h3
          style={{
            fontSize: "14px",
            fontWeight: "700",
            color: "#1a1209",
            margin: 0,
          }}
        >
          Bundle Pricing Summary
        </h3>

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
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                fontWeight: "700",
                color: "#1a1209",
              }}
            >
              {getPackageDisplayLabel(pricingSummary)}
            </p>
          </div>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "11px",
              color: "rgba(26,18,9,0.55)",
            }}
          >
            {pricingSummary.package_offer
              ? `${pricingSummary.package_offer.included_services.length} services matched to an explicit package price.`
              : "Current selection is priced as a custom bundle of canonical services."}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingBottom: "8px",
              borderBottom: "1px solid rgba(154,92,46,0.1)",
            }}
          >
            <span style={{ fontSize: "11px", color: "rgba(26,18,9,0.55)" }}>
              Setup total
            </span>
            <span
              style={{ fontSize: "13px", fontWeight: "700", color: "#1a1209" }}
            >
              ${formatCurrency(pricingSummary.total_setup)}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingBottom: "8px",
              borderBottom: "1px solid rgba(154,92,46,0.1)",
            }}
          >
            <span style={{ fontSize: "11px", color: "rgba(26,18,9,0.55)" }}>
              Monthly total
            </span>
            <span
              style={{ fontSize: "16px", fontWeight: "800", color: "#9a5c2e" }}
            >
              ${formatCurrency(pricingSummary.total_monthly)}/mo
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <span style={{ fontSize: "11px", color: "rgba(26,18,9,0.55)" }}>
              A la carte comparison
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "rgba(26,18,9,0.7)",
                textAlign: "right",
              }}
            >
              ${formatCurrency(pricingSummary.total_setup_before_discount)} setup - $
              {formatCurrency(pricingSummary.total_monthly_before_discount)}/mo
            </span>
          </div>
        </div>

        {pricingSummary.setup_discount_total > 0 ||
        pricingSummary.monthly_discount_total > 0 ? (
          <div
            style={{
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: "10px",
              padding: "12px",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                fontWeight: "700",
                color: "#22c55e",
                margin: "0 0 6px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Explicit Bundle Discount
            </p>
            <p
              style={{
                fontSize: "11px",
                color: "rgba(26,18,9,0.55)",
                margin: 0,
              }}
            >
              Saves ${formatCurrency(pricingSummary.setup_discount_total)} setup
              and ${formatCurrency(pricingSummary.monthly_discount_total)}/mo.
            </p>
          </div>
        ) : null}

        <div
          style={{
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: "10px",
            padding: "12px",
          }}
        >
          <p
            style={{
              fontSize: "10px",
              fontWeight: "700",
              color: "#22c55e",
              margin: "0 0 6px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Install Flow
          </p>
          <p
            style={{
              fontSize: "10px",
              color: "rgba(26,18,9,0.5)",
              margin: 0,
            }}
          >
            Checkout creates one canonical order, and /admin still receives the
            installable services in the queue.
          </p>
        </div>
      </div>
    </div>
  );
}
