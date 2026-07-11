import { CheckCircle2, Clock3, LockKeyhole, ShieldCheck, Sparkles, Zap } from "lucide-react";

import LeadCaptureForm from "../components/leads/LeadCaptureForm";

const BENEFITS = [
  "Pinpoint exactly where leads are leaking",
  "Identify the highest-return automation first",
  "Receive a practical, business-specific next step",
];

const PROOF_POINTS = [
  { icon: Clock3, title: "Under 2 minutes", text: "Fast, focused intake" },
  { icon: ShieldCheck, title: "Consent-first", text: "SMS is always optional" },
  { icon: Zap, title: "Actionable", text: "No generic recommendations" },
];

export default function CaptureLeads() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5faff] text-slate-950">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-28 top-16 h-[420px] w-[420px] rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute -right-24 -top-20 h-[500px] w-[500px] rounded-full bg-blue-200/35 blur-3xl" />
        <div className="absolute bottom-[-180px] left-[38%] h-[430px] w-[430px] rounded-full bg-cyan-100/70 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />
      </div>

      <header className="relative z-10 border-b border-sky-100/80 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <a href="/" className="text-lg font-black tracking-[-0.03em] text-slate-950">
            ClientSurge <span className="text-sky-600">Systems</span>
          </a>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <LockKeyhole className="h-4 w-4 text-sky-600" />
            Secure business intake
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 lg:min-h-[calc(100vh-73px)] lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:px-10 lg:py-16">
        <section className="mx-auto max-w-xl lg:mx-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-sky-700 shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4" />
            Free automation assessment
          </div>

          <h1 className="mt-7 text-4xl font-black tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-[3.7rem] lg:leading-[1.02]">
            Find the fastest path from missed leads to booked customers.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
            Show us where your current lead process breaks. We will identify the first automation most likely to improve response speed, follow-up consistency, and booked revenue.
          </p>

          <div className="mt-8 space-y-4">
            {BENEFITS.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 text-sm font-semibold text-slate-700 sm:text-base">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-white text-sky-700 shadow-sm">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                {benefit}
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {PROOF_POINTS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-white/90 bg-white/80 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
                <Icon className="h-5 w-5 text-sky-600" />
                <p className="mt-3 text-sm font-black text-slate-900">{title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-2xl">
          <div className="rounded-[32px] border border-white/90 bg-white/70 p-2 shadow-[0_36px_100px_rgba(15,23,42,0.16)] backdrop-blur-xl">
            <div className="rounded-[26px] border border-sky-100 bg-white p-5 sm:p-8 lg:p-9">
              <div className="mb-7 flex items-start justify-between gap-5 border-b border-slate-100 pb-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-600">Business assessment</p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950 sm:text-3xl">
                    Tell us what is slowing growth
                  </h2>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
                    Clear answers produce a sharper automation recommendation.
                  </p>
                </div>
                <div className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 text-sky-700 sm:flex">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
              <LeadCaptureForm />
            </div>
          </div>
          <p className="mt-4 text-center text-[11px] leading-5 text-slate-500">
            Your information is used only to evaluate and respond to your request. SMS consent is optional.
          </p>
        </section>
      </main>
    </div>
  );
}
