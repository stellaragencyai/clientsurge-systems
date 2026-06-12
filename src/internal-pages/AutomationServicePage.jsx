import { useEffect } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import { ArrowRight, CalendarCheck, CheckCircle2, Inbox, MessageSquare, PhoneCall, RefreshCw, Star } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { DemoBookingProvider, useDemoBooking } from "@/components/landing/DemoBookingContext";
import { getAutomationBySlug } from "@/lib/sixAutomations";
import { setPageMetadata } from "@/lib/seo";

const ICONS = {
  inbox: Inbox,
  phone: PhoneCall,
  message: MessageSquare,
  calendar: CalendarCheck,
  star: Star,
  refresh: RefreshCw,
};

function AutomationServicePageInner() {
  const location = useLocation();
  const demoBooking = useDemoBooking();
  const slug = location.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  const automation = getAutomationBySlug(slug);

  useEffect(() => {
    if (!automation) return undefined;

    return setPageMetadata({
      title: `${automation.title} | ClientSurge Systems`,
      description: `${automation.summary} See what it does, what triggers it, who it helps, and how it fits into the ClientSurge automation stack.`,
      canonicalPath: automation.routePath,
      ogTitle: `${automation.title} | ClientSurge Systems`,
      ogDescription: automation.summary,
    });
  }, [automation]);

  if (!automation) {
    return <Navigate to="/" replace />;
  }

  const Icon = ICONS[automation.icon] || MessageSquare;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <section className="px-4 pb-16 pt-32 md:px-6 md:pb-24 md:pt-40" style={{ background: "#ffffff" }}>
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div
                className="mb-6 inline-flex items-center gap-3 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]"
                style={{ borderColor: "rgba(0,174,239,0.18)", color: "#0088CC" }}
              >
                <Icon className="h-4 w-4" />
                ClientSurge automation
              </div>
              <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
                {automation.title}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{automation.summary}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={demoBooking?.openDemoBooking}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #0088CC 0%, #006BB0 45%, #00AEEF 100%)" }}
                >
                  Get My Automation Plan
                  <ArrowRight className="h-4 w-4" />
                </button>
                <Link
                  to="/#services"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border px-6 text-sm font-bold no-underline"
                  style={{ borderColor: "rgba(0,174,239,0.22)", color: "#0088CC" }}
                >
                  View all 6 systems
                </Link>
              </div>
            </div>

            <div className="rounded-lg border p-5 shadow-xl" style={{ borderColor: "rgba(0,174,239,0.16)" }}>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "#0088CC" }}>
                Before and after workflow
              </p>
              <div className="space-y-4">
                <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-red-600">Before</p>
                  <p className="text-sm leading-6 text-red-900">{automation.before}</p>
                </div>
                <div className="rounded-lg border border-sky-100 bg-sky-50 p-4">
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em]" style={{ color: "#0088CC" }}>
                    After ClientSurge
                  </p>
                  <p className="text-sm leading-6 text-slate-800">{automation.after}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 md:px-6 md:py-24" style={{ background: "#f8fbff" }}>
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
            <InfoPanel title="What it does" body={automation.whatItDoes} />
            <InfoPanel title="Who it is for" body={automation.whoFor} />
            <div className="rounded-lg border bg-white p-5" style={{ borderColor: "rgba(0,174,239,0.14)" }}>
              <h2 className="mb-4 text-xl font-bold text-foreground">What triggers it</h2>
              <ul className="space-y-3">
                {automation.triggers.map((trigger) => (
                  <li key={trigger} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#0088CC" }} />
                    {trigger}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 md:px-6 md:py-24" style={{ background: "#ffffff" }}>
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em]" style={{ color: "#0088CC" }}>
                Example messages
              </p>
              <h2 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground">
                Clear, useful follow-up without sounding generic.
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                These are sample patterns only. The actual messages are configured around your business, services,
                availability, brand voice, and compliance rules.
              </p>
            </div>
            <div className="space-y-3">
              {automation.exampleMessages.map((message, index) => (
                <div
                  key={message}
                  className="rounded-lg border bg-white p-5 shadow-sm"
                  style={{ borderColor: "rgba(0,174,239,0.14)" }}
                >
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Sample message {index + 1}
                  </p>
                  <p className="text-base leading-7 text-foreground">{message}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 md:px-6 md:py-24" style={{ background: "#003B8F" }}>
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 max-w-3xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-white/60">
                Industries that benefit
              </p>
              <h2 className="font-display text-4xl font-bold leading-tight tracking-tight text-white">
                Built for local service businesses where response speed turns into revenue.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {automation.industries.map((industry) => (
                <div key={industry} className="rounded-lg border border-white/15 bg-white/10 p-4 text-sm font-bold text-white">
                  {industry}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={demoBooking?.openDemoBooking}
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold transition-transform hover:-translate-y-0.5"
              style={{ color: "#003B8F" }}
            >
              Free Automation Audit
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function InfoPanel({ title, body }) {
  return (
    <div className="rounded-lg border bg-white p-5" style={{ borderColor: "rgba(0,174,239,0.14)" }}>
      <h2 className="mb-4 text-xl font-bold text-foreground">{title}</h2>
      <p className="text-sm leading-7 text-muted-foreground">{body}</p>
    </div>
  );
}

export default function AutomationServicePage() {
  return (
    <DemoBookingProvider>
      <AutomationServicePageInner />
    </DemoBookingProvider>
  );
}
