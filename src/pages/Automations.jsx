import { useEffect } from "react";
import { ArrowRight, Zap, Mail, Calendar, Star, RefreshCw, CheckCircle, Headphones } from "lucide-react";
import { Link } from "react-router-dom";
import { setPageMetadata } from "@/lib/seo";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MobileCallBar from "@/components/landing/MobileCallBar";
import SectionHeader from "@/components/design-system/SectionHeader";

const SERVICES = [
  { id: "ai-voice-agent", icon: Headphones, title: "AI Phone Receptionist", tagline: "Answers, triages, and routes calls when your team is busy, closed, or overloaded.", included: "Optional premium call layer" },
  { id: "lead-capture-automation", icon: Zap, title: "Lead Capture Automation", tagline: "Turns forms, calls, ads, and website inquiries into one trackable pipeline.", included: "Starter and above" },
  { id: "missed-call-text-back", icon: Headphones, title: "Missed-Call Recovery", tagline: "Texts missed callers quickly so the conversation can continue.", included: "Starter and above" },
  { id: "ai-lead-follow-up", icon: Mail, title: "AI Lead Follow-Up", tagline: "Keeps prospects warm until they reply, book, opt out, or become closed.", included: "Growth and Pro" },
  { id: "appointment-booking-automation", icon: Calendar, title: "AI Booking Automation", tagline: "Moves interested prospects toward a confirmed appointment or handoff.", included: "Growth and Pro" },
  { id: "review-automation", icon: Star, title: "Review Automation", tagline: "Requests reviews when the customer experience is fresh and the timing is right.", included: "Pro" },
  { id: "customer-reactivation", icon: RefreshCw, title: "Reactivation Automation", tagline: "Brings old leads, no-shows, and unclosed quotes back into conversation.", included: "Pro" },
];

export default function Automations() {
  useEffect(() => {
    return setPageMetadata({
      title: "ClientSurge Automation Stack | Lead Response, Booking, Reviews, Reactivation",
      description: "Explore the ClientSurge automation stack across Starter, Growth, and Pro: lead capture, missed-call recovery, follow-up, booking, reviews, reactivation, and optional AI phone coverage.",
      canonicalPath: "/automations",
      ogTitle: "ClientSurge Automation Stack",
      ogDescription: "See which automation systems are included in Starter, Growth, and Pro packages.",
    });
  }, []);

  return (
    <DemoBookingProvider>
      <div className="min-h-screen text-slate-950" style={{ background: "#FFFFFF" }}>
        <Navbar />
        <main className="pt-[var(--cs-nav-height)]">
          <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
            <SectionHeader
              eyebrow="Automation Stack"
              title="Explore the ClientSurge Automation Stack"
              subtitle="Starter, Growth, and Pro include different combinations of these systems depending on how much of your lead flow you want ClientSurge to handle."
              align="center"
              variant="light"
            />
          </section>

          <section className="max-w-7xl mx-auto px-6 pb-24">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {SERVICES.map((service) => {
                const Icon = service.icon;
                return (
                  <article
                    key={service.id}
                    className="rounded-xl overflow-hidden border p-6 flex flex-col shadow-sm"
                    style={{
                      background: "#FFFFFF",
                      borderColor: "rgba(0,79,156,0.16)",
                      boxShadow: "0 18px 45px rgba(6,16,37,0.08)",
                    }}
                  >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(53,189,241,0.12)", border: "1px solid rgba(53,189,241,0.25)" }}>
                      <Icon className="w-5 h-5" style={{ color: "#0077B6" }} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#53647A" }}>What this protects</p>
                    <h2 className="font-titles text-lg font-bold mb-2" style={{ color: "#061025" }}>{service.title}</h2>
                    <p className="text-sm leading-relaxed mb-4 flex-1" style={{ color: "#334155" }}>{service.tagline}</p>
                    <div className="rounded-lg p-3 mb-5" style={{ border: "1px solid rgba(0,119,182,0.18)", background: "#EFF8FF" }}>
                      <p className="text-xs font-semibold" style={{ color: "#061025" }}><CheckCircle className="w-3.5 h-3.5 inline mr-1" style={{ color: "#0077B6" }} /> {service.included}</p>
                    </div>
                    <Link to={`/book?service=${service.id}`} className="cs-btn-primary w-full">See Packages With This System <ArrowRight className="w-4 h-4" /></Link>
                  </article>
                );
              })}
            </div>

            <div
              className="mt-16 rounded-2xl p-10 md:p-14 text-center"
              style={{
                background: "linear-gradient(135deg, rgba(239,248,255,0.96), rgba(255,255,255,0.98))",
                border: "1px solid rgba(0,79,156,0.16)",
                boxShadow: "0 22px 60px rgba(6,16,37,0.08)",
              }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#0077B6" }}>Compare Packages</p>
              <h2 className="font-titles text-3xl md:text-4xl font-bold mb-4" style={{ color: "#061025" }}>Not Every Business Needs the Full Stack on Day One</h2>
              <p className="text-base max-w-xl mx-auto mb-8 leading-relaxed" style={{ color: "#334155" }}>Compare Starter, Growth, and Pro to choose the amount of lead flow you want ClientSurge to handle.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/pricing" className="cs-btn-primary" style={{ padding: "0 40px", height: "56px", fontSize: "1rem" }}>Compare Packages <ArrowRight className="w-5 h-5" /></Link>
                <Link to="/book" className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold transition-all" style={{ color: "#004F9C", border: "1.5px solid rgba(0, 119, 182, 0.28)", background: "#FFFFFF" }}>Get Help Choosing</Link>
              </div>
            </div>
          </section>
        </main>
        <Footer />
        <MobileCallBar />
      </div>
    </DemoBookingProvider>
  );
}
