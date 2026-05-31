import { useEffect, lazy, Suspense } from "react";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero.jsx";
import HomepageConversionContent from "../components/landing/HomepageConversionContent";
import { DemoBookingProvider } from "../components/landing/DemoBookingContext";
import ChatBubble from "../components/landing/ChatBubble";
import { LargeSectionSkeleton, SectionSkeleton } from "../components/landing/SkeletonLoader";
import { FAQ_ITEMS } from "../components/landing/FAQ";

const TrustBar = lazy(() => import("../components/landing/TrustBar"));
const Industries = lazy(() => import("../components/landing/Industries"));
const LeadJourneyDiagram = lazy(() => import("../components/landing/LeadJourneyDiagram"));
const SixAutomationSystems = lazy(() => import("../components/landing/SixAutomationSystems"));
const CoreOffer = lazy(() => import("../components/landing/CoreOffer"));
const FAQ = lazy(() => import("../components/landing/FAQ"));
const Pricing = lazy(() => import("../components/landing/Pricing"));
const ProofBeforeLaunch = lazy(() => import("../components/landing/ProofBeforeLaunch"));
const FounderSection = lazy(() => import("../components/landing/FounderSection"));
const Testimonials = lazy(() => import("../components/landing/Testimonials"));
const FinalCTA = lazy(() => import("../components/landing/FinalCTA"));
const Footer = lazy(() => import("../components/landing/Footer"));
const SectionBreak = lazy(() => import("../components/landing/SectionBreak"));

import {
  getFAQSchema,
  getLocalBusinessSchema,
  getOrganizationSchema,
  getServiceSchema,
  getWebsiteSchema,
} from "../components/SEO/SchemaMarkup";
import CookieConsent from "../components/landing/CookieConsent";
import { setJsonLd, setPageMetadata } from "@/lib/seo";
import {
  CinematicSectionDivider,
  HomepageMotionShell,
  MotionSection,
} from "@/components/landing/PremiumHomepageMotion";

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
    let cleanupWebsite = () => {};
    let cleanupFaq = () => {};

    try {
      cleanupMetadata = setPageMetadata({
        title: "AI Automation Systems for Local Leads | ClientSurge Systems",
        description:
          "six done-for-you automations for local service businesses: lead capture, missed-call recovery, AI follow-up, appointment booking, review generation, and customer reactivation.",
        canonicalPath: "/",
        ogTitle: "AI Automation Systems That Turn More Local Leads Into Booked Jobs",
        ogDescription:
          "ClientSurge builds six done-for-you automations: lead capture, missed-call recovery, AI follow-up, appointment booking, review generation, and customer reactivation.",
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
      <HomepageMotionShell>
      <div className="min-h-screen">
        <Navbar />
        <Hero />
        <MotionSection>
          <HomepageConversionContent />
        </MotionSection>
        <Suspense fallback={<SectionSkeleton />}>
          <MotionSection>
            <SixAutomationSystems />
          </MotionSection>
          <CinematicSectionDivider />
          <SectionBreak />
          <MotionSection>
            <Industries />
          </MotionSection>
          <CinematicSectionDivider />
          <SectionBreak />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <MotionSection>
            <TrustBar />
          </MotionSection>
          <CinematicSectionDivider />
          <SectionBreak />
          <MotionSection>
            <LeadJourneyDiagram />
          </MotionSection>
          <CinematicSectionDivider />
          <SectionBreak />
          <MotionSection>
            <ProofBeforeLaunch />
          </MotionSection>
          <CinematicSectionDivider />
          <SectionBreak />
        </Suspense>
        <Suspense fallback={<LargeSectionSkeleton />}>
          <MotionSection>
            <CoreOffer />
          </MotionSection>
          <CinematicSectionDivider />
          <SectionBreak />
          <MotionSection>
            <Pricing />
          </MotionSection>
          <CinematicSectionDivider />
          <SectionBreak />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <MotionSection>
            <FAQ />
          </MotionSection>
          <CinematicSectionDivider />
          <SectionBreak />
          <MotionSection>
            <FounderSection />
          </MotionSection>
          <CinematicSectionDivider />
          <SectionBreak />
          <MotionSection>
            <Testimonials />
          </MotionSection>
          <CinematicSectionDivider />
          <SectionBreak />
          <MotionSection>
            <FinalCTA />
          </MotionSection>
        </Suspense>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
        <ChatBubble />
        <CookieConsent />
      </div>
      </HomepageMotionShell>
    </DemoBookingProvider>
  );
}