import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  HeartPulse,
  SmilePlus,
  Activity,
  Wrench,
  Hammer,
  HardHat,
} from "lucide-react";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import MobileCallBar from "../components/landing/MobileCallBar";
import DemoBookingModal from "../components/forms/DemoBookingModal";
import { setPageMetadata } from "@/lib/seo";

const industries = [
{
  id: "med-spas-clinics",
  title: "Med Spas & Aesthetic Clinics",
  status: "Live",
  icon: HeartPulse,
  accent: "text-rose-700",
  accentBg: "bg-rose-50 border-rose-200",
  ctaClass: "border-rose-300/60 bg-rose-50 text-rose-700 hover:bg-rose-100",
  description:
  "Our flagship industry page. See how we automate lead response, follow-up, and consultation booking for med spas and aesthetic clinics.",
  href: "/med-spa"
},
{
  id: "dental",
  title: "Dental & Orthodontics",
  status: "Live",
  icon: SmilePlus,
  accent: "text-cyan-700",
  accentBg: "bg-cyan-50 border-cyan-200",
  ctaClass: "border-cyan-300/60 bg-cyan-50 text-cyan-700 hover:bg-cyan-100",
  description:
  "Best for practices that need faster response to new patient inquiries, missed-call text-back, and more booked consults.",
  href: "/dental"
},
{
  id: "chiropractic",
  title: "Chiropractic & Physical Therapy",
  status: "Live",
  icon: Activity,
  accent: "text-emerald-700",
  accentBg: "bg-emerald-50 border-emerald-200",
  ctaClass: "border-emerald-300/60 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  description:
  "Built for practices that need more evaluations booked, cleaner follow-up, and less admin drag after the first inquiry.",
  href: "/chiropractic"
},
{
  id: "hvac",
  title: "HVAC, Plumbing & Home Services",
  status: "Live",
  icon: Wrench,
  accent: "text-sky-700",
  accentBg: "bg-sky-50 border-sky-200",
  ctaClass: "border-sky-300/60 bg-sky-50 text-sky-700 hover:bg-sky-100",
  description:
  "Ideal for service businesses losing jobs to missed calls, slow follow-up, and manual lead management.",
  href: "/hvac"
},
{
  id: "roofing",
  title: "Roofing & Restoration",
  status: "Live",
  icon: Hammer,
  accent: "text-amber-700",
  accentBg: "bg-amber-50 border-amber-200",
  ctaClass: "border-amber-300/60 bg-amber-50 text-amber-700 hover:bg-amber-100",
  description:
  "Designed for teams that need faster estimate response, better urgency handling, and more booked inspections.",
  href: "/roofing"
},
{
  id: "contractors",
  title: "Contractors & Trades",
  status: "Live",
  icon: HardHat,
  accent: "text-violet-700",
  accentBg: "bg-violet-50 border-violet-200",
  ctaClass: "border-violet-300/60 bg-violet-50 text-violet-700 hover:bg-violet-100",
  description:
  "Great for teams that need to respond quickly, follow up on quote requests, and convert more web leads into booked jobs.",
  href: "/contractors"
}];


export default function Industries() {
  const [showBookingModal, setShowBookingModal] = useState(false);

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
      <section className="text-center pr-2 pl-2 pt-24 pb-4" style={{ background: "linear-gradient(to bottom, hsl(40,8%,88%), hsl(0,0%,100%))" }}>
        <p className="text-xs font-semibold text-[#005f99] tracking-widest uppercase mb-4">Industries</p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-4">
          Automation for Appointment-Based Businesses
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          We build done-for-you automation systems for lead-driven businesses. Start with the live med spa page, or explore the
          industries we are expanding into next.
        </p>
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
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
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
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${industry.ctaClass}`}>
                  
                    Explore this industry
                    <ArrowRight className="w-4 h-4" />
                  </a> :

                <button
                  type="button"
                  onClick={() => setShowBookingModal(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                  
                    Make the Leap
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
