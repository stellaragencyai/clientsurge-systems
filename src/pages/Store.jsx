import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { ShoppingCart, Zap, Search, ArrowRight } from "lucide-react";
import { CartProvider, useCart } from "@/lib/cartContext";
import { AI_PRODUCTS, CATEGORIES } from "@/lib/aiProducts";
import ProductCard from "@/components/store/ProductCard";
import CartSidebar from "@/components/store/CartSidebar";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";
import { getSelectedIndustryRecommendation } from "@/lib/industryRecommendations";

const InteractiveStackBuilder = lazy(() => import("@/components/store/InteractiveStackBuilder"));

function StoreInner() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const { items, setCartOpen, totalSetup, totalMonthly } = useCart();

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncIndustry = () => {
      setSelectedIndustry(getSelectedIndustryRecommendation());
    };

    syncIndustry();
    window.addEventListener("storage", syncIndustry);
    window.addEventListener("clientsurge:industry-selected", syncIndustry);

    return () => {
      window.removeEventListener("storage", syncIndustry);
      window.removeEventListener("clientsurge:industry-selected", syncIndustry);
    };
  }, []);

  const filtered = useMemo(() => {
    const recommendedKeys = new Set(selectedIndustry?.recommendedServiceKeys || []);

    return AI_PRODUCTS.filter((product) => {
      const matchCategory = activeCategory === "All" || product.category === activeCategory;
      const matchSearch =
        !search ||
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    }).sort((left, right) => {
      const leftRecommended = recommendedKeys.has(left.service_key);
      const rightRecommended = recommendedKeys.has(right.service_key);

      if (leftRecommended === rightRecommended) {
        return 0;
      }

      return leftRecommended ? -1 : 1;
    });
  }, [activeCategory, search, selectedIndustry]);

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
      }}
    >
      {/* Full-page wallpaper */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundImage: "url('https://media.base44.com/images/public/69dc4a79656fdba136d413d3/b3df6b4fc_Gemini_Generated_Image_jlrxmdjlrxmdjlrx.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Dark overlay for readability */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          background: "linear-gradient(135deg, rgba(15,8,2,0.62) 0%, rgba(30,15,5,0.55) 50%, rgba(20,10,2,0.65) 100%)",
        }}
      />

      {/* All content sits above the fixed background */}
      <div style={{ position: "relative", zIndex: 2 }}>
      <style>{`
        .store-page nav {
          background: rgba(15,8,2,0.35) !important;
          border-bottom-color: rgba(200,150,92,0.2) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
        }
        .store-page nav .text-foreground { color: #f5e6d0 !important; }
        .store-page nav .text-muted-foreground { color: rgba(245,230,208,0.6) !important; }
        .store-page nav .border-border { border-color: rgba(200,150,92,0.25) !important; }
        .store-page nav .bg-background\\/50, .store-page nav .bg-background\\/70 { background: rgba(255,255,255,0.06) !important; }
        .store-page footer { background: rgba(10,5,0,0.7) !important; border-top-color: rgba(200,150,92,0.2) !important; }
      `}</style>
      <div className="store-page">
      <Navbar />

      <div style={{ textAlign: "center", padding: "64px 24px 48px", position: "relative" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            borderRadius: "9999px",
            padding: "6px 16px",
            marginBottom: "20px",
            background: "rgba(200,150,92,0.18)",
            border: "1px solid rgba(200,150,92,0.4)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <Zap style={{ width: "12px", height: "12px", color: "#f0c878" }} />
          <span
            style={{
              fontSize: "11px",
              fontWeight: "700",
              color: "#f0c878",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            AI Services Marketplace
          </span>
        </div>
        <h1
          className="font-display"
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: "800",
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            color: "#fff",
            marginBottom: "16px",
            textShadow: "0 2px 20px rgba(0,0,0,0.5)",
          }}
        >
          Build Your{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #f5d9a8 0%, #e8a84a 50%, #c8965c 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AI-Powered Business
          </span>
        </h1>
        <p
          style={{
            fontSize: "1.1rem",
            color: "rgba(255,240,210,0.75)",
            lineHeight: 1.7,
            maxWidth: "560px",
            margin: "0 auto 32px",
          }}
        >
          Pick the AI services you need, add them to your cart, and we handle the entire setup.
          Your automations go live within 5-7 days.
        </p>

        {selectedIndustry ? (
          <div
            style={{
              maxWidth: "760px",
              margin: "0 auto 28px",
              padding: "18px 22px",
              borderRadius: "24px",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(200,150,92,0.35)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#f0c878",
                margin: "0 0 8px",
              }}
            >
              Personalized For {selectedIndustry.shortName}
            </p>
            <p
              style={{
                fontSize: "15px",
                color: "#fff",
                fontWeight: "600",
                margin: "0 0 6px",
              }}
            >
              We moved your recommended services to the top and suggest starting with the{" "}
              {selectedIndustry.recommendedPackage?.name}.
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "rgba(255,230,180,0.7)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {selectedIndustry.whyItWorks}
            </p>
          </div>
        ) : null}

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "24px", marginBottom: "16px" }}>
          {[
            { label: "AI Services Available", val: "12" },
            { label: "Avg. Setup Time", val: "5-7 days" },
            { label: "Cancel Anytime", val: "No Contracts" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <p style={{ fontSize: "20px", fontWeight: "800", color: "#f0c878", margin: "0 0 2px", textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}>
                {stat.val}
              </p>
              <p style={{ fontSize: "11px", color: "rgba(255,220,160,0.55)", margin: 0, fontWeight: "600" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {items.length > 0 && (
        <div
          onClick={() => setCartOpen(true)}
          style={{
            position: "sticky",
            top: "64px",
            zIndex: 50,
            margin: "0 24px 24px",
            borderRadius: "16px",
            background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(120,70,20,0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShoppingCart style={{ width: "18px", height: "18px", color: "#f5e6d0" }} />
            <span style={{ color: "#f5e6d0", fontWeight: "700", fontSize: "14px" }}>
              {items.length} service{items.length > 1 ? "s" : ""} in cart
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "12px", color: "rgba(245,230,208,0.7)" }}>
              ${totalSetup} setup · ${totalMonthly}/mo
            </span>
            <span
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#f5e6d0",
                fontSize: "12px",
                fontWeight: "700",
                padding: "6px 16px",
                borderRadius: "9999px",
              }}
            >
              View Cart →
            </span>
          </div>
        </div>
      )}

      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "0 24px 24px" }}>
        {selectedIndustry ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "18px",
              padding: "14px 18px",
              borderRadius: "18px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(200,150,92,0.3)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#f0c878",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  margin: "0 0 4px",
                }}
              >
                Recommended Stack
              </p>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#fff",
                  margin: 0,
                }}
              >
                {selectedIndustry.recommendedServices.map((service) => service.name).join(" • ")}
              </p>
            </div>
            <a
              href="#top"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                fontWeight: "700",
                color: "#f0c878",
                textDecoration: "none",
              }}
            >
              Reviewing {selectedIndustry.shortName} recommendations
              <ArrowRight style={{ width: "14px", height: "14px" }} />
            </a>
          </div>
        ) : null}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginBottom: "24px" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "200px", maxWidth: "300px" }}>
            <Search
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "14px",
                height: "14px",
                color: "rgba(240,200,120,0.6)",
              }}
            />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{
                width: "100%",
                borderRadius: "9999px",
                border: "1.5px solid rgba(200,150,92,0.35)",
                padding: "9px 14px 9px 34px",
                fontSize: "13px",
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                outline: "none",
                boxSizing: "border-box",
                color: "#fff",
              }}
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                style={{
                  borderRadius: "9999px",
                  padding: "7px 16px",
                  fontSize: "12px",
                  fontWeight: "600",
                  border: activeCategory === category ? "1.5px solid rgba(240,200,120,0.6)" : "1.5px solid rgba(200,150,92,0.25)",
                  cursor: "pointer",
                  background: activeCategory === category
                    ? "linear-gradient(135deg,#6b3f1f,#9a5c2e)"
                    : "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  color: activeCategory === category ? "#f5e6d0" : "rgba(255,220,160,0.8)",
                  transition: "all 0.2s",
                  boxShadow: activeCategory === category ? "0 2px 12px rgba(120,70,20,0.4)" : "none",
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
          <div style={{ textAlign: "center", padding: "48px", color: "rgba(255,220,160,0.5)" }}>
            <p style={{ fontSize: "16px", fontWeight: "600" }}>No services match your search</p>
          </div>
        )}

        {items.length > 0 ? (
          <Suspense fallback={null}>
            <InteractiveStackBuilder />
          </Suspense>
        ) : null}
      </div>

      <CartSidebar />
      <Footer />
      </div>
      </div>
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