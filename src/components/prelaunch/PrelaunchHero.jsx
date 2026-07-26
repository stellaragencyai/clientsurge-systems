import { ArrowRight } from "lucide-react";

const HERO_IMAGE = "https://clientsurgesystems.com/og-image.png";

export default function PrelaunchHero() {
  const scrollToForm = (event) => {
    event.preventDefault();
    const el = document.getElementById("waitlist");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="prelaunch-hero" aria-labelledby="prelaunch-hero-headline">
      <div className="prelaunch-hero__bg" aria-hidden="true" />
      <div className="prelaunch-hero__inner">
        <div className="prelaunch-hero__content">
          <span className="prelaunch-hero__eyebrow">ClientSurge Systems &middot; Founding Access</span>
          <h1 id="prelaunch-hero-headline" className="prelaunch-hero__headline">
            More Time. More Customers. Less Manual Work.
          </h1>
          <p className="prelaunch-hero__copy">
            ClientSurge combines a visually premium, high-converting industry website with built-in
            AI automations, managed infrastructure, and industry-specific AI capabilities&mdash;helping
            your business capture, follow up with, and convert more opportunities around the clock.
          </p>
          <p className="prelaunch-hero__outcome">
            A smarter customer-acquisition system designed to give business owners more freedom and
            more room to grow.
          </p>
          <button type="button" onClick={scrollToForm} className="prelaunch-hero__cta">
            Join the Founding Waitlist <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="prelaunch-hero__visual">
          <img
            src={HERO_IMAGE}
            alt="ClientSurge Systems platform brand preview"
            width={1200}
            height={630}
            loading="eager"
            decoding="async"
            className="prelaunch-hero__image"
          />
        </div>
      </div>
    </section>
  );
}