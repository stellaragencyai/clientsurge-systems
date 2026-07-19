import { useState } from "react";
import { ArrowRight, KeyRound, Mail, Shield, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  CSAlert,
  CSButton,
  CSField,
  CSModal,
  CSStatusBadge,
} from "@/components/design-system";
import { useAuth } from "@/lib/AuthContext";
import SignupModal from "./SignupModal";

export default function PortalLoginModal({ onClose }) {
  const { applyAuthenticatedUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showSignup, setShowSignup] = useState(false);
  const [view, setView] = useState("login");
  const [adminUser, setAdminUser] = useState(null);
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  const isLoginView = view === "login";
  const isResetSuccessView = view === "forgot-success";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      await base44.auth.loginViaEmailPassword(email.trim(), password);
      const currentUser = await base44.auth.me();
      applyAuthenticatedUser(currentUser);
      const role = (currentUser?.role || "").toLowerCase();

      if (role === "admin" || role === "super_admin") {
        setAdminUser(currentUser);
        setShowRoleSelect(true);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get("from_url");
      window.location.href = fromUrl && fromUrl.startsWith("/") && !fromUrl.startsWith("//")
        ? fromUrl
        : "/client-portal";
    } catch (err) {
      setError(err?.data?.message || err?.message || "Unable to sign in. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const emailToReset = (resetEmail || email).trim();
      await base44.auth.resetPasswordRequest(emailToReset);
      setNotice("Password reset email sent. Use the secure link in that email to create a new password, then sign in here.");
      setView("forgot-success");
    } catch (err) {
      setError(err?.data?.message || err?.message || "We could not send the reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChoice = (destination) => {
    window.location.href = destination;
  };

  if (showSignup) {
    return (
      <SignupModal
        onClose={onClose}
        onSwitchToLogin={() => setShowSignup(false)}
      />
    );
  }

  if (showRoleSelect && adminUser) {
    return (
      <CSModal
        open
        onClose={onClose}
        title="Choose login role"
        description="Your account has admin privileges. Choose how you would like to proceed."
        size="sm"
      >
        <div className="cs-portal-login cs-portal-login--role">
          <CSStatusBadge tone="info">
            <Shield size={14} aria-hidden="true" /> Admin detected
          </CSStatusBadge>

          <div className="cs-portal-login__role-list">
            <button
              type="button"
              onClick={() => handleRoleChoice("/admin")}
              className="cs-portal-login__role-option"
            >
              <span className="cs-portal-login__role-icon" aria-hidden="true">
                <Shield />
              </span>
              <span>
                <strong className="cs-portal-login__role-title">Log in as Admin</strong>
                <span className="cs-portal-login__role-description">
                  Full access to the admin dashboard, lead management, client onboarding, and system controls.
                </span>
              </span>
              <ArrowRight aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => handleRoleChoice("/client-portal")}
              className="cs-portal-login__role-option"
            >
              <span className="cs-portal-login__role-icon cs-portal-login__role-icon--client" aria-hidden="true">
                <User />
              </span>
              <span>
                <strong className="cs-portal-login__role-title">Log in as Client (Pro Package)</strong>
                <span className="cs-portal-login__role-description">
                  View the client portal experience, campaign statuses, lead flow, and setup progress as a member with an active Pro package.
                </span>
              </span>
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>
      </CSModal>
    );
  }

  return (
    <CSModal
      open
      onClose={onClose}
      title={isLoginView ? "Client portal sign in" : isResetSuccessView ? "Check your email" : "Reset your password"}
      description={isLoginView
        ? "Access your ClientSurge system, activation progress, reports, and required next actions."
        : isResetSuccessView
          ? "Use the secure reset link when it arrives, then return here to sign in."
          : "Enter the email connected to your ClientSurge account."}
      size="sm"
      closeLabel="Close client portal sign in"
    >
      <div className="cs-portal-login">
        <CSStatusBadge tone="info">
          <span className="cs-portal-login__status-dot" aria-hidden="true" /> Client portal
        </CSStatusBadge>

        {error ? (
          <CSAlert tone="danger" title={isLoginView ? "Sign in failed" : "Reset email not sent"}>
            {error}
          </CSAlert>
        ) : null}

        {notice ? (
          <CSAlert tone="success" title="Reset email sent">
            {notice}
          </CSAlert>
        ) : null}

        {isResetSuccessView ? (
          <div className="cs-portal-login__success-actions">
            <CSButton
              type="button"
              size="lg"
              className="cs-portal-login__submit"
              onClick={() => {
                setError("");
                setNotice("");
                setView("login");
              }}
            >
              Return to sign in
            </CSButton>
          </div>
        ) : (
          <form onSubmit={isLoginView ? handleSubmit : handleForgotPassword} className="cs-portal-login__form">
            {isLoginView ? (
              <>
                <CSField
                  id="portal-login-email"
                  label="Email address"
                  hint="Use the email connected to your ClientSurge order."
                  required
                >
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                      if (!resetEmail) setResetEmail(event.target.value);
                    }}
                    required
                    placeholder="jane@business.com"
                  />
                </CSField>

                <CSField id="portal-login-password" label="Password" required>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    required
                    placeholder="Enter your password"
                  />
                </CSField>
              </>
            ) : (
              <CSField
                id="portal-login-reset-email"
                label="Email address"
                hint="For privacy, ClientSurge sends the same confirmation whether or not an account exists."
                required
              >
                <input
                  type="email"
                  autoComplete="email"
                  value={resetEmail || email}
                  onChange={(event) => {
                    setResetEmail(event.target.value);
                    setEmail(event.target.value);
                    setError("");
                  }}
                  required
                  placeholder="jane@business.com"
                />
              </CSField>
            )}

            <CSButton
              type="submit"
              size="lg"
              loading={loading}
              className="cs-portal-login__submit"
            >
              {loading
                ? isLoginView ? "Signing in..." : "Sending reset email..."
                : isLoginView ? <>Sign in <ArrowRight aria-hidden="true" /></> : <>Send reset email <Mail aria-hidden="true" /></>}
            </CSButton>

            <div className="cs-portal-login__secondary-actions">
              {isLoginView ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setNotice("");
                      setResetEmail(email);
                      setView("forgot");
                    }}
                    className="cs-portal-login__text-button"
                  >
                    <KeyRound size={14} aria-hidden="true" />
                    Forgot your password?
                  </button>
                  <p className="cs-portal-login__footer-note">
                    Do not have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setShowSignup(true)}
                      className="cs-portal-login__inline-button"
                    >
                      Start onboarding
                    </button>
                  </p>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setNotice("");
                    setView("login");
                  }}
                  className="cs-portal-login__text-button"
                >
                  Back to sign in
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </CSModal>
  );
}
