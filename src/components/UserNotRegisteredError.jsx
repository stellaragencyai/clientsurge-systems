import { AlertTriangle } from "lucide-react";
import { CSAlert, CSButton, CSCard } from "@/components/design-system";

export default function UserNotRegisteredError() {
  return (
    <main className="cs-auth-state">
      <CSCard className="cs-auth-state__card">
        <div className="cs-auth-state__icon cs-auth-state__icon--warning">
          <AlertTriangle aria-hidden="true" />
        </div>
        <h1>Access restricted</h1>
        <p>
          This signed-in identity is not registered for the ClientSurge application.
        </p>
        <CSAlert tone="info" title="What to check">
          <ul className="cs-auth-state__list">
            <li>Verify you are using the account connected to your ClientSurge order.</li>
            <li>Contact support if this account should already have access.</li>
          </ul>
        </CSAlert>
        <div className="cs-auth-state__actions">
          <CSButton onClick={() => { window.location.href = "/login"; }}>
            Sign in again
          </CSButton>
          <CSButton variant="secondary" onClick={() => { window.location.href = "/contact"; }}>
            Contact support
          </CSButton>
        </div>
      </CSCard>
    </main>
  );
}
