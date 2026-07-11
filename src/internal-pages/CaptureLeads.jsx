import { CheckCircle2, Clock3, ShieldCheck, Sparkles, Zap } from "lucide-react";

import LeadCaptureForm from "../components/leads/LeadCaptureForm";

const BENEFITS = [
  "Identify where leads are being lost",
  "Prioritize the highest-impact automation",
  "Get a practical next-step recommendation",
];

export default function CaptureLeads() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7fbff]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-20 h-80 w-80 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute -right-20 top-0 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-100/50 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <main className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 lg:px-10 lg:py-16">
        <section className="mx-auto max-w-xl lg:mx-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/85 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-sky-700 shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4" />
            Free ClientSurge assessment
          </div>

          <h1 className="mt-7 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
            Find the fastest way to turn more leads into booked customers.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
            Tell us where your current process breaks down. We will use your answers to identify the first automation that can create the biggest operational and revenue impact.
          </p>

          <div className="mt-8 space-y-4">
            {BENEFITS.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 text-sm font-semibold text-slate-700 sm:text-base">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                {benefit}
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white bg-white/75 p-4 shadow-sm backdrop-blur">
              <Clock3 className="h-5 w-5 text-sky-600" />
              <p className="mt-3 text-sm font-bold text-slate-900">Under 2 minutes</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Fast, focused intake</p>
            </div>
            <div className="rounded-2xl border border-white bg-white/75 p-4 shadow-sm backdrop-blur">
              <ShieldCheck className="h-5 w-5 text-sky-600" />
              <p className="mt-3 text-sm font-bold text-slate-900">Private by design</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Consent-first workflow</p>
            </div>
            <div className="rounded-2xl border border-white bg-white/75 p-4 shadow-sm backdrop-blur">
              <Zap className="h-5 w-5 text-sky-600" />
              <p className="mt-3 text-sm font-bold text-slate-900">Actionable output</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">No generic advice</p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-2xl">
          <div className="rounded-[30px] border border-white/80 bg-white/92 p-1.5 shadow-[0_32px_90px_rgba(15,23,42,0.14)] backdrop-blur-xl">
            <div className="rounded-[25px] border border-sky-100 bg-white p-5 sm:p-8 lg:p-9">
              <div className="mb-7 border-b border-slate-100 pb-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">Start here</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Tell us about your business
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The clearer your answers, the more precise the recommendation.
                </p>
              </div>
              <LeadCaptureForm />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
