import { useEffect, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero.jsx";
import { DemoBookingProvider } from "../components/landing/DemoBookingContext";
import AutomationSystemsGrid from "../components/landing/AutomationSystemsGrid";
import HomepageHowItWorksTeaser from "../components/landing/HomepageHowItWorksTeaser";
import ThreeSystemsSection from "../components/landing/ThreeSystemsSection";
import TrustStrip from "../components/landing/TrustStrip";
import ChatBubble from "../components/landing/ChatBubble";
import Footer from "../components/landing/Footer";
import ScrollProgressBar from "../components/landing/ScrollProgressBar";
import { SectionSkeleton } from "../components/landing/SkeletonLoader";
import { FAQ_ITEMS } from "../components/landing/FAQData";

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
    return true;
  }
}

function LazySection({ children }) {
  return <Suspense fallback={<SectionSkeleton />}>{children}</Suspense>;
}

export default function Home() {
  const location = useLocation();

  // Hash anchor scroll
  useEffect(() => {
    if (!location.hash) return undefined;
    const id = decodeURIComponent(location.hash.slice(1));
    let attempts = 0;
    let timeoutId;
    const scrollToHashTarget = () => {
      const target = document.getElementById(id);
      if (target) { target.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
      if (attempts < 24) { attempts += 1; timeoutId = window.setTimeout(scrollToHashTarget, 125); }
    };
    timeoutId = window.setTimeout(scrollToHashTarget, 0);
    return () => window.clearTimeout(timeoutId);
  }, [location.hash]);

  // SEO
  useEffect(() => {
    if (isEditorSandbox()) return () => {};
    if (typeof document === "undefined" || !document.head) return () => {};

    let cleanups = [];
    try { cleanups.push(setPageMetadata({
      title: "Business AI Automation Store — Pick Your System, We Install It Remotely | ClientSurge Systems",
      description: "Browse, choose, and activate AI automation systems for lead capture, missed-call recovery, follow-up, booking, reviews, and reactivation. Remotely installed and tested for service businesses.",
      canonicalPath: "/",
      ogTitle: "The Business AI Automation Store — Pick Your System, We Install It Remotely",
      ogDescription: "ClientSurge helps businesses browse, choose, and activate AI automation systems through a guided AI-powered remote setup process.",
    })); } catch (_e) {}
    try { cleanups.push(setJsonLd("organization", getOrganizationSchema())); } catch (_e) {}
    try { cleanups.push(setJsonLd("local-business", getLocalBusinessSchema())); } catch (_e) {}
    try { cleanups.push(setJsonLd("service", getServiceSchema())); } catch (_e) {}
    try { cleanups.push(setJsonLd("website", getWebsiteSchema())); } catch (_e) {}
    try { cleanups.push(setJsonLd("faq", getFAQSchema(FAQ_ITEMS))); } catch (_e) {}

    return () => cleanups.forEach(fn => { try { fn(); } catch (_e) {} });
  }, []);

  return (
    <DemoBookingProvider>
      <div className="min-h-screen">
        <ScrollProgressBar />
        <Navbar />

        {/* 1. Hero */}
        <Hero />

        {/* 2. Automation Systems Preview — concise 6-system grid, CTA → /store */}
        <div id="automations" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
        <AutomationSystemsGrid />

        {/* 3. How It Works Teaser — process strip only, CTA → /how-it-works */}
        <HomepageHowItWorksTeaser />

        {/* 4. Package Preview — concise Starter/Growth/Pro, CTA → /pricing */}
        <div id="pricing" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
        <ThreeSystemsSection />

        {/* 5. Industries / Best Fit Preview — who this is for, CTA → /industries */}
        <div id="industries" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }} />
        <LazySection>
          <Industries />
        </LazySection>

        {/* 6. Compact Trust Strip */}
        <TrustStrip />

        {/* 7. Final CTA block */}
        <LazySection>
          <FinalCTA />
        </LazySection>

        <Footer />
        <ChatBubble />
      </div>
    </DemoBookingProvider>
  );
}