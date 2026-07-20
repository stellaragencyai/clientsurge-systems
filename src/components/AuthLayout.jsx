import React from "react";
import { Activity, CheckCircle2, ShieldCheck, Sparkles, Zap } from "lucide-react";

const FEATURES = [
  { icon: Sparkles, title: "AI-powered automation", text: "Intelligent systems working around the clock." },
  { icon: Zap, title: "Instant lead response", text: "Every inquiry receives an immediate reply." },
  { icon: Activity, title: "Smart follow-up", text: "Consistent outreach without manual chasing." },
  { icon: ShieldCheck, title: "Secure by design", text: "Protected access for your business operations." },
];

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <main className="min-h-screen bg-[#020b26] px-3 py-3 sm:px-5 sm:py-5">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-[1500px] overflow-hidden rounded-[30px] border border-cyan-300/15 bg-white shadow-[0_40px_120px_rgba(0,8,35,0.55)] lg:grid-cols-[1.05fr_0.95fr] sm:min-h-[calc(100vh-40px)]">
        <section className="relative hidden overflow-hidden bg-[#04102f] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(0,194,255,0.22),transparent_28%),radial-gradient(circle_at_85%_88%,rgba(0,93,255,0.23),transparent_34%),linear-gradient(145deg,#06143b_0%,#020822_100%)]" />
          <div className="absolute -left-24 top-24 h-72 w-72 rounded-full border border-cyan-300/20" />
          <div className="absolute -left-36 top-10 h-[430px] w-[430px] rounded-full border border-cyan-300/10" />
          <div className="absolute bottom-[-180px] right-[-120px] h-[520px] w-[520px] rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative z-10">
            <div className="mb-14 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 shadow-[0_0_30px_rgba(34,211,238,0.18)]">
                <Zap className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.24em] text-white">ClientSurge</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300/70">AI Business System</p>
              </div>
            </div>

            <p className="mb-5 text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Built for service businesses</p>
            <h2 className="max-w-xl font-display text-5xl font-black leading-[0.98] tracking-[-0.055em] text-white xl:text-6xl">
              Your business runs better with <span className="text-cyan-300">AI.</span>
            </h2>
            <p className="mt-6 max-w-lg text-base font-medium leading-7 text-slate-300">
              Access the systems that respond to leads, follow up automatically, and keep your growth engine moving.
            </p>
          </div>

          <div className="relative z-10 mt-12 grid gap-3 xl:grid-cols-2">
            {FEATURES.map(({ icon: FeatureIcon, title: featureTitle, text }) => (
              <div key={featureTitle} className="group rounded-2xl border border-cyan-200/10 bg-white/[0.045] p-4 backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-cyan-300/[0.07]">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300 ring-1 ring-cyan-300/20">
                  <FeatureIcon className="h-4 w-4" />
                </div>
                <p className="text-sm font-extrabold text-white">{featureTitle}</p>
                <p className="mt-1 text-xs font-medium leading-5 text-slate-400">{text}</p>
              </div>
            ))}
          </div>

          <div className="relative z-10 mt-10 flex items-center gap-3 border-t border-white/10 pt-6 text-xs font-bold text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-cyan-300" />
            Protected account access
          </div>
        </section>

        <section className="relative flex min-h-[720px] items-center justify-center overflow-hidden bg-[linear-gradient(145deg,#ffffff_0%,#f7fbff_55%,#edf8ff_100%)] px-5 py-10 sm:px-10 lg:min-h-full xl:px-16">
          <div className="absolute right-[-130px] top-[-120px] h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute bottom-[-160px] left-[-120px] h-96 w-96 rounded-full bg-blue-300/15 blur-3xl" />

          <div className="relative z-10 w-full max-w-[470px]">
            <div className="mb-8 text-center sm:text-left">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-600 shadow-[0_10px_30px_rgba(8,145,178,0.12)]">
                {Icon ? <Icon className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
              </div>
              <h1 className="font-display text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">{title}</h1>
              {subtitle && <p className="mt-3 text-sm font-medium leading-6 text-slate-500">{subtitle}</p>}
            </div>

            <div className="rounded-[26px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8">
              {children}
            </div>

            {footer && <div className="mt-6 text-center text-sm font-medium text-slate-500">{footer}</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
