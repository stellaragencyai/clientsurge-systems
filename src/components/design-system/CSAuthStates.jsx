import { AlertTriangle, LockKeyhole, ShieldX } from "lucide-react";
import { CSButton, CSCard, CSSkeleton } from "./CSProductPrimitives";

export function CSAuthLoadingState({ title = "Securing your workspace", description = "Validating your session and loading your ClientSurge system." }) {
  return (
    <main className="cs-auth-state" aria-busy="true" aria-live="polite">
      <CSCard className="cs-auth-state__card">
        <div className="cs-auth-state__icon"><LockKeyhole aria-hidden="true" /></div>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="cs-auth-state__skeletons" aria-hidden="true">
          <CSSkeleton height="12px" width="76%" />
          <CSSkeleton height="12px" width="58%" />
          <CSSkeleton height="44px" width="100%" />
        </div>
      </CSCard>
    </main>
  );
}

export function CSUnauthorizedState({ onReturn, title = "You do not have access to this area", description = "Your account is active, but your current role does not include permission for this workspace." }) {
  return (
    <main className="cs-auth-state">
      <CSCard className="cs-auth-state__card">
        <div className="cs-auth-state__icon cs-auth-state__icon--danger"><ShieldX aria-hidden="true" /></div>
        <h1>{title}</h1>
        <p>{description}</p>
        <CSButton onClick={onReturn}>Return to your workspace</CSButton>
      </CSCard>
    </main>
  );
}

export function CSSessionExpiredState({ onSignIn, title = "Your secure session has ended", description = "Sign in again to continue. Your saved ClientSurge data has not been removed." }) {
  return (
    <main className="cs-auth-state">
      <CSCard className="cs-auth-state__card">
        <div className="cs-auth-state__icon cs-auth-state__icon--warning"><AlertTriangle aria-hidden="true" /></div>
        <h1>{title}</h1>
        <p>{description}</p>
        <CSButton onClick={onSignIn}>Sign in securely</CSButton>
      </CSCard>
    </main>
  );
}
