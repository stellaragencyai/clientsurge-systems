import { ArrowRight, CheckCircle2 } from "lucide-react";
import { trackCTA } from "@/lib/analytics";

const SYSTEM_STEPS = [
  {
    number: "01",
    title: "Capture",
    description: "Website forms, calls, and inquiries enter one organized workflow.",
  },
  {
    number: "02",
    title: "Respond",
    description: "New leads receive an immediate, consistent first response.",
  },
  {
    number: "03",
    title: "Follow Up",
    description: "Automated nurture keeps qualified opportunities from disappearing.",
  },
  {
    number: "04",
    title: "Book and Retain",
    description: "Booking, reviews, and reactivation continue the customer journey.",
  },
];

const SUPPORT_POINTS = ["Done-for-you setup", "Clear package pricing", "No mandatory sales demo"];

function scrollToSection(event, sectionId, fallbackPath, analyticsName) {
  trackCTA(analyticsName, "hero");
  event?.preventDefault?.();

  const target = document.getElementById(sectionId);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `/#${sectionId}`);
    return;
  }

  window.location.href = fallbackPath;
}

function SystemPreview() {
  return (
    <div
      className="mx-auto w-full max-w-[560px] rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_28px_70px_rgba(15,23,42,0.14)] sm:p-6"
      aria-label="ClientSurge four-step automation workflow preview"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#008fc9]">ClientSurge System</p>
          <p className="mt-1 text-sm font-bold text-slate-900">Lead conversion workflow</p>
        </div>
        <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-black text-[#0077a8]">Configured for you</span>
      </div>

      <div className="mt-3 divide-y divide-slate-100">
        {SYSTEM_STEPS.map((step) => (
          <div key={step.number} className="grid grid-cols-[44px_minmax(0,1fr)] gap-3 py-4 sm:grid-cols-[52px_minmax(0,1fr)] sm:gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#06162f] text-xs font-black text-white sm:h-11 sm:w-11">
              {step.number}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-[-0.02em] text-slate-950 sm:text-lg">{step.title}</h2>
                <CheckCircle2 className="h-4 w-4 text-[#00AEEF]" aria-hidden="true" />
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-500">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-center text-xs font-bold text-slate-500">
        Website · SMS · Email · Booking · Reviews · Reactivation
      </div>
    </div>
  );
}

export default function HomeHero() {
  const scrollToPricing = (event) =>
    scrollToSection(event, "pricing", "/pricing", "hero_compare_packages_click");

  const scrollToSolution = (event) =>
    scrollToSection(event, "solution", "/how-it-works", "hero_see_how_it_works");

  return (
    <section className="relative isolate overflow-hidden bg-white" aria-label="ClientSurge Systems homepage hero">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 82% 18%, rgba(0,174,239,0.13), transparent 30%), linear-gradient(180deg, #ffffff 0%, #f7fcff 100%)",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-12 px-5 pb-16 pt-[calc(var(--cs-nav-height,76px)+4rem)] sm:px-8 sm:pb-20 lg:grid-cols-[minmax(0,0.95fr)_minmax(460px,1.05fr)] lg:gap-16 lg:px-10 lg:pb-24 lg:pt-[calc(var(--cs-nav-height,76px)+4.5rem)]">
        <div className="mx-auto max-w-[620px] text-center lg:mx-0 lg:text-left">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#008fc9]">
            AI sales automation for service businesses
          </p>

          <h1
            className="mt-5 font-black leading-[0.98] tracking-[-0.055em] text-[#06162f]"
            style={{ fontSize: "clamp(2.9rem, 5.2vw, 4.8rem)" }}
          >
            Turn more website leads into booked customers.
          </h1>

          <p className="mx-auto mt-6 max-w-[590px] text-base font-medium leading-8 text-slate-600 sm:text-lg lg:mx-0">
            ClientSurge installs the response, follow-up, booking, review, and reactivation workflows your business needs to stop losing qualified opportunities.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <a
              href="/#pricing"
              onClick={scrollToPricing}
              className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#009bd8] px-7 text-sm font-black text-white shadow-[0_14px_30px_rgba(0,155,216,0.24)] transition-colors hover:bg-[#008cc3] focus:outline-none focus:ring-2 focus:ring-[#00AEEF] focus:ring-offset-2 sm:w-auto"
            >
              Compare Packages
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>

            <a
              href="/how-it-works"
              onClick={scrollToSolution}
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-slate-300 bg-white px-7 text-sm font-black text-[#06162f] transition-colors hover:border-sky-300 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-[#00AEEF] focus:ring-offset-2 sm:w-auto"
            >
              See How It Works
            </a>
          </div>

          <div className="mt-6 flex flex-col items-center justify-center gap-2 text-sm font-semibold text-slate-500 sm:flex-row sm:flex-wrap lg:justify-start">
            {SUPPORT_POINTS.map((point, index) => (
              <span key={point} className="inline-flex items-center gap-2">
                {index > 0 && <span className="hidden text-slate-300 sm:inline" aria-hidden="true">·</span>}
                <CheckCircle2 className="h-4 w-4 text-[#00AEEF]" aria-hidden="true" />
                {point}
              </span>
            ))}
          </div>
        </div>

        <SystemPreview />
      </div>
    </section>
  );
}
