import { useEffect } from 'react';
import { ArrowRight, Calendar, CheckCircle2, ClipboardList, Phone, RotateCw, Scale, Send, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { setPageMetadata } from '@/lib/seo';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import MobileCallBar from '@/components/landing/MobileCallBar';

const PAIN_POINTS = [
  { title: 'Intake Speed Decides the Case', desc: 'Injured prospects often contact multiple firms and choose the first credible firm that responds clearly.' },
  { title: 'Missed Calls Become Competitor Cases', desc: 'After-hours calls, lunch-hour calls, and staff overload can turn into lost consultations.' },
  { title: 'Manual Follow-Up Gets Inconsistent', desc: 'Case leads need repeated, careful follow-up without overloading the intake team.' },
  { title: 'Consultation No-Shows Waste Capacity', desc: 'Unconfirmed consultations and unclear next steps create avoidable intake friction.' },
];

const USE_CASES = [
  { Icon: Phone, title: 'Missed-Call Recovery', desc: 'Missed callers receive a fast text-back and a clear path to request a consultation.' },
  { Icon: ClipboardList, title: 'Case-Type Intake', desc: 'Collect injury type, incident timing, contact info, and basic routing details before staff review.' },
  { Icon: Calendar, title: 'Consultation Handoff', desc: 'Move qualified prospects toward a call, intake appointment, or attorney review workflow.' },
  { Icon: RotateCw, title: 'Prospect Reactivation', desc: 'Restart conversations with older prospects who never completed intake or consultation.' },
];

const FEATURES = ['Immediate lead response', 'Missed-call text-back', 'Case-type routing prompts', 'Consultation handoff', 'Multi-step follow-up', 'Old prospect reactivation'];

export default function PersonalInjury() {
  useEffect(() => {
    const cleanup = setPageMetadata({
      title: 'Personal Injury Law Firm Automation Systems | ClientSurge Systems',
      description: 'AI automation for personal injury law firms: immediate lead response, intake routing, consultation scheduling, missed-call recovery, and prospect reactivation.',
      canonicalPath: '/personal-injury',
      ogTitle: 'Personal Injury Law Firm Automation',
      ogDescription: 'Automate lead response, intake routing, and consultation handoff for personal injury firms.'
    });
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_18%_8%,rgba(124,58,237,0.11),transparent_30%),linear-gradient(180deg,#f8fcff_0%,#ffffff_36%,#f7fbff_100%)]">
      <Navbar />
      <main className="pt-[calc(var(--cs-nav-height)+28px)]">
        <section className="relative overflow-hidden px-4 md:px-6 py-16 md:py-24">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1.05fr_0.95fr] items-center">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-primary">Personal Injury AI System</p>
              <h1 className="font-titles text-4xl md:text-6xl font-black tracking-tight text-foreground leading-[0.95]">Turn Urgent Case Inquiries Into Faster Intake Paths</h1>
              <p className="mt-6 max-w-2xl text-base md:text-lg leading-relaxed text-muted-foreground">ClientSurge helps personal injury firms respond quickly, route case inquiries, recover missed calls, support consultation handoff, and follow up with prospects before they choose another firm.</p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/pricing" className="cs-btn-primary inline-flex items-center justify-center gap-2">Compare Packages <ArrowRight className="w-4 h-4" /></Link>
                <Link to="/automations" className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-white px-6 py-3 text-sm font-bold text-primary shadow-sm hover:bg-primary/5">View Automation Stack</Link>
              </div>
            </div>
            <div className="rounded-3xl border border-primary/15 bg-white/90 p-6 md:p-8 shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-primary">Launch Focus</p>
              <div className="grid grid-cols-2 gap-3">
                {[['Fast', 'intake response'], ['Case type', 'routing'], ['Consult', 'handoff'], ['Follow-up', 'reactivation']].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-center">
                    <p className="font-titles text-xl font-black text-primary">{value}</p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-foreground">Best fit: Growth System or Pro System</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">For firms that need intake response, routing prompts, consultation handoff, and structured prospect follow-up.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 md:px-6 py-14 md:py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">The Problem</p>
              <h2 className="mt-3 font-titles text-3xl md:text-4xl font-black tracking-tight text-foreground">Where Personal Injury Leads Slip</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {PAIN_POINTS.map((point, idx) => (
                <div key={point.title} className="rounded-2xl border border-primary/10 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
                  <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-primary/15 bg-primary/8 text-primary font-black">{idx + 1}</div>
                  <h3 className="font-titles text-xl font-bold text-foreground">{point.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{point.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 md:px-6 py-14 md:py-20 bg-white/75">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Operating Layer</p>
              <h2 className="mt-3 font-titles text-3xl md:text-4xl font-black tracking-tight text-foreground">How ClientSurge Supports Intake Teams</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {USE_CASES.map(({ Icon, title, desc }) => (
                <div key={title} className="rounded-2xl border border-primary/10 bg-white/90 p-6 md:p-7 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/8 text-primary"><Icon className="h-5 w-5" /></div>
                    <div>
                      <h3 className="font-titles text-xl font-bold text-foreground">{title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 md:px-6 py-14 md:py-20">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">What's Included</p>
            <h2 className="mt-3 font-titles text-3xl md:text-4xl font-black tracking-tight text-foreground">Your Personal Injury Intake System Includes</h2>
            <div className="mt-8 grid md:grid-cols-2 gap-3 text-left">
              {FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-3 rounded-xl border border-primary/10 bg-white/85 p-4 shadow-sm"><CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary" /><span className="text-sm font-semibold text-foreground/85">{feature}</span></div>
              ))}
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
              <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
              <p className="text-sm leading-relaxed text-amber-900">Messaging and intake flows should be reviewed against your firm's compliance, advertising, and jurisdiction-specific requirements before live launch.</p>
            </div>
          </div>
        </section>

        <section className="px-4 md:px-6 py-16 md:py-24">
          <div className="max-w-4xl mx-auto rounded-3xl border border-primary/15 bg-gradient-to-br from-[#003b8f] to-[#00aeef] p-8 md:p-12 text-center text-white shadow-[0_24px_80px_rgba(0,107,176,0.24)]">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-white/75">Get Started</p>
            <h2 className="font-titles text-3xl md:text-4xl font-black tracking-tight">Install a Personal Injury Intake System</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm md:text-base leading-relaxed text-white/82">Choose Growth System or higher for immediate response, case-type routing prompts, consultation handoff, and structured follow-up.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/pricing" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-primary shadow-lg">Compare Packages <ArrowRight className="w-4 h-4" /></Link>
              <Link to="/book" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur">Get a Free Audit <Scale className="w-4 h-4" /></Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileCallBar />
    </div>
  );
}
