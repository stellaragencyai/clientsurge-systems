import { useEffect } from 'react';
import { ArrowRight, CalendarCheck2, ClipboardList, MessagesSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { setPageMetadata } from '@/lib/seo';
import { trackCTA } from '@/lib/analytics';
import MobileCallBar from '@/components/landing/MobileCallBar';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import DemoBookingInline from '@/components/forms/DemoBookingInline';

export default function Book() {
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-4 pb-24 pt-[calc(var(--cs-nav-height)+44px)] md:px-6">
        <section className="mx-auto max-w-6xl rounded-2xl border border-primary/20 bg-white p-8 md:p-12 shadow-xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">Guided System Match</p>
              <h1 className="font-titles text-3xl md:text-5xl font-bold text-foreground leading-tight mb-4">
                Find the Right ClientSurge System
              </h1>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-6">
                Tell us about your lead sources, missed-call flow, follow-up gaps, booking process, and launch goals. We will help you decide whether Starter, Growth, or Pro is the right starting point.
              </p>
              <Link to="/start" onClick={() => trackCTA('start_remote_setup', 'book_page_header')} className="cs-btn-primary inline-flex">
                Start Guided Setup <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="rounded-xl border border-primary/15 bg-primary/5 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-4">How the match works</p>
              <div className="grid gap-3">
                {["Identify your lead flow gap", "Recommend Starter, Growth, or Pro", "Map setup and launch proof checks"].map((item, index) => (
                  <div key={item} className="rounded-lg bg-white border border-border px-4 py-3 text-sm font-semibold text-foreground">
                    {String(index + 1).padStart(2, '0')} · {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              { icon: CalendarCheck2, title: 'Choose the right system', body: 'Starter for response gaps, Growth for follow-up and booking, Pro for the full recovery layer.' },
              { icon: ClipboardList, title: 'Complete guided intake', body: 'Provide business details, tools, phone/email setup, booking links, and access requirements.' },
              { icon: MessagesSquare, title: 'Launch with proof', body: 'The system is configured and checked before it is treated as live.' },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-lg p-5 text-left border border-primary/15 bg-white">
                  <Icon className="w-5 h-5 text-primary mb-4" />
                  <h3 className="text-base font-semibold mb-2 text-foreground">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              );
            })}
          </div>

          <div id="scheduler" className="mt-10 rounded-xl border border-border bg-muted/30 p-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">Prefer help from a person?</h2>
            <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed mb-5">
              Share your business details, industry, and website. We will help you decide which system fits best.
            </p>
            <DemoBookingInline />
          </div>
        </section>
      </main>
      <Footer />
      <MobileCallBar />
    </div>
  );
}
