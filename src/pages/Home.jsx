import { useEffect, lazy, Suspense } from "react";
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
import VisualFlawsPatch60 from "../components/landing/VisualFlawsPatch60";
import { FAQ_ITEMS } from "../components/landing/FAQData";
import ThreeSystemsSection from "../components/landing/ThreeSystemsSection";
import SixAutomationsSection from "../components/landing/SixAutomationsSection.jsx";

const Industries = lazy(() => import("../components/landing/Industries"));
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
  useHashNavigation();
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
      title: "Stop Losing Leads from Missed Calls & Slow Follow-Up | ClientSurge Systems",
      description: "Stop losing leads from missed calls, slow follow-up, and unbooked inquiries. ClientSurge captures every lead, responds instantly, and books appointments automatically.",
      canonicalPath: "/",
      ogTitle: "Stop Losing Leads — Convert Every Call and Inquiry",
      ogDescription: "ClientSurge captures every lead, responds instantly, and books appointments automatically. Stop losing leads from missed calls, slow follow-up, and unbooked inquiries.",
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

        {/* 1. Cinematic Hero — primary value prop + CTA */}
        <CinematicHero />

        {/* 2. Six Core Automations — what the system does */}
        <div id="automations" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
        <SixAutomationsSection />

        {/* 3. Revenue Leak — problem framing */}
        <RevenueLeakSection />

        {/* 4. Pricing / Core Offer */}
        <div id="pricing" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
        <ThreeSystemsSection />

        {/* 5. Industries — user finds their vertical */}
        <div id="industries" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
        <LazyHomepageSection fallback={<SectionSkeleton />}>
          <Industries />
        </LazyHomepageSection>

        {/* 6. Final CTA — booking conversion */}
        <LazyHomepageSection fallback={<SectionSkeleton />}>
          <FinalCTA />
        </LazyHomepageSection>

        <Footer />
        <ChatBubble />

      </div>
    </DemoBookingProvider>
  );
}