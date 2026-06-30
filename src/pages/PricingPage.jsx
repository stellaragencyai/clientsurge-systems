import { useEffect } from "react";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import MobileCallBar from "../components/landing/MobileCallBar";
import TrustStrip from "../components/landing/TrustStrip";
import PricingPageContent from "@/components/pricing/PricingPageContent";
import CartSidebar from "@/components/store/CartSidebar";
import { CartProvider } from "@/lib/cartContext";
import { setPageMetadata } from "@/lib/seo";

export default function PricingPage() {
  useEffect(() => {
    return setPageMetadata({
      title: "Choose Your ClientSurge AI System — Starter, Growth, Pro",
      description:
        "Compare ClientSurge Starter, Growth, and Pro systems for lead capture, missed-call recovery, follow-up, booking, reviews, and reactivation. Done-for-you setup included.",
      canonicalPath: "/pricing",
      ogTitle: "Choose Your ClientSurge AI System",
      ogDescription:
        "Pick the system that matches your lead flow. Starter fixes response gaps. Growth adds follow-up and booking. Pro adds the full recovery layer.",
    });
  }, []);

  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <TrustStrip />
        <PricingPageContent />
        <Footer />
        <MobileCallBar />
        <CartSidebar />
      </div>
    </CartProvider>
  );
}
