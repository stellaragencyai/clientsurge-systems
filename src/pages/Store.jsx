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

const InteractiveStackBuilder = lazy(() =>
  import("@/components/store/InteractiveStackBuilder")
);

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
    const recommendedKeys = new Set(
      selectedIndustry?.recommendedServiceKeys || []
    );

    return AI_PRODUCTS.filter((product) => {
      const matchCategory =
        activeCategory === "All" || product.category === activeCategory;
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

  const recommendedPreview = useMemo(
    () => selectedIndustry?.recommendedServices?.slice(0, 4) || [],
    [selectedIndustry]
  );

  const recommendedOverflow = Math.max(
    (selectedIndustry?.recommendedServices?.length || 0) -
      recommendedPreview.length,
    0
  );

  const resultLabel = `${filtered.length} service${
    filtered.length === 1 ? "" : "s"
  }`;

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundImage:
            "url('https://media.base44.com/images/public/69dc4a79656fdba136d413d3/b3df6b4fc_Gemini_Generated_Image_jlrxmdjlrxmdjlrx.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          background:
            "linear-gradient(135deg, rgba(10,6,2,0.76) 0%, rgba(20,11,4,0.72) 46%, rgba(12,7,2,0.8) 100%)",
        }}
      />

      <div style={{ position: "relative", zIndex: 2 }}>
        <style>{`
          .store-page nav {
            background: rgba(16,9,3,0.62) !important;
            border-bottom-color: rgba(200,150,92,0.22) !important;
            backdrop-filter: blur(22px) !important;
            -webkit-backdrop-filter: blur(22px) !important;
          }
          .store-page nav .text-foreground { color: #f5e6d0 !important; }
          .store-page nav .text-muted-foreground { color: rgba(245,230,208,0.72) !important; }
          .store-page nav .border-border { border-color: rgba(200,150,92,0.25) !important; }
          .store-page nav .bg-background\\/50,
          .store-page nav .bg-background\\/70 { background: rgba(255,255,255,0.08) !important; }
          .store-page footer {
            background: rgba(10,5,0,0.7) !important;
            border-top-color: rgba(200,150,92,0.2) !important;
          }
          .store-page .store-hero {
            text-align: center;
            padding: 48px 24px 34px;
            position: relative;
          }
          .store-page .store-hero-copy {
            max-width: 640px;
            margin: 0 auto;
          }
          .store-page .store-stat-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
            max-width: 760px;
            margin: 0 auto;
          }
          .store-page .store-toolbar {
            display: flex;
            flex-wrap: wrap;
            gap: 14px;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
          }
          .store-page .store-searchWrap {
            position: relative;
            flex: 1 1 320px;
            max-width: 390px;
          }
          .store-page .store-filterMeta {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: flex-end;
            flex: 1 1 520px;
          }
          .store-page .store-categories {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          .store-page .store-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 20px;
          }
          .store-page .store-sticky-cart {
            position: sticky;
            top: 64px;
            z-index: 50;
            margin: 0 24px 20px;
            border-radius: 18px;
            background: linear-gradient(135deg, rgba(65,35,15,0.94) 0%, rgba(108,65,30,0.94) 52%, rgba(76,43,19,0.96) 100%);
            padding: 12px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            cursor: pointer;
            box-shadow: 0 10px 28px rgba(12,7,3,0.24);
            border: 1px solid rgba(245,217,168,0.14);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
          }
          .store-page .store-sticky-cart__meta {
            display: flex;
            align-items: center;
            gap: 14px;
            flex-wrap: wrap;
            justify-content: flex-end;
          }
          .store-page .store-recommendation-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 12px;
          }
          .store-page .store-summary-chip {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            padding: 7px 12px;
            font-size: 11px;
            font-weight: 700;
            color: #f6ddb0;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(200,150,92,0.24);
          }
          @media (max-width: 1080px) {
            .store-page .store-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }
          @media (max-width: 720px) {
            .store-page .store-hero {
              padding: 34px 20px 22px;
            }
            .store-page .store-stat-grid {
              grid-template-columns: 1fr;
              gap: 10px;
            }
            .store-page .store-toolbar {
              flex-direction: column;
              align-items: stretch;
            }
            .store-page .store-searchWrap {
              max-width: none;
            }
            .store-page .store-filterMeta {
              justify-content: flex-start;
              flex-direction: column;
              align-items: stretch;
            }
            .store-page .store-grid {
              grid-template-columns: 1fr;
              gap: 16px;
            }
            .store-page .store-sticky-cart {
              margin: 0 16px 18px;
              align-items: stretch;
              flex-direction: column;
            }
            .store-page .store-sticky-cart__meta {
              width: 100%;
              justify-content: space-between;
            }
          }
        `}</style>
        <div className="store-page">
          <Navbar />

          <div id="top" className="store-hero">
            <div className="store-hero-copy">
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  borderRadius: "9999px",
                  padding: "6px 16px",
                  marginBottom: "18px",
                  background: "rgba(200,150,92,0.16)",
                  border: "1px solid rgba(200,150,92,0.34)",
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
                  lineHeight: 1.04,
                  letterSpacing: "-0.02em",
                  color: "#fffdf8",
                  marginBottom: "12px",
                  textShadow: "0 2px 24px rgba(0,0,0,0.6)",
                }}
              >
                Build Your{" "}
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #fff2d2 0%, #e9b45b 48%, #c48a4b 100%)",
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
                  fontSize: "1.02rem",
                  color: "rgba(255,241,218,0.88)",
                  lineHeight: 1.68,
                  maxWidth: "620px",
                  margin: "0 auto 24px",
                }}
              >
                Pick the services you need, add them to your cart, and we handle
                the setup. Your automations go live in 5 to 7 business days.
              </p>
            </div>

            {selectedIndustry ? (
              <div
                style={{
                  maxWidth: "760px",
                  margin: "0 auto 20px",
                  padding: "16px 18px",
                  borderRadius: "24px",
                  background: "rgba(24,14,6,0.52)",
                  border: "1px solid rgba(200,150,92,0.26)",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  boxShadow: "0 12px 34px rgba(0,0,0,0.12)",
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
                    color: "#fff6e8",
                    fontWeight: "600",
                    margin: "0 0 6px",
                  }}
                >
                  We moved your recommended services to the top and suggest
                  starting with the {selectedIndustry.recommendedPackage?.name}.
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "rgba(255,230,180,0.82)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {selectedIndustry.whyItWorks}
                </p>
              </div>
            ) : null}

            <div className="store-stat-grid" style={{ marginBottom: "16px" }}>
              {[
                { label: "AI Services Available", val: "12" },
                { label: "Avg. Setup Time", val: "5-7 days" },
                { label: "Cancel Anytime", val: "No Contracts" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    textAlign: "center",
                    borderRadius: "18px",
                    padding: "14px 16px",
                    background: "rgba(20,11,4,0.38)",
                    border: "1px solid rgba(200,150,92,0.16)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "21px",
                      fontWeight: "800",
                      color: "#f0c878",
                      margin: "0 0 4px",
                      textShadow: "0 2px 10px rgba(0,0,0,0.4)",
                    }}
                  >
                    {stat.val}
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,232,193,0.68)",
                      margin: 0,
                      fontWeight: "600",
                    }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {items.length > 0 ? (
            <div onClick={() => setCartOpen(true)} className="store-sticky-cart">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <ShoppingCart
                  style={{ width: "18px", height: "18px", color: "#f5e6d0" }}
                />
                <span
                  style={{
                    color: "#f5e6d0",
                    fontWeight: "700",
                    fontSize: "14px",
                  }}
                >
                  {items.length} service{items.length > 1 ? "s" : ""} in cart
                </span>
              </div>
              <div className="store-sticky-cart__meta">
                <span
                  style={{
                    fontSize: "12px",
                    color: "rgba(245,230,208,0.78)",
                  }}
                >
                  ${totalSetup} setup - ${totalMonthly}/mo
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
                  View Cart
                </span>
              </div>
            </div>
          ) : null}

          <div
            style={{
              maxWidth: "1300px",
              margin: "0 auto",
              padding: "0 24px 24px",
            }}
          >
            {selectedIndustry ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "18px",
                  padding: "14px 18px",
                  borderRadius: "18px",
                  background: "rgba(20,11,4,0.42)",
                  border: "1px solid rgba(200,150,92,0.22)",
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
                  <div className="store-recommendation-pills">
                    {recommendedPreview.map((service) => (
                      <span
                        key={service.product_id}
                        className="store-summary-chip"
                      >
                        {service.name}
                      </span>
                    ))}
                    {recommendedOverflow > 0 ? (
                      <span className="store-summary-chip">
                        +{recommendedOverflow} more
                      </span>
                    ) : null}
                  </div>
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
                  Reviewing {selectedIndustry.shortName}
                  <ArrowRight style={{ width: "14px", height: "14px" }} />
                </a>
              </div>
            ) : null}

            <div className="store-toolbar">
              <div className="store-searchWrap">
                <Search
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "14px",
                    height: "14px",
                    color: "rgba(255,232,193,0.72)",
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
                    border: "1.5px solid rgba(200,150,92,0.3)",
                    padding: "11px 16px 11px 38px",
                    fontSize: "13px",
                    background: "rgba(22,12,5,0.45)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    outline: "none",
                    boxSizing: "border-box",
                    color: "#fff7eb",
                  }}
                />
              </div>

              <div className="store-filterMeta">
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "rgba(255,232,193,0.86)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {resultLabel}
                </span>
                <div className="store-categories">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      style={{
                        borderRadius: "9999px",
                        padding: "7px 16px",
                        fontSize: "12px",
                        fontWeight: "600",
                        border:
                          activeCategory === category
                            ? "1.5px solid rgba(240,200,120,0.64)"
                            : "1.5px solid rgba(200,150,92,0.22)",
                        cursor: "pointer",
                        background:
                          activeCategory === category
                            ? "linear-gradient(135deg,#6b3f1f,#9a5c2e)"
                            : "rgba(18,10,4,0.42)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        color:
                          activeCategory === category
                            ? "#f5e6d0"
                            : "rgba(255,232,193,0.84)",
                        transition: "all 0.2s",
                        boxShadow:
                          activeCategory === category
                            ? "0 4px 14px rgba(120,70,20,0.36)"
                            : "none",
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="store-grid">
              {filtered.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>

            {filtered.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px",
                  color: "rgba(255,220,160,0.6)",
                }}
              >
                <p style={{ fontSize: "16px", fontWeight: "600" }}>
                  No services match your search
                </p>
              </div>
            ) : null}

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
