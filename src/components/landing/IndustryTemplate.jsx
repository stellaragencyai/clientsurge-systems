import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { DemoBookingProvider, useDemoBooking } from "./DemoBookingContext";
import Navbar from "./Navbar";
import Footer from "./Footer";
import IndustryHero from "../industry/IndustryHero";
import IndustryPainBar from "../industry/IndustryPainBar";
import IndustrySMSDemo from "../industry/IndustrySMSDemo";
import IndustryResults from "../industry/IndustryResults";
import IndustryFAQ from "../industry/IndustryFAQ";
import IndustryAutomationUseCases from "./IndustryAutomationUseCases";
import { getIndustryBySlug } from "@/lib/industryData";
import { getFAQSchema } from "../SEO/SchemaMarkup";
import { setJsonLd, setPageMetadata } from "@/lib/seo";
import { buildIndustryJsonLd } from "@/utils/industryJsonLd";

const INDUSTRY_SEO = {
  roofing: {
    title: "Roofing Automation Systems in Phoenix & Scottsdale | ClientSurge Systems",
    h1: "AI Automation Systems for Roofing Companies in Phoenix & Scottsdale",
    description:
      "AI automation for roofing companies: storm-season lead surges, missed-call recovery, inspection booking, estimate follow-up, insurance and storm-damage inquiry routing, and old estimate reactivation.",
  },
  hvac: {
    title: "HVAC Automation Systems in Phoenix & Scottsdale | ClientSurge Systems",
    h1: "AI Automation Systems for HVAC Companies in Phoenix & Scottsdale",
    description:
      "AI automation for HVAC companies: emergency call handling, seasonal demand spikes, missed-call recovery, estimate follow-up, service-call reminders, and maintenance plan automation.",
  },
  dental: {
    title: "Dental Automation Systems in Phoenix & Scottsdale | ClientSurge Systems",
    h1: "AI Automation Systems for Dental Practices in Phoenix & Scottsdale",
    description:
      "AI automation for dental practices: new patient booking, emergency dental inquiries, missed appointment recovery, treatment-plan follow-up, and review automation.",
  },
  "med-spa": {
    title: "Med Spa Automation Systems in Phoenix & Scottsdale | ClientSurge Systems",
    h1: "AI Automation Systems for Med Spas in Phoenix & Scottsdale",
    description:
      "AI automation for med spas: consultation booking, package lead nurture, membership follow-up, no-show reduction, review requests, and old inquiry reactivation.",
  },
  chiropractic: {
    title: "Chiropractic Automation Systems in Phoenix & Scottsdale | ClientSurge Systems",
    h1: "AI Automation Systems for Chiropractic Clinics in Phoenix & Scottsdale",
    description:
      "AI automation for chiropractic clinics: new patient intake, appointment reminders, unfinished care plan follow-up, reactivation campaigns, and review automation.",
  },
  contractors: {
    title: "Contractor Automation Systems in Phoenix & Scottsdale | ClientSurge Systems",
    h1: "AI Automation Systems for Contractors in Phoenix & Scottsdale",
    description:
      "AI automation for contractors: project inquiry routing, quote follow-up, missed-call recovery, estimate nurturing, and old opportunity reactivation.",
  },
};

const INDUSTRY_HERO_FALLBACKS = {
  "med-spa": "https://images.unsplash.com/photo-1644353740797-b85ffb378b3a?w=1200&q=95&fit=crop&auto=format",
  dental: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200&q=90&fit=crop&auto=format",
  chiropractic: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=90&fit=crop&auto=format",
  hvac: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&q=90&fit=crop&auto=format",
  roofing: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=90&fit=crop&auto=format",
  contractors: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&q=90&fit=crop&auto=format",
};

