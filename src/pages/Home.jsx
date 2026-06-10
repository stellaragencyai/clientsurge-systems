import { useEffect, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero.jsx";
import { DemoBookingProvider } from "../components/landing/DemoBookingContext";
import ChatBubble from "../components/landing/ChatBubble";
import Footer from "../components/landing/Footer";
import SecurityPriority from "../components/landing/SecurityPriority";
import { LargeSectionSkeleton, SectionSkeleton } from "../components/landing/SkeletonLoader";
import { FAQ_ITEMS } from "../components/landing/FAQData";

import {
  getFAQSchema,
  getLocalBusinessSchema,
  getOrganizationSchema,
  getServiceSchema,
  getWebsiteSchema,
} from "../components/SEO/SchemaMarkup";
import { setJsonLd, setPageMetadata } from "@/lib/seo";

// Lazy-loaded below-fold sections
const TrustBar = lazy(() => import("../components/landing/TrustBar"));
const Industries = lazy(() => import("../components/landing/Industries"));
const CoreOffer = lazy(() => import("../components/landing/CoreOffer"));
const FAQ = lazy(() => import("../components/landing/FAQ"));
const Pricing = lazy(() => import("../components/landing/Pricing"));
const FounderSection = lazy(() => import("../components/landing/FounderSection"));
const Testimonials = lazy(() => import("../components/landing/Testimonials"));
const FinalCTA = lazy(() => import("../components/landing/FinalCTA"));
const SectionBreak = lazy(() => import("../components/landing/SectionBreak"));
const LeadJourneyDiagram = lazy(() => import("../components/landing/LeadJourneyDiagram"));
const AIDashboardPreview = lazy(() => import("../components/landing/AIDashboardPreview"));
const AutomationShowcase = lazy(() => import("../components/landing/AutomationShowcase"));

const SectionFallback = () => <SectionSkeleton />;
const LargeFallback = () => <LargeSectionSkeleton />;

export default function Home() {
  const location = useLocation();

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

  useEffect(() => {
    let cleanups = [];
    try {
      cleanups = [
        setPageMetadata({
          title: "AI Automation Systems for Local Leads | ClientSurge Systems",
          description: "Six done-for-you automations for lead capture, missed-call recovery, AI follow-up, appointment booking, review generation, and customer reactivation for local service businesses.",
          canonicalPath: "/",
          ogTitle: "AI Automation Systems That Turn More Local Leads Into Booked Jobs",
          ogDescription: "ClientSurge builds AI voice-agent, follow-up, missed-call recovery, and booking automation systems for local service businesses.",
        }),
        setJsonLd("organization", getOrganizationSchema()),
        setJsonLd("local-business", getLocalBusinessSchema()),
        setJsonLd("service", getServiceSchema()),
        setJsonLd("website", getWebsiteSchema()),
        setJsonLd("faq", getFAQSchema(FAQ_ITEMS)),
      ];
    } catch (error) {
      console.error("Homepage SEO bootstrap failed:", error);
    }
    return () => cleanups.forEach(fn => fn && fn());
  }, []);

  return (
    <DemoBookingProvider>
      <div className="min-h-screen">
        <Navbar />
        <Hero />

        <Suspense fallback={<SectionFallback />}>
          <Industries />
        </Suspense>
        <Suspense fallback={null}><SectionBreak /></Suspense>
        <Suspense fallback={<SectionFallback />}>
          <TrustBar />
        </Suspense>
        <Suspense fallback={null}><SectionBreak /></Suspense>

        <Suspense fallback={<LargeFallback />}>
          <LeadJourneyDiagram />
        </Suspense>
        <Suspense fallback={null}><SectionBreak /></Suspense>

        <Suspense fallback={<LargeFallback />}>
          <AutomationShowcase />
        </Suspense>
        <Suspense fallback={null}><SectionBreak /></Suspense>

        <Suspense fallback={<LargeFallback />}>
          <AIDashboardPreview />
        </Suspense>
        <Suspense fallback={null}><SectionBreak /></Suspense>
        <Suspense fallback={<LargeFallback />}>
          <CoreOffer />
        </Suspense>
        <Suspense fallback={null}><SectionBreak /></Suspense>
        <Suspense fallback={<LargeFallback />}>
          <Pricing />
        </Suspense>
        <Suspense fallback={null}><SectionBreak /></Suspense>

        <Suspense fallback={<SectionFallback />}>
          <FAQ />
        </Suspense>
        <Suspense fallback={null}><SectionBreak /></Suspense>
        <Suspense fallback={<SectionFallback />}>
          <FounderSection />
        </Suspense>
        <Suspense fallback={null}><SectionBreak /></Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Testimonials />
        </Suspense>
        <Suspense fallback={null}><SectionBreak /></Suspense>
        <Suspense fallback={<SectionFallback />}>
          <FinalCTA />
        </Suspense>

        <SecurityPriority />
        <Footer />
        <ChatBubble />
      </div>
    </DemoBookingProvider>
  );
}