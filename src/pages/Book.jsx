import { useEffect } from 'react';
import { ArrowRight, CalendarCheck2, ClipboardList, MessagesSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { setPageMetadata } from '@/lib/seo';
import { trackCTA } from '@/lib/analytics';
import MobileCallBar from '@/components/landing/MobileCallBar';
import DemoBookingInline from '@/components/forms/DemoBookingInline';

export default function Book() {
  useEffect(() => {
    const cleanupMetadata = setPageMetadata({
      title: 'Book Your Free Demo | ClientSurge Systems',
      description:
        'Book a free ClientSurge Systems demo to review your follow-up process, lead leaks, and the fastest automation wins for your business.',
      canonicalPath: '/book',
      ogTitle: 'Book Your Free ClientSurge Demo',
      ogDescription:
        'Schedule a walkthrough to see how ClientSurge can improve your lead response and booking flow.',
    });

    return cleanupMetadata;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background px-6 py-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-8 xl:grid-cols-[1.05fr,0.95fr] xl:items-start">
          <div className="rounded-3xl border border-border bg-card/80 p-6 md:p-8">
            <div className="mb-10 text-center xl:text-left">
              <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
                Book Your Free Demo
              </h1>
              <p className="text-muted-foreground text-lg">
                Free 15 minutes. No commitment. Choose a time, share a little context, and we will tailor the walkthrough to your business.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center xl:justify-start">
                <a
                  href="#book-demo-form"
                  onClick={() => trackCTA('book_your_free_demo', 'book_page_header')}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Start your booking
                  <ArrowRight className="w-4 h-4" />
                </a>
                <Link
                  to="/#services"
                  onClick={() => trackCTA('review_8_system_flow', 'book_page_header')}
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Review the 8-step system
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="max-w-2xl mx-auto xl:mx-0">
              <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">What Happens After You Book</p>
              <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground">
                Clear next steps before the call
              </h2>
              <p className="mt-3 text-sm md:text-base text-muted-foreground">
                You are not booking yourself into a black box. Here is exactly what happens next.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: CalendarCheck2,
                  title: 'You book',
                  body: 'Choose a time that works for you and get an immediate confirmation.',
                },
                {
                  icon: ClipboardList,
                  title: 'We prepare your audit',
                  body: 'We review your lead flow, follow-up gaps, and where bookings are leaking.',
                },
                {
                  icon: MessagesSquare,
                  title: 'We meet',
                  body: 'On the call, we show the fastest automation wins and what implementation would look like for your business.',
                },
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="rounded-2xl border border-border bg-background p-5 text-left shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground xl:text-left">
              No spam. No pressure. Just a tailored walkthrough of your current lead and booking process.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 xl:justify-start">
              <Link
                to="/contact"
                onClick={() => trackCTA('contact_us_instead', 'book_page')}
                className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Contact us instead
              </Link>
            </div>
          </div>

          <div
            id="book-demo-form"
            className="rounded-3xl border border-primary/20 p-6 shadow-xl"
            style={{
              background:
                'linear-gradient(180deg, rgba(12,22,40,0.98) 0%, rgba(19,34,58,0.96) 100%)',
            }}
          >
            <div className="mb-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                Live Booking Form
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-white">
                Choose a time that works
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Fill out the quick intake, pick a slot, and we will send the confirmation details right away.
              </p>
            </div>
            <DemoBookingInline redirectOnSuccess="/success" />
          </div>
        </div>
      </div>
      <MobileCallBar />
    </div>
  );
}
