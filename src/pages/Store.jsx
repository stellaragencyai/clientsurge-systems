import { lazy, Suspense, useEffect, useMemo, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Zap, Search, ArrowRight, LayoutGrid, Clock, BadgeCheck } from "lucide-react";
import { CartProvider, useCart } from "@/lib/cartContext";
import { AI_PRODUCTS, CATEGORIES, CANONICAL_SERVICE_PRODUCTS } from "@/lib/aiProducts";
import ProductCard from "@/components/store/ProductCard";
import CartSidebar from "@/components/store/CartSidebar";
import Navbar from "@/components/landing/Navbar";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";
import { getSelectedIndustryRecommendation } from "@/lib/industryRecommendations";
import { PACKAGE_OFFERS } from "@/lib/salesCatalog";
import GuidedPathToggle from "@/components/store/GuidedPathToggle";
import { getRecommendedProducts } from "@/lib/productRecommendations";
import StackValueCounter from "@/components/store/StackValueCounter";
import { setPageMetadata } from "@/lib/seo";

// Lazy load heavy store components
const InteractiveStackBuilder = lazy(() =>
import("@/components/store/InteractiveStackBuilder")
);
const SocialProofTicker = lazy(() => import("@/components/store/SocialProofTicker"));
const ServiceComparisonModal = lazy(() => import("@/components/store/ServiceComparisonModal"));
const Footer = lazy(() => import("@/components/landing/Footer"));
const BuildYourStackFlow = lazy(() => import("@/components/store/BuildYourStackFlow"));
const BundleSavingsToast = lazy(() => import("@/components/store/BundleSavingsToast"));

