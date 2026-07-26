import {
  BarChart3,
  Globe2,
  MailCheck,
  PhoneCall,
  ServerCog,
  ShieldCheck,
  Workflow,
} from "lucide-react";

const CAPABILITIES = [
  {
    title: "Conversion Website",
    description: "A visually premium, industry-specific website built to capture and convert leads.",
    Icon: Globe2,
  },
  {
    title: "AI Automation Suite",
    description: "Two to six-plus connected automations depending on the package selected.",
    Icon: Workflow,
  },
  {
    title: "AI Voice Assistant",
    description: "Industry-specific ElevenLabs voice assistance in eligible packages.",
    Icon: PhoneCall,
  },
  {
    title: "Managed Hosting",
    description: "Hosting, technical configuration, and connected infrastructure managed for you.",
    Icon: ServerCog,
  },
  {
    title: "Analytics and Email",
    description: "Google Analytics plus Resend-powered email automation and communication systems.",
    Icon: BarChart3,
    SecondaryIcon: MailCheck,
  },
  {
    title: "DNS and Protection",
    description: "Cloudflare DNS, security, and performance protection built into the managed system.",
    Icon: ShieldCheck,
  },
];

export default function PrelaunchSystemOverview() {
  return (
    <section className="prelaunch-system" aria-labelledby="prelaunch-system-heading">
      <div className="prelaunch-system__inner">
        <span className="prelaunch-section-kicker">One complete system</span>
        <h2 id="prelaunch-system-heading" className="prelaunch-system__heading">
          Built together. Managed together.
        </h2>
        <p className="prelaunch-system__copy">
          ClientSurge combines the customer-facing website, automation layer, communications, and
          infrastructure into one managed growth system—not a pile of disconnected tools.
        </p>

        <div className="prelaunch-system__grid">
          {CAPABILITIES.map(({ title, description, Icon, SecondaryIcon }) => (
            <article key={title} className="prelaunch-system__card">
              <span className="prelaunch-system__icon" aria-hidden="true">
                <Icon size={21} />
                {SecondaryIcon && <SecondaryIcon size={14} className="prelaunch-system__icon-secondary" />}
              </span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>

        <p className="prelaunch-system__plan-note">
          Package scope varies. The Pro system contains the most advanced website, the complete AI
          automation suite, and all eligible managed services.
        </p>
      </div>
    </section>
  );
}
