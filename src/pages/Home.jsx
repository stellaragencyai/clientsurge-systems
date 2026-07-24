import { useEffect, useMemo, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { useHashNavigation } from "../hooks/useHashNavigation";
import PremiumNavbar from "../components/landing/PremiumNavbar";
import HomeHero from "../components/landing/HomeHero.jsx";
import SolutionSection from "../components/landing/SolutionSection.jsx";
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
import FAQSection from "../components/landing/FAQSection.jsx";
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
import "../styles/home-visual-polish.css";
import "../styles/home-section-spacing.css";

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

function HomepageVisualBackdrop() {
  return (
    <div className="cs-home-ambient" aria-hidden="true">
      <div className="cs-home-ambient__grid" />
    </div>
  );
}

function HomepageSectionDivider({ label }) {
  return (
    <div className="cs-home-section-divider" aria-hidden="true">
      <span className="cs-home-section-divider__text">
        <span className="cs-home-section-divider__dot" />
        {label}
      </span>
    </div>
  );
}

function HomepageSectionFrame({ children, name, accent = false }) {
  return (
    <div
      className={`cs-home-section-frame ${accent ? "cs-home-section-frame--accent" : ""} ${name === "pricing" || name === "final-cta" ? `cs-home-section-frame--${name}` : ""}`}
      data-home-section={name}
    >
      {children}
    </div>
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
        title: "ClientSurge Systems | Stop Losing Leads to Slow Follow-Up",
        description: "ClientSurge turns local service websites into lead recovery systems with audit-driven lead capture, instant response, missed-call text-back, booking handoff, follow-up, and proof-based status tracking.",
        canonicalPath: "/",
        ogTitle: "Stop Losing Local Service Leads | ClientSurge Systems",
        ogDescription: "Diagnose lead leakage, compare packaged automation systems, and install a proof-first response and follow-up system for your business.",
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
      <div className="cs-home-polish min-h-screen">
        <HomepageVisualBackdrop />
        <ScrollProgressBar />
        <LoggedOutConfirmationBanner />
        <PremiumNavbar />

        <main className="cs-home-main" aria-label="ClientSurge Systems homepage">
          {/* 1. Hero — lead leakage positioning + animated product demo */}
          <HomepageSectionFrame name="hero">
            <SectionErrorBoundary sectionName="hero" fallbackMessage="Welcome to ClientSurge Systems.">
              <HomeHero />
            </SectionErrorBoundary>
          </HomepageSectionFrame>

          {/* 4. Six Core Automations — product-style showcase */}
          <div id="automations" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
          <HomepageSectionFrame name="automations">
            <SectionErrorBoundary sectionName="automations" fallbackMessage="Automation details loading.">
              <SixAutomationsSection />
            </SectionErrorBoundary>
          </HomepageSectionFrame>

          {/* 5. Industries — vertical-specific templates */}
          <div id="industries" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
          <HomepageSectionDivider label="Built for local service businesses" />
          <HomepageSectionFrame name="industries" accent>
            <LazyHomepageSection fallback={<SectionSkeleton height="600px" />}>
              <Industries />
            </LazyHomepageSection>
          </HomepageSectionFrame>

          {/* 6. Trust — security, verification, architecture, transparency */}
          <HomepageSectionDivider label="Trust and transparency" />
          <HomepageSectionFrame name="trust">
            <SectionErrorBoundary sectionName="trust">
              <TrustSection />
            </SectionErrorBoundary>
          </HomepageSectionFrame>

          {/* 7. Pricing / Core Offer */}
          <div id="pricing" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
          <HomepageSectionDivider label="Choose your system" />
          <HomepageSectionFrame name="pricing" accent>
            <SectionErrorBoundary sectionName="pricing">
              <ThreeSystemsSection />
            </SectionErrorBoundary>
          </HomepageSectionFrame>

          {/* 8. FAQ — accordion section */}
          <div id="faq" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
          <HomepageSectionDivider label="Questions before checkout" />
          <HomepageSectionFrame name="faq">
            <SectionErrorBoundary sectionName="faq" fallbackMessage="FAQ loading.">
              <FAQSection />
            </SectionErrorBoundary>
          </HomepageSectionFrame>

          {/* 9. Final CTA — booking conversion */}
          <HomepageSectionFrame name="final-cta" accent>
            <LazyHomepageSection fallback={<SectionSkeleton height="400px" />}>
              <FinalCTA />
            </LazyHomepageSection>
          </HomepageSectionFrame>
        </main>

        <Footer />
        <ChatBubble />
      </div>
    </DemoBookingProvider>
  );
}