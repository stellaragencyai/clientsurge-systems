import { LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { CSButton, CSCard, CSStatusBadge } from "./CSProductPrimitives";

export default function CSAuthSurface({
  title,
  description,
  onPrimaryAction,
  secondaryAction,
  primaryLabel = "Sign in securely",
  children,
}) {
  return (
    <main className="cs-auth-surface">
      <section className="cs-auth-surface__hero" aria-labelledby="cs-auth-title">
        <div className="cs-auth-surface__brand-panel">
          <div className="cs-auth-surface__brand-lockup" aria-label="ClientSurge Systems">
            <span className="cs-auth-surface__brand-mark" aria-hidden="true">CS</span>
            <span>ClientSurge Systems</span>
          </div>

          <div className="cs-auth-surface__brand-content">
            <CSStatusBadge tone="info">
              <LockKeyhole size={14} aria-hidden="true" /> Secure client access
            </CSStatusBadge>
            <h1 id="cs-auth-title">{title}</h1>
            <p>{description}</p>

            <div className="cs-auth-surface__actions">
              <CSButton size="lg" onClick={onPrimaryAction}>
                {primaryLabel}
              </CSButton>
              {secondaryAction}
            </div>
          </div>

          <div className="cs-auth-surface__assurance" aria-label="Security assurance">
            <ShieldCheck aria-hidden="true" />
            <span>Protected access to your ClientSurge system and business data.</span>
          </div>
        </div>

        <div className="cs-auth-surface__workspace">
          <CSCard
            className="cs-auth-surface__access-card"
            title="Your system, in one place"
            description="Access the information that matters without navigating technical tools."
          >
            <ul className="cs-auth-surface__benefits">
              <li><Sparkles aria-hidden="true" /> Activation and launch progress</li>
              <li><Sparkles aria-hidden="true" /> AI service status and recent outcomes</li>
              <li><Sparkles aria-hidden="true" /> Leads, appointments, reporting, and billing</li>
              <li><Sparkles aria-hidden="true" /> Support requests and required next actions</li>
            </ul>
            {children}
          </CSCard>
        </div>
      </section>
    </main>
  );
}
