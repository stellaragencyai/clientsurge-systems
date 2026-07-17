import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import PortalLoginModal from "@/components/forms/PortalLoginModal";
import { setPageMetadata } from "@/lib/seo";

const FEATURE_ITEMS = [
  {
    icon: Bot,
    title: "AI-Powered Automation",
    description: "Intelligent automation that works around the clock.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Insights",
    description: "Track performance and growth as it happens.",
  },
  {
    icon: Workflow,
    title: "Seamless Integration",
    description: "Connects with the tools your business already uses.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-Grade Security",
    description: "Your data is protected with bank-level encryption.",
  },
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
    <main className="min-h-screen bg-[#f7f9fc] font-[Montserrat,sans-serif] text-[#07152f]">
      <div className="grid min-h-screen lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative overflow-hidden bg-[#020d25] px-6 py-10 text-white sm:px-10 lg:px-14 xl:px-20">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -right-28 top-4 h-[620px] w-[620px] rounded-full border border-[#18c8ff]/15" />
            <div className="absolute -right-16 top-20 h-[480px] w-[480px] rounded-full border border-[#18c8ff]/12" />
            <div className="absolute right-[-100px] top-[210px] h-[360px] w-[360px] rounded-full border border-[#18c8ff]/10" />
            <div className="absolute left-[45%] top-[8%] h-72 w-72 rounded-full bg-[#0abef5]/10 blur-3xl" />
            <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,rgba(31,205,255,0.12),transparent_28%),radial-gradient(circle_at_70%_75%,rgba(31,205,255,0.08),transparent_26%)]" />
          </div>

          <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-[760px] flex-col">
            <div className="flex items-center gap-3 text-xl font-extrabold tracking-[-0.04em] sm:text-2xl">
              <div className="grid h-11 w-11 place-items-center rounded-full border border-[#23ccff]/50 bg-[#0b1b38] shadow-[0_0_26px_rgba(28,205,255,0.22)]">
                <BrainCircuit className="h-5 w-5 text-[#20caff]" />
              </div>
              <span>ClientSurge</span>
            </div>

            <div className="flex flex-1 flex-col justify-center py-12 lg:py-16">
              <div className="mb-7 inline-flex w-fit items-center gap-2 rounded-full border border-[#20caff]/25 bg-[#0d213f]/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8ee9ff] shadow-[0_0_28px_rgba(28,205,255,0.08)]">
                <Sparkles className="h-3.5 w-3.5" />
                AI-powered business growth
              </div>

              <h1 className="max-w-3xl text-[clamp(3rem,5vw,6.3rem)] font-extrabold leading-[0.98] tracking-[-0.055em]">
                Automate Smarter.
                <span className="mt-2 block bg-gradient-to-r from-[#23d7ff] via-[#1cc6ff] to-[#25a9ff] bg-clip-text text-transparent">
                  Grow Faster.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-base font-medium leading-8 text-[#b7c5da] sm:text-lg">
                ClientSurge helps you automate lead generation, client follow-up, and business operations — so you can focus on what matters most.
              </p>

              <div className="mt-10 grid gap-7 sm:grid-cols-2">
                {FEATURE_ITEMS.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="group flex gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#23caff]/35 bg-[#081a35] shadow-[inset_0_0_20px_rgba(27,198,255,0.06),0_0_22px_rgba(27,198,255,0.08)] transition duration-200 group-hover:-translate-y-0.5 group-hover:border-[#25d4ff]/70 group-hover:shadow-[0_0_28px_rgba(27,198,255,0.18)]">
                      <Icon className="h-5 w-5 text-[#1cc8ff]" />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold tracking-[-0.025em] text-white sm:text-base">{title}</h2>
                      <p className="mt-1 text-sm font-medium leading-6 text-[#91a3bd]">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-7 text-sm font-medium text-[#8394ae]">
              Trusted by hundreds of growing businesses
            </div>
          </div>
        </section>

        <section className="flex min-h-[720px] items-center justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-20">
          <div className="w-full max-w-[590px]">
            <div className="rounded-[28px] border border-[#dfe7f1] bg-white p-7 shadow-[0_28px_80px_rgba(9,30,66,0.12)] sm:p-10 lg:p-12">
              <div className="max-w-md">
                <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#eaf8ff] text-[#13bdf1] shadow-[inset_0_0_0_1px_rgba(19,189,241,0.12)]">
                  <LockKeyhole className="h-6 w-6" />
                </div>

                <h2 className="text-4xl font-extrabold leading-tight tracking-[-0.05em] text-[#07152f] sm:text-5xl">Welcome back</h2>
                <p className="mt-3 text-base font-medium leading-7 text-[#61708a]">Sign in to continue to your ClientSurge dashboard.</p>
              </div>

              <div className="mt-9 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-extrabold text-[#101c35]">Email address</label>
                  <button
                    type="button"
                    onClick={() => setShowLogin(true)}
                    className="flex h-14 w-full items-center gap-3 rounded-xl border border-[#d9e2ee] bg-white px-4 text-left text-sm font-medium text-[#8895a9] shadow-sm transition hover:border-[#21c8ff]/60 hover:shadow-[0_0_0_4px_rgba(28,200,255,0.08)]"
                  >
                    <Mail className="h-5 w-5 text-[#0fbce8]" />
                    you@company.com
                  </button>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <label className="text-sm font-extrabold text-[#101c35]">Password</label>
                    <button type="button" onClick={() => setShowLogin(true)} className="text-sm font-extrabold text-[#0bbce9] transition hover:text-[#0799c0]">
                      Forgot password?
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLogin(true)}
                    className="flex h-14 w-full items-center gap-3 rounded-xl border border-[#d9e2ee] bg-white px-4 text-left text-sm font-medium text-[#8895a9] shadow-sm transition hover:border-[#21c8ff]/60 hover:shadow-[0_0_0_4px_rgba(28,200,255,0.08)]"
                  >
                    <LockKeyhole className="h-5 w-5 text-[#0fbce8]" />
                    Enter your password
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLogin(true)}
                  className="group flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#18c6f2] px-6 text-base font-extrabold text-[#031428] shadow-[0_14px_34px_rgba(24,198,242,0.34)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#25d4ff] hover:shadow-[0_18px_42px_rgba(24,198,242,0.46)] active:translate-y-0"
                >
                  Sign in
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold text-[#8490a2]">
                <CheckCircle2 className="h-4 w-4 text-[#18c6f2]" />
                Secure client access
              </div>
            </div>
          </div>
        </section>
      </div>

      {showLogin && <PortalLoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
