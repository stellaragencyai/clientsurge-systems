import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShoppingCart, Zap, Search, Sparkles, Package2 } from "lucide-react";
import { CartProvider, useCart } from "@/lib/cartContext";
import {
  AI_PRODUCTS,
  CATEGORIES,
  PACKAGE_OFFERS,
  SELF_SERVE_PRODUCTS,
  formatCurrency,
  getPackageServices,
} from "@/lib/aiProducts";
import ProductCard from "@/components/store/ProductCard";
import CartSidebar from "@/components/store/CartSidebar";
import InteractiveStackBuilder from "@/components/store/InteractiveStackBuilder";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";

function PackageOfferCard({ offer, onSelect }) {
  return (
    <div
      style={{
        borderRadius: "24px",
        padding: "24px",
        border: offer.highlight
          ? "2px solid rgba(154,92,46,0.45)"
          : "1.5px solid rgba(154,92,46,0.16)",
        background: offer.highlight
          ? "linear-gradient(135deg, rgba(255,248,235,0.98) 0%, rgba(252,239,216,0.94) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(252,248,242,0.9) 100%)",
        boxShadow: offer.highlight
          ? "0 18px 48px rgba(154,92,46,0.14)"
          : "0 8px 24px rgba(0,0,0,0.05)",
        position: "relative",
      }}
    >
      {offer.badge ? (
        <div
          style={{
            position: "absolute",
            top: "-12px",
            left: "24px",
            borderRadius: "9999px",
            padding: "6px 14px",
            fontSize: "11px",
            fontWeight: "700",
            color: "#fff",
            background: "linear-gradient(135deg,#9a5c2e,#c8965c)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {offer.badge}
        </div>
      ) : null}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
        <div>
          <h3 className="font-display" style={{ fontSize: "1.45rem", fontWeight: "700", color: "#1a1209", margin: 0 }}>
            {offer.name}
          </h3>
          <p style={{ fontSize: "13px", color: "rgba(26,18,9,0.58)", margin: "8px 0 0" }}>{offer.fit}</p>
        </div>
        <div
          style={{
            borderRadius: "16px",
            padding: "10px 12px",
            background: "rgba(154,92,46,0.08)",
            border: "1px solid rgba(154,92,46,0.12)",
            minWidth: "120px",
            textAlign: "right",
          }}
        >
          <p style={{ margin: 0, fontSize: "11px", color: "rgba(26,18,9,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "700" }}>
            Bundle Savings
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: "800", color: "#9a5c2e" }}>
            ${formatCurrency(offer.setup_savings)} + ${formatCurrency(offer.monthly_savings)}/mo
          </p>
        </div>
      </div>

      <p style={{ fontSize: "13px", color: "rgba(26,18,9,0.6)", lineHeight: 1.65, margin: "16px 0 0" }}>
        {offer.description}
      </p>

      <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginTop: "18px" }}>
        <div
          style={{
            borderRadius: "14px",
            background: "rgba(154,92,46,0.06)",
            padding: "12px 14px",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: "10px", color: "rgba(26,18,9,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "700" }}>
            Setup
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "26px", fontWeight: "800", color: "#1a1209" }}>
            ${formatCurrency(offer.setup_total)}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "11px", color: "rgba(26,18,9,0.4)" }}>
            vs ${formatCurrency(offer.compare_at_setup)} a la carte
          </p>
        </div>

        <div
          style={{
            borderRadius: "14px",
            background: "rgba(154,92,46,0.06)",
            padding: "12px 14px",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: "10px", color: "rgba(26,18,9,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "700" }}>
            Monthly
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "26px", fontWeight: "800", color: "#9a5c2e" }}>
            ${formatCurrency(offer.monthly_total)}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "11px", color: "rgba(26,18,9,0.4)" }}>
            vs ${formatCurrency(offer.compare_at_monthly)}/mo a la carte
          </p>
        </div>
      </div>

      <div style={{ marginTop: "18px" }}>
        <p style={{ margin: "0 0 10px", fontSize: "11px", fontWeight: "700", color: "rgba(26,18,9,0.45)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Canonical Install Services Included
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {offer.included_services.map((service) => (
            <span
              key={service.service_key}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                borderRadius: "9999px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#1a1209",
                background: "rgba(255,255,255,0.82)",
                border: "1px solid rgba(154,92,46,0.14)",
              }}
            >
              <span>{service.icon}</span>
              {service.name}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onSelect(offer.package_key)}
        style={{
          width: "100%",
          marginTop: "20px",
          borderRadius: "9999px",
          padding: "2px",
          border: "none",
          cursor: "pointer",
          background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
          boxShadow: "0 6px 18px rgba(120,70,20,0.28)",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            height: "46px",
            borderRadius: "9999px",
            background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
            color: "#f5e6d0",
            fontWeight: "700",
            fontSize: "13px",
          }}
        >
          <Package2 style={{ width: "15px", height: "15px" }} />
          Load This Bundle
        </span>
      </button>
    </div>
  );
}

