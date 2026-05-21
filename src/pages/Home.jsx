import { useEffect, lazy, Suspense } from "react";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero.jsx";
import { DemoBookingProvider } from "../components/landing/DemoBookingContext";
import ChatBubble from "../components/landing/ChatBubble";
import { LargeSectionSkeleton, SectionSkeleton } from "../components/landing/SkeletonLoader";
import { FAQ_ITEMS } from "../components/landing/FAQ";

const TrustBar = lazy(() => import("../components/landing/TrustBar"));
const Industries = lazy(() => import("../components/landing/Industries"));
const SixAutomationSystems = lazy(() => import("../components/landing/SixAutomationSystems"));
const CoreOffer = lazy(() => import("../components/landing/CoreOffer"));
const FAQ = lazy(() => import("../components/landing/FAQ"));
const Pricing = lazy(() => import("../components/landing/Pricing"));
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
          "ClientSurge Systems installs six done-for-you automations for service businesses: lead capture, missed-call recovery, AI follow-up, appointment booking, review generation, and customer reactivation.",
        canonicalPath: "/",
        ogTitle: "ClientSurge Systems | AI Lead Response and Booking Automation",
        ogDescription:
          "See the six ClientSurge automation systems that help local service businesses capture leads, follow up faster, book appointments, and recover lost revenue.",
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
          <SixAutomationSystems />
          <SectionBreak />
          <Industries />
          <SectionBreak />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <TrustBar />
          <SectionBreak />
        </Suspense>
        <Suspense fallback={<LargeSectionSkeleton />}>
          <CoreOffer />
          <SectionBreak />
          <Pricing />
          <SectionBreak />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <FAQ />
          <SectionBreak />
          <FounderSection />
          <SectionBreak />
          <Testimonials />
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
