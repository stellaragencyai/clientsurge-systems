import { useEffect, useMemo, useState } from "react";
import { Search, LayoutGrid, Clock, BadgeCheck, ShoppingCart, ArrowRight } from "lucide-react";
import { CartProvider, useCart } from "@/lib/cartContext";
import { AI_PRODUCTS, CATEGORIES, getPackageOffer, getPackageServices } from "@/lib/aiProducts";
import ProductCard from "@/components/store/ProductCard";
import CartSidebar from "@/components/store/CartSidebar";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";
import { setPageMetadata } from "@/lib/seo";
import { trackCTA } from "@/lib/analytics";
import { useNavigate, useSearchParams } from "react-router-dom";
import SectionHeader from "@/components/design-system/SectionHeader";

function StoreInner() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const { items, setCartOpen, totalSetup, totalMonthly, replaceItems } = useCart();
  const requestedPackageKey = searchParams.get("package");
  const selectedPackageOffer = useMemo(() => getPackageOffer(requestedPackageKey), [requestedPackageKey]);

  useEffect(() => {
    return setPageMetadata({
      title: "AI Automation Storefront — Browse Installable Systems | ClientSurge Systems",
      description: "Browse installable AI automation systems for lead response, missed-call recovery, follow-up, booking, reviews, and reactivation. Done-for-you setup by ClientSurge.",
      canonicalPath: "/store",
      ogTitle: "AI Automation Storefront | ClientSurge Systems",
      ogDescription: "Choose a packaged AI system, complete guided intake, and let ClientSurge handle setup, testing, and launch readiness.",
      robots: "noindex,nofollow",
    });
  }, []);

  useEffect(() => {
    if (!selectedPackageOffer) return;
    replaceItems(getPackageServices(selectedPackageOffer.package_key));
  }, [replaceItems, selectedPackageOffer]);

  const filteredProducts = useMemo(() => {
    return AI_PRODUCTS.filter((product) => {
      const matchesCategory = activeCategory === "All" || product.category === activeCategory;
      const term = search.trim().toLowerCase();
      const matchesSearch = !term || product.name.toLowerCase().includes(term) || product.description.toLowerCase().includes(term) || product.category.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  const choosePackage = (packageKey) => {
    trackCTA(`store_package_${packageKey}`, "store");
    navigate(`/product-signup?package=${packageKey}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-[calc(var(--cs-nav-height)+40px)]">
        <section className="px-6 pb-10 text-center">
          <SectionHeader
            eyebrow="AI Automation Storefront"
            title={selectedPackageOffer ? `${selectedPackageOffer.customer_facing_name || selectedPackageOffer.name} System` : "The AI Automation Storefront for Service Businesses"}
            subtitle={selectedPackageOffer ? "Your selected ClientSurge system is preloaded. Review what is included, then continue into checkout and guided setup." : "Browse installable AI systems for missed calls, lead response, follow-up, booking, reviews, and reactivation. Choose what you need. ClientSurge installs it."}
          />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
            {[
              { label: "Packaged Systems", value: "Starter / Growth / Pro", Icon: LayoutGrid },
              { label: "Launch Quality", value: "Proof Checked", Icon: Clock },
              { label: "Billing", value: "Month-to-Month", Icon: BadgeCheck },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="rounded-xl border border-primary/15 bg-white p-4 text-left shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center"><Icon className="h-4 w-4 text-primary" /></div>
                  <div><p className="text-sm font-bold text-foreground">{value}</p><p className="text-xs font-semibold text-muted-foreground">{label}</p></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {items.length > 0 && (
          <button type="button" onClick={() => setCartOpen(true)} className="mx-auto mb-8 flex max-w-5xl w-[calc(100%-48px)] items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left shadow-lg" style={{ background: "linear-gradient(135deg, rgba(0,107,176,0.95), rgba(0,174,239,0.95))", color: "#ffffff" }}>
            <span className="inline-flex items-center gap-2 text-sm font-bold"><ShoppingCart className="h-4 w-4" /> {items.length} service{items.length === 1 ? "" : "s"} selected</span>
            <span className="text-xs font-semibold">${totalSetup} setup · ${totalMonthly}/mo · View Cart</span>
          </button>
        )}

        {selectedPackageOffer && (
          <section className="max-w-5xl mx-auto px-6 mb-10">
            <div className="rounded-2xl border border-primary/15 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Selected System</p>
              <h2 className="text-2xl font-titles font-bold text-foreground mb-2">{selectedPackageOffer.customer_facing_name || selectedPackageOffer.name} is ready for guided setup</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{selectedPackageOffer.description} Review the included systems below, then continue into checkout and guided setup.</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {selectedPackageOffer.included_services.map((service) => <span key={service.product_id} className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-2 text-xs font-bold text-foreground"><span>{service.icon}</span>{service.name}</span>)}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => { trackCTA("store_package_checkout", "store"); navigate(`/product-signup?package=${selectedPackageOffer.package_key}`); }} className="cs-btn-primary inline-flex"><ArrowRight className="w-4 h-4" /> Continue to Checkout</button>
                <button onClick={() => { const next = new URLSearchParams(searchParams); next.delete("package"); setSearchParams(next, { replace: true }); }} className="inline-flex items-center justify-center rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted">Browse All Services Instead</button>
              </div>
            </div>
          </section>
        )}

        <section className="max-w-7xl mx-auto px-6 pb-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className="relative md:w-[360px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by problem: missed calls, follow-up, booking, reviews..." className="w-full rounded-full border border-primary/30 bg-white px-10 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button key={category} onClick={() => setActiveCategory(category)} className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${activeCategory === category ? "border-primary bg-primary text-white" : "border-border bg-white text-foreground hover:border-primary/50"}`}>{category}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => <ProductCard key={product.product_id} product={product} />)}
          </div>
          {filteredProducts.length === 0 && <div className="py-20 text-center text-muted-foreground">No services match that search.</div>}
        </section>

        <section className="max-w-7xl mx-auto px-6 pb-16">
          <div className="rounded-2xl border border-primary/15 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Complete Systems</p>
            <h2 className="text-xl font-titles font-bold text-foreground mb-2">Want the fastest path? Start with a complete system.</h2>
            <p className="text-sm text-muted-foreground mb-5">Buying automations one by one is useful, but most businesses move faster by starting with Starter, Growth, or Pro.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { name: "Starter System", key: "starter_system", price: "$797 setup + $497/mo" },
                { name: "Growth System", key: "growth_system", price: "$1,297 setup + $997/mo", badge: "Recommended" },
                { name: "Pro System", key: "pro_system", price: "$2,497 setup + $1,997/mo" },
              ].map((pkg) => (
                <button key={pkg.key} onClick={() => choosePackage(pkg.key)} className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-left hover:border-primary/50 transition">
                  {pkg.badge && <span className="mb-2 inline-flex rounded-full bg-primary px-2 py-1 text-[10px] font-bold uppercase text-white">{pkg.badge}</span>}
                  <p className="font-bold text-foreground">{pkg.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{pkg.price}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <CartSidebar />
    </div>
  );
}

export default function Store() {
  return (
    <DemoBookingProvider>
      <CartProvider><StoreInner /></CartProvider>
    </DemoBookingProvider>
  );
}
