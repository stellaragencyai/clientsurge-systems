import { useEffect, useMemo, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { useHashNavigation } from "../hooks/useHashNavigation";
import Navbar from "../components/landing/Navbar";
import { DemoBookingProvider } from "../components/landing/DemoBookingContext";

import Footer from "../components/landing/Footer";
import ScrollProgressBar from "../components/landing/ScrollProgressBar";
import { SectionSkeleton } from "../components/landing/SkeletonLoader";
import { FAQ_ITEMS } from "../components/landing/FAQData";
import SectionErrorBoundary from "../components/SectionErrorBoundary.jsx";

import {
  getFAQSchema,
  getLocalBusinessSchema,
  getOrganizationSchema,
  getServiceSchema,
  getWebsiteSchema,
} from "../components/SEO/SchemaMarkup";
import { setJsonLd, setPageMetadata } from "@/lib/seo";

function HeroRescueFallback() {
  return (
    <section
      aria-label="ClientSurge Systems homepage rescue hero"
      className="relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: "calc(100svh - var(--cs-nav-height, 72px))", background: "#061025", padding: "6rem 1.5rem 4rem" }}
    >
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em]" style={{ color: "#35BDF1" }}>
          ClientSurge Systems
        </p>
        <h1 className="mx-auto mb-5 max-w-4xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
          Stop Losing Leads From Missed Calls & Slow Follow-Up
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-base leading-8 md:text-lg" style={{ color: "#D4D8E0" }}>
          ClientSurge captures leads, follows up instantly, books appointments, and helps local service businesses recover revenue that normally slips through the cracks.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#pricing"
            className="inline-flex h-12 items-center justify-center rounded-full px-7 text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #0079CC 0%, #00AEEF 100%)" }}
          >
            Compare Packages
          </a>
          <a
            href="/contact"
            className="inline-flex h-12 items-center justify-center rounded-full border px-7 text-sm font-semibold text-white"
            style={{ borderColor: "rgba(53, 189, 241, 0.45)" }}
          >
            Get Help
          </a>
        </div>
      </div>
    </section>
  );
}

function HomeSectionFallback({ label = "This section is temporarily unavailable." }) {
  return (
    <section
      aria-label={label}
      className="flex items-center justify-center"
      style={{ minHeight: "220px", padding: "3rem 1.5rem" }}
    >
      <p className="text-center text-sm text-muted-foreground">{label}</p>
    </section>
  );
}

function safeLazy(loader, sectionName, FallbackComponent) {
  return lazy(() =>
    loader().catch((error) => {
      if (typeof console !== "undefined" && console.error) {
        console.error(`[Home:${sectionName}] failed to load`, error);
      }

      const Fallback = FallbackComponent || (() => (
        <HomeSectionFallback label={`${sectionName} temporarily unavailable.`} />
      ));

      return { default: Fallback };
    })
  );
}

const CinematicHero = safeLazy(
  () => import("../components/landing/CinematicHero.jsx"),
  "hero",
  HeroRescueFallback
);
const SixAutomationsSection = safeLazy(
  () => import("../components/landing/SixAutomationsSection.jsx"),
  "automations"
);
const RevenueLeakSection = safeLazy(
  () => import("../components/landing/RevenueLeakSection.jsx"),
  "revenue leak"
);
const ThreeSystemsSection = safeLazy(
  () => import("../components/landing/ThreeSystemsSection"),
  "pricing"
);
const Industries = safeLazy(
  () => import("../components/landing/Industries"),
  "industries"
);
const FinalCTA = safeLazy(
  () => import("../components/landing/FinalCTA"),
  "final CTA"
);
const ChatBubble = safeLazy(
  () => import("../components/landing/ChatBubble"),
  "chat"
);

function isEditorSandbox() {
  try {
    const h = window.location.hostname;
    return h.includes("preview-sandbox") || h.includes("base44");
  } catch {
    return true;
  }
}

function LazyHomepageSection({ children, fallback, sectionName = "homepage-section", fallbackMessage }) {
  return (
    <SectionErrorBoundary sectionName={sectionName} fallbackMessage={fallbackMessage}>
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

    let id = location.hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch (_e) {
      // Keep the raw hash so a malformed URL hash cannot crash the homepage.
    }

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
    website: getWebsiteSchema(),
    faq: getFAQSchema(FAQ_ITEMS),
  }), []);

  useEffect(() => {
    if (isEditorSandbox()) return () => {};
    if (typeof document === "undefined" || !document.head) return () => {};

    const cleanups = [];

    try {
      cleanups.push(setPageMetadata({
        title: "Stop Losing Leads from Missed Calls & Slow Follow-Up | ClientSurge Systems",
        description: "Stop losing leads from missed calls, slow follow-up, and unbooked inquiries. ClientSurge captures every lead, responds instantly, and books appointments automatically.",
        canonicalPath: "/",
        ogTitle: "Stop Losing Leads — Convert Every Call and Inquiry",
        ogDescription: "ClientSurge captures every lead, responds instantly, and books appointments automatically. Stop losing leads from missed calls, slow follow-up, and unbooked inquiries.",
      }));
    } catch (_e) {}

    try { cleanups.push(setJsonLd("organization", schemas.organization)); } catch (_e) {}
    try { cleanups.push(setJsonLd("local-business", schemas.localBusiness)); } catch (_e) {}
    try { cleanups.push(setJsonLd("service", schemas.service)); } catch (_e) {}
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
        <LazyHomepageSection
          sectionName="hero"
          fallback={<SectionSkeleton height="640px" />}
          fallbackMessage="Welcome to ClientSurge Systems."
        >
          <CinematicHero />
        </LazyHomepageSection>

        {/* 2. Six Core Automations — what the system does */}
        <div id="automations" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
        <LazyHomepageSection
          sectionName="automations"
          fallback={<SectionSkeleton height="600px" />}
          fallbackMessage="Automation details loading."
        >
          <SixAutomationsSection />
        </LazyHomepageSection>

        {/* 3. Revenue Leak — problem framing */}
        <LazyHomepageSection
          sectionName="revenue-leak"
          fallback={<SectionSkeleton height="520px" />}
        >
          <RevenueLeakSection />
        </LazyHomepageSection>

        {/* 4. Pricing / Core Offer */}
        <div id="pricing" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
        <LazyHomepageSection
          sectionName="pricing"
          fallback={<SectionSkeleton height="640px" />}
        >
          <ThreeSystemsSection />
        </LazyHomepageSection>

        {/* 5. Industries — user finds their vertical */}
        <div id="industries" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
        <LazyHomepageSection
          sectionName="industries"
          fallback={<SectionSkeleton height="600px" />}
        >
          <Industries />
        </LazyHomepageSection>

        {/* 6. Final CTA — booking conversion */}
        <LazyHomepageSection
          sectionName="final-cta"
          fallback={<SectionSkeleton height="400px" />}
        >
          <FinalCTA />
        </LazyHomepageSection>

        <Footer />
        <LazyHomepageSection sectionName="chat" fallback={null}>
          <ChatBubble />
        </LazyHomepageSection>
      </div>
    </DemoBookingProvider>
  );
}
