import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useHashNavigation } from "../hooks/useHashNavigation";
import Navbar from "../components/landing/Navbar";
import HomeHero from "../components/landing/HomeHero.jsx";
import ProblemOutcomeSection from "../components/landing/ProblemOutcomeSection.jsx";
import SolutionSection from "../components/landing/SolutionSection.jsx";
import TrustSection from "../components/landing/TrustSection.jsx";
import { DemoBookingProvider } from "../components/landing/DemoBookingContext";
import Footer from "../components/landing/Footer";
import { FAQ_ITEMS } from "../components/landing/FAQData";
import ThreeSystemsSection from "../components/landing/ThreeSystemsSection";
import SixAutomationsSection from "../components/landing/SixAutomationsSection.jsx";
import FAQSection from "../components/landing/FAQSection.jsx";
import SectionErrorBoundary from "../components/SectionErrorBoundary.jsx";
import {
  getFAQSchema,
  getLocalBusinessSchema,
  getOrganizationSchema,
  getProductSchema,
  getServiceSchema,
  getWebsiteSchema,
} from "../components/SEO/SchemaMarkup";
import { setJsonLd, setPageMetadata } from "@/lib/seo";

function isEditorSandbox() {
  try {
    const hostname = window.location.hostname;
    return hostname.includes("preview-sandbox") || hostname.includes("base44");
  } catch {
    return true;
  }
}

export default function Home() {
  const location = useLocation();
  useHashNavigation();

  useEffect(() => {
    if (!location.hash) return undefined;

    const id = decodeURIComponent(location.hash.slice(1));
    let attempts = 0;
    let rafId;

    const scrollToHashTarget = () => {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (attempts < 24) {
        attempts += 1;
        rafId = window.requestAnimationFrame(scrollToHashTarget);
      }
    };

    rafId = window.requestAnimationFrame(scrollToHashTarget);
    return () => window.cancelAnimationFrame(rafId);
  }, [location.hash]);

  const schemas = useMemo(
    () => ({
      organization: getOrganizationSchema(),
      localBusiness: getLocalBusinessSchema(),
      service: getServiceSchema(),
      product: getProductSchema(),
      website: getWebsiteSchema(),
      faq: getFAQSchema(FAQ_ITEMS),
    }),
    [],
  );

  useEffect(() => {
    if (isEditorSandbox()) return () => {};
    if (typeof document === "undefined" || !document.head) return () => {};

    const cleanups = [];

    try {
      cleanups.push(
        setPageMetadata({
          title: "ClientSurge Systems | Stop Losing Leads to Slow Follow-Up",
          description:
            "ClientSurge turns local service websites into lead recovery systems with lead capture, instant response, missed-call text-back, booking, follow-up, reviews, and reactivation.",
          canonicalPath: "/",
          ogTitle: "Stop Losing Local Service Leads | ClientSurge Systems",
          ogDescription:
            "Compare packaged automation systems and install a focused response, follow-up, and booking system for your business.",
        }),
      );
    } catch (_error) {}

    try {
      cleanups.push(setJsonLd("organization", schemas.organization));
    } catch (_error) {}
    try {
      cleanups.push(setJsonLd("local-business", schemas.localBusiness));
    } catch (_error) {}
    try {
      cleanups.push(setJsonLd("service", schemas.service));
    } catch (_error) {}
    try {
      cleanups.push(setJsonLd("product", schemas.product));
    } catch (_error) {}
    try {
      cleanups.push(setJsonLd("website", schemas.website));
    } catch (_error) {}
    try {
      cleanups.push(setJsonLd("faq", schemas.faq));
    } catch (_error) {}

    return () => {
      cleanups.forEach((cleanup) => {
        try {
          cleanup();
        } catch (_error) {}
      });
    };
  }, [schemas]);

  return (
    <DemoBookingProvider>
      <div className="min-h-screen bg-white">
        <Navbar />

        {/* 1. Hero — one promise, two actions, one product visual. */}
        <SectionErrorBoundary sectionName="hero" fallbackMessage="Welcome to ClientSurge Systems.">
          <HomeHero />
        </SectionErrorBoundary>

        {/* 2. Problem and outcome — concise revenue leakage framing. */}
        <div id="problem" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }}>
          <SectionErrorBoundary sectionName="problem-outcome">
            <ProblemOutcomeSection />
          </SectionErrorBoundary>
        </div>

        {/* 3. How it works — the core ClientSurge operating sequence. */}
        <div id="solution" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }}>
          <SectionErrorBoundary sectionName="how-it-works">
            <SolutionSection />
          </SectionErrorBoundary>
        </div>

        {/* 4. Product — the six automations customers actually receive. */}
        <div id="automations" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }}>
          <SectionErrorBoundary sectionName="automations" fallbackMessage="Automation details loading.">
            <SixAutomationsSection />
          </SectionErrorBoundary>
        </div>

        {/* 5. Commercial decision — Starter, Growth, and Pro. */}
        <div id="pricing" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }}>
          <SectionErrorBoundary sectionName="pricing">
            <ThreeSystemsSection />
          </SectionErrorBoundary>
        </div>

        {/* 6. Objection handling — trust, essential FAQ, and one final action. */}
        <div id="trust" className="bg-white" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }}>
          <SectionErrorBoundary sectionName="trust">
            <TrustSection />
          </SectionErrorBoundary>

          <div id="faq" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }}>
            <SectionErrorBoundary sectionName="faq" fallbackMessage="FAQ loading.">
              <FAQSection />
            </SectionErrorBoundary>
          </div>

          <section className="px-5 pb-20 pt-4 sm:px-8 lg:pb-24" aria-labelledby="homepage-final-cta-title">
            <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 rounded-3xl bg-[#06162f] px-6 py-10 text-center shadow-[0_20px_55px_rgba(6,22,47,0.16)] sm:px-10 lg:flex-row lg:text-left">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#35BDF1]">Ready to stop losing leads?</p>
                <h2 id="homepage-final-cta-title" className="mt-2 text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl">
                  Choose the system that fits your business.
                </h2>
              </div>
              <a
                href="/pricing"
                className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-[#00AEEF] px-7 text-sm font-black text-white transition-colors hover:bg-[#0099d5] focus:outline-none focus:ring-2 focus:ring-[#35BDF1] focus:ring-offset-2 focus:ring-offset-[#06162f]"
              >
                Compare Packages
              </a>
            </div>
          </section>
        </div>

        <Footer />
      </div>
    </DemoBookingProvider>
  );
}
