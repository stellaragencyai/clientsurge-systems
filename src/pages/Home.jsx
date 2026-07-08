import { useEffect, useMemo, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { useHashNavigation } from "../hooks/useHashNavigation";
import Navbar from "../components/landing/Navbar";
import HomeHero from "../components/landing/HomeHero.jsx";
import RevenueLeakSection from "../components/landing/RevenueLeakSection.jsx";
import SolutionSection from "../components/landing/SolutionSection.jsx";
import WorkflowSection from "../components/landing/WorkflowSection.jsx";
import TrustSection from "../components/landing/TrustSection.jsx";
import { DemoBookingProvider } from "../components/landing/DemoBookingContext";

import LoggedOutConfirmationBanner from "../components/landing/LoggedOutConfirmationBanner";
import ChatBubble from "../components/landing/ChatBubble";
import Footer from "../components/landing/Footer";
import ScrollProgressBar from "../components/landing/ScrollProgressBar";
import { SectionSkeleton } from "../components/landing/SkeletonLoader";
import { FAQ_ITEMS } from "../components/landing/FAQData";
import ThreeSystemsSection from "../components/landing/ThreeSystemsSection";
import SixAutomationsSection from "../components/landing/SixAutomationsSection.jsx";
import ROICalculator from "../components/landing/ROICalculator.jsx";
import FAQSection from "../components/landing/FAQSection.jsx";
import SectionErrorBoundary from "../components/SectionErrorBoundary.jsx";
import CSSectionHeader from "../components/design-system/CSSectionHeader.jsx";

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
        title: "ClientSurge Systems | Turn Your Website Into an AI-Powered Sales System",
        description: "ClientSurge turns your website into an AI-powered sales system for local service businesses. Compare packaged automation systems for lead capture, instant response, booking, follow-up, reviews, and reactivation.",
        canonicalPath: "/",
        ogTitle: "Turn Your Website Into an AI-Powered Sales System | ClientSurge Systems",
        ogDescription: "AI automation for lead capture, instant response, booking, follow-up, reviews, and reactivation. Compare clear packages and choose the system that fits your business.",
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
        <LoggedOutConfirmationBanner />
        <Navbar />

        {/* 1. Hero — SaaS value prop + animated product demo */}
        <SectionErrorBoundary sectionName="hero" fallbackMessage="Welcome to ClientSurge Systems.">
          <HomeHero />
        </SectionErrorBoundary>

        {/* 2. Problem — revenue leak framing */}
        <SectionErrorBoundary sectionName="revenue-leak">
          <RevenueLeakSection />
        </SectionErrorBoundary>

        {/* 3. Solution — the 5-step AI Growth System */}
        <SectionErrorBoundary sectionName="solution">
          <SolutionSection />
        </SectionErrorBoundary>

        {/* 4. Six Core Automations — product-style showcase */}
        <div id="automations" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
        <SectionErrorBoundary sectionName="automations" fallbackMessage="Automation details loading.">
          <SixAutomationsSection />
        </SectionErrorBoundary>

        {/* 5. Interactive Workflow — SaaS product demonstration */}
        <SectionErrorBoundary sectionName="workflow">
          <WorkflowSection />
        </SectionErrorBoundary>

        {/* 6. Industries — vertical-specific templates */}
        <div id="industries" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
        <LazyHomepageSection fallback={<SectionSkeleton height="600px" />}>
          <Industries />
        </LazyHomepageSection>

        {/* 7. Trust — security, verification, architecture, transparency */}
        <SectionErrorBoundary sectionName="trust">
          <TrustSection />
        </SectionErrorBoundary>

        {/* 8. ROI Calculator — interactive lead recovery estimator */}
        <div id="roi-calculator" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }}>
          <section className="py-16 md:py-24 px-4 bg-muted/30">
            <div className="max-w-4xl mx-auto">
              <CSSectionHeader
                eyebrow="Revenue Recovery Calculator"
                title="How Much Revenue Are You Losing?"
                subtitle="Drag the sliders below to see how many leads you're losing to missed calls and slow follow-up — then browse our packages to recover them automatically."
                align="center"
                className="mb-8"
              />
              <ROICalculator />
            </div>
          </section>
        </div>

        {/* 9. Pricing / Core Offer */}
        <div id="pricing" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
        <SectionErrorBoundary sectionName="pricing">
          <ThreeSystemsSection />
        </SectionErrorBoundary>

        {/* 10. FAQ — accordion section */}
        <div id="faq" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
        <SectionErrorBoundary sectionName="faq" fallbackMessage="FAQ loading.">
          <FAQSection />
        </SectionErrorBoundary>

        {/* 11. Final CTA — booking conversion */}
        <LazyHomepageSection fallback={<SectionSkeleton height="400px" />}>
          <FinalCTA />
        </LazyHomepageSection>

        <Footer />
        <ChatBubble />
      </div>
    </DemoBookingProvider>
  );
}