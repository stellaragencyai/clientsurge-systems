import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AuthLayout from "@/components/AuthLayout";
import { CSAlert, CSButton, CSField } from "@/components/design-system";

function validatePassword(password) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must include at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must include at least one lowercase letter.";
  if (!/\d/.test(password)) return "Password must include at least one number.";
  return "";
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      window.location.href = "/login";
    } catch (requestError) {
      setError(requestError.message || "The password could not be reset. Request a new link and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="Reset link unavailable"
        subtitle="This link is incomplete, invalid, or has expired."
        footer={<Link to="/forgot-password">Request a new secure link</Link>}
      >
        <CSAlert tone="warning" title="A new link is required">
          Request another password-reset email to continue safely.
        </CSAlert>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title="Create a new password"
      subtitle="Choose a strong password for your ClientSurge account."
      footer={<Link to="/login">Return to secure sign in</Link>}
    >
      {error ? (
        <CSAlert tone="danger" title="Password could not be updated">
          {error}
        </CSAlert>
      ) : null}

      <form onSubmit={handleSubmit} noValidate>
        <CSField
          id="new-password"
          label="New password"
          hint="Use at least 8 characters with uppercase, lowercase, and a number."
          required
        >
          <input
            className="cs-auth-input"
            type="password"
            autoComplete="new-password"
            autoFocus
            placeholder="Enter a strong password"
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              setError("");
            }}
            required
          />
        </CSField>

        <CSField id="confirm-password" label="Confirm password" required>
          <input
            className="cs-auth-input"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your new password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setError("");
            }}
            required
          />
        </CSField>

        <CSButton className="cs-auth-submit" type="submit" size="lg" loading={loading}>
          Update password securely
        </CSButton>
      </form>
    </AuthLayout>
  );
}
