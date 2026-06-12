import { useEffect } from "react";
import Navbar from "../components/landing/Navbar";
import Pricing from "../components/landing/Pricing";
import Footer from "../components/landing/Footer";
import MobileCallBar from "../components/landing/MobileCallBar";
import { DemoBookingProvider } from "../components/landing/DemoBookingContext";
import { setPageMetadata } from "@/lib/seo";

export default function PricingPage() {
  useEffect(() => {
    return setPageMetadata({
      title: "Pricing | ClientSurge Systems",
      description:
        "Compare ClientSurge automation packages, setup pricing, monthly management, and what is included for local service businesses.",
      canonicalPath: "/pricing",
      ogTitle: "ClientSurge Pricing",
      ogDescription:
        "See ClientSurge package pricing, what each system includes, and how to choose the right automation rollout for your business.",
    });
  }, []);

  return (
    <DemoBookingProvider>
      <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_32%,#f3f9ff_100%)]">
        <Navbar />
        <main className="px-4 pb-28 pt-[calc(var(--cs-nav-height)+20px)] md:px-6 md:pb-20 md:pt-[calc(var(--cs-nav-height)+28px)]">
          <div className="mx-auto max-w-7xl">
            <Pricing />
          </div>
        </main>
        <Footer />
        <MobileCallBar />
      </div>
    </DemoBookingProvider>
  );
}
