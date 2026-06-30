import { useEffect, useMemo } from 'react';
import { ArrowRight, CheckCircle2, ClipboardList, MessageSquareText, ShieldCheck, Sparkles, Target } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { setPageMetadata } from '@/lib/seo';
import { trackCTA } from '@/lib/analytics';
import MobileCallBar from '@/components/landing/MobileCallBar';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import DemoBookingInline from '@/components/forms/DemoBookingInline';

const SERVICE_CONTEXT = {
  'appointment-booking-automation': {
    label: 'AI Booking Agent',
    serviceInterest: 'ai_booking_agent',
    headline: 'Match your booking process to the right ClientSurge system',
    subcopy: 'You came from the appointment-booking automation path. This page helps confirm whether Starter, Growth, or Pro is the right fit for turning interested leads into booked conversations.',
    problem: 'Leads show interest, but the handoff to booking is too slow, manual, or inconsistent.',
    outcome: 'A clearer response-to-booking path with follow-up, handoff rules, and launch proof checks.',
  },
  'missed-call-text-back': {
    label: 'Missed-Call Text Back',
    serviceInterest: 'missed_call_text_back',
    headline: 'Match your missed-call problem to the right ClientSurge system',
    subcopy: 'You came from the missed-call recovery path. We will identify whether you only need missed-call recovery or a broader follow-up system.',
    problem: 'People call, nobody answers, and too many opportunities disappear into voicemail.',
    outcome: 'A missed-call recovery path that replies fast and routes prospects to the next step.',
  },
  'instant-lead-response': {
    label: 'Instant Lead Response',
    serviceInterest: 'instant_lead_response',
    headline: 'Match your lead response gap to the right ClientSurge system',
    subcopy: 'You came from the instant-response path. We will map the fastest way to answer new inquiries before they go cold.',
    problem: 'New leads wait too long before anyone responds.',
    outcome: 'A faster lead response path with SMS/email routing and proof before launch.',
  },
};

const DEFAULT_CONTEXT = {
  label: 'ClientSurge System Match',
  serviceInterest: 'system_match',
  headline: 'Find the right ClientSurge system before you buy',
  subcopy: 'Tell us where leads slow down: missed calls, slow replies, follow-up gaps, booking friction, or old opportunities. We will help match the right starting system.',
  problem: 'Your lead flow has at least one gap that needs a clean automation path.',
  outcome: 'A recommended Starter, Growth, or Pro path with setup requirements and proof checks.',
};

export default function Book() {
  const [searchParams] = useSearchParams();
  const serviceSlug = searchParams.get('service') || '';
  const serviceContext = useMemo(() => SERVICE_CONTEXT[serviceSlug] || DEFAULT_CONTEXT, [serviceSlug]);

  useEffect(() => {
    return setPageMetadata({
      title: 'Get Help Choosing Your ClientSurge AI System',
      description: 'Get help matching your business to Starter, Growth, or Pro based on lead sources, follow-up gaps, booking process, and launch goals.',
      canonicalPath: '/book',
      ogTitle: 'Get Help Choosing Your ClientSurge AI System',
      ogDescription: 'Match your lead flow to the right ClientSurge system.',
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5fbff] via-white to-white">
      <Navbar />
      <main className="px-4 pb-24 pt-[calc(var(--cs-nav-height)+40px)] md:px-6">
        <section className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-primary/15 bg-white shadow-[0_24px_80px_rgba(0,93,170,0.10)]">
          <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="p-7 md:p-12 lg:p-14">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Guided System Match
              </div>
              <h1 className="font-titles text-4xl font-bold leading-[0.96] tracking-tight text-[#001B44] md:text-6xl">
                {serviceContext.headline}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
                {serviceContext.subcopy}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="#system-match-form"
                  onClick={() => trackCTA('open_system_match_form', 'book_page_header')}
                  className="cs-btn-primary inline-flex justify-center"
                >
                  Start System Match <ArrowRight className="w-4 h-4" />
                </a>
                <Link
                  to="/pricing"
                  onClick={() => trackCTA('compare_packages', 'book_page_header')}
                  className="inline-flex h-12 items-center justify-center rounded-full border border-primary/20 px-6 text-sm font-bold text-primary transition hover:bg-primary/8"
                >
                  Compare Packages
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  'No unsupported result claims',
                  'Proof checked before launch',
                  'Setup requirements mapped first',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-xl border border-primary/10 bg-[#f8fcff] px-3 py-2 text-sm font-semibold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <aside className="border-t border-primary/10 bg-gradient-to-br from-[#eaf7ff] via-white to-[#f6fbff] p-7 md:p-10 lg:border-l lg:border-t-0">
              <div className="rounded-2xl border border-primary/15 bg-white/85 p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Selected focus</p>
                <h2 className="mt-2 text-2xl font-bold text-[#001B44]">{serviceContext.label}</h2>
                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border border-red-100 bg-red-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-red-700">Problem</p>
                    <p className="mt-1 text-sm leading-relaxed text-red-950/80">{serviceContext.problem}</p>
                  </div>
                  <div className="rounded-xl border border-primary/15 bg-primary/8 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">Outcome</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-700">{serviceContext.outcome}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-primary/15 bg-white/85 p-5 shadow-sm">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-primary">How the match works</p>
                <div className="space-y-3">
                  {[
                    'Identify the exact lead-flow gap',
                    'Recommend Starter, Growth, or Pro',
                    'Map setup access and proof checks',
                  ].map((item, index) => (
                    <div key={item} className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-[#001B44]">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{index + 1}</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          <div className="border-t border-primary/10 bg-[#fbfdff] px-7 py-8 md:px-12">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: Target, title: 'Choose the right system', body: 'Starter for fast response, Growth for follow-up and booking, Pro for the full recovery layer.' },
                { icon: ClipboardList, title: 'Know what setup needs', body: 'We map tools, phone/email setup, booking links, access, and business rules before launch.' },
                { icon: ShieldCheck, title: 'Launch with proof', body: 'The system is configured and checked before it is treated as live.' },
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="rounded-2xl border border-primary/15 bg-white p-5 text-left shadow-sm">
                    <Icon className="mb-4 h-5 w-5 text-primary" />
                    <h3 className="mb-2 text-base font-bold text-[#001B44]">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600">{step.body}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div id="system-match-form" className="border-t border-primary/10 bg-white p-7 md:p-12">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  <MessageSquareText className="h-3.5 w-3.5" /> Guided match form
                </div>
                <h2 className="font-titles text-3xl font-bold text-[#001B44] md:text-4xl">Get a clear recommendation before you move forward</h2>
                <p className="mt-4 text-base leading-relaxed text-slate-600">
                  Share the business basics and the lead problem you want fixed first. The goal is a practical recommendation and setup path.
                </p>
                <div className="mt-6 space-y-3">
                  {[
                    'Which system tier fits your current lead flow',
                    'Which automation should be installed first',
                    'What access and proof checks are required before launch',
                  ].map((item) => (
                    <div key={item} className="flex gap-3 rounded-xl border border-primary/10 bg-[#f8fcff] p-3 text-sm font-medium text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-primary/15 bg-[#f8fcff] p-5 shadow-sm md:p-7">
                <DemoBookingInline
                  theme="light"
                  mode="system_match"
                  serviceInterest={serviceContext.serviceInterest}
                  serviceLabel={serviceContext.label}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileCallBar />
    </div>
  );
}
