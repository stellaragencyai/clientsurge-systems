import { useEffect } from "react";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import MobileCallBar from "../components/landing/MobileCallBar";
import { DemoBookingProvider } from "../components/landing/DemoBookingContext";
import { setPageMetadata } from "@/lib/seo";
import PricingOfferHero from "@/components/pricing/PricingOfferHero";
import PricingPackageGrid from "@/components/pricing/PricingPackageGrid";
import FeatureComparisonTable from "@/components/pricing/FeatureComparisonTable";
import BuyerConfidenceSection from "@/components/pricing/BuyerConfidenceSection";
import PricingFAQ from "@/components/pricing/PricingFAQ";
import TrustStrip from "@/components/landing/TrustStrip";

export default function PricingPage() {
  useEffect(() => {
    return setPageMetadata({
      title: "Business AI Automation Packages — Starter, Growth, Pro | ClientSurge Systems",
      description:
        "Choose your ClientSurge automation package. Starter, Growth, and Pro systems for lead capture, missed-call recovery, AI follow-up, booking, reviews, and reactivation. Remote setup included.",
      canonicalPath: "/pricing",
      ogTitle: "Choose Your Business AI Automation Package | ClientSurge Systems",
      ogDescription:
        "Compare Starter ($797 setup), Growth ($1,297 setup), and Pro ($2,497 setup) packages. Remotely installed AI automation systems for service businesses.",
    });
  }, []);

  return (
    <DemoBookingProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <TrustStrip />
        <PricingOfferHero />
        <PricingPackageGrid />
        <FeatureComparisonTable />
        <BuyerConfidenceSection />
        <PricingFAQ />
        <Footer />
        <MobileCallBar />
      </div>
    </DemoBookingProvider>
  );
}