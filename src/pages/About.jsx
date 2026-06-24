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
      title: "About ClientSurge Systems | AI Automation for Service Businesses",
      description:
        "Learn about ClientSurge Systems — who we are, what we build, and why we help local service businesses stop losing leads with done-for-you AI automation.",
      canonicalPath: "/about",
      ogTitle: "About ClientSurge Systems",
      ogDescription:
        "Done-for-you AI automation that turns missed leads into booked appointments — built for service businesses in Phoenix, AZ and beyond.",
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section
        className="px-6 text-center"
        style={{
          background: "linear-gradient(180deg, rgba(0,174,239,0.07) 0%, hsl(var(--background)) 100%)",
          paddingTop: "calc(var(--cs-nav-height) + 3rem)",
          paddingBottom: "4rem",
        }}
      >
        <p className="cs-section-eyebrow mb-4">Our Story</p>
        <h1 className="font-titles text-4xl md:text-5xl tracking-tight mb-4 text-foreground">
          About ClientSurge Systems
        </h1>
        <p className="text-foreground text-lg max-w-2xl mx-auto">
          We build done-for-you AI automation systems that help local service businesses respond faster, follow up smarter, and book more appointments — without adding more work to their plate.
        </p>
      </section>

      {/* Main content */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-16">

          {/* What we do */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-titles text-2xl mb-4 text-foreground">What We Do</h2>
              <p className="text-foreground leading-relaxed mb-4">
                ClientSurge Systems is an AI-powered lead automation platform built specifically for service businesses — med spas, dental offices, HVAC companies, roofers, chiropractors, and contractors. We automate the most critical part of your business: what happens the moment a new lead reaches out.
              </p>
              <p className="text-foreground leading-relaxed mb-4">
                Many service businesses lose opportunities when calls, forms, and follow-up wait too long. ClientSurge closes those gaps with approved response workflows: new inquiries can receive a timely SMS response, missed callers can get a text-back, and unanswered leads can enter a controlled follow-up path so fewer booking opportunities disappear into silence.
              </p>
              <p className="text-foreground leading-relaxed">
                We combine SMS automation, email sequences, AI booking assistance, review request flows, and lead reactivation into a single done-for-you system. You get your time back. Your leads get instant attention. And your calendar fills up faster.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { icon: Zap, title: "Instant Lead Response", desc: "AI responds to new leads quickly, 24/7." },
                { icon: Target, title: "Smart Follow-Up", desc: "Multi-step SMS and email sequences that run on autopilot." },
                { icon: Users, title: "Done For You", desc: "We configure, test, and launch everything — you just approve." },
                { icon: CheckCircle2, title: "Measured Launches", desc: "Every workflow is tested against clear response and booking goals." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-white">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-xs text-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Who it's for */}
          <div>
            <h2 className="font-titles text-2xl mb-4 text-foreground">Who It's For</h2>
            <p className="text-foreground leading-relaxed mb-4">
              ClientSurge Systems is built for local service business owners who are tired of watching leads fall through the cracks. If your team is manually following up with inquiries, playing phone tag, or losing potential clients to faster-responding competitors, our platform was designed for you.
            </p>
            <p className="text-foreground leading-relaxed mb-4">
              We specifically serve industries where speed-to-response directly impacts revenue: med spas and aesthetic clinics, dental and orthodontic practices, chiropractic and physical therapy offices, HVAC and home service companies, roofing and restoration contractors, and general tradespeople. Whether you run a solo practice or a multi-location operation, our system scales with you.
            </p>
            <p className="text-foreground leading-relaxed">
              Our clients are busy owners and operators who want a reliable, automated system running in the background — not another software tool to manage. That's why every ClientSurge deployment is fully configured and launched by our team before you ever flip the switch.
            </p>
          </div>

          {/* Who builds it */}
          <div className="p-8 rounded-2xl border border-primary/20 bg-primary/5">
            <h2 className="font-titles text-2xl mb-4 text-foreground">Who Builds It</h2>
            <p className="text-foreground leading-relaxed mb-4">
              ClientSurge Systems is founded and operated out of Phoenix, Arizona. Our team combines deep expertise in AI automation, business operations, and service industry workflows. We don't just build software — we build systems we'd want running in our own businesses.
            </p>
            <p className="text-foreground leading-relaxed mb-4">
              Every automation we deploy is hand-configured for your specific business type, reviewed by our team before launch, and monitored to ensure it's performing. We act as your behind-the-scenes operations partner — not a faceless SaaS vendor.
            </p>
            <p className="text-foreground leading-relaxed">
              We believe local businesses deserve the same AI-powered advantages that large enterprises have had for years. ClientSurge makes that possible — at a price point built for small and medium service businesses, with real humans behind every deployment.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
              >
                Get in Touch
              </Link>
              <Link
                to="/store"
                className="cs-btn-primary"
              >
                See Our Services
              </Link>
            </div>
          </div>

        </div>
      </section>

      <Footer />
      <MobileCallBar />
    </div>
  );
}