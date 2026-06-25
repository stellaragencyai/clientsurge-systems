import { useEffect } from "react";
import { Link } from "react-router-dom";
import { setPageMetadata } from "@/lib/seo";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MobileCallBar from "@/components/landing/MobileCallBar";
import SectionHeader from "@/components/design-system/SectionHeader";

export default function PersonalInjury() {
  useEffect(() => {
    return setPageMetadata({
      title: "Personal Injury Law Firm Automation | AI Lead Intake & Follow-up | ClientSurge",
      description: "Automate lead intake, initial consultation scheduling, and follow-up for personal injury law firms. Capture more cases, close faster, scale your practice.",
      canonicalPath: "/personal-injury",
      ogTitle: "Personal Injury Law Firm Automation",
      ogDescription: "AI automation for personal injury lawyers: instant intake responses, automatic consultation scheduling, consistent follow-up, and case file management integration.",
    });
  }, []);

  const painPoints = [
    "Missed calls and inquiries go to voicemail",
    "Slow response to potential clients (hours to days)",
    "Manual intake forms never completed by callers",
    "Unscheduled consults lose deals to competitors",
    "Weak follow-up on soft inquiries",
    "Admin time takes away from case work",
  ];

  const benefits = [
    "Instant SMS/email response to every inquiry within 60 seconds",
    "AI intake assistant collects case details 24/7",
    "Automatic consultation scheduling via calendar integration",
    "Multi-step follow-up for inquiries that aren't ready",
    "Missed call recovery — text-back to people who called",
    "Case file pre-population from intake data",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 px-6 md:px-8 text-center" style={{ background: "linear-gradient(to bottom, #f7fbff, #ffffff)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest" style={{ background: "rgba(0,174,239,0.1)", color: "#00AEEF" }}>
            Personal Injury Automation
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-black mb-6" style={{ lineHeight: 1.2 }}>
            Capture Every Lead. Close More Cases.
          </h1>
          <p className="text-lg md:text-xl text-foreground/75 max-w-2xl mx-auto mb-10" style={{ lineHeight: 1.6 }}>
            AI agents that answer every call, respond to every inquiry, schedule consultations automatically, and manage follow-up so you can focus on winning cases.
          </p>
          <Link to="/product-signup?package=growth_system" className="cs-btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-base">
            Get Started →
          </Link>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-16 px-6 md:px-8">
        <div className="max-w-4xl mx-auto">
          <SectionHeader eyebrow="The Challenge" title="Qualified leads slip away" subtitle="In personal injury, speed and consistency matter. Missed calls and slow responses cost you cases to firms that respond faster." />
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {painPoints.map((point) => (
              <div key={point} className="flex gap-4 p-5 rounded-xl border border-border/60 bg-card/50">
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(0,174,239,0.15)", color: "#00AEEF" }}>
                  ✓
                </div>
                <p className="text-sm text-foreground/80">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-6 md:px-8 bg-gradient-to-br from-blue-50 to-blue-25">
        <div className="max-w-4xl mx-auto">
          <SectionHeader eyebrow="Our Solution" title="Never miss a case again" subtitle="Automated intake, instant response, and smart follow-up that scales your practice without adding overhead." />
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {benefits.map((benefit) => (
              <div key={benefit} className="p-6 rounded-xl border border-primary/20 bg-white">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #0088CC, #00AEEF)" }}>
                  <span className="text-white font-bold">✓</span>
                </div>
                <p className="text-sm font-medium text-foreground">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Included in Growth System */}
      <section className="py-16 px-6 md:px-8">
        <div className="max-w-4xl mx-auto">
          <SectionHeader eyebrow="Personal Injury Package" title="Growth System — Most Popular" subtitle="Everything you need to capture, intake, and follow up with more clients." />
          <div className="grid md:grid-cols-2 gap-10 mt-12 max-w-3xl mx-auto">
            <div>
              <h3 className="font-bold text-lg mb-4 text-foreground">What's Included</h3>
              <ul className="space-y-3">
                {[
                  "24/7 inbound call answering",
                  "Instant SMS/email intake response",
                  "AI intake form completion",
                  "Consultation scheduling integration",
                  "Missed call text-back system",
                  "Multi-step follow-up sequences",
                  "Client portal for case tracking",
                  "CRM sync and file pre-population",
                ].map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-foreground/80">
                    <span className="text-primary font-bold flex-shrink-0">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4 text-foreground">Pricing</h3>
              <div className="space-y-4">
                <div className="rounded-lg border border-primary/20 p-6 bg-primary/5">
                  <p className="text-4xl font-bold text-black">$997</p>
                  <p className="text-sm text-foreground/60 mt-2">/month (after $1,297 one-time setup)</p>
                  <p className="text-xs text-foreground/50 mt-4">Month-to-month, no long-term contract</p>
                </div>
                <Link to="/product-signup?package=growth_system" className="cs-btn-primary w-full text-center block py-3">
                  Start Free Audit
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-16 px-6 md:px-8 text-center" style={{ background: "linear-gradient(135deg, #003B8F, #006BB0)" }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Scale your firm without scaling overhead</h2>
          <p className="text-lg text-blue-100 mb-8">See how much revenue you're leaving on the table by not responding to every lead immediately.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/product-signup?package=growth_system" className="inline-flex items-center justify-center rounded-full border-2 border-white bg-white text-primary font-bold px-8 py-3">
              See Pricing
            </Link>
            <Link to="/book" className="inline-flex items-center justify-center rounded-full border-2 border-white text-white font-bold px-8 py-3 hover:bg-white/10 transition-colors">
              Free Audit
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <MobileCallBar />
    </div>
  );
}