import { useEffect, useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PortalLoginModal from "@/components/forms/PortalLoginModal";
import { setPageMetadata } from "@/lib/seo";

export default function Login() {
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    return setPageMetadata({
      title: "Client Portal Login | ClientSurge Systems",
      description:
        "Sign in to the ClientSurge Systems client portal to view your AI automation setup, billing, reports, and service progress.",
      canonicalPath: "/login",
      ogTitle: "Client Portal Login | ClientSurge Systems",
      ogDescription:
        "Secure access for ClientSurge Systems clients to review automation setup, reports, billing, and support progress.",
      robots: "noindex,nofollow",
    });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="px-4 pb-16 pt-32 md:px-6 md:pb-24 md:pt-40">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
              <LockKeyhole className="h-4 w-4" />
              Secure client access
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
              ClientSurge Systems Client Portal
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Sign in to review your automation setup, onboarding progress, reports, invoices, and support updates.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowLogin(true)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #0088CC 0%, #006BB0 45%, #00AEEF 100%)" }}
              >
                Sign In To Portal
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="/contact"
                className="inline-flex min-h-12 items-center justify-center rounded-full border px-6 text-sm font-bold no-underline"
                style={{ borderColor: "rgba(0,107,176,0.24)", color: "#006BB0" }}
              >
                Need Help?
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-primary/15 bg-primary/5 p-6 shadow-sm">
            <ShieldCheck className="mb-4 h-8 w-8 text-primary" />
            <h2 className="mb-3 text-2xl font-bold text-foreground">What clients can access</h2>
            <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
              <li>Automation setup and go-live progress</li>
              <li>Lead flow, service status, and weekly reporting</li>
              <li>Billing, invoices, and package information</li>
              <li>Support requests and onboarding tasks</li>
            </ul>
          </div>
        </div>
      </section>
      <Footer />
      {showLogin && <PortalLoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
