import { useEffect } from "react";
import { ArrowRight, CheckCircle2, HeartPulse, SmilePlus, Activity, Wrench, Droplets, Hammer, HardHat, Scale, Building2, PawPrint } from "lucide-react";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import MobileCallBar from "../components/landing/MobileCallBar";
import { setPageMetadata } from "@/lib/seo";
import { forceScrollToTop } from "@/lib/scroll";
import CSSectionHeader from "@/components/design-system/CSSectionHeader";

const industries = [
  {
    id: "hvac-ai-growth-system",
    title: "HVAC AI Growth System",
    icon: Wrench,
    description: "The flagship vertical system for emergency HVAC calls, missed-call recovery, AI booking, tune-up nurture, and package-based automation activation.",
    href: "/book?industry=hvac",
    badge: "Flagship",
  },
  {
    id: "dental",
    title: "Dental AI Growth System",
    icon: SmilePlus,
    description: "For new-patient inquiries, appointment routing, insurance questions, recall follow-up, reviews, and patient reactivation.",
    href: "/book?industry=dental",
    badge: "Next",
  },
  {
    id: "roofing",
    title: "Roofing AI Growth System",
    icon: Hammer,
    description: "For storm damage, leak repairs, inspection requests, insurance-claim conversations, estimate follow-up, and review automation.",
    href: "/book?industry=roofing",
    badge: "Next",
  },
  { id: "plumbing", title: "Plumbing & Drain Services", icon: Droplets, description: "For urgent service inquiries, missed-call recovery, and dispatch-ready booking paths.", href: "/book?industry=plumbing", badge: "Legacy" },
  { id: "med-spas-clinics", title: "Med Spas & Aesthetic Clinics", icon: HeartPulse, description: "For consultation inquiries, treatment follow-up, booking handoff, and reactivation.", href: "/book?industry=med-spa", badge: "Legacy" },
  { id: "chiropractic", title: "Chiropractic & Physical Therapy", icon: Activity, description: "For new-patient inquiries, reminders, booking handoff, and patient reactivation.", href: "/book?industry=chiropractic", badge: "Legacy" },
  { id: "contractors", title: "Contractors & Trades", icon: HardHat, description: "For project inquiries, estimate follow-up, walkthrough scheduling, and reviews.", href: "/book?industry=contractors", badge: "Legacy" },
  { id: "real-estate", title: "Real Estate", icon: Building2, description: "For buyer and seller inquiries, showing handoff, follow-up, and old prospect reactivation.", href: "/real-estate", badge: "Legacy" },
  { id: "personal-injury", title: "Personal Injury", icon: Scale, description: "For intake response, consultation scheduling, missed-call recovery, and follow-up.", href: "/personal-injury", badge: "Legacy" },
  { id: "veterinary", title: "Veterinary Clinics", icon: PawPrint, description: "For appointment requests, reminders, missed-call text-back, and client reactivation.", href: "/book?industry=veterinary", badge: "Legacy" },
];

export default function Industries() {
  const handleIndustryNavigation = (event, href) => {
    event.preventDefault();
    forceScrollToTop();
    window.location.assign(href);
  };

  useEffect(() => {
    return setPageMetadata({
      title: "AI Growth Systems by Industry | ClientSurge Systems",
      description: "Explore ClientSurge vertical AI Growth Systems for HVAC, dental, roofing, plumbing, med spas, legal intake, and local service businesses. Each system combines an industry website experience with package-controlled automation modules.",
      canonicalPath: "/industries",
      ogTitle: "ClientSurge Vertical AI Growth Systems",
      ogDescription: "Industry-specific customer acquisition systems powered by AI automation, package permissions, deployment health, and ClientDeployment visibility.",
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="text-center pr-4 pl-4 pt-24 pb-8 bg-background">
        <CSSectionHeader
          eyebrow="Vertical AI Growth Systems"
          title="Industry Systems, Not Generic Website Templates"
          subtitle="Each ClientSurge vertical combines a conversion-focused website, industry-specific AI configuration, CRM pipeline logic, and package-controlled automation modules. The industry defines the experience. The package controls which automations activate."
          as="h1"
        />
      </section>

      <section className="px-6 pb-6">
        <div className="max-w-5xl mx-auto rounded-3xl border border-primary/15 bg-white/80 p-5 md:p-7 shadow-sm">
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-center">
            A basic website is like a house with no utilities. ClientSurge installs the digital plumbing, electricity, security, and smart systems that make the website function as automated revenue infrastructure.
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {industries.map((industry) => {
            const IndustryIcon = industry.icon;
            const isFlagship = industry.badge === "Flagship";
            return (
              <article key={industry.id} id={industry.id} className={`cs-card p-6 scroll-mt-24 ${isFlagship ? "ring-1 ring-primary/25 shadow-[0_18px_60px_rgba(0,107,176,0.14)]" : ""}`}>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border bg-primary/10 border-primary/20"><IndustryIcon className="h-5 w-5 text-primary" /></div>
                    <h2 className="font-display text-2xl font-semibold text-foreground">{industry.title}</h2>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap border ${isFlagship ? "bg-primary text-primary-foreground border-primary" : "bg-primary/10 text-primary border-primary/25"}`}><CheckCircle2 className="w-3.5 h-3.5" /> {industry.badge}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">{industry.description}</p>
                <a href={industry.href} onClick={(event) => handleIndustryNavigation(event, industry.href)} className="cs-btn-secondary">
                  View system fit <ArrowRight className="w-4 h-4" />
                </a>
              </article>
            );
          })}
        </div>
      </section>

      <Footer />
      <MobileCallBar />
    </div>
  );
}
