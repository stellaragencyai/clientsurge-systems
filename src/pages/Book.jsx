import { useEffect, useState } from 'react';
import { ArrowRight, CalendarCheck2, ClipboardList, MessagesSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { setPageMetadata } from '@/lib/seo';
import { trackCTA } from '@/lib/analytics';
import MobileCallBar from '@/components/landing/MobileCallBar';
import { bookingConfig } from '@/lib/booking';

export default function Book() {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const cleanupMetadata = setPageMetadata({
      title: 'Book Your Demo | ClientSurge Systems',
      description:
        'Book a free ClientSurge Systems demo to review your follow-up process, lead leaks, and the fastest automation wins for your business.',
      canonicalPath: '/book',
      ogTitle: 'Book Your Free ClientSurge Demo',
      ogDescription:
        'Schedule a walkthrough to see how ClientSurge can improve your lead response and booking flow.',
    });

    let script = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
    let scriptAdded = false;

    if (!script) {
      script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);
      scriptAdded = true;
    } else {
      setScriptLoaded(true);
    }

    return () => {
      cleanupMetadata();
      if (scriptAdded && script?.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Book Your Free Demo
          </h1>
          <p className="text-muted-foreground text-lg">30 minutes. No commitment.</p>
          <a
            href="/#automation-demo"
            onClick={() => trackCTA('see_live_demo_3_minutes', 'book_page_header')}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            See a live demo in 3 minutes
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Calendly Widget */}
        <div className="bg-white rounded-2xl border border-border shadow-lg overflow-hidden">
          <div className="calendly-inline-widget" data-url={bookingConfig.embedUrl} style={{minWidth:'320px',height:'700px'}} />
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-2">If the scheduler does not load, use one of these options:</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={bookingConfig.directUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackCTA('open_external_scheduler', 'book_page_fallback')}
              className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-background px-4 py-2 font-semibold text-primary hover:bg-primary/5 transition-colors"
            >
              Open scheduler in a new tab
            </a>
            <Link
              to="/contact"
              onClick={() => trackCTA('contact_us_instead', 'book_page_fallback')}
              className="inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Contact us instead
            </Link>
          </div>
          {!scriptLoaded && (
            <p className="mt-3 text-xs text-amber-700">
              The booking widget is still loading. The fallback links above are available right away.
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            {bookingConfig.fallbackMessage}
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card/80 p-6 md:p-8">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">What Happens After You Book</p>
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground">
              Clear next steps before the call
            </h2>
            <p className="mt-3 text-sm md:text-base text-muted-foreground">
              You are not booking yourself into a black box. Here is exactly what happens next.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: CalendarCheck2,
                title: "You book",
                body: "Choose a time that works for you and get an immediate confirmation.",
              },
              {
                icon: ClipboardList,
                title: "We prepare your audit",
                body: "We review your lead flow, follow-up gaps, and where bookings are leaking.",
              },
              {
                icon: MessagesSquare,
                title: "We meet",
                body: "On the call, we show the fastest automation wins and what implementation would look like for your business.",
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

          <p className="mt-6 text-center text-xs text-muted-foreground">
            No spam. No pressure. Just a tailored walkthrough of your current lead and booking process.
          </p>
        </div>
      </div>
      <MobileCallBar />
    </div>
  );
}
