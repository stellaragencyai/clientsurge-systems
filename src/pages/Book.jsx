import { useEffect } from 'react';
import { ArrowRight, CalendarCheck2, ClipboardList, MessagesSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { setPageMetadata } from '@/lib/seo';
import { trackCTA } from '@/lib/analytics';
import MobileCallBar from '@/components/landing/MobileCallBar';
import DemoBookingModal from '@/components/forms/DemoBookingModal';

export default function Book() {
  const navigate = useNavigate();

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

    return cleanupMetadata;
  }, []);

  const handleClose = () => {
    const cameFromThisSite = document.referrer.startsWith(window.location.origin);

    if (cameFromThisSite && window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Book Your Free Demo
          </h1>
          <p className="text-muted-foreground text-lg">Free 15 minutes. No commitment. Same guided booking flow as the rest of the site.</p>
          <a
            href="/#automation-demo"
            onClick={() => trackCTA('see_live_demo_3_minutes', 'book_page_header')}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            See a live demo in 3 minutes
            <ArrowRight className="w-4 h-4" />
          </a>
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

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => trackCTA('book_your_free_demo', 'book_page')}
              className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Booking modal is open above
            </button>
            <Link
              to="/contact"
              onClick={() => trackCTA('contact_us_instead', 'book_page')}
              className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Contact us instead
            </Link>
          </div>
        </div>
      </div>
      <DemoBookingModal onClose={handleClose} />
      <MobileCallBar />
    </div>
  );
}
