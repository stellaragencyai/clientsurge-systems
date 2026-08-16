import { useEffect, useState, useMemo } from "react";

// September 1, 2026 at 12:00 a.m. America/Phoenix time (MST = UTC-7, no DST)
const LAUNCH_TARGET = new Date("2026-09-01T07:00:00.000Z");

function getRemaining() {
  const diff = LAUNCH_TARGET.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export default function PrelaunchCountdown() {
  const [time, setTime] = useState(getRemaining);
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    setTime(getRemaining());
    const interval = setInterval(() => setTime(getRemaining()), 1000);
    return () => clearInterval(interval);
  }, []);

  const units = [
    { label: "Days", value: time.days },
    { label: "Hours", value: time.hours },
    { label: "Minutes", value: time.minutes },
    { label: "Seconds", value: time.seconds },
  ];

  return (
    <section className="prelaunch-countdown" aria-labelledby="prelaunch-countdown-heading">
      <div className="prelaunch-countdown__inner">
        <span className="prelaunch-countdown__kicker">Launching September 1, 2026</span>
        <h2 id="prelaunch-countdown-heading" className="prelaunch-countdown__heading">
          Stop losing leads because nobody responded fast enough.
        </h2>
        <p className="prelaunch-countdown__intro">
          ClientSurge launches a connected AI lead-response system built to handle the critical steps between an incoming inquiry and a booked appointment.
        </p>
        <div className="prelaunch-countdown__grid" role="timer">
          {units.map((unit) => (
            <div key={unit.label} className="prelaunch-countdown__unit">
              <span
                className="prelaunch-countdown__value"
                data-reduced={prefersReducedMotion ? "true" : "false"}
              >
                {String(unit.value).padStart(2, "0")}
              </span>
              <span className="prelaunch-countdown__label">{unit.label}</span>
            </div>
          ))}
        </div>
        <p className="prelaunch-countdown__date">
          September 1, 2026 at 12:00 a.m. Arizona time
        </p>

        <div className="prelaunch-countdown__outcomes" aria-label="What ClientSurge automates">
          <div>
            <strong>Responds in seconds</strong>
            <span>New website inquiries can get an immediate response.</span>
          </div>
          <div>
            <strong>Recovers missed calls</strong>
            <span>Missed callers can receive an automatic text-back.</span>
          </div>
          <div>
            <strong>Follows up automatically</strong>
            <span>Leads keep moving until there is a clear next step.</span>
          </div>
        </div>

        <a href="#waitlist" className="prelaunch-countdown__cta">
          Join the Founding Waitlist
        </a>
        <p className="prelaunch-countdown__microcopy">
          Founding access is limited to the first 1,000 eligible businesses.
        </p>
      </div>
    </section>
  );
}