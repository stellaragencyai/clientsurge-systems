import { useEffect, lazy, Suspense, useRef, useState } from "react";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero.jsx";
import HomepageConversionContent from "../components/landing/HomepageConversionContent";
import { DemoBookingProvider } from "../components/landing/DemoBookingContext";
import ChatBubble from "../components/landing/ChatBubble";
import Footer from "../components/landing/Footer";
import { LargeSectionSkeleton, SectionSkeleton } from "../components/landing/SkeletonLoader";
import { FAQ_ITEMS } from "../components/landing/FAQData";

const TrustBar = lazy(() => import("../components/landing/TrustBar"));
const Industries = lazy(() => import("../components/landing/Industries"));
const SixAutomationSystems = lazy(() => import("../components/landing/SixAutomationSystems"));
const ProofBeforeLaunch = lazy(() => import("../components/landing/ProofBeforeLaunch"));
const CoreOffer = lazy(() => import("../components/landing/CoreOffer"));
const FAQ = lazy(() => import("../components/landing/FAQ"));
const Pricing = lazy(() => import("../components/landing/Pricing"));
const FounderSection = lazy(() => import("../components/landing/FounderSection"));
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

function LazyHomepageSection({ children, fallback, minHeight = 360 }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (isVisible) {
      return undefined;
    }

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <div ref={ref} style={{ minHeight: isVisible ? undefined : minHeight }}>
      {isVisible ? (
        <Suspense fallback={fallback}>{children}</Suspense>
      ) : (
        fallback
      )}
    </div>
  );
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
          "six done-for-you automations for lead capture, missed-call recovery, AI follow-up, appointment booking, review generation, and customer reactivation for local service businesses.",
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
        <Hero />
        <HomepageConversionContent />
        <LazyHomepageSection fallback={<SectionSkeleton />} minHeight={900}>
          <SixAutomationSystems />
          <SectionBreak />
          <ProofBeforeLaunch />
          <SectionBreak />
          <Industries />
          <SectionBreak />
        </LazyHomepageSection>
        <LazyHomepageSection fallback={<SectionSkeleton />} minHeight={420}>
          <TrustBar />
          <SectionBreak />
        </LazyHomepageSection>
        <LazyHomepageSection fallback={<LargeSectionSkeleton />} minHeight={900}>
          <CoreOffer />
          <SectionBreak />
          <Pricing />
          <SectionBreak />
        </LazyHomepageSection>
        <LazyHomepageSection fallback={<SectionSkeleton />} minHeight={900}>
          <FAQ />
          <SectionBreak />
          <FounderSection />
          <SectionBreak />
          <Testimonials />
          <SectionBreak />
          <FinalCTA />
        </LazyHomepageSection>
        <Footer />
        <ChatBubble />
        <CookieConsent />
      </div>
    </DemoBookingProvider>
  );
}
