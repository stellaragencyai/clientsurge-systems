import { useEffect } from 'react';
import { ArrowRight, Calendar, CheckCircle2, Home, Phone, RotateCw, Search, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { setPageMetadata } from '@/lib/seo';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import MobileCallBar from '@/components/landing/MobileCallBar';

const PAIN_POINTS = [
  { title: 'Speed-to-Lead Gap', desc: 'Buyer and seller inquiries often go to the agent or team that responds first, not the one with the best brand.' },
  { title: 'Showing Coordination Drag', desc: 'Manual back-and-forth slows down high-intent buyers who are ready to see a property.' },
  { title: 'Missed-Call Revenue Leak', desc: 'A missed call can mean a missed showing, listing appointment, referral, or commission opportunity.' },
  { title: 'Cold Prospect Lists', desc: 'Old buyer and seller leads sit in the CRM without a structured reactivation path.' },
];

const USE_CASES = [
  { Icon: Search, title: 'Buyer Inquiry Response', desc: 'Respond to Zillow, website, ad, and form inquiries with a fast next step before the prospect keeps shopping.' },
  { Icon: Calendar, title: 'Showing Handoff', desc: 'Move interested buyers toward showing availability, appointment confirmation, or callback routing.' },
  { Icon: Home, title: 'Seller Lead Capture', desc: 'Capture property address, selling timeline, and contact details for cleaner listing consultation handoff.' },
  { Icon: RotateCw, title: 'Lead Reactivation', desc: 'Restart conversations with old buyers, sellers, and unresponsive prospects using controlled follow-up.' },
];

const FEATURES = ['Instant inquiry response', 'Missed-call text-back', 'Showing handoff', 'Seller intake path', 'CRM follow-up prompts', 'Old lead reactivation'];

export default function RealEstate() {
  useEffect(() => {
    const cleanup = setPageMetadata({
      title: 'Real Estate Automation Systems | ClientSurge Systems',
      description: 'AI automation for real estate agents and brokers: faster lead response, automated follow-up, showing handoff, seller intake, and prospect reactivation.',
      canonicalPath: '/real-estate',
      ogTitle: 'Real Estate Automation Systems',
      ogDescription: 'Automate lead response, follow-up, showing handoff, and reactivation for real estate agents and teams.'
    });
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_18%_8%,rgba(0,174,239,0.10),transparent_30%),linear-gradient(180deg,#f8fcff_0%,#ffffff_36%,#f7fbff_100%)]">
      <Navbar />
      <main className="pt-[calc(var(--cs-nav-height)+28px)]">
        <section className="relative overflow-hidden px-4 md:px-6 py-16 md:py-24">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1.05fr_0.95fr] items-center">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-primary">Real Estate AI System</p>
              <h1 className="font-titles text-4xl md:text-6xl font-black tracking-tight text-foreground leading-[0.95]">Respond to Buyer and Seller Inquiries Before They Drift</h1>
              <p className="mt-6 max-w-2xl text-base md:text-lg leading-relaxed text-muted-foreground">ClientSurge helps real estate teams capture inquiries, follow up consistently, route prospects toward showings or consultations, and reactivate old leads without adding manual admin drag.</p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/pricing" className="cs-btn-primary inline-flex items-center justify-center gap-2">Compare Packages <ArrowRight className="w-4 h-4" /></Link>
                <Link to="/automations" className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-white px-6 py-3 text-sm font-bold text-primary shadow-sm hover:bg-primary/5">View Automation Stack</Link>
              </div>
            </div>
            <div className="rounded-3xl border border-primary/15 bg-white/90 p-6 md:p-8 shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-primary">Launch Focus</p>
              <div className="grid grid-cols-2 gap-3">
                {[['60 sec', 'response path'], ['Showing', 'handoff'], ['Seller', 'intake'], ['Reactivation', 'old prospects']].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-center">
                    <p className="font-titles text-xl font-black text-primary">{value}</p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-foreground">Best fit: Growth System or Pro System</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">For teams that need response, multi-step follow-up, appointment handoff, and lead reactivation working together.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 md:px-6 py-14 md:py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">The Problem</p>
              <h2 className="mt-3 font-titles text-3xl md:text-4xl font-black tracking-tight text-foreground">Where Real Estate Leads Slip</h2>
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
              <h2 className="mt-3 font-titles text-3xl md:text-4xl font-black tracking-tight text-foreground">How ClientSurge Supports Real Estate Teams</h2>
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
            <h2 className="mt-3 font-titles text-3xl md:text-4xl font-black tracking-tight text-foreground">Your Real Estate Lead Flow System Includes</h2>
            <div className="mt-8 grid md:grid-cols-2 gap-3 text-left">
              {FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-3 rounded-xl border border-primary/10 bg-white/85 p-4 shadow-sm"><CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary" /><span className="text-sm font-semibold text-foreground/85">{feature}</span></div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 md:px-6 py-16 md:py-24">
          <div className="max-w-4xl mx-auto rounded-3xl border border-primary/15 bg-gradient-to-br from-[#003b8f] to-[#00aeef] p-8 md:p-12 text-center text-white shadow-[0_24px_80px_rgba(0,107,176,0.24)]">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-white/75">Get Started</p>
            <h2 className="font-titles text-3xl md:text-4xl font-black tracking-tight">Install a Real Estate Lead Flow System</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm md:text-base leading-relaxed text-white/82">Choose Growth System or higher for instant response, follow-up, showing handoff, seller intake, and reactivation campaigns.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/pricing" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-primary shadow-lg">Compare Packages <ArrowRight className="w-4 h-4" /></Link>
              <Link to="/book" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur">Get a Free Audit <Phone className="w-4 h-4" /></Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileCallBar />
    </div>
  );
}
