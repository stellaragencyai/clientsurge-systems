import { Check, CheckCircle2, Plus } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cartContext";

export default function ProductCard({ product }) {
  const { items, addItem, removeItem } = useCart();
  const [flipped, setFlipped] = useState(false);
  const inCart = items.some((item) => item.product_id === product.product_id);
  const purchaseDisabled =
    product.store_purchase_enabled === false || product.coming_soon;
  const availabilityLabel =
    product.availability_label ||
    (product.coming_soon
      ? "Coming Soon"
      : product.store_purchase_enabled === false
      ? "Manual Review Required"
      : "Pilot Install Available");
  const fulfillmentLabel =
    product.fulfillment_label ||
    (product.store_purchase_enabled === false
      ? "Not self-serve today"
      : "Operator setup + canonical testing");

  const primaryActionLabel = product.coming_soon
    ? "Coming Soon"
    : product.store_purchase_enabled === false
    ? "Manual Review"
    : inCart
    ? "Added"
    : "Add";

  const toggle = () => {
    if (purchaseDisabled) {
      return;
    }

    if (inCart) {
      removeItem(product.product_id);
      return;
    }

    addItem(product);
  };

  const howItWorks = product.highlights || [];

  return (
    <>
      <style>{`
        .pcard-scene {
          perspective: 1000px;
          min-height: 380px;
        }
        .pcard-inner {
          position: relative;
          width: 100%;
          min-height: 380px;
          transform-style: preserve-3d;
          transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .pcard-inner.is-flipped {
          transform: rotateY(180deg);
        }
        .pcard-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 18px;
          overflow: hidden;
        }
        .pcard-back {
          transform: rotateY(180deg);
        }
        .crystal-card {
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: #ffffff;
          border: 1.5px solid rgba(0, 0, 0, 0.12);
          border-radius: 18px;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow:
            0 2px 12px rgba(0, 0, 0, 0.07),
            0 1px 3px rgba(0, 0, 0, 0.05);
          transition: box-shadow 0.4s ease, transform 0.4s ease, border-color 0.3s ease;
        }
        .crystal-card:hover {
          border-color: rgba(154, 92, 46, 0.35);
          box-shadow:
            0 12px 36px rgba(0, 0, 0, 0.1),
            0 2px 8px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
        }
        .crystal-card.in-cart {
          background: rgba(240, 253, 244, 0.35);
          box-shadow:
            inset 0 1px 0 rgba(134, 239, 172, 0.4),
            0 8px 28px rgba(34, 197, 94, 0.12);
        }
        .crystal-card.coming-soon-card {
          background: rgba(245, 245, 245, 0.08);
        }
        .flip-hint {
          position: absolute;
          top: 10px;
          right: 12px;
          font-size: 9px;
          font-weight: 700;
          color: rgba(154, 92, 46, 0.5);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .pcard-scene:hover .flip-hint {
          opacity: 1;
        }
      `}</style>

      <div
        className="pcard-scene"
        onMouseEnter={() => !product.coming_soon && setFlipped(true)}
        onMouseLeave={() => setFlipped(false)}
      >
        <div className={`pcard-inner${flipped ? " is-flipped" : ""}`}>
          <div className="pcard-face">
            <div
              className={`crystal-card${inCart ? " in-cart" : ""}${
                product.coming_soon ? " coming-soon-card" : ""
              }`}
              style={{ padding: "18px", position: "relative" }}
            >
              {!product.coming_soon && <span className="flip-hint">Hover to see setup truth</span>}

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "26px",
                    background: product.coming_soon
                      ? "rgba(180,180,180,0.15)"
                      : "linear-gradient(135deg, rgba(154,92,46,0.12) 0%, rgba(200,150,92,0.08) 100%)",
                    border: product.coming_soon
                      ? "1px solid rgba(180,180,180,0.2)"
                      : "1px solid rgba(154,92,46,0.2)",
                    boxShadow: product.coming_soon
                      ? "inset 0 1px 0 rgba(255,255,255,0.3)"
                      : "inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 8px rgba(154,92,46,0.1)",
                    filter: product.coming_soon ? "grayscale(80%)" : "none",
                    opacity: product.coming_soon ? 0.7 : 1,
                    flexShrink: 0,
                  }}
                >
                  {product.icon}
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: "#7a4825",
                      background: "rgba(154,92,46,0.1)",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      border: "1px solid rgba(154,92,46,0.22)",
                    }}
                  >
                    {product.category}
                  </span>
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: product.coming_soon ? "rgba(90,90,90,0.8)" : "#1b140d",
                      background: product.coming_soon
                        ? "rgba(180,180,180,0.14)"
                        : product.store_purchase_enabled === false
                        ? "rgba(245,158,11,0.12)"
                        : "rgba(34,197,94,0.12)",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      border: product.coming_soon
                        ? "1px solid rgba(180,180,180,0.24)"
                        : product.store_purchase_enabled === false
                        ? "1px solid rgba(245,158,11,0.24)"
                        : "1px solid rgba(34,197,94,0.22)",
                    }}
                  >
                    {availabilityLabel}
                  </span>
                </div>
              </div>

              <div style={{ position: "relative", zIndex: 1 }}>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: product.coming_soon ? "rgba(27,20,13,0.5)" : "#1b140d",
                    margin: "0 0 4px",
                    lineHeight: 1.2,
                  }}
                >
                  {product.name}
                </h3>
                <p
                  style={{
                    fontSize: "11px",
                    color: product.coming_soon ? "rgba(154,92,46,0.5)" : "#9a5c2e",
                    fontWeight: "700",
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {product.subtitle}
                </p>
              </div>

              <p
                style={{
                  fontSize: "13px",
                  color: product.coming_soon ? "rgba(27,20,13,0.45)" : "rgba(27,20,13,0.70)",
                  lineHeight: 1.65,
                  margin: 0,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {product.description}
              </p>

              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  borderRadius: "12px",
                  padding: "10px 12px",
                  background: product.coming_soon
                    ? "rgba(180,180,180,0.08)"
                    : "rgba(255,255,255,0.55)",
                  border: product.coming_soon
                    ? "1px solid rgba(180,180,180,0.14)"
                    : "1px solid rgba(154,92,46,0.1)",
                }}
              >
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(27,20,13,0.5)",
                    margin: 0,
                  }}
                >
                  Delivery
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: product.coming_soon ? "rgba(100,100,100,0.72)" : "rgba(27,20,13,0.78)",
                    margin: "4px 0 0",
                  }}
                >
                  {fulfillmentLabel}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "7px", position: "relative", zIndex: 1 }}>
                {product.highlights.map((highlight) => (
                  <div key={highlight} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2
                      style={{
                        width: "13px",
                        height: "13px",
                        color: product.coming_soon ? "#b0b0b0" : "#4ade80",
                        flexShrink: 0,
                        opacity: product.coming_soon ? 0.6 : 1,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "12px",
                        color: product.coming_soon ? "rgba(100,100,100,0.55)" : "rgba(27,20,13,0.72)",
                        fontWeight: "500",
                      }}
                    >
                      {highlight}
                    </span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginTop: "auto",
                }}
              >
                <div style={{ opacity: product.coming_soon ? 0.6 : 1 }}>
                  <p
                    style={{
                      fontSize: "8px",
                      color: product.coming_soon ? "rgba(100,100,100,0.5)" : "rgba(154,92,46,0.7)",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      margin: 0,
                    }}
                  >
                    Monthly
                  </p>
                  <p
                    style={{
                      fontSize: "26px",
                      fontWeight: "900",
                      color: product.coming_soon ? "#a0a0a0" : "#9a5c2e",
                      margin: 0,
                      lineHeight: 1,
                    }}
                  >
                    ${product.monthly_fee}
                  </p>
                  <p
                    style={{
                      fontSize: "9px",
                      color: product.coming_soon ? "rgba(100,100,100,0.5)" : "rgba(27,20,13,0.5)",
                      margin: "3px 0 0",
                      fontWeight: "600",
                    }}
                  >
                    Setup ${product.setup_fee}
                  </p>
                </div>

                <button
                  onClick={toggle}
                  disabled={purchaseDisabled}
                  style={{
                    borderRadius: "9999px",
                    padding: "2px",
                    background: purchaseDisabled
                      ? "linear-gradient(135deg,#c0c0c0,#b0b0b0)"
                      : inCart
                      ? "linear-gradient(135deg,#22c55e,#16a34a)"
                      : "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
                    border: "none",
                    cursor: purchaseDisabled ? "not-allowed" : "pointer",
                    boxShadow: inCart
                      ? "0 4px 14px rgba(34,197,94,0.32)"
                      : purchaseDisabled
                      ? "none"
                      : "0 4px 14px rgba(120,70,20,0.28)",
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      height: "30px",
                      paddingLeft: "12px",
                      paddingRight: "12px",
                      borderRadius: "9999px",
                      background: purchaseDisabled
                        ? "linear-gradient(135deg,#a0a0a0,#909090)"
                        : inCart
                        ? "linear-gradient(135deg,#16a34a,#15803d)"
                        : "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                      color: "#fff",
                      fontWeight: "700",
                      fontSize: "11px",
                      opacity: purchaseDisabled ? 0.7 : 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {inCart && !purchaseDisabled ? (
                      <>
                        <Check style={{ width: "12px", height: "12px" }} /> {primaryActionLabel}
                      </>
                    ) : (
                      <>
                        {!purchaseDisabled && <Plus style={{ width: "12px", height: "12px" }} />}
                        {primaryActionLabel}
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {!product.coming_soon && (
            <div className="pcard-face pcard-back">
              <div className="crystal-card" style={{ padding: "22px", background: "rgba(255,255,255,0.18)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "26px" }}>{product.icon}</span>
                  <div>
                    <p
                      style={{
                        fontSize: "10px",
                        fontWeight: "700",
                        color: "#9a5c2e",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        margin: 0,
                      }}
                    >
                      Setup Truth
                    </p>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1b140d", margin: 0 }}>
                      {product.name}
                    </h3>
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: "12px",
                    padding: "12px 14px",
                    background: "rgba(255,255,255,0.35)",
                    border: "1px solid rgba(255,255,255,0.5)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      color: "#9a5c2e",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      margin: "0 0 4px",
                    }}
                  >
                    Availability
                  </p>
                  <p style={{ fontSize: "12px", color: "#1b140d", margin: 0, fontWeight: "600" }}>
                    {availabilityLabel}
                  </p>
                  <p style={{ fontSize: "12px", color: "rgba(27,20,13,0.68)", margin: "4px 0 0" }}>
                    {fulfillmentLabel}
                  </p>
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                  {howItWorks.map((step, index) => (
                    <div
                      key={step}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        background: "rgba(255,255,255,0.25)",
                        border: "1px solid rgba(255,255,255,0.35)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
                      }}
                    >
                      <div
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg,#9a5c2e,#c8965c)",
                          color: "#fff",
                          fontSize: "10px",
                          fontWeight: "800",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: "0 2px 6px rgba(154,92,46,0.3)",
                        }}
                      >
                        {index + 1}
                      </div>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "rgba(27,20,13,0.75)",
                          fontWeight: "500",
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {step}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={toggle}
                  disabled={purchaseDisabled}
                  style={{
                    borderRadius: "9999px",
                    padding: "2px",
                    background: purchaseDisabled
                      ? "linear-gradient(135deg,#c0c0c0,#b0b0b0)"
                      : inCart
                      ? "linear-gradient(135deg,#22c55e,#16a34a)"
                      : "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
                    border: "none",
                    cursor: purchaseDisabled ? "not-allowed" : "pointer",
                    width: "100%",
                    boxShadow: inCart
                      ? "0 4px 14px rgba(34,197,94,0.32)"
                      : purchaseDisabled
                      ? "none"
                      : "0 4px 14px rgba(120,70,20,0.28)",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      height: "36px",
                      borderRadius: "9999px",
                      background: purchaseDisabled
                        ? "linear-gradient(135deg,#a0a0a0,#909090)"
                        : inCart
                        ? "linear-gradient(135deg,#16a34a,#15803d)"
                        : "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                      color: "#fff",
                      fontWeight: "700",
                      fontSize: "12px",
                      opacity: purchaseDisabled ? 0.75 : 1,
                    }}
                  >
                    {inCart && !purchaseDisabled ? (
                      <>
                        <Check style={{ width: "12px", height: "12px" }} /> Added to Cart
                      </>
                    ) : (
                      primaryActionLabel
                    )}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
