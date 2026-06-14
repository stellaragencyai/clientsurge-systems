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

function useHomepageWhiteCanvas() {
  useEffect(() => {
    // Skip all DOM mutations inside the Base44 visual editor sandbox
    if (isEditorSandbox()) return undefined;
    if (typeof document === "undefined" || !document.body || !document.documentElement) {
      return undefined;
    }
    try {
      document.body.classList.add("homepage-white-canvas");
      document.documentElement.style.setProperty("--scroll-bg-from", "hsl(0, 0%, 100%)");
      document.documentElement.style.setProperty("--scroll-bg-to", "hsl(0, 0%, 100%)");
    } catch (_e) {
      return undefined;
    }
    return () => {
      try {
        if (!document.body || !document.documentElement) return;
        document.body.classList.remove("homepage-white-canvas");
        document.documentElement.style.removeProperty("--scroll-bg-from");
        document.documentElement.style.removeProperty("--scroll-bg-to");
      } catch (_e) {}
    };
  }, []);
}

function LazyHomepageSection({ children, fallback }) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

export default function Home() {
  useHomepageWhiteCanvas();
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
          <Industries />
        </LazyHomepageSection>

        <LazyHomepageSection fallback={<SectionSkeleton />}>
          <TrustBar />
        </LazyHomepageSection>

        <LazyHomepageSection fallback={<SectionSkeleton />}>
          <div id="problem-solution" aria-hidden="true" />
          <div id="six-automations" aria-hidden="true" />
          <CoreOffer />
        </LazyHomepageSection>

        <LazyHomepageSection fallback={<SectionSkeleton />}>
          <Pricing />
        </LazyHomepageSection>

        <LazyHomepageSection fallback={<SectionSkeleton />}>
          <FAQ />
        </LazyHomepageSection>

        <LazyHomepageSection fallback={<SectionSkeleton />}>
          <Testimonials />
        </LazyHomepageSection>

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