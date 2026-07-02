import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { DemoBookingProvider, useDemoBooking } from "./DemoBookingContext";
import Navbar from "./Navbar";
import LaunchAnnouncementBanner from "@/components/campaign/LaunchAnnouncementBanner";
import Footer from "./Footer";
import IndustryHero from "../industry/IndustryHero";
import IndustryPainBar from "../industry/IndustryPainBar";
import IndustrySMSDemo from "../industry/IndustrySMSDemo";
import IndustryResults from "../industry/IndustryResults";
import IndustryFAQ from "../industry/IndustryFAQ";
import IndustryAutomationUseCases from "./IndustryAutomationUseCases";
import { getIndustryBySlug } from "@/lib/industryData";
import { applyCurrentSixIndustryOverride } from "@/lib/currentSixIndustryPageOverrides";
import { getFAQSchema } from "../SEO/SchemaMarkup";
import { setJsonLd, setPageMetadata } from "@/lib/seo";
import { forceScrollToTop } from "@/lib/scroll";
import { buildIndustryJsonLd } from "@/utils/industryJsonLd";
import ErrorBoundary from "@/components/ErrorBoundary";
import { trackCTA } from "@/lib/analytics";

const INDUSTRY_SEO = {
  roofing: { title: "Roofing Automation Systems in Phoenix & Scottsdale | ClientSurge Systems", h1: "Get More Roofing Leads Booked Before Competitors Reply", description: "AI automation for roofing companies: storm-season lead surges, missed-call recovery, inspection booking, estimate follow-up, insurance and storm-damage inquiry routing, and old estimate reactivation." },
  hvac: { title: "HVAC Automation Systems in Phoenix & Scottsdale | ClientSurge Systems", h1: "Book More HVAC Service Calls During Peak Demand", description: "AI automation for HVAC companies: emergency call handling, seasonal demand spikes, missed-call recovery, estimate follow-up, service-call reminders, and maintenance plan automation." },
  plumbing: { title: "Plumbing Automation Systems in Phoenix & Scottsdale | ClientSurge Systems", h1: "Turn Urgent Plumbing Calls Into Booked Dispatches Faster", description: "AI automation for plumbing companies: emergency leak calls, drain repair requests, water heater inquiries, missed-call recovery, after-hours lead capture, and dispatch handoff." },
  dental: { title: "Dental Automation Systems in Phoenix & Scottsdale | ClientSurge Systems", h1: "Turn More New Patient Inquiries Into Confirmed Appointments", description: "AI automation for dental practices: new patient booking, emergency dental inquiries, missed appointment recovery, treatment-plan follow-up, and review automation." },
  "med-spa": { title: "Med Spa Automation Systems in Phoenix & Scottsdale | ClientSurge Systems", h1: "Book More Med Spa Consults Before Leads Go Cold", description: "AI automation for med spas: consultation requests, aesthetic treatment inquiries, missed DMs and calls, booking handoff, lead nurture, and old inquiry reactivation." },
  chiropractic: { title: "Chiropractic Automation Systems in Phoenix & Scottsdale | ClientSurge Systems", h1: "AI Automation Systems for Chiropractic Clinics in Phoenix & Scottsdale", description: "AI automation for chiropractic clinics: new patient intake, appointment reminders, unfinished care plan follow-up, reactivation campaigns, and review automation." },
  contractors: { title: "Contractor Automation Systems in Phoenix & Scottsdale | ClientSurge Systems", h1: "AI Automation Systems for Contractors in Phoenix & Scottsdale", description: "AI automation for contractors: project inquiry routing, quote follow-up, missed-call recovery, estimate nurturing, and old opportunity reactivation." },
  "real-estate": { title: "Real Estate Lead Automation | ClientSurge Systems", h1: "Respond to Buyer & Seller Leads Before Any Competitor Does", description: "AI automation for real estate agents: instant response to Zillow and portal leads, showing scheduling, missed-call recovery, open house follow-up, and listing consultation booking." },
  "personal-injury": { title: "Personal Injury Law Firm Automation | ClientSurge Systems", h1: "Sign More Cases With 24/7 AI Intake Before Leads Call Another Firm", description: "AI automation for personal injury law firms: 24/7 intake, instant accident inquiry response, case pre-screening, missed-call recovery, and retainer follow-up." },
};

