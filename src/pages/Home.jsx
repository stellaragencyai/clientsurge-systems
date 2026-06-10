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
import DeferredSection from "../components/performance/DeferredSection";

// All sections below the fold are code-split AND viewport-deferred
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

import {
  getFAQSchema,
  getLocalBusinessSchema,
  getOrganizationSchema,
  getServiceSchema,
  getWebsiteSchema,
} from "../components/SEO/SchemaMarkup";
import { setJsonLd, setPageMetadata } from "@/lib/seo";

export default function Home() {
  const location = useLocation();

  // Smooth scroll to hash anchors
  useEffect(() => {
    if (!location.hash) return undefined;

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

  // SEO metadata
  useEffect(() => {
    let cleanupMetadata = () => {};
    let cleanupOrg = () => {};
    let cleanupBusiness = () => {};
    let cleanupService = () => {};
    let cleanupWebsite = () => {};
    let cleanupFaq = () => {};

    try {
      cleanupMetadata = setPageMetadata({
        title: "AI Automation Systems for Local Leads | ClientSurge Systems",
        description:
          "Six done-for-you automations for lead capture, missed-call recovery, AI follow-up, appointment booking, review generation, and customer reactivation for local service businesses.",
        canonicalPath: "/",
        ogTitle: "AI Automation Systems That Turn More Local Leads Into Booked Jobs",
        ogDescription:
          "ClientSurge builds AI voice-agent, follow-up, missed-call recovery, and booking automation systems for local service businesses.",
      });
      cleanupOrg = setJsonLd("organization", getOrganizationSchema());
      cleanupBusiness = setJsonLd("local-business", getLocalBusinessSchema());
      cleanupService = setJsonLd("service", getServiceSchema());
      cleanupWebsite = setJsonLd("website", getWebsiteSchema());
      cleanupFaq = setJsonLd("faq", getFAQSchema(FAQ_ITEMS));
    } catch (error) {
      console.error("Homepage SEO bootstrap failed:", error);
    }

    return () => {
      cleanupFaq();
      cleanupService();
      cleanupBusiness();
      cleanupOrg();
      cleanupWebsite();
      cleanupMetadata();
    };
  }, []);

  return (
    <DemoBookingProvider>
      <div className="min-h-screen">
        <Navbar />

        {/* Hero is above fold — loads immediately, no Suspense wrapper */}
        <Hero />

        {/* Industries + TrustBar: defer mounting until near viewport */}
        <DeferredSection minHeight="300px" fallback={<SectionSkeleton />}>
          <Industries />
          <Suspense fallback={null}><SectionBreak /></Suspense>
          <TrustBar />
          <Suspense fallback={null}><SectionBreak /></Suspense>
        </DeferredSection>

        {/* Mid-page heavy sections */}
        <DeferredSection minHeight="600px" fallback={<LargeSectionSkeleton />}>
          <LeadJourneyDiagram />
          <Suspense fallback={null}><SectionBreak /></Suspense>
          <AIDashboardPreview />
          <Suspense fallback={null}><SectionBreak /></Suspense>
          <CoreOffer />
          <Suspense fallback={null}><SectionBreak /></Suspense>
          <Pricing />
          <Suspense fallback={null}><SectionBreak /></Suspense>
        </DeferredSection>

        {/* Bottom sections */}
        <DeferredSection minHeight="400px" fallback={<SectionSkeleton />}>
          <FAQ />
          <Suspense fallback={null}><SectionBreak /></Suspense>
          <FounderSection />
          <Suspense fallback={null}><SectionBreak /></Suspense>
          <Testimonials />
          <Suspense fallback={null}><SectionBreak /></Suspense>
          <FinalCTA />
        </DeferredSection>

        <SecurityPriority />
        <Footer />
        <ChatBubble />
      </div>
    </DemoBookingProvider>
  );
}