import { useEffect } from "react";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import MobileCallBar from "../components/landing/MobileCallBar";
import { DemoBookingProvider } from "../components/landing/DemoBookingContext";
import CoreOffer from "../components/landing/CoreOffer";
import { setPageMetadata } from "@/lib/seo";

export default function OurSystemPage() {
  useEffect(() => {
    return setPageMetadata({
      title: "Our System | ClientSurge Systems",
      description:
        "See how the ClientSurge system captures leads, follows up faster, recovers missed calls, books appointments, and reactivates old opportunities.",
      canonicalPath: "/our-system",
      ogTitle: "The ClientSurge System",
      ogDescription:
        "Explore the full ClientSurge automation flow from lead capture through booking, follow-up, reviews, and reactivation.",
    });
  }, []);

  return (
    <DemoBookingProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-[var(--cs-nav-height)]">
          <CoreOffer />
        </main>
        <Footer />
        <MobileCallBar />
      </div>
    </DemoBookingProvider>
  );
}
