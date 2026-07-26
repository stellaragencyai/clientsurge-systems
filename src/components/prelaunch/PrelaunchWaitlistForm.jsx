import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PrelaunchWaitlistForm() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const trimmedFirstName = firstName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedBusinessName = businessName.trim();

    if (!trimmedFirstName) {
      setError("Please enter your first name.");
      return;
    }
    if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) {
      setError("Please enter a valid business email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke("submitWaitlistSignup", {
        first_name: trimmedFirstName,
        email: trimmedEmail,
        business_name: trimmedBusinessName || undefined,
        website,
      });
      const data = response?.data || response;
      if (data?.status === "duplicate") {
        setError(data.message || "This email is already on the ClientSurge founding waitlist.");
      } else if (data?.status === "success") {
        setSuccess(true);
      } else {
        setError(data?.message || data?.error || "Unable to join the waitlist. Please try again.");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to join the waitlist. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section id="waitlist" className="prelaunch-form" aria-labelledby="prelaunch-form-heading">
        <div className="prelaunch-form__inner">
          <div className="prelaunch-form__success" role="status" aria-live="polite">
            <CheckCircle2 size={40} aria-hidden="true" className="prelaunch-form__success-icon" />
            <span className="prelaunch-section-kicker">Submission confirmed</span>
            <h2 id="prelaunch-form-heading" className="prelaunch-form__success-title">
              You&apos;re on the waitlist
            </h2>
            <p className="prelaunch-form__success-copy">
              Watch your inbox for ClientSurge launch updates and founding-access information.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="waitlist" className="prelaunch-form" aria-labelledby="prelaunch-form-heading">
      <div className="prelaunch-form__inner">
        <span className="prelaunch-section-kicker">Reserve founding access</span>
        <h2 id="prelaunch-form-heading" className="prelaunch-form__heading">
          Join the Founding Waitlist
        </h2>
        <p className="prelaunch-form__copy">
          Be among the first businesses notified when ClientSurge launches.
        </p>

        <div className="prelaunch-form__message" aria-live="polite" aria-atomic="true">
          {error && (
            <div className="prelaunch-form__error" role="alert">
              <AlertCircle size={16} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <form
          id="prelaunch-waitlist-form"
          onSubmit={handleSubmit}
          className="prelaunch-form__form"
          noValidate
        >
          <div className="prelaunch-form__honeypot" aria-hidden="true">
            <label htmlFor="waitlist-website">Website</label>
            <input
              id="waitlist-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </div>

          <div className="prelaunch-form__field">
            <label htmlFor="waitlist-first-name" className="prelaunch-form__label">
              First name
            </label>
            <input
              id="waitlist-first-name"
              name="first_name"
              type="text"
              autoComplete="given-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
              maxLength={100}
              className="prelaunch-form__input"
              disabled={loading}
            />
          </div>

          <div className="prelaunch-form__field">
            <label htmlFor="waitlist-email" className="prelaunch-form__label">
              Business email
            </label>
            <input
              id="waitlist-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              maxLength={320}
              className="prelaunch-form__input"
              disabled={loading}
            />
          </div>

          <div className="prelaunch-form__field">
            <label htmlFor="waitlist-business" className="prelaunch-form__label">
              Business name <span className="prelaunch-form__optional">(optional)</span>
            </label>
            <input
              id="waitlist-business"
              name="business_name"
              type="text"
              autoComplete="organization"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              maxLength={200}
              className="prelaunch-form__input"
              disabled={loading}
            />
          </div>

          <button type="submit" className="prelaunch-form__submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="prelaunch-form__spinner" aria-hidden="true" />
                Joining…
              </>
            ) : (
              <>
                Join the Founding Waitlist <ArrowRight size={18} aria-hidden="true" />
              </>
            )}
          </button>

          <p className="prelaunch-form__consent">
            By joining, you agree to receive ClientSurge launch and founding-access emails. You can
            unsubscribe at any time. See our <Link to="/privacy">Privacy Policy</Link> and{" "}
            <Link to="/terms">Terms</Link>.
          </p>
        </form>
      </div>
    </section>
  );
}
