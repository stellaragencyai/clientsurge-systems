import { useEffect, lazy, Suspense } from "react";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero.jsx";
import { DemoBookingProvider } from "../components/landing/DemoBookingContext";
import ChatBubble from "../components/landing/ChatBubble";
import { SectionSkeleton } from "../components/landing/SkeletonLoader";
import FAQ, { FAQ_ITEMS } from "../components/landing/FAQ";
import Footer from "../components/landing/Footer";

// Lazy load below-the-fold sections individually for independent rendering
const TrustBar = lazy(() => import("../components/landing/TrustBar"));
const Industries = lazy(() => import("../components/landing/Industries"));
const CoreOffer = lazy(() => import("../components/landing/CoreOffer"));
const Pricing = lazy(() => import("../components/landing/Pricing"));
const Testimonials = lazy(() => import("../components/landing/Testimonials"));
const FinalCTA = lazy(() => import("../components/landing/FinalCTA"));
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
          <SectionBreak />
          <CoreOffer />
          <SectionBreak />
          <Pricing />
          <SectionBreak />
          <FAQ />
          <SectionBreak />
          <Testimonials />
          <SectionBreak />
          <FinalCTA />
        </Suspense>
        <Footer />
        <ChatBubble />
        <CookieConsent />
      </div>
    </DemoBookingProvider>
  );
}
