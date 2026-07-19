import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AuthLayout from "@/components/AuthLayout";
import { CSAlert, CSButton, CSField } from "@/components/design-system";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await base44.auth.resetPasswordRequest(normalizedEmail);
    } catch {
      // Preserve account privacy by returning the same response for every address.
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      icon={Mail}
      title="Recover your access"
      subtitle="Enter the email connected to your ClientSurge account."
      footer={
        <Link to="/login">
          <ArrowLeft size={14} aria-hidden="true" /> Back to secure sign in
        </Link>
      }
    >
      {sent ? (
        <CSAlert tone="success" title="Check your email">
          If an account exists for that address, a secure password-reset link will arrive shortly.
        </CSAlert>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <CSField
            id="forgot-password-email"
            label="Email address"
            hint="Use the address associated with your ClientSurge account."
            error={error}
            required
          >
            <input
              className="cs-auth-input"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              required
            />
          </CSField>

          <CSButton className="cs-auth-submit" type="submit" size="lg" loading={loading}>
            Send secure reset link
          </CSButton>
        </form>
      )}
    </AuthLayout>
  );
}
