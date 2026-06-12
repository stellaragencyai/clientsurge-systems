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
      title: "Launch Scenarios & Testimonials | ClientSurge Systems",
      description:
        "See the launch scenarios, workflow outcomes, and proof-oriented testimonial framing ClientSurge uses for med spas, HVAC, dental, and local service businesses.",
      canonicalPath: "/testimonials",
      ogTitle: "ClientSurge Launch Scenarios",
      ogDescription:
        "See the workflow outcomes ClientSurge is built to create across lead capture, follow-up, missed calls, and booking.",
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
