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
    const cleanupMetadata = setPageMetadata({
      title: 'Get Help Choosing Your AI Growth System | ClientSurge Systems',
      description:
        'Not sure whether Starter, Growth, or Pro is right for your business? Get help choosing the best ClientSurge package for your lead flow.',
      canonicalPath: '/book',
      ogTitle: 'Get Help Choosing Your AI Growth System',
      ogDescription:
        'Talk to a human about whether Starter, Growth, or Pro is the right ClientSurge package for your business lead flow.',
    });

    return cleanupMetadata;
  }, []);

  return (
    <div className="book-page min-h-screen bg-gradient-to-br from-background via-card to-background">
        <Navbar />
        <main className="px-4 pb-32 pt-[calc(var(--cs-nav-height)+28px)] md:px-6 md:pb-20 md:pt-[calc(var(--cs-nav-height)+44px)]">
          <div className="mx-auto w-full max-w-6xl">
            <section className="book-blue-shell">
              <span className="book-shell-signal" aria-hidden="true" />
              <div className="book-hero-grid">
                <div className="book-hero-copy">
                  <div className="book-kicker">
                    <span className="book-kicker-dot" />
                    Package Guidance
                  </div>
                  <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                    Get Help Choosing Your AI Growth System
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                    Not sure whether Starter, Growth, or Pro is the right fit for your business? Tell us about your lead flow and we'll recommend the best package — no audit, no pressure.
                  </p>
                  <a
                    href="/pricing"
                    onClick={() => trackCTA('compare_packages', 'book_page_header')}
                    className="book-text-link mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Compare Packages Instead
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>

                <div className="book-audit-card" aria-label="Package selection process">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Process</p>
                    <span className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      15 min
                    </span>
                  </div>
                  <div className="book-flow-rail" aria-hidden="true">
                    <span className="book-flow-pulse" />
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="mt-5 grid gap-2">
                    {["Choose your package", "We configure it", "Go live in 5–7 days"].map((item, index) => (
                      <div key={item} className="book-mini-step">
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="book-content-panel">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">What's Inside Each Package</p>
                  <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground">
                    What your AI growth system includes
                  </h2>
                  <p className="mt-3 text-sm md:text-base text-muted-foreground">
                    Built for roofers, HVAC companies, dental practices, med spas, chiropractic clinics, contractors, and other local service businesses.
                  </p>
                </div>

                <div className="mt-7 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                  "Instant lead response SMS & email",
                  "Missed-call text-back recovery",
                  "Multi-step SMS/email follow-up",
                  "Booking & scheduling automation",
                  "Lead reactivation engine",
                  "Review request automation",
                  ].map((item) => (
                    <div key={item} className="book-check-card rounded-lg border border-primary/15 bg-white/76 px-4 py-3 text-sm font-semibold text-foreground">
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid md:grid-cols-3 gap-4">
                  {[
                    {
                      icon: CalendarCheck2,
                      title: "Choose your package",
                      body: "Pick Starter, Growth, or Pro based on your lead flow needs. No sales pressure — just a clear path to more captured revenue.",
                    },
                    {
                      icon: ClipboardList,
                      title: "We handle setup and go-live",
                      body: "We configure your automations, connect your providers, and get everything running in 5–7 business days.",
                    },
                    {
                      icon: MessagesSquare,
                      title: "Your system runs 24/7",
                      body: "Leads are captured, followed up, and converted — automatically. You focus on your business while the system works.",
                    },
                  ].map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.title} className="book-step-card rounded-lg border border-primary/15 bg-white/82 p-5 text-left shadow-sm" style={{ "--book-step-index": index }}>
                        <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                      </div>
                    );
                  })}
                </div>

                <div id="scheduler" className="book-scheduler-panel mt-8">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
                      Package guidance
                    </p>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      Tell us about your business and we'll recommend the right package.
                    </h3>
                    <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
                      Share your business details, industry, and website — we'll help you decide whether Starter, Growth, or Pro is the best fit.
                    </p>
                  </div>
                  <div className="book-scheduler-visual" aria-hidden="true">
                   <span>Choose</span>
                   <ArrowRight className="h-4 w-4" />
                   <span>Configure</span>
                   <ArrowRight className="h-4 w-4" />
                   <span>Go Live</span>
                  </div>
                </div>

                <div className="book-inline-scheduler mt-6" aria-label="AI Automation Stack scheduler">
                  <DemoBookingInline />
                </div>

                <div className="book-cta-band mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    to="/contact"
                    onClick={() => trackCTA('contact_us_instead', 'book_page')}
                    className="inline-flex items-center justify-center rounded-lg border border-primary/15 bg-white/84 px-5 py-3 text-sm font-semibold text-foreground hover:bg-white transition-colors"
                  >
                    Contact us instead
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </main>
        <Footer />
        <MobileCallBar />
        <style>{`
          .book-page {
            background:
              radial-gradient(circle at 12% 12%, rgba(0, 174, 239, 0.20), transparent 28rem),
              radial-gradient(circle at 86% 6%, rgba(0, 95, 153, 0.14), transparent 24rem),
              linear-gradient(135deg, #f7fbff 0%, #ffffff 42%, #eef8ff 100%);
          }

          .book-blue-shell {
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(0, 95, 153, 0.16);
            border-radius: 8px;
            background:
              linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(247, 251, 255, 0.90)),
              radial-gradient(circle at 80% 0%, rgba(0, 174, 239, 0.14), transparent 24rem);
            box-shadow: 0 28px 90px rgba(0, 95, 153, 0.16);
          }

          .book-blue-shell::before {
            content: "";
            position: absolute;
            inset: 0;
            border-top: 4px solid rgba(0, 174, 239, 0.85);
            pointer-events: none;
          }

          .book-shell-signal {
            position: absolute;
            left: 0;
            top: 0;
            z-index: 2;
            width: 34%;
            height: 4px;
            background: linear-gradient(90deg, transparent, #00aeef, #005f99);
            box-shadow: 0 0 18px rgba(0, 174, 239, 0.70);
            animation: bookShellSignal 3.4s ease-in-out infinite;
          }

          .book-hero-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 360px;
            gap: 32px;
            align-items: center;
            padding: 38px;
          }

          .book-kicker {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid rgba(0, 95, 153, 0.18);
            border-radius: 8px;
            background: rgba(0, 95, 153, 0.06);
            padding: 7px 10px;
            color: #005f99;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.16em;
            text-transform: uppercase;
          }

          .book-kicker-dot {
            width: 7px;
            height: 7px;
            border-radius: 999px;
            background: #00aeef;
            box-shadow: 0 0 0 4px rgba(0, 174, 239, 0.12);
          }

          .book-audit-card {
            border: 1px solid rgba(0, 95, 153, 0.16);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.82);
            box-shadow: 0 20px 54px rgba(0, 95, 153, 0.12);
            padding: 22px;
          }

          .book-flow-rail {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 26px;
            padding: 8px 4px;
          }

          .book-flow-rail::before {
            content: "";
            position: absolute;
            left: 16px;
            right: 16px;
            height: 2px;
            border-radius: 999px;
            background: linear-gradient(90deg, rgba(0, 95, 153, 0.24), rgba(0, 174, 239, 0.72), rgba(0, 95, 153, 0.36));
          }

          .book-flow-rail > span:not(.book-flow-pulse) {
            position: relative;
            z-index: 2;
            width: 14px;
            height: 14px;
            border: 2px solid #ffffff;
            border-radius: 50%;
            background: #005f99;
            box-shadow: 0 0 0 6px rgba(0, 174, 239, 0.10);
          }

          .book-flow-pulse {
            position: absolute;
            left: 16px;
            z-index: 1;
            width: 58px;
            height: 2px;
            border-radius: 999px;
            background: linear-gradient(90deg, transparent, #00aeef, #005f99);
            box-shadow: 0 0 18px rgba(0, 174, 239, 0.70);
            animation: bookFlowPulse 2.8s ease-in-out infinite;
          }

          .book-mini-step {
            display: flex;
            align-items: center;
            gap: 10px;
            border: 1px solid rgba(0, 95, 153, 0.12);
            border-radius: 8px;
            background: rgba(247, 251, 255, 0.86);
            padding: 10px 12px;
            color: #001f4e;
            font-size: 13px;
            font-weight: 700;
          }

          .book-mini-step span {
            color: #005f99;
            font-size: 11px;
            letter-spacing: 0.10em;
          }

          .book-content-panel {
            margin: 0 18px 18px;
            border: 1px solid rgba(0, 95, 153, 0.13);
            border-radius: 8px;
            background:
              linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(248, 251, 255, 0.88)),
              radial-gradient(circle at 8% 0%, rgba(0, 174, 239, 0.12), transparent 22rem);
            padding: 28px;
          }

          .book-check-card,
          .book-step-card,
          .book-scheduler-panel {
            transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
          }

          .book-check-card:hover,
          .book-step-card:hover,
          .book-step-card:focus-within {
            transform: translateY(-3px);
            border-color: rgba(0, 95, 153, 0.24);
            box-shadow: 0 18px 44px rgba(0, 95, 153, 0.10);
          }

          .book-step-card {
            animation: bookStepEnter 520ms ease both;
            animation-delay: calc(var(--book-step-index) * 90ms);
          }

          .book-scheduler-panel {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 24px;
            align-items: center;
            border: 1px solid rgba(0, 95, 153, 0.16);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.74);
            box-shadow: 0 20px 50px rgba(0, 95, 153, 0.10);
            padding: 24px;
          }

          .book-scheduler-visual {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #005f99;
            font-size: 12px;
            font-weight: 800;
            white-space: nowrap;
          }

          .book-scheduler-visual span {
            border: 1px solid rgba(0, 95, 153, 0.14);
            border-radius: 8px;
            background: rgba(0, 174, 239, 0.08);
            padding: 9px 11px;
          }

          .book-cta-band {
            border: 1px solid rgba(0, 95, 153, 0.12);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.62);
            padding: 16px;
          }

          .book-primary-button {
            min-width: 190px;
            background: linear-gradient(135deg, #00aeef 0%, #0088cc 46%, #003b8f 100%);
            box-shadow: 0 16px 34px rgba(0, 95, 153, 0.26);
          }

          .book-inline-scheduler {
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 8px;
            background: linear-gradient(145deg, #071527 0%, #0d2747 52%, #09203c 100%);
            box-shadow: 0 20px 54px rgba(0, 31, 78, 0.18);
            padding: 20px;
          }

          @keyframes bookShellSignal {
            0%, 12% {
              transform: translateX(-40%);
              opacity: 0;
            }
            22%, 78% {
              opacity: 1;
            }
            100% {
              transform: translateX(330%);
              opacity: 0;
            }
          }

          @keyframes bookFlowPulse {
            0%, 12% {
              transform: translateX(0);
              opacity: 0;
            }
            24%, 82% {
              opacity: 1;
            }
            100% {
              transform: translateX(240px);
              opacity: 0;
            }
          }

          @keyframes bookStepEnter {
            from {
              opacity: 0;
              transform: translateY(12px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media (max-width: 900px) {
            .book-hero-grid,
            .book-scheduler-panel {
              grid-template-columns: 1fr;
            }

            .book-hero-grid {
              padding: 28px 20px;
            }

            .book-content-panel {
              margin: 0 12px 12px;
              padding: 20px;
            }

            .book-scheduler-visual {
              flex-wrap: wrap;
              white-space: normal;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .book-shell-signal,
            .book-flow-pulse,
            .book-step-card {
              animation: none;
            }

            .book-check-card,
            .book-step-card,
            .book-scheduler-panel {
              transition: none;
            }
          }
        `}</style>
    </div>
  );
}