import { useState } from "react";
import { ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PrelaunchWaitlistForm() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!firstName.trim()) {
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
        first_name: firstName.trim(),
        email: trimmedEmail,
        business_name: businessName.trim() || undefined,
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
          <div className="prelaunch-form__success" role="status">
            <CheckCircle2 size={40} aria-hidden="true" className="prelaunch-form__success-icon" />
            <h2 id="prelaunch-form-heading" className="prelaunch-form__success-title">
              You're on the waitlist
            </h2>
            <p className="prelaunch-form__success-copy">
              You're on the ClientSurge founding waitlist. Watch your inbox for launch updates and
              founding-access information.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="waitlist" className="prelaunch-form" aria-labelledby="prelaunch-form-heading">
      <div className="prelaunch-form__inner">
        <h2 id="prelaunch-form-heading" className="prelaunch-form__heading">
          Join the Founding Waitlist
        </h2>
        <p className="prelaunch-form__copy">
          Reserve your founding access. We will notify you when ClientSurge launches.
        </p>

        {error && (
          <div className="prelaunch-form__error" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="prelaunch-form__form" noValidate>
          <div className="prelaunch-form__field">
            <label htmlFor="waitlist-first-name" className="prelaunch-form__label">
              First name
            </label>
            <input
              id="waitlist-first-name"
              type="text"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
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
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              type="text"
              autoComplete="organization"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              maxLength={200}
              className="prelaunch-form__input"
              disabled={loading}
            />
          </div>
          <button type="submit" className="prelaunch-form__submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="prelaunch-form__spinner" aria-hidden="true" /> Joining...
              </>
            ) : (
              <>
                Join the Founding Waitlist <ArrowRight size={18} aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}