function StoreInner() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, setCartOpen, replaceItems, pricingSummary } = useCart();

  const selectedPackageKey = searchParams.get("package");

  useEffect(() => {
    if (!selectedPackageKey) {
      return;
    }

    const packageServices = getPackageServices(selectedPackageKey);
    if (!packageServices.length) {
      return;
    }

    replaceItems(packageServices);
    setCartOpen(true);
  }, [replaceItems, selectedPackageKey, setCartOpen]);

  const filtered = useMemo(() => {
    return AI_PRODUCTS.filter((product) => {
      const matchCat = activeCategory === "All" || product.category === activeCategory;
      const matchSearch =
        !search ||
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, search]);

  const handleSelectPackage = (packageKey) => {
    replaceItems(getPackageServices(packageKey));
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("package", packageKey);
      return next;
    });
    setCartOpen(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fdfcfa 0%, #f8f4ee 40%, #faf7f2 100%)", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      <div style={{ textAlign: "center", padding: "64px 24px 40px", position: "relative" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", borderRadius: "9999px", padding: "6px 16px", marginBottom: "20px", background: "rgba(154,92,46,0.08)", border: "1px solid rgba(154,92,46,0.2)" }}>
          <Zap style={{ width: "12px", height: "12px", color: "#9a5c2e" }} />
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#9a5c2e", letterSpacing: "0.16em", textTransform: "uppercase" }}>AI Service Catalog</span>
        </div>
        <h1 className="font-display" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: "800", lineHeight: 1.08, letterSpacing: "-0.02em", color: "#1a1209", marginBottom: "16px" }}>
          Buy the{" "}
          <span style={{ background: "linear-gradient(135deg, #7a3f1a 0%, #c8965c 50%, #9a5c2e 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            exact services
          </span>{" "}
          we actually deploy
        </h1>
        <p style={{ fontSize: "1.1rem", color: "rgba(26,18,9,0.55)", lineHeight: 1.7, maxWidth: "760px", margin: "0 auto 28px" }}>
          Browse all 12 offers in the AI catalog. Self-serve checkout is enabled only for the 6 services that already map directly into the canonical order-driven install queue, while the rest stay consultative until their delivery path is standardized.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "24px" }}>
          {[
            { label: "AI Services in Catalog", val: String(AI_PRODUCTS.length) },
            { label: "Self-Serve Checkout", val: String(SELF_SERVE_PRODUCTS.length) },
            { label: "Packaged Systems", val: String(PACKAGE_OFFERS.length) },
            { label: "Avg. Setup Time", val: "5-7 days" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <p style={{ fontSize: "20px", fontWeight: "800", color: "#9a5c2e", margin: "0 0 2px" }}>{stat.val}</p>
              <p style={{ fontSize: "11px", color: "rgba(26,18,9,0.4)", margin: 0, fontWeight: "600" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {items.length > 0 && (
        <div
          onClick={() => setCartOpen(true)}
          style={{ position: "sticky", top: "64px", zIndex: 50, margin: "0 24px 24px", borderRadius: "16px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", boxShadow: "0 8px 32px rgba(120,70,20,0.3)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShoppingCart style={{ width: "18px", height: "18px", color: "#f5e6d0" }} />
            <div>
              <span style={{ color: "#f5e6d0", fontWeight: "700", fontSize: "14px" }}>
                {items.length} installable service{items.length > 1 ? "s" : ""} selected
              </span>
              <p style={{ margin: "4px 0 0", fontSize: "11px", color: "rgba(245,230,208,0.72)" }}>
                {pricingSummary.package_offer
                  ? `${pricingSummary.package_offer.name}${pricingSummary.add_on_service_keys.length ? " + add-ons" : ""}`
                  : "Custom service bundle"}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", textAlign: "right" }}>
            <div>
              <span style={{ display: "block", fontSize: "12px", color: "rgba(245,230,208,0.7)" }}>
                ${formatCurrency(pricingSummary.total_setup)} setup · ${formatCurrency(pricingSummary.total_monthly)}/mo
              </span>
              {pricingSummary.setup_discount_total > 0 || pricingSummary.monthly_discount_total > 0 ? (
                <span style={{ display: "block", fontSize: "11px", color: "#f5d9a8" }}>
                  Saves ${formatCurrency(pricingSummary.setup_discount_total)} + ${formatCurrency(pricingSummary.monthly_discount_total)}/mo
                </span>
              ) : null}
            </div>
            <span style={{ background: "rgba(255,255,255,0.15)", color: "#f5e6d0", fontSize: "12px", fontWeight: "700", padding: "6px 16px", borderRadius: "9999px" }}>View Cart →</span>
          </div>
        </div>
      )}

      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "0 24px 24px" }}>
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Sparkles style={{ width: "18px", height: "18px", color: "#9a5c2e" }} />
            <h2 className="font-display" style={{ margin: 0, fontSize: "1.8rem", color: "#1a1209" }}>
              Packaged Systems
            </h2>
          </div>
          <p style={{ margin: "0 0 18px", fontSize: "14px", color: "rgba(26,18,9,0.58)", maxWidth: "760px", lineHeight: 1.65 }}>
            These bundles are explicit pricing shortcuts for the same canonical install services you can buy individually. When a bundle matches your selected self-serve services, checkout and `/admin` both show the package and the actual included installable services.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {PACKAGE_OFFERS.map((offer) => (
              <PackageOfferCard key={offer.package_key} offer={offer} onSelect={handleSelectPackage} />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginBottom: "24px" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "200px", maxWidth: "320px" }}>
            <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "rgba(154,92,46,0.5)" }} />
            <input
              type="text"
              placeholder="Search canonical services..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ width: "100%", borderRadius: "9999px", border: "1.5px solid rgba(154,92,46,0.2)", padding: "9px 14px 9px 34px", fontSize: "13px", background: "rgba(255,255,255,0.8)", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                style={{
                  borderRadius: "9999px",
                  padding: "7px 16px",
                  fontSize: "12px",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer",
                  background: activeCategory === category ? "linear-gradient(135deg,#6b3f1f,#9a5c2e)" : "rgba(154,92,46,0.07)",
                  color: activeCategory === category ? "#f5e6d0" : "rgba(26,18,9,0.6)",
                  transition: "all 0.2s",
                  boxShadow: activeCategory === category ? "0 2px 8px rgba(120,70,20,0.25)" : "none",
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {filtered.map((product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px", color: "rgba(26,18,9,0.4)" }}>
            <p style={{ fontSize: "16px", fontWeight: "600" }}>No canonical services match your search</p>
          </div>
        )}

        <InteractiveStackBuilder />
      </div>

      <CartSidebar />
      <Footer />
    </div>
  );
}

export default function Store() {
  return (
    <DemoBookingProvider>
      <CartProvider>
        <StoreInner />
      </CartProvider>
    </DemoBookingProvider>
  );
}