const INDUSTRY_BLOG_LINKS = {
  "med-spa": {
    href: "/blog/med-spa-lead-response-automation",
    title: "Med spa lead response automation guide",
    description: "See how the med spa workflow handles consult requests, front-desk gaps, booking prompts, and proof boundaries.",
  },
  dental: {
    href: "/blog/dental-missed-call-automation",
    title: "Dental missed call automation guide",
    description: "Review the new-patient missed-call path, dental-specific routing, and launch proof to check before go-live.",
  },
  contractors: {
    href: "/blog/contractor-lead-follow-up-system",
    title: "Contractor lead follow-up guide",
    description: "Map estimate requests, quote follow-up, dormant opportunities, and owner-facing metrics into one workflow.",
  },
  hvac: {
    href: "/blog/hvac-missed-call-text-back",
    title: "HVAC missed call text-back guide",
    description: "Protect urgent repair calls and seasonal demand with approved text-back, routing, and duplicate-suppression proof.",
  },
  roofing: {
    href: "/blog/roofing-lead-response-automation",
    title: "Roofing lead response automation guide",
    description: "Connect storm demand, inspection requests, missed calls, and estimate follow-up without overpromising.",
  },
  chiropractic: {
    href: "/blog/ai-appointment-booking-local-business",
    title: "AI appointment booking guide",
    description: "Understand the qualification, booking, handoff, and human-review limits behind appointment automation.",
  },
};

const INDUSTRY_THEME = {
  default: {
    accent: "#0088CC",
    accentDark: "#003B8F",
    sectionTint: "#f7fbff",
  },
  hvac: {
    accent: "#0088CC",
    accentDark: "#003B8F",
    sectionTint: "#f7fbff",
    triggerLabel: "Run missed-call rescue",
    triggerEvent: "Missed emergency AC call detected",
    automationName: "HVAC Missed-Call Recovery",
  },
};

function buildSmsMessages(smsDemo) {
  return [
    smsDemo?.initialMessage && { from: "lead", text: smsDemo.initialMessage, delay: 300 },
    smsDemo?.automatedResponse && { from: "system", text: smsDemo.automatedResponse, delay: 900 },
    smsDemo?.leadReply && { from: "lead", text: smsDemo.leadReply, delay: 1100 },
    smsDemo?.confirmationMessage && { from: "system", text: smsDemo.confirmationMessage, delay: 900 },
  ].filter(Boolean);
}

