import { useEffect, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero.jsx";
import { DemoBookingProvider } from "../components/landing/DemoBookingContext";

import ChatBubble from "../components/landing/ChatBubble";
import Footer from "../components/landing/Footer";
import ScrollProgressBar from "../components/landing/ScrollProgressBar";
import SecurityPriority from "../components/landing/SecurityPriority";
import { SectionSkeleton } from "../components/landing/SkeletonLoader";
import { FAQ_ITEMS } from "../components/landing/FAQData";
import RevenueProofBlock from "../components/landing/RevenueProofBlock";

const TrustBar = lazy(() => import("../components/landing/TrustBar"));
const Industries = lazy(() => import("../components/landing/Industries"));
const CoreOffer = lazy(() => import("../components/landing/CoreOffer"));
const FAQ = lazy(() => import("../components/landing/FAQ"));
const Pricing = lazy(() => import("../components/landing/Pricing"));

const Testimonials = lazy(() => import("../components/landing/Testimonials"));
const FinalCTA = lazy(() => import("../components/landing/FinalCTA"));
const SectionBreak = lazy(() => import("../components/landing/SectionBreak"));

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
      title: "AI Automation Systems for Local Leads | ClientSurge Systems",
      description: "six done-for-you automations for lead capture, missed-call recovery, AI follow-up, appointment booking, review generation, and customer reactivation for local service businesses.",
      canonicalPath: "/",
      ogTitle: "AI Automation Systems That Turn More Local Leads Into Booked Jobs",
      ogDescription: "ClientSurge builds AI voice-agent, follow-up, missed-call recovery, and booking automation systems for local service businesses.",
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
        <Navbar />
        <Hero />

        {/* Each section gets its own Suspense boundary — prevents one slow section from blocking others */}
        <LazyHomepageSection fallback={<SectionSkeleton />}>
          <div id="industries" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
          <Industries />
        </LazyHomepageSection>

        <LazyHomepageSection fallback={<SectionSkeleton />}>
          <div className="max-w-6xl mx-auto px-6 pt-4">
            <RevenueProofBlock industryLoss={14700} leadsRecovered="8-12" bookingsGenerated="3-5" />
          </div>
        </LazyHomepageSection>

        <LazyHomepageSection fallback={<SectionSkeleton />}>
          <TrustBar />
        </LazyHomepageSection>

        <LazyHomepageSection fallback={<SectionSkeleton />}>
          <div id="problem-solution" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
          <div id="six-automations" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
          <CoreOffer />
        </LazyHomepageSection>

        <LazyHomepageSection fallback={<SectionSkeleton />}>
          <div id="pricing" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
          <Pricing />
        </LazyHomepageSection>

        <SectionBreak />

        <LazyHomepageSection fallback={<SectionSkeleton />}>
          <div id="faq" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
          <FAQ />
        </LazyHomepageSection>

        <SectionBreak />

        <LazyHomepageSection fallback={<SectionSkeleton />}>
          <div id="testimonials" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
          <Testimonials />
        </LazyHomepageSection>

        <SectionBreak />

        <LazyHomepageSection fallback={<SectionSkeleton />}>
          <FinalCTA />
        </LazyHomepageSection>

        <SecurityPriority />
        <Footer />
        <ChatBubble />
      </div>
    </DemoBookingProvider>
  );
}