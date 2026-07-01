import { useEffect } from "react";
import { ArrowRight, CheckCircle2, HeartPulse, SmilePlus, Activity, Wrench, Droplets, Hammer, HardHat, Scale, Building2, PawPrint } from "lucide-react";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import MobileCallBar from "../components/landing/MobileCallBar";
import { setPageMetadata } from "@/lib/seo";
import { forceScrollToTop } from "@/lib/scroll";
import SectionHeader from "@/components/design-system/SectionHeader";

const industries = [
  { id: "roofing", title: "Roofing & Restoration", icon: Hammer, description: "For teams that need faster inspection response, quote follow-up, and reactivation.", href: "/roofing" },
  { id: "hvac", title: "HVAC & Heating/Cooling", icon: Wrench, description: "For teams handling seasonal spikes, missed calls, service requests, and booking handoffs.", href: "/hvac" },
  { id: "plumbing", title: "Plumbing & Drain Services", icon: Droplets, description: "For urgent service inquiries, missed-call recovery, and dispatch-ready booking paths.", href: "/plumbing" },
  { id: "dental", title: "Dental & Orthodontics", icon: SmilePlus, description: "For new-patient response, appointment routing, recall follow-up, and review requests.", href: "/dental" },
  { id: "med-spas-clinics", title: "Med Spas & Aesthetic Clinics", icon: HeartPulse, description: "For consultation inquiries, treatment follow-up, booking handoff, and reactivation.", href: "/med-spa" },
  { id: "chiropractic", title: "Chiropractic & Physical Therapy", icon: Activity, description: "For new-patient inquiries, reminders, booking handoff, and patient reactivation.", href: "/chiropractic" },
  { id: "contractors", title: "Contractors & Trades", icon: HardHat, description: "For project inquiries, estimate follow-up, walkthrough scheduling, and reviews.", href: "/contractors" },
  { id: "real-estate", title: "Real Estate", icon: Building2, description: "For buyer and seller inquiries, showing handoff, follow-up, and old prospect reactivation.", href: "/real-estate" },
  { id: "personal-injury", title: "Personal Injury", icon: Scale, description: "For intake response, consultation scheduling, missed-call recovery, and follow-up.", href: "/personal-injury" },
  { id: "veterinary", title: "Veterinary Clinics", icon: PawPrint, description: "For appointment requests, reminders, missed-call text-back, and client reactivation.", href: "/veterinary" },
];

export default function Industries() {
  const handleIndustryNavigation = (event, href) => {
    event.preventDefault();
    forceScrollToTop();
    window.location.assign(href);
  };

  useEffect(() => {
    return setPageMetadata({
      title: "Industries We Serve | ClientSurge Systems",
      description: "Explore ClientSurge systems for roofing, HVAC, plumbing, dental, med spa, chiropractic, contractors, real estate, personal injury, and veterinary clinics.",
      canonicalPath: "/industries",
      ogTitle: "ClientSurge Systems by Industry",
      ogDescription: "See which ClientSurge automation systems fit your industry and lead flow.",
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="text-center pr-4 pl-4 pt-24 pb-8 bg-background">
        <SectionHeader
          eyebrow="Industries"
          title="Automation for Lead-Driven Service Businesses"
          subtitle="We build done-for-you systems for businesses that depend on fast lead response, follow-up, booking, reviews, and reactivation."
        />
      </section>

      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {industries.map((industry) => {
            const IndustryIcon = industry.icon;
            return (
              <article key={industry.id} id={industry.id} className="cs-card p-6 scroll-mt-24">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border bg-primary/10 border-primary/20"><IndustryIcon className="h-5 w-5 text-primary" /></div>
                    <h2 className="font-display text-2xl font-semibold text-foreground">{industry.title}</h2>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap bg-primary/10 text-primary border border-primary/25"><CheckCircle2 className="w-3.5 h-3.5" /> Live</span>
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
