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
  { label: "New inquiry captured", Icon: Globe2 },
  { label: "Instant AI response", Icon: MessageSquareText },
  { label: "Follow-up continues", Icon: Workflow },
  { label: "Appointment booked", Icon: CalendarCheck2 },
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
          <span className="prelaunch-hero__eyebrow">ClientSurge Systems · Founding Access</span>
          <h1 id="prelaunch-hero-headline" className="prelaunch-hero__headline">
            More Time. More Customers. Less Manual Work.
          </h1>
          <p className="prelaunch-hero__copy">
            ClientSurge combines a visually premium, high-converting industry website with built-in
            AI automations, managed infrastructure, and industry-specific AI capabilities—helping
            your business capture, follow up with, and convert more opportunities around the clock.
          </p>
          <p className="prelaunch-hero__outcome">
            A smarter customer-acquisition system designed to give business owners more freedom and
            more room to grow.
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
                <span aria-hidden="true" /> Active
              </span>
            </div>

            <div className="prelaunch-hero__system-body">
              <span className="prelaunch-hero__system-eyebrow">Website + AI automation</span>
              <h2>Capture the opportunity. Automate what happens next.</h2>
              <p>
                One connected system moves a new lead from first contact toward a booked customer.
              </p>

              <div className="prelaunch-hero__flow" aria-hidden="true">
                {FLOW_STEPS.map(({ label, Icon }, index) => (
                  <div className="prelaunch-hero__flow-step" key={label}>
                    <span className="prelaunch-hero__flow-icon">
                      <Icon size={17} />
                    </span>
                    <span>{label}</span>
                    {index < FLOW_STEPS.length - 1 && <ArrowRight className="prelaunch-hero__flow-arrow" size={15} />}
                  </div>
                ))}
              </div>

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
