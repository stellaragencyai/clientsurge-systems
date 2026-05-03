import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DemoBookingProvider, useDemoBooking } from "./DemoBookingContext";
import Navbar from "./Navbar";
import Footer from "./Footer";
import IndustryHero from "../industry/IndustryHero";
import IndustryPainBar from "../industry/IndustryPainBar";
import ProblemSolution from "./ProblemSolution";
import IndustrySMSDemo from "../industry/IndustrySMSDemo";
import IndustryResults from "../industry/IndustryResults";
import IndustryFAQ from "../industry/IndustryFAQ";
import { INDUSTRIES, getIndustryBySlug } from "@/lib/industryData";
import { setPageMetadata } from "@/lib/seo";

function IndustryTemplateInner({ industrySlug }) {
  const industry = getIndustryBySlug(industrySlug);
  const demoBooking = useDemoBooking();
  const [notFound, setNotFound] = useState(!industry);

  useEffect(() => {
    if (!industry) return;
    return setPageMetadata({
      title: `${industry.name} AI Automation | ClientSurge Systems`,
      description: industry.hero?.subheadline || `Done-for-you AI lead response and booking automation for ${industry.name}.`,
      canonicalPath: `/${industrySlug}`,
      ogTitle: `${industry.name} AI Automation | ClientSurge Systems`,
      ogDescription: industry.hero?.subheadline || `AI automation built specifically for ${industry.name}.`,
    });
  }, [industry, industrySlug]);

  if (notFound || !industry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Industry Not Found</h1>
          <p className="text-muted-foreground">We don't have a page for that industry yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <IndustryHero
          eyebrow={industry.hero.eyebrow}
          headline={industry.hero.headline}
          subheadline={industry.hero.subheadline}
          image={industry.hero.image || `https://via.placeholder.com/1200x600?text=${industry.name}`}
          cta={industry.hero.cta}
          onBookDemo={() => demoBooking?.openDemoBooking?.()}
        />

        {/* Pain Stats Bar */}
        <IndustryPainBar stats={industry.painStats} />

        {/* Problem/Solution Section (industry-tailored) */}
        <section className="py-16 md:py-24 px-4 md:px-6" style={{ background: "#ffffff" }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">
                The Problem & The Solution
              </p>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
                Where {industry.shortName} Lose Revenue
              </h2>
            </div>

            <div className="space-y-3">
              {industry.problems.map((item, i) => (
                <div key={i} className="grid md:grid-cols-2 gap-5 items-stretch">
                  {/* Problem */}
                  <div
                    className="rounded-2xl px-5 py-4 border relative overflow-hidden flex items-start gap-3"
                    style={{
                      background: "rgba(255,255,255,0.55)",
                      backdropFilter: "blur(18px)",
                      WebkitBackdropFilter: "blur(18px)",
                      border: "1px solid rgba(220,38,38,0.2)",
                      boxShadow: "0 4px 20px rgba(220,38,38,0.06), inset 0 1px 0 rgba(255,255,255,0.85)",
                    }}
                  >
                    <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200/70 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span style={{ fontSize: "12px" }}>✕</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground leading-snug">{item.problem}</p>
                      <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200/60 uppercase tracking-[0.08em]">
                        <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                        {item.stat}
                      </div>
                    </div>
                  </div>

                  {/* Solution */}
                  <div
                    className="rounded-2xl px-5 py-4 border relative overflow-hidden flex items-start gap-3"
                    style={{
                      background: "rgba(255,255,255,0.55)",
                      backdropFilter: "blur(18px)",
                      WebkitBackdropFilter: "blur(18px)",
                      border: "1px solid rgba(154,92,46,0.2)",
                      boxShadow: "0 4px 20px rgba(154,92,46,0.07), inset 0 1px 0 rgba(255,255,255,0.9)",
                    }}
                  >
                    <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span style={{ fontSize: "12px" }}>✓</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground leading-snug">{item.solution}</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25 uppercase tracking-[0.08em]">
                        {item.result}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SMS Demo */}
        <IndustrySMSDemo
          businessName={industry.smsDemo.businessName}
          initialMessage={industry.smsDemo.initialMessage}
          automatedResponse={industry.smsDemo.automatedResponse}
          leadReply={industry.smsDemo.leadReply}
          confirmationMessage={industry.smsDemo.confirmationMessage}
        />

        {/* Results/Metrics */}
        <IndustryResults
          metrics={industry.metrics}
          onBookDemo={() => demoBooking?.openDemoBooking?.()}
        />

        {/* FAQ */}
        <IndustryFAQ faqs={industry.faqs} />
      </main>

      <Footer />
    </div>
  );
}

export default function IndustryTemplate() {
  const { slug } = useParams();

  return (
    <DemoBookingProvider>
      <IndustryTemplateInner industrySlug={slug} />
    </DemoBookingProvider>
  );
}