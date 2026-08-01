import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap, Users, Target, CheckCircle2 } from "lucide-react";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import MobileCallBar from "../components/landing/MobileCallBar";
import { setPageMetadata } from "@/lib/seo";

export default function About() {
  useEffect(() => {
    return setPageMetadata({
      title: "About ClientSurge Systems | AI Automation Packages for Service Businesses",
      description:
        "Learn why ClientSurge Systems exists: to make buying and launching proven AI systems for lead response, follow-up, booking, reviews, and reactivation simple for service businesses.",
      canonicalPath: "/about",
      ogTitle: "About ClientSurge Systems",
      ogDescription:
        "ClientSurge packages AI automation systems, installs them for your business, and checks proof before launch.",
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="px-6 text-center" style={{ background: "linear-gradient(180deg, rgba(0,174,239,0.07) 0%, hsl(var(--background)) 100%)", paddingTop: "calc(var(--cs-nav-height) + 3rem)", paddingBottom: "4rem" }}>
        <p className="cs-section-eyebrow mb-4">Our Story</p>
        <h1 className="font-titles text-4xl md:text-5xl tracking-tight mb-4 text-foreground">The Easiest Way to Buy and Launch AI Automation Systems</h1>
        <p className="text-foreground text-lg max-w-3xl mx-auto">
          ClientSurge exists because service businesses should not need developers, random tools, or months of trial-and-error to launch AI systems for lead response, follow-up, booking, reviews, and reactivation.
        </p>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-titles text-2xl mb-4 text-foreground">Why We Built ClientSurge</h2>
              <p className="text-foreground leading-relaxed mb-4">
                Most companies do not lose leads because they are bad at sales. They lose them because the first response, follow-up, and booking path are too slow or too manual.
              </p>
              <p className="text-foreground leading-relaxed mb-4">
                ClientSurge turns that messy process into a storefront model: choose the system, complete guided intake, and let us configure the workflows that protect your lead flow.
              </p>
              <p className="text-foreground leading-relaxed">
                The goal is not another dashboard your team has to babysit. The goal is a done-for-you operating layer that captures inquiries, recovers missed calls, follows up, books, requests reviews, and reactivates old opportunities.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { icon: Zap, title: "Packaged Systems", desc: "Starter, Growth, and Pro give buyers a clear path instead of vague custom projects." },
                { icon: Target, title: "Outcome-First Setup", desc: "Every workflow is tied to response, follow-up, booking, review, or reactivation outcomes." },
                { icon: Users, title: "Done For You", desc: "We configure, test, and prepare the system so your team is not stuck wiring tools together." },
                { icon: CheckCircle2, title: "Proof Before Launch", desc: "The launch path is checked before a system is treated as live." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-white">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-primary" /></div>
                  <div><p className="text-sm font-semibold text-foreground">{title}</p><p className="text-xs text-foreground mt-0.5">{desc}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-titles text-2xl mb-4 text-foreground">Who It Is For</h2>
            <p className="text-foreground leading-relaxed mb-4">
              ClientSurge is built for service business owners and operators who already get leads but are tired of missed calls, slow replies, inconsistent follow-up, and booking opportunities that disappear.
            </p>
            <p className="text-foreground leading-relaxed mb-4">
              We serve industries where speed-to-response directly affects revenue: med spas, dental practices, chiropractic and physical therapy offices, HVAC, plumbing, roofing, restoration, contractors, real estate teams, and professional service providers.
            </p>
            <p className="text-foreground leading-relaxed">
              If your team manually chases inquiries, forgets quote follow-up, misses calls during busy windows, or lets old leads sit untouched, ClientSurge was designed for that exact gap.
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-primary/20 bg-primary/5">
            <h2 className="font-titles text-2xl mb-4 text-foreground">What We Are Not</h2>
            <div className="grid gap-3 sm:grid-cols-2 mb-6">
              {["Not a chatbot gimmick", "Not a DIY software tool", "Not another dashboard to babysit", "Not a vague custom agency project"].map((item) => <div key={item} className="rounded-lg border border-primary/15 bg-white px-4 py-3 text-sm font-semibold text-foreground">{item}</div>)}
            </div>
            <p className="text-foreground leading-relaxed mb-4">
              We are building a storefront for installable AI systems: pick the package, answer the setup questions, and move into a controlled launch workflow.
            </p>
            <p className="text-foreground leading-relaxed mb-6">
              ClientSurge is founded and operated out of Phoenix, Arizona by operators focused on speed-to-lead, clean workflows, and measurable launch proof.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/pricing" className="cs-btn-primary">Compare Packages</Link>
              <Link to="/pricing" className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors">View Pricing</Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
      <MobileCallBar />
    </div>
  );
}
