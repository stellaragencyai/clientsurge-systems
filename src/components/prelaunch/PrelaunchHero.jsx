import {
  ArrowRight,
  CalendarCheck2,
  Check,
  Globe2,
  MessageSquareText,
  PhoneCall,
  ShieldCheck,
  Workflow,
} from "lucide-react";

const FLOW_STEPS = [
  { label: "Lead comes in", detail: "Website form, call, or inquiry", Icon: Globe2 },
  { label: "Instant AI response", detail: "Responds in seconds", Icon: MessageSquareText },
  { label: "Automatic follow-up", detail: "No lead gets forgotten", Icon: Workflow },
  { label: "Lead is qualified", detail: "Moves the right opportunities forward", Icon: ShieldCheck },
  { label: "Appointment booked", detail: "A clear next step is created", Icon: CalendarCheck2 },
];

const SYSTEM_LAYERS = [
  { label: "2–6+ AI automations", Icon: Workflow },
  { label: "Industry AI voice assistant", Icon: PhoneCall },
  { label: "Managed and protected", Icon: ShieldCheck },
];

export default function PrelaunchHero() {
  const scrollToForm = (event) => {
    event.preventDefault();
    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="prelaunch-hero" aria-labelledby="prelaunch-hero-headline">
      <div className="prelaunch-hero__bg" aria-hidden="true" />
      <div className="prelaunch-hero__inner">
        <div className="prelaunch-hero__content">
          <span className="prelaunch-hero__eyebrow">AI Lead Response &amp; Booking Automation for Local Businesses</span>
          <h1 id="prelaunch-hero-headline" className="prelaunch-hero__headline">
            Turn incoming leads into booked appointments—automatically.
          </h1>
          <p className="prelaunch-hero__copy">
            ClientSurge installs one connected AI-powered system that responds to website leads,
            texts missed callers, follows up automatically, qualifies prospects, and moves them
            toward a booked appointment—24/7.
          </p>
          <p className="prelaunch-hero__outcome">
            Website leads · Missed calls · Follow-up · Qualification · Booking
          </p>
          <button type="button" onClick={scrollToForm} className="prelaunch-hero__cta">
            Join the Founding Waitlist <ArrowRight size={18} aria-hidden="true" />
          </button>
          <p className="prelaunch-hero__microcopy">
            Founding access is limited to the first 1,000 eligible businesses.
          </p>
        </div>

        <div
          className="prelaunch-hero__visual"
          role="img"
          aria-label="Illustration of a ClientSurge website capturing a lead, responding with AI, following up, and booking an appointment"
        >
          <div className="prelaunch-hero__system-card">
            <div className="prelaunch-hero__system-bar">
              <div className="prelaunch-hero__window-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <span className="prelaunch-hero__system-label">ClientSurge system preview</span>
              <span className="prelaunch-hero__system-status">
                <span aria-hidden="true" /> Preview
              </span>
            </div>

            <div className="prelaunch-hero__system-body">
              <span className="prelaunch-hero__system-eyebrow">How ClientSurge works</span>
              <h2>From incoming lead to booked appointment.</h2>
              <p>
                One connected system handles the critical steps that usually depend on somebody responding manually.
              </p>

              <div className="prelaunch-hero__flow" aria-hidden="true">
                {FLOW_STEPS.map(({ label, detail, Icon }, index) => (
                  <div className="prelaunch-hero__flow-step" key={label}>
                    <span className="prelaunch-hero__flow-index">{index + 1}</span>
                    <span className="prelaunch-hero__flow-icon">
                      <Icon size={17} />
                    </span>
                    <span className="prelaunch-hero__flow-copy">
                      <strong>{label}</strong>
                      <small>{detail}</small>
                    </span>
                  </div>
                ))}
              </div>

              <p className="prelaunch-hero__missed-call">
                <strong>Missed call?</strong> ClientSurge can text the caller back automatically and start the conversation.
              </p>

              <div className="prelaunch-hero__layers">
                {SYSTEM_LAYERS.map(({ label, Icon }) => (
                  <div className="prelaunch-hero__layer" key={label}>
                    <Icon size={17} aria-hidden="true" />
                    <span>{label}</span>
                    <Check size={15} aria-hidden="true" />
                  </div>
                ))}
              </div>

              <p className="prelaunch-hero__visual-note">
                Illustrative system flow. Features and automation count vary by package.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
