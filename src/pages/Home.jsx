import { useEffect, useMemo, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { useHashNavigation } from "../hooks/useHashNavigation";
import Navbar from "../components/landing/Navbar";
import CinematicHero from "../components/landing/CinematicHero.jsx";
import RevenueLeakSection from "../components/landing/RevenueLeakSection.jsx";
import { DemoBookingProvider } from "../components/landing/DemoBookingContext";

import ChatBubble from "../components/landing/ChatBubble";
import Footer from "../components/landing/Footer";
import ScrollProgressBar from "../components/landing/ScrollProgressBar";
import { SectionSkeleton } from "../components/landing/SkeletonLoader";
import { FAQ_ITEMS } from "../components/landing/FAQData";
import ThreeSystemsSection from "../components/landing/ThreeSystemsSection";
import SixAutomationsSection from "../components/landing/SixAutomationsSection.jsx";
import ROICalculator from "../components/landing/ROICalculator.jsx";
import SectionErrorBoundary from "../components/SectionErrorBoundary.jsx";

const Industries = lazy(() => import("../components/landing/Industries"));
const FinalCTA = lazy(() => import("../components/landing/FinalCTA"));

import {
  getFAQSchema,
  getLocalBusinessSchema,
  getOrganizationSchema,
  getProductSchema,
  getServiceSchema,
  getWebsiteSchema,
} from "../components/SEO/SchemaMarkup";
import { setJsonLd, setPageMetadata } from "@/lib/seo";

function isEditorSandbox() {
  try {
    const h = window.location.hostname;
    return h.includes("preview-sandbox") || h.includes("base44");
  } catch {
    return true;
  }
}

function LazyHomepageSection({ children, fallback }) {
  return (
    <SectionErrorBoundary sectionName="lazy-section">
      <Suspense fallback={fallback}>{children}</Suspense>
    </SectionErrorBoundary>
  );
}

export default function Home() {
  const location = useLocation();
  useHashNavigation();

  // Optimized hash-scroll: uses requestAnimationFrame with a max attempt count
  // to avoid redundant setTimeout chains when multiple sections mount.
  useEffect(() => {
    if (!location.hash) return undefined;

    const id = decodeURIComponent(location.hash.slice(1));
    let attempts = 0;
    let rafId;

    const scrollToHashTarget = () => {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (attempts < 24) {
        attempts += 1;
        rafId = window.requestAnimationFrame(scrollToHashTarget);
      }
    };

    rafId = window.requestAnimationFrame(scrollToHashTarget);
    return () => window.cancelAnimationFrame(rafId);
  }, [location.hash]);

  // Memoize SEO schemas so they only compute once per mount.
  const schemas = useMemo(() => ({
    organization: getOrganizationSchema(),
    localBusiness: getLocalBusinessSchema(),
    service: getServiceSchema(),
    product: getProductSchema(),
    website: getWebsiteSchema(),
    faq: getFAQSchema(FAQ_ITEMS),
  }), []);

  useEffect(() => {
    if (isEditorSandbox()) return () => {};
    if (typeof document === "undefined" || !document.head) return () => {};

    const cleanups = [];

    try {
      cleanups.push(setPageMetadata({
        title: "ClientSurge Systems | The Amazon of AI Services for Business",
        description: "Browse packaged AI systems for lead capture, missed-call recovery, AI follow-up, booking, reviews, and reactivation. Add to cart, check out, and we install it — no demos required.",
        canonicalPath: "/",
        ogTitle: "The Amazon of AI Services for Business | ClientSurge Systems",
        ogDescription: "Browse AI automation systems, add to cart, and check out. Done-for-you setup included. No demos, no sales calls. Lead capture, missed-call recovery, follow-up, booking, reviews, and reactivation.",
      }));
    } catch (_e) {}

    try { cleanups.push(setJsonLd("organization", schemas.organization)); } catch (_e) {}
    try { cleanups.push(setJsonLd("local-business", schemas.localBusiness)); } catch (_e) {}
    try { cleanups.push(setJsonLd("service", schemas.service)); } catch (_e) {}
    try { cleanups.push(setJsonLd("product", schemas.product)); } catch (_e) {}
    try { cleanups.push(setJsonLd("website", schemas.website)); } catch (_e) {}
    try { cleanups.push(setJsonLd("faq", schemas.faq)); } catch (_e) {}

    return () => {
      cleanups.forEach((fn) => { try { fn(); } catch (_e) {} });
    };
  }, [schemas]);

  return (
    <DemoBookingProvider>
      <div className="min-h-screen">
        <ScrollProgressBar />
        <Navbar />

        {/* 1. Cinematic Hero — primary value prop + CTA */}
        <SectionErrorBoundary sectionName="hero" fallbackMessage="Welcome to ClientSurge Systems.">
          <CinematicHero />
        </SectionErrorBoundary>

        {/* 2. Industries — first post-hero section so visitors immediately find their vertical */}
        <div id="industries" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
        <LazyHomepageSection fallback={<SectionSkeleton height="600px" />}>
          <Industries />
        </LazyHomepageSection>

        {/* 3. Six Core Automations — what the system does */}
        <div id="automations" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
        <SectionErrorBoundary sectionName="automations" fallbackMessage="Automation details loading.">
          <SixAutomationsSection />
        </SectionErrorBoundary>

        {/* 4. Revenue Leak — problem framing */}
        <SectionErrorBoundary sectionName="revenue-leak">
          <RevenueLeakSection />
        </SectionErrorBoundary>

        {/* 4b. ROI Calculator — interactive lead recovery estimator */}
        <div id="roi-calculator" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }}>
          <section className="py-16 md:py-24 px-4 bg-muted/30">
            <div className="max-w-4xl mx-auto">
              <div className="cs-section-header cs-section-header--center mb-8">
                <p className="cs-section-eyebrow">Revenue Recovery Calculator</p>
                <div className="cs-section-title-row cs-section-header--center">
                  <span className="cs-section-bar" />
                  <h2 className="cs-section-title">How Much Revenue Are You Losing?</h2>
                </div>
                <p className="cs-section-subtitle">
                  Drag the sliders below to see how many leads you're losing to missed calls
                  and slow follow-up — then browse our store to recover them automatically.
                </p>
              </div>
              <ROICalculator />
            </div>
          </section>
        </div>

        {/* 5. Pricing / Core Offer */}
        <div id="pricing" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
        <SectionErrorBoundary sectionName="pricing">
          <ThreeSystemsSection />
        </SectionErrorBoundary>

        {/* 6. Final CTA — booking conversion */}
        <LazyHomepageSection fallback={<SectionSkeleton height="400px" />}>
          <FinalCTA />
        </LazyHomepageSection>

        <Footer />
        <ChatBubble />
      </div>
    </DemoBookingProvider>
  );
}