const INDUSTRY_HERO_FALLBACKS = {
  "med-spa": "https://images.unsplash.com/photo-1644353740797-b85ffb378b3a?w=1200&q=95&fit=crop&auto=format",
  dental: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200&q=90&fit=crop&auto=format",
  chiropractic: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=90&fit=crop&auto=format",
  hvac: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200&q=90&fit=crop&auto=format",
  plumbing: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200&q=90&fit=crop&auto=format",
  roofing: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=90&fit=crop&auto=format",
  contractors: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&q=90&fit=crop&auto=format",
  "real-estate": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=95&fit=crop&auto=format",
  "personal-injury": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&q=95&fit=crop&auto=format",
};

const INDUSTRY_BLOG_LINKS = {
  "med-spa": { href: "/blog/med-spa-lead-response-automation", title: "Med spa lead response automation guide", description: "See how the med spa workflow handles consult requests, front-desk gaps, booking prompts, and proof boundaries." },
  dental: { href: "/blog/dental-missed-call-automation", title: "Dental missed call automation guide", description: "Review the new-patient missed-call path, dental-specific routing, and launch proof to check before go-live." },
  contractors: { href: "/blog/contractor-lead-follow-up-system", title: "Contractor lead follow-up guide", description: "Map estimate requests, quote follow-up, dormant opportunities, and owner-facing metrics into one workflow." },
  hvac: { href: "/blog/hvac-missed-call-text-back", title: "HVAC missed call text-back guide", description: "Protect urgent repair calls and seasonal demand with approved text-back, routing, and duplicate-suppression proof." },
  plumbing: { href: "/blog/hvac-missed-call-text-back", title: "Missed-call text-back guide for urgent home-service leads", description: "Use the HVAC guide as the current source-backed missed-call workflow reference while plumbing-specific production proof is pending." },
  roofing: { href: "/blog/roofing-lead-response-automation", title: "Roofing lead response automation guide", description: "Connect storm demand, inspection requests, missed calls, and estimate follow-up without overpromising." },
  chiropractic: { href: "/blog/ai-appointment-booking-local-business", title: "AI appointment booking guide", description: "Understand the qualification, booking, handoff, and human-review limits behind appointment automation." },
};

