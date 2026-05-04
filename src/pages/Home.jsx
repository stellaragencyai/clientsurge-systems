import { useEffect, lazy, Suspense } from "react";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero.jsx";
import { DemoBookingProvider } from "../components/landing/DemoBookingContext";
import ChatBubble from "../components/landing/ChatBubble";
import { SectionSkeleton, LargeSectionSkeleton } from "../components/landing/SkeletonLoader";
import { FAQ_ITEMS } from "../components/landing/FAQ";

// Lazy load ALL below-the-fold sections individually for independent rendering
const TrustBar = lazy(() => import("../components/landing/TrustBar"));
const InteractiveJourneyMap = lazy(() => import("../components/landing/InteractiveJourneyMap"));
const Industries = lazy(() => import("../components/landing/Industries"));
const CoreOffer = lazy(() => import("../components/landing/CoreOffer"));
const IntegrationPartners = lazy(() => import("../components/landing/IntegrationPartners"));
const FAQ = lazy(() => import("../components/landing/FAQ"));
const Pricing = lazy(() => import("../components/landing/Pricing"));
const LeadLeakage = lazy(() => import("../components/landing/LeadLeakage"));
const BeforeAfter = lazy(() => import("../components/landing/BeforeAfter"));
const Testimonials = lazy(() => import("../components/landing/Testimonials"));
const FinalCTA = lazy(() => import("../components/landing/FinalCTA"));
const Footer = lazy(() => import("../components/landing/Footer"));
const SectionBreak = lazy(() => import("../components/landing/SectionBreak"));
const AutomationShowcase = lazy(() => import("../components/landing/AutomationShowcase"));
const MissedCallAnimation = lazy(() => import("../components/landing/MissedCallAnimation"));
const SystemDiagramSection = lazy(() => import("../components/landing/SystemDiagram"));

import {
  getFAQSchema,
  getLocalBusinessSchema,
  getOrganizationSchema,
  getServiceSchema,
} from "../components/SEO/SchemaMarkup";
import CookieConsent from "../components/landing/CookieConsent";
import { setJsonLd, setPageMetadata } from "@/lib/seo";

function useHomepageWhiteCanvas() {
  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    document.body.classList.add("homepage-white-canvas");
    document.documentElement.style.setProperty("--scroll-bg-from", "hsl(0, 0%, 100%)");
    document.documentElement.style.setProperty("--scroll-bg-to", "hsl(0, 0%, 100%)");

    return () => {
      document.body.classList.remove("homepage-white-canvas");
      document.documentElement.style.removeProperty("--scroll-bg-from");
      document.documentElement.style.removeProperty("--scroll-bg-to");
    };
  }, []);
}

export default function Home() {
  useHomepageWhiteCanvas();

  useEffect(() => {
    let cleanupMetadata = () => {};
    let cleanupOrg = () => {};
    let cleanupBusiness = () => {};
    let cleanupService = () => {};
    let cleanupFaq = () => {};

    try {
      cleanupMetadata = setPageMetadata({
        title: "ClientSurge Systems | AI Lead Response and Booking Automation",
        description:
          "Done-for-you automation for med spas and lead-driven service businesses that need faster response, stronger follow-up, and more booked appointments.",
        canonicalPath: "/",
        ogTitle: "ClientSurge Systems | AI Lead Response and Booking Automation",
        ogDescription:
          "See how ClientSurge helps med spas and lead-driven service businesses turn more leads into booked appointments.",
      });
      cleanupOrg = setJsonLd("organization", getOrganizationSchema());
      cleanupBusiness = setJsonLd("local-business", getLocalBusinessSchema());
      cleanupService = setJsonLd("service", getServiceSchema());
      cleanupFaq = setJsonLd("faq", getFAQSchema(FAQ_ITEMS));
    } catch (error) {
      console.error("Homepage SEO bootstrap failed:", error);
    }

    return () => {
      cleanupFaq();
      cleanupService();
      cleanupBusiness();
      cleanupOrg();
      cleanupMetadata();
    };
  }, []);

  return (
    <DemoBookingProvider>
      <div className="min-h-screen">
        <Navbar />
        <Hero />
        <Suspense fallback={<SectionSkeleton />}>
          <SectionBreak />
          <Industries />
          <SectionBreak />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <TrustBar />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <InteractiveJourneyMap />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <SectionBreak />
          <LeadLeakage />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <BeforeAfter />
        </Suspense>
        <Suspense fallback={<LargeSectionSkeleton />}>
          <SectionBreak />
          <CoreOffer />
        </Suspense>
        <Suspense fallback={<LargeSectionSkeleton />}>
          <SectionBreak />
          <SystemDiagramSection />
        </Suspense>
        <Suspense fallback={<LargeSectionSkeleton />}>
          <SectionBreak />
          <AutomationShowcase />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <SectionBreak />
          <MissedCallAnimation />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <SectionBreak />
          <IntegrationPartners />
        </Suspense>
        <Suspense fallback={<LargeSectionSkeleton />}>
          <SectionBreak />
          <Pricing />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <SectionBreak />
          <FAQ />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <SectionBreak />
          <Testimonials />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <SectionBreak />
          <FinalCTA />
        </Suspense>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
        <ChatBubble />
        <CookieConsent />
      </div>
    </DemoBookingProvider>
  );
}