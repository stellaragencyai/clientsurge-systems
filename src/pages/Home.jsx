import { useEffect } from 'react';
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import TrustBar from "../components/landing/TrustBar";
import Industries from "../components/landing/Industries";
import ToolsStrip from "../components/landing/ToolsStrip";
import ProblemSolution from "../components/landing/ProblemSolution.jsx";
import HowItWorks from "../components/landing/HowItWorks";
import AutomationDemo from "../components/landing/AutomationDemo";
import AIResponseDemo from "../components/landing/AIResponseDemo";
import AIAuditSection from "../components/landing/AIAuditSection";
import AIRoutingForm from "../components/landing/AIRoutingForm";
import Testimonials from "../components/landing/Testimonials";
import CoreOffer from "../components/landing/CoreOffer";
import AutomationWalkthrough from "../components/landing/AutomationWalkthrough";
import FAQ from "../components/landing/FAQ";
import Pricing from "../components/landing/Pricing";
import FinalCTA from "../components/landing/FinalCTA";
import Footer from "../components/landing/Footer";
import SamChatWidget from "../components/sam/SamChatWidget";
import CookieConsent from "../components/landing/CookieConsent";
import MobileCallBar from "../components/landing/MobileCallBar";
import FadeIn from "../components/landing/FadeIn";
import { FAQ_ITEMS } from "../components/landing/FAQ";
import { getFAQSchema, getLocalBusinessSchema, getOrganizationSchema, getServiceSchema } from "../components/SEO/SchemaMarkup";
import { setJsonLd, setPageMetadata } from "@/lib/seo";

export default function Home() {
  useEffect(() => {
    const cleanupMetadata = setPageMetadata({
      title: "ClientSurge Systems | AI Lead Response and Booking Automation",
      description:
        "Done-for-you automation for med spas and lead-driven service businesses that need faster response, stronger follow-up, and more booked appointments.",
      canonicalPath: "/",
      ogTitle: "ClientSurge Systems | AI Lead Response and Booking Automation",
      ogDescription:
        "See how ClientSurge helps med spas and lead-driven service businesses turn more leads into booked appointments.",
    });
    const cleanupOrg = setJsonLd("organization", getOrganizationSchema());
    const cleanupBusiness = setJsonLd("local-business", getLocalBusinessSchema());
    const cleanupService = setJsonLd("service", getServiceSchema());
    const cleanupFaq = setJsonLd("faq", getFAQSchema(FAQ_ITEMS));

    return () => {
      cleanupFaq();
      cleanupService();
      cleanupBusiness();
      cleanupOrg();
      cleanupMetadata();
    };
  }, []);

  return (
    <div className="min-h-screen pb-16">
      <Navbar />
      <Hero />
      <FadeIn><TrustBar /></FadeIn>
      <FadeIn><Industries /></FadeIn>
      <FadeIn><ToolsStrip /></FadeIn>
      <FadeIn><ProblemSolution /></FadeIn>
      <FadeIn><HowItWorks id="how-it-works-section" /></FadeIn>
      <FadeIn><AutomationDemo /></FadeIn>
      <FadeIn><AIResponseDemo /></FadeIn>
      <FadeIn><AIAuditSection /></FadeIn>
      <FadeIn><AIRoutingForm /></FadeIn>
      <FadeIn><AutomationWalkthrough /></FadeIn>
      <FadeIn><CoreOffer /></FadeIn>
      <FadeIn><Testimonials /></FadeIn>
      <FadeIn><Pricing /></FadeIn>
      <FadeIn><FAQ /></FadeIn>
      <FinalCTA />
      <Footer />
      <SamChatWidget />
      <CookieConsent />
      <MobileCallBar />
    </div>
  );
}