const INDUSTRY_THEME = {
  default: { accent: "#0088CC", accentDark: "#003B8F", sectionTint: "#f7fbff" },
  hvac: { accent: "#0088CC", accentDark: "#003B8F", sectionTint: "#f7fbff", triggerLabel: "Run missed-call rescue", triggerEvent: "Missed emergency AC call detected", automationName: "HVAC Missed-Call Recovery" },
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
  const baseIndustry = getIndustryBySlug(industrySlug);
  const industry = applyCurrentSixIndustryOverride(baseIndustry, industrySlug);
  const seo = INDUSTRY_SEO[industrySlug];
  const blogLink = INDUSTRY_BLOG_LINKS[industrySlug];
  const theme = INDUSTRY_THEME[industrySlug] || INDUSTRY_THEME.default;
  const demoBooking = useDemoBooking();
  const notFound = !industry;

  useEffect(() => {
    forceScrollToTop();
    trackCTA(`industry_page_${industrySlug}`, "industry");
  }, [industrySlug]);

  useEffect(() => {
    if (!industry) return;

    const cleanupMetadata = setPageMetadata({
      title: seo?.title || `${industry.name} AI Automation | ClientSurge Systems`,
      description: industry.hero?.subheadline || seo?.description || `Done-for-you AI lead response and booking automation for ${industry.name}.`,
      canonicalPath: `/${industrySlug}`,
      ogTitle: seo?.title || `${industry.name} AI Automation | ClientSurge Systems`,
      ogDescription: industry.hero?.subheadline || seo?.description || `AI automation built specifically for ${industry.name}.`,
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
      <LaunchAnnouncementBanner />
      <main style={{ flex: 1 }}>
        <ErrorBoundary>
          <IndustryHero
            eyebrow={industry.hero.eyebrow}
            headline={industry.hero.headline || seo?.h1}
            subheadline={industry.hero.subheadline || seo?.description}
            image={industry.hero.image || INDUSTRY_HERO_FALLBACKS[industrySlug] || INDUSTRY_HERO_FALLBACKS.contractors}
            cta={industry.hero.cta}
            onBookDemo={() => {
              trackCTA("hero_demo_cta", `industry_${industrySlug}`);
              demoBooking?.openDemoBooking?.({ prefillIndustry: industry.name, industrySlug });
            }}
          />
        </ErrorBoundary>

        <ErrorBoundary>
          <IndustryPainBar stats={industry.painStats} />
        </ErrorBoundary>

        <section className="px-4 py-14 md:px-6 md:py-20" style={{ background: "#ffffff" }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold text-primary tracking-[0.18em] uppercase mb-4">The Problem & The Solution</p>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                Where {industry.shortName} Lose Revenue
              </h2>
            </div>

            <div className="space-y-4">
              {industry.problems.map((item, i) => (
                <div key={i} className="grid md:grid-cols-2 gap-4 md:gap-5 items-stretch">
                  <div className="rounded-lg px-5 py-5 border relative overflow-hidden flex items-start gap-3" style={{ background: "linear-gradient(180deg, #ffffff 0%, #fff7f7 100%)", border: "1px solid rgba(185,28,28,0.18)", boxShadow: "0 8px 24px rgba(185,28,28,0.05)" }}>
                    <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-200/80 flex items-center justify-center flex-shrink-0 mt-0.5"><XCircle style={{ width: "17px", height: "17px", color: "#b91c1c" }} /></div>
                    <div className="flex-1"><p className="text-sm md:text-base font-semibold text-foreground leading-snug">{item.problem}</p><div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded bg-red-50 border border-red-200/70 uppercase tracking-[0.08em]" style={{ color: "#991b1b" }}><span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />{item.stat}</div></div>
                  </div>
                  <div className="rounded-lg px-5 py-5 border relative overflow-hidden flex items-start gap-3" style={{ background: "linear-gradient(180deg, #ffffff 0%, #f2faff 100%)", border: "1px solid rgba(0,136,204,0.2)", boxShadow: "0 8px 24px rgba(0,59,143,0.06)" }}>
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center flex-shrink-0 mt-0.5"><CheckCircle2 style={{ width: "17px", height: "17px", color: theme.accent }} /></div>
                    <div className="flex-1"><p className="text-sm md:text-base font-semibold text-foreground leading-snug">{item.solution}</p><div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/25 uppercase tracking-[0.08em]">{item.result}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ErrorBoundary><IndustryAutomationUseCases industry={industry} /></ErrorBoundary>

        {blogLink && (
          <section className="bg-primary/5 px-4 py-12 md:px-6">
            <div className="mx-auto max-w-5xl rounded-lg border border-primary/15 bg-white p-6 shadow-sm md:p-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">Related launch guide</p>
              <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
                <div><h2 className="mb-2 text-2xl font-black leading-tight text-foreground md:text-3xl">{blogLink.title}</h2><p className="max-w-2xl text-sm leading-6 text-muted-foreground">{blogLink.description}</p></div>
                <Link to={blogLink.href} onClick={() => trackCTA("blog_guide_link", `industry_${industrySlug}`)} className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-black text-white shadow-sm transition hover:opacity-90">Read guide</Link>
              </div>
            </div>
          </section>
        )}

        <ErrorBoundary>
          <IndustrySMSDemo businessName={industry.smsDemo.businessName} initialMessage={industry.smsDemo.initialMessage} automatedResponse={industry.smsDemo.automatedResponse} leadReply={industry.smsDemo.leadReply} confirmationMessage={industry.smsDemo.confirmationMessage} messages={buildSmsMessages(industry.smsDemo)} triggerLabel={theme.triggerLabel || "Simulate"} triggerEvent={theme.triggerEvent || "New lead detected"} automationName={theme.automationName || `${industry.shortName} Automation`} accentColor={theme.accent} />
        </ErrorBoundary>

        <ErrorBoundary>
          <IndustryResults metrics={industry.metrics} testimonial={industry.testimonial} finalCta={industry.hero.cta} onBookDemo={() => { trackCTA("results_demo_cta", `industry_${industrySlug}`); demoBooking?.openDemoBooking?.({ prefillIndustry: industry.name, industrySlug }); }} />
        </ErrorBoundary>

        <ErrorBoundary><IndustryFAQ faqs={industry.faqs} /></ErrorBoundary>
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
