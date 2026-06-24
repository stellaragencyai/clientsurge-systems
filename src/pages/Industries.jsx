import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  HeartPulse,
  SmilePlus,
  Activity,
  Wrench,
  Droplets,
  Hammer,
  HardHat,
  Scale,
} from "lucide-react";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import MobileCallBar from "../components/landing/MobileCallBar";
import DemoBookingModal from "../components/forms/DemoBookingModal";
import { setPageMetadata } from "@/lib/seo";
import { forceScrollToTop } from "@/lib/scroll";
import SectionHeader from "@/components/design-system/SectionHeader";

const industries = [
{
  id: "med-spas-clinics",
  title: "Med Spas & Aesthetic Clinics",
  status: "Live",
  icon: HeartPulse,
  accent: "text-[#005f99]",
  accentBg: "bg-primary/10 border-primary/20",
  ctaClass: "border-primary/25 bg-primary/5 text-primary hover:bg-primary/10",
  description:
  "Our flagship industry page. See how we automate lead response, follow-up, and consultation booking for med spas and aesthetic clinics.",
  href: "/med-spa"
},
{
  id: "dental",
  title: "Dental & Orthodontics",
  status: "Live",
  icon: SmilePlus,
  accent: "text-[#005f99]",
  accentBg: "bg-primary/10 border-primary/20",
  ctaClass: "border-primary/25 bg-primary/5 text-primary hover:bg-primary/10",
  description:
  "Best for practices that need faster response to new patient inquiries, missed-call text-back, and more booked consults.",
  href: "/dental"
},
{
  id: "chiropractic",
  title: "Chiropractic & Physical Therapy",
  status: "Live",
  icon: Activity,
  accent: "text-[#005f99]",
  accentBg: "bg-primary/10 border-primary/20",
  ctaClass: "border-primary/25 bg-primary/5 text-primary hover:bg-primary/10",
  description:
  "Built for practices that need more evaluations booked, cleaner follow-up, and less admin drag after the first inquiry.",
  href: "/chiropractic"
},
{
  id: "hvac",
  title: "HVAC & Heating/Cooling",
  status: "Live",
  icon: Wrench,
  accent: "text-[#005f99]",
  accentBg: "bg-primary/10 border-primary/20",
  ctaClass: "border-primary/25 bg-primary/5 text-primary hover:bg-primary/10",
  description:
  "Ideal for HVAC teams losing jobs to emergency missed calls, seasonal spikes, slow follow-up, and manual booking handoffs.",
  href: "/hvac"
},
{
  id: "plumbing",
  title: "Plumbing & Drain Services",
  status: "Live",
  icon: Droplets,
  accent: "text-[#005f99]",
  accentBg: "bg-primary/10 border-primary/20",
  ctaClass: "border-primary/25 bg-primary/5 text-primary hover:bg-primary/10",
  description:
  "Built for plumbing teams that need faster response to emergency leaks, drain repair, water heater calls, and dispatch handoff.",
  href: "/plumbing"
},
{
  id: "roofing",
  title: "Roofing & Restoration",
  status: "Live",
  icon: Hammer,
  accent: "text-[#005f99]",
  accentBg: "bg-primary/10 border-primary/20",
  ctaClass: "border-primary/25 bg-primary/5 text-primary hover:bg-primary/10",
  description:
  "Designed for teams that need faster estimate response, better urgency handling, and more booked inspections.",
  href: "/roofing"
},
{
  id: "contractors",
  title: "Contractors & Trades",
  status: "Live",
  icon: HardHat,
  accent: "text-[#005f99]",
  accentBg: "bg-primary/10 border-primary/20",
  ctaClass: "border-primary/25 bg-primary/5 text-primary hover:bg-primary/10",
  description:
  "Great for teams that need to respond quickly, follow up on quote requests, and convert more web leads into booked jobs.",
  href: "/contractors"
},
{
  id: "legal-services",
  title: "Legal & Personal Injury",
  status: "Live",
  icon: Scale,
  accent: "text-[#005f99]",
  accentBg: "bg-primary/10 border-primary/20",
  ctaClass: "border-primary/25 bg-primary/5 text-primary hover:bg-primary/10",
  description:
  "Built for law firms and personal injury practices that need faster intake, consistent follow-up, and more signed cases.",
  href: "/personal-injury"
}];


export default function Industries() {
  const [showBookingModal, setShowBookingModal] = useState(false);

  const handleIndustryNavigation = (event, href) => {
    event.preventDefault();
    forceScrollToTop();
    window.location.assign(href);
  };

  useEffect(() => {
    return setPageMetadata({
      title: "Industries We Serve | ClientSurge Systems",
      description:
      "Explore the industries ClientSurge Systems serves, from med spas and clinics to home services and appointment-based businesses.",
      canonicalPath: "/industries",
      ogTitle: "Industries We Serve | ClientSurge Systems",
      ogDescription:
      "See which industries ClientSurge supports and where tailored automation pages are available today."
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="text-center pr-4 pl-4 pt-24 pb-8" style={{ background: "linear-gradient(to bottom, #f7fbff, #ffffff)" }}>
        <SectionHeader
          eyebrow="Industries"
          title="Automation for Appointment-Based Businesses"
          subtitle="We build done-for-you automation systems for lead-driven businesses. Start with the live med spa page, or explore the industries we are expanding into next."
        />
      </section>

      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {industries.map((industry) => {
            const isLive = industry.status === "Live";
            const IndustryIcon = industry.icon;
            return (
              <article
                key={industry.id}
                id={industry.id}
                className="rounded-3xl border border-border bg-card p-6 shadow-sm scroll-mt-24">
                
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${industry.accentBg}`}>
                      <IndustryIcon className={`h-5 w-5 ${industry.accent}`} />
                    </div>
                    <h2 className="font-display text-2xl font-semibold text-foreground">{industry.title}</h2>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap ${
                    isLive ?
                    "bg-[#005f99]/10 text-[#005f99] border border-[#005f99]/25" :
                    "bg-muted text-muted-foreground border border-border"}`
                    }>
                    
                    {isLive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock3 className="w-3.5 h-3.5" />}
                    {industry.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">{industry.description}</p>
                {isLive ?
                <a
                  href={industry.href}
                  onClick={(event) => handleIndustryNavigation(event, industry.href)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${industry.ctaClass}`}>
                  
                    Explore this industry
                    <ArrowRight className="w-4 h-4" />
                  </a> :

                <button
                  type="button"
                  onClick={() => setShowBookingModal(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                  
                    Free Automation Audit
                    <ArrowRight className="w-4 h-4" />
                  </button>
                }
              </article>);

          })}
        </div>
      </section>

      <Footer />
      <MobileCallBar />
      {showBookingModal && <DemoBookingModal onClose={() => setShowBookingModal(false)} />}
    </div>);

}