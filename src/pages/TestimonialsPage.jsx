import { useEffect } from "react";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import MobileCallBar from "../components/landing/MobileCallBar";
import { DemoBookingProvider } from "../components/landing/DemoBookingContext";
import Testimonials from "../components/landing/Testimonials";
import { setPageMetadata } from "@/lib/seo";

export default function TestimonialsPage() {
  useEffect(() => {
    return setPageMetadata({
      title: "Workflow Scenarios & Trust Signals | ClientSurge Systems",
      description:
        "See ClientSurge workflow scenarios and trust signals. These are system previews, not verified customer testimonials unless specifically labeled as verified customer quotes.",
      canonicalPath: "/testimonials",
      ogTitle: "ClientSurge Workflow Scenarios & Trust Signals",
      ogDescription:
        "See workflow previews ClientSurge is built to support across lead capture, follow-up, missed calls, and booking without treating previews as verified testimonials.",
    });
  }, []);

  return (
    <DemoBookingProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-[var(--cs-nav-height)]">
          <Testimonials />
        </main>
        <Footer />
        <MobileCallBar />
      </div>
    </DemoBookingProvider>
  );
}
