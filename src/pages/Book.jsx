import { useEffect } from 'react';
import { ArrowRight, CalendarCheck2, ClipboardList, MessagesSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { setPageMetadata } from '@/lib/seo';
import { trackCTA } from '@/lib/analytics';
import MobileCallBar from '@/components/landing/MobileCallBar';
import { getPublicBookingLink } from '@/lib/publicEnv';

const CALENDLY_URL = getPublicBookingLink();
const CONTACT_FALLBACK = '/contact';

export default function Book() {
  useEffect(() => {
    const cleanupMetadata = setPageMetadata({
      title: 'Book Your Free ClientSurge Automation Audit | ClientSurge Systems',
      description:
        'Book a free ClientSurge automation audit to review missed-call leakage, speed-to-lead gaps, website conversion, follow-up gaps, and booking friction.',
      canonicalPath: '/book',
      ogTitle: 'Book Your Free ClientSurge Automation Audit',
      ogDescription:
        'Choose a time for a practical review of your lead flow, missed-call recovery, follow-up automation, and booking opportunities.',
    });

    return cleanupMetadata;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Book Your Free ClientSurge Automation Audit
          </h1>
          <p className="text-muted-foreground text-lg">
            Review the places your local service business may be losing calls, forms, follow-up, and booked appointments.
          </p>
          <a
            href="/automations"
            onClick={() => trackCTA('review_automation_systems', 'book_page_header')}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Review the automation systems
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card/80 p-6 md:p-8">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">What Happens After You Book</p>
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground">
              What the audit includes
            </h2>
            <p className="mt-3 text-sm md:text-base text-muted-foreground">
              Built for roofers, HVAC companies, dental practices, med spas, chiropractic clinics, contractors, and other local service businesses.
            </p>
          </div>

          <div className="mb-8 grid sm:grid-cols-2 gap-3">
            {[
              "Missed-call leakage review",
              "Speed-to-lead review",
              "Website conversion review",
              "Follow-up gap review",
              "Booking friction review",
              "Practical automation recommendations",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground">
                {item}
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: CalendarCheck2,
                title: "Choose a time",
                body: "Pick a time that works for you and get an immediate confirmation.",
              },
              {
                icon: ClipboardList,
                title: "Quick discovery call",
                body: "We review your current calls, forms, website path, follow-up process, and booking handoff.",
              },
              {
                icon: MessagesSquare,
                title: "Get automation opportunities",
                body: "You leave with practical ways to recover missed leads, respond faster, and book more appointments.",
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
            If the embedded scheduler fails to load, use the contact page or email support@clientsurgesystems.com and we will help schedule manually.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {CALENDLY_URL ? (
              <a
                href={CALENDLY_URL}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackCTA('schedule_your_audit', 'book_page')}
                className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Open Scheduler
              </a>
            ) : (
              <Link
                to={CONTACT_FALLBACK}
                onClick={() => trackCTA('contact_to_schedule_audit', 'book_page')}
                className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Request Scheduling Help
              </Link>
            )}
            <Link
              to="/contact"
              onClick={() => trackCTA('contact_us_instead', 'book_page')}
              className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Contact us instead
            </Link>
          </div>
        </div>
        {CALENDLY_URL ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <iframe
              src={CALENDLY_URL}
              title="Schedule your ClientSurge automation audit"
              width="100%"
              height="700"
              scrolling="yes"
              className="block w-full border-0"
            />
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <h2 className="font-display text-xl font-semibold text-foreground">Scheduler setup needed</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The public scheduler link is not configured yet. Use the contact page and we will schedule the audit manually.
            </p>
            <Link
              to={CONTACT_FALLBACK}
              onClick={() => trackCTA('contact_to_schedule_audit_panel', 'book_page')}
              className="mt-4 inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Contact ClientSurge
            </Link>
          </div>
        )}
      </div>
      <MobileCallBar />
    </div>
  );
}

