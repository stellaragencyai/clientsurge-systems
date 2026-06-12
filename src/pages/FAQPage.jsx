import { useEffect } from "react";
import Navbar from "../components/landing/Navbar";
import FAQ from "../components/landing/FAQ";
import Footer from "../components/landing/Footer";
import MobileCallBar from "../components/landing/MobileCallBar";
import { setPageMetadata } from "@/lib/seo";

export default function FAQPage() {
  useEffect(() => {
    return setPageMetadata({
      title: "Frequently Asked Questions | ClientSurge Systems",
      description:
        "Answers about ClientSurge setup, pricing, integrations, support, billing, cancellation, and SMS compliance.",
      canonicalPath: "/faq",
      ogTitle: "ClientSurge FAQ",
      ogDescription:
        "Get answers about how ClientSurge works, what is included, pricing, integrations, onboarding, and support.",
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-[var(--cs-nav-height)]">
        <FAQ />
      </main>
      <Footer />
      <MobileCallBar />
    </div>
  );
}
