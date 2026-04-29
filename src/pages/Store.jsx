import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { ShoppingCart, Zap, Search, ArrowRight } from "lucide-react";
import { CartProvider, useCart } from "@/lib/cartContext";
import { AI_PRODUCTS, CATEGORIES } from "@/lib/aiProducts";
import ProductCard from "@/components/store/ProductCard";
import CartSidebar from "@/components/store/CartSidebar";
import SocialProofTicker from "@/components/store/SocialProofTicker";
import ServiceComparisonModal from "@/components/store/ServiceComparisonModal";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";
import { getSelectedIndustryRecommendation } from "@/lib/industryRecommendations";
import { PACKAGE_OFFERS } from "@/lib/salesCatalog";
import BuildYourStackFlow from "@/components/store/BuildYourStackFlow";
import GuidedPathToggle from "@/components/store/GuidedPathToggle";
import { getRecommendedProducts } from "@/lib/productRecommendations";
import StackValueCounter from "@/components/store/StackValueCounter";
import BundleSavingsToast from "@/components/store/BundleSavingsToast";

const InteractiveStackBuilder = lazy(() =>
  import("@/components/store/InteractiveStackBuilder")
);

function StoreInner() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [pathMode, setPathMode] = useState("guided");
  const { items, setCartOpen, totalSetup, totalMonthly } = useCart();

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncIndustry = () => {
      // Check if quiz routed here with a package key
      const quizPackage = window.sessionStorage.getItem("clientsurge:quiz-package");
      if (quizPackage) {
        const pkg = PACKAGE_OFFERS.find((p) => p.package_key === quizPackage);
        if (pkg) {
          setSelectedIndustry({
            shortName: pkg.name,
            recommendedPackage: pkg,
            recommendedServiceKeys: pkg.included_service_keys,
            recommendedServices: pkg.included_services.map((s) => ({ ...s, whyThisMatters: s.description })),
            whyItWorks: pkg.fit,
          });
          return;
        }
      }
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

    let results = AI_PRODUCTS.filter((product) => {
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

    // In guided mode, show only recommended + featured services
    if (pathMode === "guided" && selectedIndustry) {
      const recommendedNames = new Set(
        selectedIndustry?.recommendedServices?.map((s) => s.name) || []
      );
      results = results.filter(
        (p) => recommendedNames.has(p.name)
      ).slice(0, 6);
    }

    return results;
  }, [activeCategory, search, selectedIndustry, pathMode]);

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
          background: "linear-gradient(180deg, #fdfbf8 0%, #f8f3eb 46%, #fcfaf6 100%)",
        }}
      />
      {/* Subtle texture overlay matching main page */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          backgroundImage: "url('https://media.base44.com/images/public/69dc4a79656fdba136d413d3/10c852a82_generated_image.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.05,
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 2 }}>
        <style>{`
          .store-page nav {
            background: rgba(253,251,248,0.85) !important;
            border-bottom-color: rgba(154,92,46,0.14) !important;
            backdrop-filter: blur(22px) !important;
            -webkit-backdrop-filter: blur(22px) !important;
          }
          .store-page .store-hero {
            text-align: center;
            padding: 24px 24px 14px;
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
            gap: 28px;
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
              gap: 24px;
            }
          }
          @media (max-width: 720px) {
            .store-page .store-hero {
              padding: 18px 16px 10px;
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
              gap: 20px;
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
                  background: "rgba(154,92,46,0.08)",
                  border: "1px solid rgba(154,92,46,0.18)",
                }}
              >
                <Zap style={{ width: "12px", height: "12px", color: "#9a5c2e" }} />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#9a5c2e",
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
                 fontSize: "clamp(1.5rem, 4.5vw, 2.6rem)",
                 fontWeight: "800",
                 lineHeight: 1.08,
                 letterSpacing: "-0.035em",
                 color: "#1b140d",
                 marginBottom: "8px",
               }}
              >
                Build Your{" "}
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #7a3f1a 0%, #c8965c 52%, #9a5c2e 100%)",
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
                  fontSize: "0.9rem",
                  color: "rgba(27,20,13,0.72)",
                  lineHeight: 1.6,
                  maxWidth: "620px",
                  margin: "0 auto 12px",
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
                  margin: "0 auto 10px",
                  padding: "8px 12px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.4)",
                  border: "none",
                  borderBottom: "1px solid rgba(154,92,46,0.1)",
                  boxShadow: "none",
                  fontSize: "12px",
                }}
              >
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#9a5c2e",
                    margin: "0 0 4px",
                  }}
                >
                  Personalized For {selectedIndustry.shortName}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#1b140d",
                    fontWeight: "600",
                    margin: "0 0 2px",
                    lineHeight: 1.4,
                  }}
                >
                  Recommended: {selectedIndustry.recommendedPackage?.name}
                </p>
              </div>
            ) : null}

            <div className="store-stat-grid" style={{ marginBottom: "8px" }}>
              {[
                { label: "AI Services Available", val: "12" },
                { label: "Avg. Setup Time", val: "4-6 hours" },
                { label: "Cancel Anytime", val: "No Contracts" },
              ].map((stat) => (
                <div
                 key={stat.label}
                 style={{
                   textAlign: "center",
                   borderRadius: "10px",
                   padding: "8px 10px",
                   background: "rgba(255,255,255,0.4)",
                   border: "none",
                   borderTop: "1px solid rgba(154,92,46,0.08)",
                   boxShadow: "none",
                 }}
                >
                 <p
                   style={{
                     fontSize: "16px",
                     fontWeight: "800",
                     color: "#9a5c2e",
                     margin: "0 0 2px",
                   }}
                 >
                   {stat.val}
                 </p>
                 <p
                   style={{
                     fontSize: "10px",
                     color: "rgba(27,20,13,0.6)",
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


            <StackValueCounter />

            <div style={{ display: "flex", gap: "10px", marginBottom: "18px", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => setShowComparison(true)}
                style={{
                  borderRadius: "9999px",
                  padding: "8px 20px",
                  fontSize: "12px",
                  fontWeight: "600",
                  border: "1.5px solid rgba(154,92,46,0.3)",
                  background: "rgba(255,255,255,0.7)",
                  color: "#9a5c2e",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.9)";
                  e.currentTarget.style.borderColor = "rgba(154,92,46,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.7)";
                  e.currentTarget.style.borderColor = "rgba(154,92,46,0.3)";
                }}
              >
                📊 Compare All Services
              </button>
              <GuidedPathToggle mode={pathMode} onModeChange={setPathMode} />
            </div>

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
                    color: "rgba(154,92,46,0.6)",
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
                    border: "1.5px solid rgba(154,92,46,0.22)",
                    padding: "11px 16px 11px 38px",
                    fontSize: "13px",
                    background: "rgba(255,255,255,0.85)",
                    outline: "none",
                    boxSizing: "border-box",
                    color: "#1b140d",
                    boxShadow: "0 2px 8px rgba(111,67,31,0.05)",
                  }}
                />
              </div>

              <div className="store-filterMeta">
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "rgba(27,20,13,0.55)",
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
                            ? "1.5px solid rgba(154,92,46,0.5)"
                            : "1.5px solid rgba(154,92,46,0.18)",
                        cursor: "pointer",
                        background:
                          activeCategory === category
                            ? "linear-gradient(135deg,#6b3f1f,#9a5c2e)"
                            : "rgba(255,255,255,0.75)",
                        color:
                          activeCategory === category
                            ? "#f5e6d0"
                            : "rgba(27,20,13,0.72)",
                        transition: "all 0.2s",
                        boxShadow:
                          activeCategory === category
                            ? "0 4px 14px rgba(120,70,20,0.28)"
                            : "0 1px 4px rgba(111,67,31,0.06)",
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="store-grid">
              {filtered.map((product) => {
                const recommendations = getRecommendedProducts(
                  product.product_id,
                  AI_PRODUCTS
                );
                return (
                  <ProductCard product={product} />
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px",
                  color: "rgba(27,20,13,0.45)",
                }}
              >
                <p style={{ fontSize: "16px", fontWeight: "600" }}>
                  {pathMode === "guided" && selectedIndustry
                    ? "Try switching to 'Explore All' to see more services"
                    : "No services match your search"}
                </p>
              </div>
            ) : null}

            {items.length > 0 ? (
              <Suspense fallback={null}>
                <InteractiveStackBuilder />
              </Suspense>
            ) : null}
          </div>

          <BuildYourStackFlow />
          <CartSidebar />
          <Footer />
          <SocialProofTicker />
          <BundleSavingsToast />
          {showComparison && <ServiceComparisonModal onClose={() => setShowComparison(false)} />}
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