import { useEffect } from 'react';
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import TrustBar from "../components/landing/TrustBar";
import Industries from "../components/landing/Industries";
import LeadValueCalculator from "../components/landing/LeadValueCalculator";
import Testimonials from "../components/landing/Testimonials";
import FAQ from "../components/landing/FAQ";
import Pricing from "../components/landing/Pricing";
import FinalCTA from "../components/landing/FinalCTA";
import Footer from "../components/landing/Footer";
import { DemoBookingProvider } from "../components/landing/DemoBookingContext";
import { FAQ_ITEMS } from "../components/landing/FAQ";
import { getFAQSchema, getLocalBusinessSchema, getOrganizationSchema, getServiceSchema } from "../components/SEO/SchemaMarkup";
import { setJsonLd, setPageMetadata } from "@/lib/seo";

export default function Home() {
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
      <div className="min-h-screen pb-16">
        <Navbar />
        <Hero />
        <LeadValueCalculator />
        <Industries />
        <section aria-label="Proof and trust">
          <TrustBar />
          <Testimonials />
        </section>
        <Pricing />
        <FAQ />
        <FinalCTA />
        <Footer />
      </div>
    </DemoBookingProvider>
  );
}
