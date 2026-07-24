import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { trackCTA } from "@/lib/analytics";

const LAUNCH_AT = "2026-09-01T00:00:00-07:00";
const CAMPAIGN_START_AT = "2026-07-24T00:00:00-07:00";
const FOUNDING_LIMIT = 1000;

const LOGO_URL =
  "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getCountdownParts(now = Date.now()) {
  const target = new Date(LAUNCH_AT).getTime();
  const remainingMs = Math.max(0, target - now);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, remainingMs };
}

function getCountdownProgress(now = Date.now()) {
  const start = new Date(CAMPAIGN_START_AT).getTime();
  const end = new Date(LAUNCH_AT).getTime();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return clamp(((now - start) / (end - start)) * 100, 0, 100);
}

function formatNumber(value) {
  return String(value).padStart(2, "0");
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function collectAttribution() {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const attribution = {};

  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((field) => {
    const value = params.get(field);
    if (value) attribution[field] = value;
  });

  try {
    const stored = JSON.parse(sessionStorage.getItem("cs_utm_session") || "{}");
    Object.keys(stored).forEach((key) => {
      if (!attribution[key] && key.startsWith("utm_")) attribution[key] = stored[key];
    });
  } catch (_error) {}

  return attribution;
}

function CountdownTile({ label, value }) {
  return (
    <div className="cs-launch-count-tile">
      <span className="cs-launch-count-value">{value}</span>
      <span className="cs-launch-count-label">{label}</span>
    </div>
  );
}

function LaunchWaitlistForm() {
  const [email, setEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const canSubmit = validEmail(email) && status !== "submitting";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (websiteUrl.trim()) {
      setStatus("success");
      setMessage("You are on the founding waitlist.");
      return;
    }

    if (!validEmail(email)) {
      setStatus("error");
      setMessage("Enter a valid email address to join the waitlist.");
      return;
    }

    setStatus("submitting");
    trackCTA("launch_waitlist_join", "september_launch_homepage");

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        source: "landing_page",
        source_page: typeof window !== "undefined" ? window.location.pathname : "/",
        service_interest: "ClientSurge September 1, 2026 founding waitlist",
        message: `September 1, 2026 launch waitlist. Offer: first ${FOUNDING_LIMIT} signups get 50% off for life and no setup fee.`,
        problem: "Requested founding waitlist access before public launch.",
        requested_channels: ["email"],
        consent_given: true,
        consent_source: "launch_waitlist_email_form",
        consent_text_version: "launch_waitlist_email_only_v1",
        environment: "production",
        ...collectAttribution(),
      };

      const response = await base44.functions.invoke("captureValidatedWebsiteLead", payload);
      const data = response?.data ?? response;

      if (!data?.success && !data?.duplicate) {
        throw new Error(data?.error || "Unable to join the waitlist right now.");
      }

      setStatus(data?.duplicate ? "duplicate" : "success");
      setMessage(data?.duplicate
        ? "You are already on the founding waitlist."
        : "You are on the founding waitlist.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(error?.message || "Unable to join the waitlist right now.");
    }
  };

  return (
    <form className="cs-launch-form" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="launch-waitlist-email">Email address</label>
      <div className="cs-launch-input-shell">
        <Mail aria-hidden="true" />
        <input
          id="launch-waitlist-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
          required
        />
        <input
          type="text"
          value={websiteUrl}
          onChange={(event) => setWebsiteUrl(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="cs-launch-honeypot"
          aria-hidden="true"
        />
      </div>
      <button type="submit" disabled={!canSubmit} className="cs-launch-submit">
        <span>{status === "submitting" ? "Joining..." : "Join The Waitlist"}</span>
        {status === "submitting" ? <Clock3 aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
      </button>
      <p className="cs-launch-consent">
        By joining, you agree to receive email launch updates from ClientSurge Systems. Unsubscribe anytime.
      </p>
      {message && (
        <p className={`cs-launch-form-status cs-launch-form-status--${status}`} role={status === "error" ? "alert" : "status"}>
          {status === "error" ? null : <CheckCircle2 aria-hidden="true" />}
          <span>{message}</span>
        </p>
      )}
    </form>
  );
}

function LaunchInstrument({ progress }) {
  return (
    <div className="cs-launch-instrument" style={{ "--launch-progress": `${progress}%` }}>
      <div className="cs-launch-instrument-face">
        <div className="cs-launch-instrument-track" aria-hidden="true" />
        <div className="cs-launch-instrument-core">
          <span>Live Countdown</span>
          <strong>Sept 1</strong>
          <small>2026</small>
        </div>
      </div>
    </div>
  );
}

export default function LaunchWaitlistPage() {
  const [countdown, setCountdown] = useState(() => getCountdownParts());
  const [progress, setProgress] = useState(() => getCountdownProgress());

  useEffect(() => {
    document.body.classList.add("cs-launch-body");
    return () => document.body.classList.remove("cs-launch-body");
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setCountdown(getCountdownParts(now));
      setProgress(getCountdownProgress(now));
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const formattedCountdown = useMemo(() => ({
    days: String(countdown.days),
    hours: formatNumber(countdown.hours),
    minutes: formatNumber(countdown.minutes),
    seconds: formatNumber(countdown.seconds),
  }), [countdown.days, countdown.hours, countdown.minutes, countdown.seconds]);

  return (
    <div className="cs-launch-page">
      <div className="cs-launch-grid" aria-hidden="true" />
      <header className="cs-launch-header">
        <a href="/" className="cs-launch-logo" aria-label="ClientSurge Systems home">
          <img src={LOGO_URL} alt="ClientSurge Systems" width="284" height="132" decoding="async" />
        </a>
        <a className="cs-launch-login" href="/login">Client Login</a>
      </header>

      <main className="cs-launch-main" aria-label="ClientSurge Systems September 1 launch waitlist">
        <section className="cs-launch-hero">
          <div className="cs-launch-copy">
            <div className="cs-launch-kicker">
              <CalendarDays aria-hidden="true" />
              <span>Launching September 1, 2026</span>
            </div>
            <h1>
              <span>ClientSurge</span>
              <span>Systems</span>
            </h1>
            <p className="cs-launch-lede">
              The founding waitlist is open for local service businesses that want faster lead response, cleaner follow-up, and proof-first automation before the public launch.
            </p>
            <div className="cs-launch-offer" aria-label="Founding launch offer">
              <Sparkles aria-hidden="true" />
              <span>First {FOUNDING_LIMIT.toLocaleString()} signups lock 50% off for life and no setup fee.</span>
            </div>
            <LaunchWaitlistForm />
          </div>

          <div className="cs-launch-countdown" aria-label="Countdown to September 1, 2026">
            <LaunchInstrument progress={progress} />
            <div className="cs-launch-count-grid" aria-live="polite">
              <CountdownTile label="Days" value={formattedCountdown.days} />
              <CountdownTile label="Hours" value={formattedCountdown.hours} />
              <CountdownTile label="Minutes" value={formattedCountdown.minutes} />
              <CountdownTile label="Seconds" value={formattedCountdown.seconds} />
            </div>
            <div className="cs-launch-progress">
              <span>Campaign window</span>
              <strong>{Math.round(progress)}%</strong>
            </div>
          </div>
        </section>

        <section className="cs-launch-proof-row" aria-label="Launch offer details">
          <div>
            <ShieldCheck aria-hidden="true" />
            <span>No setup fee for founding accounts</span>
          </div>
          <div>
            <Clock3 aria-hidden="true" />
            <span>Priority onboarding opens at launch</span>
          </div>
          <div>
            <Sparkles aria-hidden="true" />
            <span>Founding 1,000 discount window</span>
          </div>
        </section>
      </main>

      <footer className="cs-launch-footer">
        <span>2026 ClientSurge Systems</span>
        <nav aria-label="Legal links">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/sms-terms">SMS Terms</a>
        </nav>
      </footer>
    </div>
  );
}
