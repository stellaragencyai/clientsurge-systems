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
      <div className="min-h-screen" style={{ background: "#061025" }}>
        <Navbar />
        <main className="pt-[var(--cs-nav-height)]">
          <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
            <SectionHeader
              eyebrow="Automation Stack"
              title="Explore the ClientSurge Automation Stack"
              subtitle="Starter, Growth, and Pro include different combinations of these systems depending on how much of your lead flow you want ClientSurge to handle."
              align="center"
              variant="dark"
            />
          </section>

          <section className="max-w-7xl mx-auto px-6 pb-24">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {SERVICES.map((service) => {
                const Icon = service.icon;
                return (
                  <article key={service.id} className="rounded-xl overflow-hidden border p-6 flex flex-col" style={{ background: "rgba(8,20,44,0.72)", borderColor: "rgba(53,189,241,0.2)" }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(53,189,241,0.12)", border: "1px solid rgba(53,189,241,0.25)" }}>
                      <Icon className="w-5 h-5" style={{ color: "#35BDF1" }} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#7F8DA3" }}>What this protects</p>
                    <h2 className="font-titles text-lg font-bold mb-2" style={{ color: "#FFFFFF" }}>{service.title}</h2>
                    <p className="text-sm leading-relaxed mb-4 flex-1" style={{ color: "#AEB8C8" }}>{service.tagline}</p>
                    <div className="rounded-lg p-3 mb-5" style={{ border: "1px solid rgba(53,189,241,0.2)", background: "rgba(53,189,241,0.06)" }}>
                      <p className="text-xs font-semibold" style={{ color: "#FFFFFF" }}><CheckCircle className="w-3.5 h-3.5 inline mr-1" style={{ color: "#35BDF1" }} /> {service.included}</p>
                    </div>
                    <Link to={`/book?service=${service.id}`} className="cs-btn-primary w-full">See Packages With This System <ArrowRight className="w-4 h-4" /></Link>
                  </article>
                );
              })}
            </div>

            <div className="mt-16 rounded-2xl p-10 md:p-14 text-center" style={{ background: "linear-gradient(135deg, rgba(0,79,156,0.12), rgba(0,59,143,0.08))", border: "1px solid rgba(53,189,241,0.2)", backdropFilter: "blur(12px)" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#35BDF1" }}>Compare Packages</p>
              <h2 className="font-titles text-3xl md:text-4xl font-bold mb-4" style={{ color: "#FFFFFF" }}>Not Every Business Needs the Full Stack on Day One</h2>
              <p className="text-base max-w-xl mx-auto mb-8 leading-relaxed" style={{ color: "#AEB8C8" }}>Compare Starter, Growth, and Pro to choose the amount of lead flow you want ClientSurge to handle.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/pricing" className="cs-btn-primary" style={{ padding: "0 40px", height: "56px", fontSize: "1rem" }}>Compare Packages <ArrowRight className="w-5 h-5" /></Link>
                <Link to="/book" className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold transition-all" style={{ color: "#FFFFFF", border: "1.5px solid rgba(53, 189, 241, 0.3)", background: "rgba(8, 20, 44, 0.5)" }}>Get Help Choosing</Link>
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
