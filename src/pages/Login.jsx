import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import PortalLoginModal from "@/components/forms/PortalLoginModal";
import { setPageMetadata } from "@/lib/seo";

const CLIENT_BENEFITS = [
  { icon: Workflow, label: "Automation setup", detail: "Track installation, integrations, and go-live readiness." },
  { icon: BarChart3, label: "Performance visibility", detail: "Review lead flow, service activity, and reporting." },
  { icon: Clock3, label: "Real-time progress", detail: "See verified updates without waiting for status emails." },
];

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("from_url")) setShowLogin(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f9fc] text-slate-950">
      <header className="border-b border-white/10 bg-[#071a33] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-blue-950/30">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-black tracking-tight text-white">ClientSurge</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200/70">Systems</p>
            </div>
          </Link>
          <div className="hidden items-center gap-2 text-xs font-semibold text-slate-300 sm:flex">
            <ShieldCheck className="h-4 w-4 text-sky-300" />
            Secure client access
          </div>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-blue-200/25 blur-3xl" />
        </div>

        <section className="relative mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-12 px-5 py-14 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-700 shadow-sm">
              <LockKeyhole className="h-4 w-4" />
              Private workspace
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-[1.04] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
              Your ClientSurge system, in one secure command center.
            </h1>
            <p className="mt-6 max-w-xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
              Sign in to monitor setup progress, automation health, lead activity, reporting, billing, and support—without chasing updates across email threads.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowLogin(true)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-6 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(37,99,235,0.34)]"
              >
                Sign in to your portal
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                to="/contact"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-bold text-slate-700 no-underline shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
              >
                Get account help
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Encrypted access</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Live setup status</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Client-only workspace</span>
            </div>
          </div>

          <aside className="relative">
            <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_28px_80px_rgba(15,23,42,0.12)] sm:p-7">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-sky-600">Client workspace</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Everything that matters, visible.</h2>
                </div>
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {CLIENT_BENEFITS.map(({ icon: Icon, label, detail }) => (
                  <div key={label} className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">{label}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-800">
                  <CheckCircle2 className="h-5 w-5" />
                  System status: secure
                </div>
                <p className="mt-1.5 text-xs font-medium leading-5 text-emerald-700/80">
                  Access is restricted to verified ClientSurge clients and authorized administrators.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </main>

      {showLogin && <PortalLoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