function StoreInner() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const searchDebounce = useRef(null);

  const handleSearchChange = useCallback((val) => {
    setSearchInput(val);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setSearch(val), 280);
  }, []);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [pathMode, setPathMode] = useState("guided");
  const { items, setCartOpen, totalSetup, totalMonthly } = useCart();

  useEffect(() => {
    const cleanupMeta = setPageMetadata({
      title: "AI Automation Store | ClientSurge Systems",
      description: "Build your custom AI automation stack for your local business. Instant lead response, missed call text-back, 14-day nurture sequences, and more. Start for $97/month.",
      canonicalPath: "/store",
      ogTitle: "AI Automation Store | ClientSurge Systems",
      ogDescription: "Pick the AI automations your business needs. Done-for-you setup in 5–7 business days. No contracts."
    });
    return cleanupMeta;
  }, []);

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
            whyItWorks: pkg.fit
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

    // In guided mode: show recommended services if industry selected, else show all purchasable
    if (pathMode === "guided") {
      if (selectedIndustry) {
        const recommendedNames = new Set(
          selectedIndustry?.recommendedServices?.map((s) => s.name) || []
        );
        results = results.filter((p) => recommendedNames.has(p.name)).slice(0, 6);
      } else {
        // No industry selected — show all checkout-enabled (non-coming-soon) products
        results = results.filter((p) => p.checkout_enabled !== false && !p.coming_soon);
      }
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
  filtered.length === 1 ? "" : "s"}`;


  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
        position: "relative"
      }}>
      
      

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
          /* AI Module tab active glow */
          .ai-module-btn {
            position: relative;
            overflow: hidden;
          }
          .ai-module-btn::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 8px;
            opacity: 0;
            background: radial-gradient(ellipse at center, rgba(200,150,92,0.25) 0%, transparent 70%);
            transition: opacity 0.3s ease;
          }
          .ai-module-btn:hover::after { opacity: 1; }
          .ai-module-btn.active-module::after { opacity: 1; }
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
              max-width: 100%;
              padding: 0 4px;
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


              <h1
                className="font-display"
                style={{
                  fontSize: "clamp(1.5rem, 4.5vw, 2.6rem)",
                  fontWeight: "800",
                  lineHeight: 1.08,
                  letterSpacing: "-0.035em",
                  color: "rgba(245,225,195,0.95)",
                  marginBottom: "8px"
                }}>
                
                Build Your{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #f5d9a8 0%, #c8965c 52%, #e8b87a 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    filter: "drop-shadow(0 0 18px rgba(200,150,92,0.5))"
                  }}>
                  
                  AI-Powered Business
                </span>
              </h1>

              <p
                style={{
                  fontSize: "0.9rem",
                  color: "rgba(220,190,150,0.65)",
                  lineHeight: 1.6,
                  maxWidth: "620px",
                  margin: "0 auto 12px"
                }}>
                
                Pick the services you need, add them to your cart, and we handle
                the setup. Your automations go live in 5 to 7 business days.
              </p>
            </div>

            {selectedIndustry ?
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
                fontSize: "12px"
              }}>
              
                <p
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#9a5c2e",
                  margin: "0 0 4px"
                }}>
                
                  Personalized For {selectedIndustry.shortName}
                </p>
                <p
                style={{
                  fontSize: "13px",
                  color: "#1b140d",
                  fontWeight: "600",
                  margin: "0 0 2px",
                  lineHeight: 1.4
                }}>
                
                  Recommended: {selectedIndustry.recommendedPackage?.name}
                </p>
              </div> :
            null}

            <div className="store-stat-grid" style={{ marginBottom: "8px" }}>
              {[
              { label: "AI Services Available", val: "12", Icon: LayoutGrid },
              { label: "Avg. Setup Time", val: "4–6 Hours", Icon: Clock },
              { label: "Cancel Anytime", val: "No Contracts", Icon: BadgeCheck }].
              map(({ label, val, Icon }, idx) =>
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 28, delay: idx * 0.1 }}
                whileHover={{ y: -2, boxShadow: "0 10px 28px rgba(154,92,46,0.13)" }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  borderRadius: "14px",
                  padding: "14px 18px",
                  background: "#ffffff",
                  border: "1.5px solid rgba(0,0,0,0.1)",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.07)",
                  cursor: "default"
                }}>
                
                  <div style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, rgba(154,92,46,0.12) 0%, rgba(200,150,92,0.08) 100%)",
                  border: "1px solid rgba(154,92,46,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                    <Icon style={{ width: "18px", height: "18px", color: "#9a5c2e" }} />
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <p style={{ fontSize: "15px", fontWeight: "800", color: "#000000", margin: "0 0 2px" }}>
                      {val}
                    </p>
                    <p style={{ fontSize: "10px", color: "rgba(27,20,13,0.6)", margin: 0, fontWeight: "600" }}>
                      {label}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {items.length > 0 ?
          <div onClick={() => setCartOpen(true)} className="store-sticky-cart">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <ShoppingCart
                style={{ width: "18px", height: "18px", color: "#f5e6d0" }} />
              
                <span
                style={{
                  color: "#f5e6d0",
                  fontWeight: "700",
                  fontSize: "14px"
                }}>
                
                  {items.length} service{items.length > 1 ? "s" : ""} in cart
                </span>
              </div>
              <div className="store-sticky-cart__meta">
                <span
                style={{
                  fontSize: "12px",
                  color: "rgba(245,230,208,0.78)"
                }}>
                
                  ${totalSetup} setup - ${totalMonthly}/mo
                </span>
                <span
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "#f5e6d0",
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "6px 16px",
                  borderRadius: "9999px"
                }}>
                
                  View Cart
                </span>
              </div>
            </div> :
          null}

          <div
            style={{
              maxWidth: "1300px",
              margin: "0 auto",
              padding: "0 24px 24px"
            }}>
            


            <div style={{ display: "flex", gap: "10px", marginBottom: "18px", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
              






















              
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
                    color: "rgba(154,92,46,0.6)"
                  }} />
                
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchInput}
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
                    boxShadow: "0 2px 8px rgba(111,67,31,0.05)"
                  }} />
                
              </div>

              <div className="store-filterMeta">
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "rgba(27,20,13,0.55)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase"
                  }}>
                  
                  {resultLabel}
                </span>
                <div className="store-categories">
                  {CATEGORIES.filter((cat) => {
                    if (cat === "All") return true;
                    return CANONICAL_SERVICE_PRODUCTS.some((p) => p.category === cat && p.checkout_enabled && !p.coming_soon);
                  }).map((category) =>
                  <motion.button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    whileHover={{ y: -1, scale: 1.03 }}
                    whileTap={{ scale: 0.94 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    style={{
                      borderRadius: "9999px",
                      padding: "7px 16px",
                      fontSize: "12px",
                      fontWeight: "600",
                      border:
                      activeCategory === category ?
                      "1.5px solid rgba(0,136,204,0.6)" :
                      "1.5px solid rgba(154,92,46,0.18)",
                      cursor: "pointer",
                      background:
                      activeCategory === category ?
                      "linear-gradient(135deg,#0088CC,#00AEEF)" :
                      "rgba(255,255,255,0.75)",
                      color:
                      activeCategory === category ?
                      "#ffffff" :
                      "rgba(27,20,13,0.72)",
                      boxShadow:
                      activeCategory === category ?
                      "0 4px 14px rgba(0,174,239,0.35)" :
                      "0 1px 4px rgba(111,67,31,0.06)"
                    }}>
                    
                      {category}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            <div className="store-grid">
              {filtered.map((product) =>
              <ProductCard key={product.product_id} product={product} />
              )}
            </div>

            {filtered.length === 0 ?
            <div
              style={{
                textAlign: "center",
                padding: "48px",
                color: "rgba(27,20,13,0.45)"
              }}>
              
                <p style={{ fontSize: "16px", fontWeight: "600" }}>
                  {pathMode === "guided" && !selectedIndustry ?
                "No services available — try 'Explore All'" :
                pathMode === "guided" && selectedIndustry ?
                "Try switching to 'Explore All' to see more services" :
                "No services match your search"}
                </p>
              </div> :
            null}

            {items.length > 0 ?
            <Suspense fallback={null}>
                <InteractiveStackBuilder />
              </Suspense> :
            null}
          </div>

          <Suspense fallback={null}>
            <BuildYourStackFlow />
            <BundleSavingsToast />
          </Suspense>
           <CartSidebar />
           {/* S25: Talk to a Human — escape valve for overwhelmed visitors */}
           <div style={{
            background: "linear-gradient(135deg, rgba(154,92,46,0.06), rgba(200,150,92,0.03))",
            borderTop: "1px solid rgba(154,92,46,0.1)",
            padding: "28px 24px",
            textAlign: "center"
          }}>
             <p style={{ fontSize: "14px", color: "rgba(27,20,13,0.6)", margin: "0 0 12px" }}>
               Not sure what your business needs?
             </p>
             <a
              href="/book"
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: "linear-gradient(135deg, #0088CC, #00AEEF)",
                color: "#ffffff", fontWeight: "700", fontSize: "13px",
                padding: "10px 22px", borderRadius: "999px", textDecoration: "none",
                boxShadow: "0 4px 14px rgba(0,174,239,0.35)"
              }}>
              
               📞 Book a free 15-min strategy call
             </a>
             <p style={{ fontSize: "11px", color: "rgba(27,20,13,0.35)", marginTop: "10px" }}>
               We'll tell you exactly which services will move the needle for your business.
             </p>
           </div>
           <Suspense fallback={null}>
             <Footer />
             <SocialProofTicker />
           </Suspense>
           {showComparison &&
          <Suspense fallback={null}>
               <ServiceComparisonModal onClose={() => setShowComparison(false)} />
             </Suspense>
          }
        </div>
      </div>
    </div>);

}

export default function Store() {
  return (
    <DemoBookingProvider>
      <CartProvider>
        <StoreInner />
      </CartProvider>
    </DemoBookingProvider>);

}