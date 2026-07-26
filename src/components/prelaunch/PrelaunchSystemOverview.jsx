const CAPABILITIES = [
  "Premium industry website",
  "Built-in AI automations",
  "Automated lead response",
  "Automated prospect follow-up",
  "Appointment-booking workflows",
  "Customer communication automation",
  "Managed website hosting",
  "Google Analytics",
  "Resend-powered email automation",
  "Cloudflare DNS and security",
  "ElevenLabs AI voice assistants (eligible packages)",
];

export default function PrelaunchSystemOverview() {
  return (
    <section className="prelaunch-system" aria-labelledby="prelaunch-system-heading">
      <div className="prelaunch-system__inner">
        <h2 id="prelaunch-system-heading" className="prelaunch-system__heading">
          One connected, fully managed system
        </h2>
        <p className="prelaunch-system__copy">
          ClientSurge brings your website, AI automations, and infrastructure together as a single
          managed platform&mdash;not a collection of disconnected tools.
        </p>
        <ul className="prelaunch-system__strip">
          {CAPABILITIES.map((item) => (
            <li key={item} className="prelaunch-system__chip">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}