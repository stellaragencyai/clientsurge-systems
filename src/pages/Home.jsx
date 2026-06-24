import { useEffect, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import CinematicHero from "../components/landing/CinematicHero.jsx";
import IntegrationCarousel from "../components/landing/IntegrationCarousel.jsx";
import RevenueLeakSection from "../components/landing/RevenueLeakSection.jsx";
import SixStepFlow from "../components/landing/SixStepFlow.jsx";
import { DemoBookingProvider } from "../components/landing/DemoBookingContext";

import ChatBubble from "../components/landing/ChatBubble";
import Footer from "../components/landing/Footer";
import ScrollProgressBar from "../components/landing/ScrollProgressBar";
import { SectionSkeleton } from "../components/landing/SkeletonLoader";
import VisualFlawsPatch60 from "../components/landing/VisualFlawsPatch60";
import { FAQ_ITEMS } from "../components/landing/FAQData";
import LogoCarousel from "../components/landing/LogoCarousel";
import AutomationSystemsGrid from "../components/landing/AutomationSystemsGrid";
import ThreeSystemsSection from "../components/landing/ThreeSystemsSection";
import TrustStrip from "../components/landing/TrustStrip";
import WhatHappensAfter from "../components/landing/WhatHappensAfter";
import BeforeAfterComparison from "../components/landing/BeforeAfterComparison";
import CTABand from "../components/landing/CTABand";

const Industries = lazy(() => import("../components/landing/Industries"));
const CoreOffer = lazy(() => import("../components/landing/CoreOffer"));
const FinalCTA = lazy(() => import("../components/landing/FinalCTA"));

import {
  getFAQSchema,
  getLocalBusinessSchema,
  getOrganizationSchema,
  getServiceSchema,
  getWebsiteSchema,
} from "../components/SEO/SchemaMarkup";
import { setJsonLd, setPageMetadata } from "@/lib/seo";

function isEditorSandbox() {
  try {
    const h = window.location.hostname;
    return h.includes("preview-sandbox") || h.includes("base44");
  } catch {
    return true; // fail-safe: treat unknown environments as sandboxed
  }
}



function LazyHomepageSection({ children, fallback }) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

export default function Home() {
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) {
      return undefined;
    }

    const id = decodeURIComponent(location.hash.slice(1));
    let attempts = 0;
    let timeoutId;

    const scrollToHashTarget = () => {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (attempts < 24) {
        attempts += 1;
        timeoutId = window.setTimeout(scrollToHashTarget, 125);
      }
    };

    timeoutId = window.setTimeout(scrollToHashTarget, 0);
    return () => window.clearTimeout(timeoutId);
  }, [location.hash]);

  useEffect(() => {
    if (isEditorSandbox()) return () => {};
    if (typeof document === "undefined" || !document.head) return () => {};

    let cleanupMetadata = () => {};
    let cleanupOrg = () => {};
    let cleanupBusiness = () => {};
    let cleanupService = () => {};
    let cleanupWebsite = () => {};
    let cleanupFaq = () => {};

    try { cleanupMetadata = setPageMetadata({
      title: "Business AI Automation Store — Pick Your System, We Install It Remotely | ClientSurge Systems",
      description: "Browse, choose, and activate AI automation systems for lead capture, missed-call recovery, follow-up, booking, reviews, and reactivation. Remotely installed and tested for service businesses.",
      canonicalPath: "/",
      ogTitle: "The Business AI Automation Store — Pick Your System, We Install It Remotely",
      ogDescription: "ClientSurge helps businesses browse, choose, and activate AI automation systems through a guided AI-powered remote setup process.",
    }); } catch (_e) {}
    try { cleanupOrg = setJsonLd("organization", getOrganizationSchema()); } catch (_e) {}
    try { cleanupBusiness = setJsonLd("local-business", getLocalBusinessSchema()); } catch (_e) {}
    try { cleanupService = setJsonLd("service", getServiceSchema()); } catch (_e) {}
    try { cleanupWebsite = setJsonLd("website", getWebsiteSchema()); } catch (_e) {}
    try { cleanupFaq = setJsonLd("faq", getFAQSchema(FAQ_ITEMS)); } catch (_e) {}

    return () => {
      try { cleanupFaq(); } catch (_e) {}
      try { cleanupService(); } catch (_e) {}
      try { cleanupBusiness(); } catch (_e) {}
      try { cleanupOrg(); } catch (_e) {}
      try { cleanupWebsite(); } catch (_e) {}
      try { cleanupMetadata(); } catch (_e) {}
    };
  }, []);

  return (
    <DemoBookingProvider>
      <div className="min-h-screen">
        <ScrollProgressBar />
        <VisualFlawsPatch60 />
        <Navbar />

        {/* 1. Cinematic Hero */}
        <CinematicHero />

        {/* 1a. Logo Carousel */}
        <LogoCarousel />

        {/* 1b. Integration Carousel */}
        <IntegrationCarousel />

        {/* 1c. Revenue Leak Section */}
        <RevenueLeakSection />

        {/* 1d. Six-Step ClientSurge Flow */}
        <SixStepFlow />

        {/* 1e. What Happens After You Start */}
        <WhatHappensAfter />

        {/* 1f. Before ClientSurge vs After ClientSurge */}
        <BeforeAfterComparison />

        {/* 1g. CTA Band 1 */}
        <CTABand
          headline="Every missed lead is a delayed sale."
          subcopy="Install the response system before more inquiries go cold."
          primaryLabel="Request Free Automation Audit"
          primaryAction="contact"
          secondaryLabel="Compare Packages"
          secondaryAction="pricing"
          location="cta_band_1"
        />

        {/* 3. Automation Systems Preview */}
        <div id="automations" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
        <AutomationSystemsGrid />

        {/* 4. How It Works Teaser */}
        <LazyHomepageSection fallback={<SectionSkeleton />}>
          <CoreOffer />
        </LazyHomepageSection>

        {/* 5. Package Preview */}
        <div id="pricing" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
        <ThreeSystemsSection />

        {/* 5b. CTA Band 2 */}
        <CTABand
          headline="Ready to turn your website into a lead-response system?"
          subcopy="ClientSurge connects capture, follow-up, booking, reviews, and reactivation into one operating flow."
          primaryLabel="View Automations"
          primaryAction="automations"
          secondaryLabel="Compare Packages"
          secondaryAction="pricing"
          location="cta_band_2"
        />

        {/* 6. Compact Trust Strip */}
        <TrustStrip />

        {/* 7. Industries Preview */}
        <LazyHomepageSection fallback={<SectionSkeleton />}>
          <div id="industries" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
          <Industries />
        </LazyHomepageSection>

        {/* 8. Final CTA */}
        <LazyHomepageSection fallback={<SectionSkeleton />}>
          <FinalCTA />
        </LazyHomepageSection>

        <Footer />
        <ChatBubble />

      </div>
    </DemoBookingProvider>
  );
}