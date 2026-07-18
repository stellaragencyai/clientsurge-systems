import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  LockKeyhole,
  Mail,
  MessageSquareMore,
  Sparkles,
  UsersRound,
  Workflow,
  Zap,
} from "lucide-react";
import PortalLoginModal from "@/components/forms/PortalLoginModal";
import CSBrandSurface from "@/components/design-system/CSBrandSurface";
import { setPageMetadata } from "@/lib/seo";

const FEATURE_ITEMS = [
  {
    icon: UsersRound,
    title: "AI Employees",
    description: "Your AI team engages, qualifies, and converts leads around the clock.",
  },
  {
    icon: MessageSquareMore,
    title: "Smart Conversations",
    description: "Fast, on-brand conversations that feel human and move customers forward.",
  },
  {
    icon: Workflow,
    title: "Automations That Work",
    description: "End-to-end systems that eliminate manual follow-up and missed opportunities.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Insights",
    description: "Clear performance reporting that shows exactly what your AI workforce is producing.",
  },
];

function TemporaryBrandLockup() {
  return (
    <div className="flex items-center gap-3" aria-label="ClientSurge Systems">
      <div
        className="grid h-12 w-12 place-items-center rounded-2xl border"
        style={{
          borderColor: "rgba(66, 215, 245, 0.45)",
          background: "linear-gradient(145deg, rgba(7,152,242,.24), rgba(6,18,37,.9))",
          boxShadow: "var(--cs-glow-blue)",
        }}
      >
        <Zap className="h-6 w-6" style={{ color: "var(--cs-cyan-300)" }} fill="currentColor" />
      </div>
      <div className="leading-none">
        <div className="text-[1.4rem] font-extrabold tracking-[-0.045em] text-white">ClientSurge</div>
        <div className="mt-1 text-[0.58rem] font-extrabold tracking-[0.42em]" style={{ color: "var(--cs-blue-500)" }}>
          SYSTEMS
        </div>
      </div>
    </div>
  );
}

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
    <main className="min-h-screen bg-[#f6f9fd] font-[Montserrat,sans-serif]" style={{ color: "var(--cs-text-on-light)" }}>
      <div className="grid min-h-screen lg:grid-cols-[1.04fr_0.96fr]">
        <CSBrandSurface as="section" className="px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
          <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-[780px] flex-col">
            <TemporaryBrandLockup />

            <div className="flex flex-1 flex-col justify-center py-12 lg:py-16">
              <div className="cs-eyebrow mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[rgba(66,215,245,.2)] bg-[rgba(16,38,66,.56)] px-4 py-2 shadow-[0_0_28px_rgba(7,152,242,.08)] backdrop-blur-xl">
                <Sparkles className="h-3.5 w-3.5" />
                The AI operating system for local businesses
              </div>

              <h1 className="max-w-3xl text-[clamp(3.2rem,5.8vw,6.8rem)] font-extrabold leading-[0.94] tracking-[-0.058em] text-white">
                Build Your AI Workforce.
                <span className="cs-gradient-text mt-3 block">Grow Around the Clock.</span>
              </h1>

              <p
                className="mt-7 max-w-2xl text-base font-medium leading-8 sm:text-lg"
                style={{ color: "var(--cs-text-muted-dark)" }}
              >
                ClientSurge captures leads, handles customer conversations, books appointments, and keeps your business moving 24/7.
              </p>

              <div className="mt-10 grid gap-x-7 gap-y-8 sm:grid-cols-2">
                {FEATURE_ITEMS.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="group flex gap-4">
                    <div className="cs-dark-card grid h-12 w-12 shrink-0 place-items-center transition duration-200 group-hover:-translate-y-0.5 group-hover:border-[rgba(66,215,245,.42)]">
                      <Icon className="h-5 w-5" style={{ color: "var(--cs-cyan-400)" }} />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold tracking-[-0.025em] text-white sm:text-base">{title}</h2>
                      <p className="mt-1 text-sm font-medium leading-6" style={{ color: "var(--cs-text-subtle-dark)" }}>
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-7 text-sm font-semibold"
              style={{ color: "var(--cs-text-subtle-dark)" }}
            >
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--cs-cyan-400)", boxShadow: "0 0 16px rgba(24,186,244,.7)" }} />
                AI systems operational
              </span>
              <span>Secure client access</span>
            </div>
          </div>
        </CSBrandSurface>

        <section className="flex min-h-[720px] items-center justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-20">
          <div className="w-full max-w-[590px]">
            <div className="cs-light-card rounded-[var(--cs-radius-xl)] p-7 sm:p-10 lg:p-12">
              <div className="max-w-md">
                <div
                  className="mb-6 grid h-14 w-14 place-items-center rounded-2xl"
                  style={{
                    color: "var(--cs-blue-500)",
                    background: "rgba(7, 152, 242, 0.09)",
                    boxShadow: "inset 0 0 0 1px rgba(7,152,242,.12)",
                  }}
                >
                  <LockKeyhole className="h-6 w-6" />
                </div>

                <h2 className="text-4xl font-extrabold leading-tight tracking-[-0.05em] sm:text-5xl">Welcome back</h2>
                <p className="mt-3 text-base font-medium leading-7" style={{ color: "var(--cs-text-muted-light)" }}>
                  Sign in to access your AI business system.
                </p>
              </div>

              <div className="mt-9 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-extrabold">Email address</label>
                  <button
                    type="button"
                    onClick={() => setShowLogin(true)}
                    className="cs-input flex items-center gap-3 text-left text-sm font-medium"
                    style={{ color: "#8794a8" }}
                  >
                    <Mail className="h-5 w-5" style={{ color: "var(--cs-blue-500)" }} />
                    you@company.com
                  </button>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <label className="text-sm font-extrabold">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowLogin(true)}
                      className="text-sm font-extrabold transition hover:brightness-90"
                      style={{ color: "var(--cs-blue-500)" }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLogin(true)}
                    className="cs-input flex items-center gap-3 text-left text-sm font-medium"
                    style={{ color: "#8794a8" }}
                  >
                    <LockKeyhole className="h-5 w-5" style={{ color: "var(--cs-blue-500)" }} />
                    Enter your password
                  </button>
                </div>

                <button type="button" onClick={() => setShowLogin(true)} className="cs-primary-button group h-14 w-full text-base">
                  Sign in to ClientSurge
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold" style={{ color: "#8490a2" }}>
                <CheckCircle2 className="h-4 w-4" style={{ color: "var(--cs-cyan-400)" }} />
                Your data is secure and encrypted
              </div>
            </div>
          </div>
        </section>
      </div>

      {showLogin && <PortalLoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}