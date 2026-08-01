import { useEffect, useMemo, useState } from "react";
import { Search, LayoutGrid, Clock, BadgeCheck, ShoppingCart, ArrowRight } from "lucide-react";
import { CartProvider, useCart } from "@/lib/cartContext";
import { AI_PRODUCTS, CATEGORIES, PACKAGE_OFFERS, formatCurrency, getPackageOffer, getPackageServices } from "@/lib/aiProducts";
import ProductCard from "@/components/store/ProductCard";
import CartSidebar from "@/components/store/CartSidebar";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";
import { setPageMetadata } from "@/lib/seo";
import { trackCTA } from "@/lib/analytics";
import { useSearchParams } from "react-router-dom";
import Breadcrumb from "@/components/seo/Breadcrumb";

const checkoutHrefForPackage = (packageKey) => `/product-signup?package=${encodeURIComponent(packageKey)}`;

function StoreHeroHeader({ selectedPackageOffer }) {
  const eyebrow = selectedPackageOffer ? "SELECTED SYSTEM" : "THE AUTOMATION STORE";
  const title = selectedPackageOffer
    ? `${selectedPackageOffer.customer_facing_name || selectedPackageOffer.name} System`
    : "Six Systems That Protect Every Lead";
  const subtitle = selectedPackageOffer
    ? "Your selected ClientSurge system is preloaded. Review what is included, then continue into checkout and guided setup."
    : "Browse the automation stack — capture, recover, follow up, book, request reviews, and reactivate. Add individual modules or pick a full system. No demos required.";

  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
      <p className="mb-6 text-xs font-black uppercase tracking-[0.28em] text-primary md:text-sm">
        {eyebrow}
      </p>
      <div className="flex w-full items-center justify-center gap-4 md:gap-6">
        <span
          aria-hidden="true"
          className="hidden h-[clamp(2.25rem,4vw,3.5rem)] w-1.5 flex-shrink-0 rounded-full bg-primary shadow-[0_0_18px_rgba(0,174,239,0.55)] sm:block"
        />
        <h1 className="max-w-[940px] text-center font-titles text-[clamp(2rem,3.4vw,3.75rem)] font-black leading-[1.03] tracking-[-0.045em] text-foreground">
          {title}
        </h1>
      </div>
      <p className="mx-auto mt-7 max-w-5xl text-center text-[clamp(1.05rem,1.55vw,1.35rem)] leading-relaxed text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}

function StoreInner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const { items, setCartOpen, totalSetup, totalMonthly, replaceItems } = useCart();
  const requestedPackageKey = searchParams.get("package");
  const selectedPackageOffer = useMemo(() => getPackageOffer(requestedPackageKey), [requestedPackageKey]);

  useEffect(() => {
    return setPageMetadata({
      title: "The Automation Store | Six Systems That Protect Every Lead | ClientSurge Systems",
      description: "Browse the ClientSurge automation stack: capture, recover, follow up, book, request reviews, and reactivate. Add individual modules or pick a full system.",
      canonicalPath: "/store",
      ogTitle: "The Automation Store | ClientSurge Systems",
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

  const trackPackageSelection = (packageKey) => {
    trackCTA(`store_package_${packageKey}`, "store");
  };

  const packageLinks = useMemo(() => (
    PACKAGE_OFFERS.map((offer) => ({
      name: offer.customer_facing_name || offer.name,
      key: offer.package_key,
      price: `${formatCurrency(offer.setup_total)} setup + ${formatCurrency(offer.monthly_total)}/mo`,
      badge: offer.package_key === "growth_system" ? "Recommended" : "",
    }))
  ), []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 pt-[calc(var(--cs-nav-height)+1rem)]">
        <Breadcrumb items={[{ label: "Store", path: "/store" }]} />
      </div>
      <main className="pt-[calc(var(--cs-nav-height)+40px)]">
        <section className="px-6 pb-12 text-center">
          <StoreHeroHeader selectedPackageOffer={selectedPackageOffer} />
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
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
                <a
                  href={checkoutHrefForPackage(selectedPackageOffer.package_key)}
                  onClick={() => trackCTA("store_package_checkout", "store")}
                  className="cs-btn-primary inline-flex items-center gap-2 no-underline"
                >
                  <ArrowRight className="w-4 h-4" /> Continue to Checkout
                </a>
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
              {packageLinks.map((pkg) => (
                <a
                  key={pkg.key}
                  href={checkoutHrefForPackage(pkg.key)}
                  onClick={() => trackPackageSelection(pkg.key)}
                  className="block rounded-xl border border-primary/20 bg-primary/5 p-4 text-left no-underline hover:border-primary/50 transition"
                >
                  {pkg.badge && <span className="mb-2 inline-flex rounded-full bg-primary px-2 py-1 text-[10px] font-bold uppercase text-white">{pkg.badge}</span>}
                  <p className="font-bold text-foreground">{pkg.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{pkg.price}</p>
                </a>
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