function IndustryTemplateInner({ industrySlug }) {
  const industry = getIndustryBySlug(industrySlug);
  const seo = INDUSTRY_SEO[industrySlug];
  const blogLink = INDUSTRY_BLOG_LINKS[industrySlug];
  const theme = INDUSTRY_THEME[industrySlug] || INDUSTRY_THEME.default;
  const demoBooking = useDemoBooking();
  const notFound = !industry;

  useEffect(() => {
    if (!industry) return;

    const cleanupMetadata = setPageMetadata({
      title: seo?.title || `${industry.name} AI Automation | ClientSurge Systems`,
      description: seo?.description || industry.hero?.subheadline || `Done-for-you AI lead response and booking automation for ${industry.name}.`,
      canonicalPath: `/${industrySlug}`,
      ogTitle: seo?.title || `${industry.name} AI Automation | ClientSurge Systems`,
      ogDescription: seo?.description || industry.hero?.subheadline || `AI automation built specifically for ${industry.name}.`,
    });
    const cleanupFaq = setJsonLd(`industry-faq-${industrySlug}`, getFAQSchema(industry.faqs || []));
    const cleanupIndustryJsonLd = setJsonLd(`industry-local-business-${industrySlug}`, buildIndustryJsonLd(industrySlug));

    return () => {
      cleanupIndustryJsonLd?.();
      cleanupFaq?.();
      cleanupMetadata?.();
    };
  }, [industry, industrySlug, seo]);

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
    <div className="industry-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", "--industry-accent": theme.accent, "--industry-accent-dark": theme.accentDark }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <IndustryHero
          eyebrow={industry.hero.eyebrow}
          headline={seo?.h1 || industry.hero.headline}
          subheadline={seo?.description || industry.hero.subheadline}
          image={industry.hero.image || INDUSTRY_HERO_FALLBACKS[industrySlug] || INDUSTRY_HERO_FALLBACKS.contractors}
          cta={industry.hero.cta}
          onBookDemo={() => demoBooking?.openDemoBooking?.()}
        />

        {/* Pain Stats Bar */}
        <IndustryPainBar stats={industry.painStats} />

        {/* Problem/Solution Section (industry-tailored) */}
        <section className="px-4 py-14 md:px-6 md:py-20" style={{ background: "#ffffff" }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold text-primary tracking-[0.18em] uppercase mb-4">
                The Problem & The Solution
              </p>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
                Where {industry.shortName} Lose Revenue
              </h2>
            </div>

            <div className="space-y-4">
              {industry.problems.map((item, i) => (
                <div key={i} className="grid md:grid-cols-2 gap-4 md:gap-5 items-stretch">
                  {/* Problem */}
                  <div
                    className="rounded-lg px-5 py-5 border relative overflow-hidden flex items-start gap-3"
                    style={{
                      background: "linear-gradient(180deg, #ffffff 0%, #fff7f7 100%)",
                      border: "1px solid rgba(185,28,28,0.18)",
                      boxShadow: "0 8px 24px rgba(185,28,28,0.05)",
                    }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-200/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <XCircle style={{ width: "17px", height: "17px", color: "#b91c1c" }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm md:text-base font-semibold text-foreground leading-snug">{item.problem}</p>
                      <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded bg-red-50 border border-red-200/70 uppercase tracking-[0.08em]" style={{ color: "#991b1b" }}>
                        <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                        {item.stat}
                      </div>
                    </div>
                  </div>

                  {/* Solution */}
                  <div
                    className="rounded-lg px-5 py-5 border relative overflow-hidden flex items-start gap-3"
                    style={{
                      background: "linear-gradient(180deg, #ffffff 0%, #f2faff 100%)",
                      border: "1px solid rgba(0,136,204,0.2)",
                      boxShadow: "0 8px 24px rgba(0,59,143,0.06)",
                    }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 style={{ width: "17px", height: "17px", color: theme.accent }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm md:text-base font-semibold text-foreground leading-snug">{item.solution}</p>
                      <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/25 uppercase tracking-[0.08em]">
                        {item.result}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <IndustryAutomationUseCases industry={industry} />

        {blogLink && (
          <section className="bg-[#07111f] px-4 py-12 md:px-6">
            <div className="mx-auto max-w-5xl rounded-lg border border-white/10 bg-white/[0.05] p-6 md:p-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Related launch guide
              </p>
              <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <h2 className="mb-2 text-2xl font-black leading-tight text-white md:text-3xl">
                    {blogLink.title}
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-slate-300">
                    {blogLink.description}
                  </p>
                </div>
                <Link
                  to={blogLink.href}
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
                >
                  Read guide
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* SMS Demo */}
        <IndustrySMSDemo
          businessName={industry.smsDemo.businessName}
          initialMessage={industry.smsDemo.initialMessage}
          automatedResponse={industry.smsDemo.automatedResponse}
          leadReply={industry.smsDemo.leadReply}
          confirmationMessage={industry.smsDemo.confirmationMessage}
          messages={buildSmsMessages(industry.smsDemo)}
          triggerLabel={theme.triggerLabel || "Simulate"}
          triggerEvent={theme.triggerEvent || "New lead detected"}
          automationName={theme.automationName || `${industry.shortName} Automation`}
          accentColor={theme.accent}
        />

        {/* Results/Metrics */}
        <IndustryResults
          metrics={industry.metrics}
          testimonial={industry.testimonial}
          onBookDemo={() => demoBooking?.openDemoBooking?.()}
        />

        {/* FAQ */}
        <IndustryFAQ faqs={industry.faqs} />
      </main>

      <Footer />
    </div>
  );
}

export default function IndustryTemplate({ industrySlug: explicitIndustrySlug }) {
  const { slug } = useParams();
  const industrySlug = explicitIndustrySlug || slug;

  return (
    <DemoBookingProvider>
      <IndustryTemplateInner industrySlug={industrySlug} />
    </DemoBookingProvider>
  );
}
