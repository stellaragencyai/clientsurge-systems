import { useState } from "react";
import { ShoppingCart, Zap, Search } from "lucide-react";
import { CartProvider, useCart } from "@/lib/cartContext";
import { AI_PRODUCTS, CATEGORIES } from "@/lib/aiProducts";
import ProductCard from "@/components/store/ProductCard";
import CartSidebar from "@/components/store/CartSidebar";
import InteractiveStackBuilder from "@/components/store/InteractiveStackBuilder";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";

function StoreInner() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const { items, setCartOpen } = useCart();

  const filtered = AI_PRODUCTS.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalMonthly = items.reduce((s, i) => s + i.monthly_fee, 0);
  const totalSetup = items.reduce((s, i) => s + i.setup_fee, 0);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fdfcfa 0%, #f8f4ee 40%, #faf7f2 100%)", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      {/* Hero header */}
      <div style={{ textAlign: "center", padding: "64px 24px 48px", position: "relative" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", borderRadius: "9999px", padding: "6px 16px", marginBottom: "20px", background: "rgba(154,92,46,0.08)", border: "1px solid rgba(154,92,46,0.2)" }}>
          <Zap style={{ width: "12px", height: "12px", color: "#9a5c2e" }} />
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#9a5c2e", letterSpacing: "0.16em", textTransform: "uppercase" }}>AI Services Marketplace</span>
        </div>
        <h1 className="font-display" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: "800", lineHeight: 1.08, letterSpacing: "-0.02em", color: "#1a1209", marginBottom: "16px" }}>
          Build Your{" "}
          <span style={{ background: "linear-gradient(135deg, #7a3f1a 0%, #c8965c 50%, #9a5c2e 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            AI-Powered Business
          </span>
        </h1>
        <p style={{ fontSize: "1.1rem", color: "rgba(26,18,9,0.55)", lineHeight: 1.7, maxWidth: "560px", margin: "0 auto 32px" }}>
          Pick the AI services you need, add them to your cart, and we handle the entire setup. Your automations go live within 5–7 days.
        </p>

        {/* Stats bar */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "24px", marginBottom: "16px" }}>
          {[
            { label: "AI Services Available", val: "12" },
            { label: "Avg. Setup Time", val: "5–7 days" },
            { label: "Cancel Anytime", val: "No Contracts" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <p style={{ fontSize: "20px", fontWeight: "800", color: "#9a5c2e", margin: "0 0 2px" }}>{s.val}</p>
              <p style={{ fontSize: "11px", color: "rgba(26,18,9,0.4)", margin: 0, fontWeight: "600" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky cart bar */}
      {items.length > 0 && (
        <div
          onClick={() => setCartOpen(true)}
          style={{ position: "sticky", top: "64px", zIndex: 50, margin: "0 24px 24px", borderRadius: "16px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", boxShadow: "0 8px 32px rgba(120,70,20,0.3)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShoppingCart style={{ width: "18px", height: "18px", color: "#f5e6d0" }} />
            <span style={{ color: "#f5e6d0", fontWeight: "700", fontSize: "14px" }}>{items.length} service{items.length > 1 ? "s" : ""} in cart</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "12px", color: "rgba(245,230,208,0.7)" }}>${totalSetup} setup · ${totalMonthly}/mo</span>
            <span style={{ background: "rgba(255,255,255,0.15)", color: "#f5e6d0", fontSize: "12px", fontWeight: "700", padding: "6px 16px", borderRadius: "9999px" }}>View Cart →</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "0 24px 24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginBottom: "24px" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1", minWidth: "200px", maxWidth: "300px" }}>
            <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "rgba(154,92,46,0.5)" }} />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", borderRadius: "9999px", border: "1.5px solid rgba(154,92,46,0.2)", padding: "9px 14px 9px 34px", fontSize: "13px", background: "rgba(255,255,255,0.8)", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Category pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  borderRadius: "9999px",
                  padding: "7px 16px",
                  fontSize: "12px",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer",
                  background: activeCategory === cat ? "linear-gradient(135deg,#6b3f1f,#9a5c2e)" : "rgba(154,92,46,0.07)",
                  color: activeCategory === cat ? "#f5e6d0" : "rgba(26,18,9,0.6)",
                  transition: "all 0.2s",
                  boxShadow: activeCategory === cat ? "0 2px 8px rgba(120,70,20,0.25)" : "none",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {filtered.map((product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px", color: "rgba(26,18,9,0.4)" }}>
            <p style={{ fontSize: "16px", fontWeight: "600" }}>No services match your search</p>
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