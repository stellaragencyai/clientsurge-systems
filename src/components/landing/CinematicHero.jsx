import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { trackCTA } from "@/lib/analytics";

const AUTOMATION_PILLS = [
  "Lead Capture",
  "Missed-Call Recovery",
  "Follow-Up",
  "AI Booking",
  "Reviews",
  "Reactivation",
  "Optional AI Phone Receptionist",
];

const TRUST_LOGOS = [
  { name: "Asana", src: "data:image/png;base64,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" },
  { name: "Cloudflare", src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGwAAABKCAYAAAAojBVlAAAK9UlEQVR42u2ce3hd13XHv+ecZyuyZFm2lPGljVMVZWBrGt0g9tR1a3rA2MbE2qR1sF+VNQYbQ4hpgGqogYqOQws6GcXKs2igpGqkqrTrG0KiJkZBO5b1JGkb2RYxqvZ/vu973e8mW+XHxZksWZb9nvt85zzO+ZzzvM+5z3POeyyZTGYYj8fjaDQaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhpawP9nL0wYp+ip1Hv+4fTg7/6oL5fLcrlcVd2y22H4UOEca+EwA1RqxzEG98ZZH82Vo9vSGdNWQ7w/Jseuh4iI9AvGL5v5j6gHoG9x5lVSKf9tXhOiUiohAwkTgx7W98c4OA6+6FJlfpMMamqZ6dNGkydVWVnr+/PlOjY2Ngw8++KDJ0XxKh2KxWCRJ0jc1NXlzc/NQjffxrtbSIiJiFgpSxgz4zu3rV2V8sbHxnYVC4bzRaNQocpMCdwH2Y5JksQHnGvfgwYOFtrZ2+Pj4+CBIpVLpfL9fHzdu3PiobVtbg7u7u+nl5eXtz58/9/f29vrGrq6uznK5fJgQa+S+ShuMOgZehTfQCn/NzJkzpaGhYfT++++/v+RyuVzDYrGQZVn2Wq3W4uLiiuPj43YjK+io5sLsqMk0TVOPx3sAcO9wOJyYmBi0Gg1No9EwP5sZGo1GHH/88b179+4tkvT09CTW1tZqrlQqFX/8+PGCk5OTiZ+fnxsNBoPLy8szhGRZNs/n86l8cHAw7cvLy6dIJBLJ4XA4os/n8wwuLi7GEhIS6uHhYQRc3+1Uenq6AQD09fU9fs2aNf31tbW1jWaz2Txw4MAZ+7nYOjs7O0lJSYFDQ0MLBQUF9v3798/AwjXb/wzAM/H09MSZM2f+r6+v/7U6kUgk+nK5vLu3t7f/4/vvv7/x4MGDL5OxpCRWJ3M4HGY6nY6Ojo6GsrKyuFqtnt5eXp68f//+GQqFgpGJiYlPZfvo0aM9b968Kd7f33+ho6Mjk8lkfl4ymVxVW1tbd3JyMm1vb8+yWCyqDw8Pe3t7e3+6nG7R6/XG3t7e1w6HQ2g0Gr7P5/NFQkLC+Ojo6Fb5fH5KS0tL3N/fDwcHB2kkEonrmZubi6+vry9PT09Pp6enK0jSXlpaSjweTz+Pj48fFhYGADc3N0eDwYDS0lL8/f09Op2Ol5WV1XdxcdGOjo7Mz8/P3+v1e1JSUvw+Pj5e0dHRp6mpKS+Xy0Xr6+s9dHR0k6enp5dHR0d3j8fjLx8fH+/q6uqsvLy8e5/P51O8vLya3W6X9vb2Wq1Wm9PT0/L09PS+wcHB9GlpaZl9fX0fg8Fg4O7u7sTHx8fU1dVZpaWlVn19fcr9/f3k7u7u0mQyGadSqWy3Wm0mNze3u7y8/Pz8/Pzlrq6uvjY2Nvb5/P5oE6n85/P5/P8/f1teXl5tFqtNj09PZ4k6dXV1QUoFAo13/8mJibk0dHRdFtbW2tra2tubm5ub29vV+v1+qmpqR8uLy+/2Ww2i4ODg+O9vb3c4XCYfX19RcXFxb2FhYVheXn5R2NjY6TBYLC4uLiKcZpMJr9erXl/f/9TU1MDi8ViKZPJdHt7e6vZ2dkcHBwM4Pz8/PO4uLh8e3t7Pzs7O3+2w+HY3d3dJ6rV6rKzs5OVlZVlQqFQ2Nzc3JyZmZk8PT2dOjo6GEZGRn5eXl6W+fn5Vn19fXNOm8Fw+I3Dw8Mfy8vL9ra2tnw/Pz9GbGwsANy9e3eq0WjY29t7Y2FhAQBv3749t6urq1t1dXWxgYEBz5cvX85eXl7eXl5eBQUFy9ra2nTz8/NpR0dH2MLCAnp7e/tsbW19+fPnz3tbW1vD7u7uH6lUCu7u7o6jo6Pz6XT6iC3OK7fwf8w5uTo3eckbAAAAAElFTkSuQmCC" },
  { name: "OpenAI", src: "data:image/png;base64,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" },
  { name: "Twilio", src: "data:image/png;base64,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" },
  { name: "Stripe", src: "data:image/png;base64,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" },
  { name: "Resend", src: "data:image/png;base64,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" },
  { name: "Resend", src: "data:image/png;base64,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" }
];

export default function CinematicHero() {
  const shouldReduceMotion = useReducedMotion();

  const scrollToSection = (id, eventName) => {
    trackCTA(eventName, "hero");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <style>{`
        .cs-hero-shield,
        .cs-hero-shield h1,
        .cs-hero-shield h2,
        .cs-hero-shield h3,
        .cs-hero-shield p,
        .cs-hero-shield span,
        .cs-hero-shield div,
        .cs-hero-shield button,
        .cs-hero-shield a {
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
        }
        .cs-hero-shield .cs-hero-eyebrow {
          color: #35BDF1 !important;
          -webkit-text-fill-color: #35BDF1 !important;
        }
        .cs-hero-shield .cs-hero-subcopy {
          color: #D4D8E0 !important;
          -webkit-text-fill-color: #D4D8E0 !important;
        }
        .cs-hero-logo-card {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.28);
          box-shadow: 0 14px 32px rgba(0, 0, 0, 0.18);
          backdrop-filter: blur(10px);
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }
        .cs-hero-logo-card:hover {
          transform: translateY(-2px);
          border-color: rgba(53, 189, 241, 0.45);
          box-shadow: 0 18px 42px rgba(0, 0, 0, 0.24), 0 0 22px rgba(53, 189, 241, 0.12);
        }
        .cs-hero-logo-card img {
          display: block;
          width: auto;
          max-width: 104px;
          max-height: 30px;
          object-fit: contain;
        }
        @media (min-width: 640px) {
          .cs-hero-logo-card img {
            max-width: 118px;
            max-height: 34px;
          }
        }
      `}</style>

      <section
        className="cs-hero-shield relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: "calc(100svh - var(--cs-nav-height))", background: "#061025" }}
        aria-label="ClientSurge AI automation storefront"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 50% 40%, #0A1B38 0%, #061025 70%, #040C1C 100%)" }}
          />
          {!shouldReduceMotion && (
            <>
              <motion.div
                className="absolute rounded-full"
                style={{
                  top: "15%",
                  left: "10%",
                  width: 340,
                  height: 340,
                  background: "radial-gradient(circle, rgba(53,189,241,0.10), transparent 70%)",
                  filter: "blur(80px)",
                  willChange: "transform",
                }}
                animate={{ x: [0, 25, 0], y: [0, 15, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute rounded-full"
                style={{
                  bottom: "12%",
                  right: "8%",
                  width: 380,
                  height: 380,
                  background: "radial-gradient(circle, rgba(53,189,241,0.08), transparent 70%)",
                  filter: "blur(90px)",
                  willChange: "transform",
                }}
                animate={{ x: [0, -20, 0], y: [0, -12, 0] }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
              />
            </>
          )}
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col items-center text-center pt-20 md:pt-24 pb-12 md:pb-16">
          <motion.div
            className="cs-hero-eyebrow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              fontSize: "clamp(0.7rem, 1vw, 0.8rem)",
              fontWeight: 800,
              letterSpacing: "0.25em",
              textShadow: "0 0 16px rgba(53,189,241,0.4)",
              textTransform: "uppercase",
              margin: "0 0 16px 0",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            AI Automation Storefront
          </motion.div>

          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            style={{
              fontFamily: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
              fontSize: "clamp(1.5rem, 3.6vw, 3rem)",
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: "-0.015em",
              margin: "0 0 20px 0",
              textTransform: "uppercase",
              textWrap: "balance",
              textShadow: "0 2px 24px rgba(0, 0, 0, 0.6)",
              maxWidth: "1100px",
              fontFeatureSettings: "'kern' 1",
            }}
          >
            <span style={{ display: "block", color: "#FFFFFF" }}>Turn Your Website Into a 24/7 AI Sales Machine</span>
          </motion.h1>

          <motion.p
            className="cs-hero-subcopy"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(1rem, 1.9vw, 1.15rem)",
              fontWeight: 400,
              lineHeight: 1.7,
              maxWidth: "680px",
              margin: "0 auto 20px auto",
              letterSpacing: "-0.011em",
            }}
          >
            Choose a packaged AI system for missed calls, slow follow-up, booking friction, reviews, and lead reactivation. We configure it, test the launch path, and install it for your business.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="flex flex-wrap justify-center gap-2 mb-8 max-w-3xl"
          >
            {AUTOMATION_PILLS.map((pill) => (
              <span
                key={pill}
                className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold"
                style={{ borderColor: "rgba(53,189,241,0.28)", background: "rgba(8,20,44,0.72)", color: "#D4D8E0" }}
              >
                {pill}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto mb-8"
          >
            <button
              onClick={() => scrollToSection("pricing", "hero_choose_system_click")}
              type="button"
              className="cs-btn-primary"
              style={{ width: "100%", maxWidth: "300px", height: "54px", padding: "0 32px" }}
            >
              Choose Your AI System <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToSection("automations", "hero_see_systems_click")}
              type="button"
              className="inline-flex items-center justify-center rounded-full border text-sm font-bold transition-all"
              style={{
                width: "100%",
                maxWidth: "300px",
                height: "54px",
                borderColor: "rgba(53, 189, 241, 0.4)",
                background: "rgba(8, 20, 44, 0.7)",
                color: "#FFFFFF",
              }}
            >
              See How It Works
            </button>
          </motion.div>

          <p className="cs-hero-subcopy text-xs font-semibold">
            No long-term contract · Month-to-month · Proof checked before launch
          </p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.36 }}
            className="mt-6 w-full max-w-4xl"
            aria-label="ClientSurge integration logos"
          >
            <p className="cs-hero-eyebrow mb-3 text-[0.68rem] font-extrabold uppercase tracking-[0.22em]">
              Built to connect with the tools your system runs on
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {TRUST_LOGOS.map((logo) => (
                <div
                  key={logo.name}
                  className="cs-hero-logo-card flex h-12 min-w-[118px] items-center justify-center rounded-2xl px-4 sm:h-14 sm:min-w-[138px]"
                  title={logo.name}
                >
                  <img src={logo.src} alt={`${logo.name} logo`} loading="eager" decoding="async" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
