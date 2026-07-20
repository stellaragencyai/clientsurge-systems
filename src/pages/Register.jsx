import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, UserPlus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/components/ui/use-toast";
import { CSAlert, CSButton, CSField } from "@/components/design-system";
import "@/styles/clientsurge-os-registration.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePassword(password) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must include at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must include at least one lowercase letter.";
  if (!/\d/.test(password)) return "Password must include at least one number.";
  return "";
}

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await base44.auth.register({ email: normalizedEmail, password });
      setEmail(normalizedEmail);
      setShowOtp(true);
    } catch (err) {
      setError(err?.data?.message || err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      window.location.href = "/";
    } catch (err) {
      setError(err?.data?.message || err?.message || "The verification code is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "Code sent", description: "Check your email for the new verification code." });
    } catch (err) {
      setError(err?.data?.message || err?.message || "We could not resend the code. Please try again.");
    }
  };

  const handleGoogle = () => base44.auth.loginWithProvider("google", "/");

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="Verify your email"
        subtitle={`Enter the six-digit code sent to ${email}.`}
        brandTitle="One final security step before your system opens."
        brandDescription="Email verification protects your ClientSurge identity and ensures activation, reporting, billing, and service access stay connected to the correct account."
        assurance="Secure one-time verification for your ClientSurge account."
      >
        <div className="cs-registration-otp">
          {error ? <CSAlert tone="danger" title="Verification unsuccessful">{error}</CSAlert> : null}
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code" aria-label="Six-digit verification code">
            <InputOTPGroup>
              {Array.from({ length: 6 }, (_, index) => <InputOTPSlot index={index} key={index} />)}
            </InputOTPGroup>
          </InputOTP>
          <CSButton className="cs-auth-submit" onClick={handleVerify} loading={loading} disabled={otpCode.length < 6}>
            Verify and continue
          </CSButton>
          <p className="cs-registration-otp__resend">
            Did not receive the code?{" "}
            <button type="button" className="cs-registration-link-button" onClick={handleResend}>Resend code</button>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Create your ClientSurge account"
      subtitle="Create the secure identity that will own your activation, services, reporting, and billing."
      brandTitle="Your AI-powered business system starts with one secure account."
      brandDescription="Create your ClientSurge identity once, then use it through activation, installation, launch, reporting, billing, and ongoing growth."
      assurance="Protected account creation and email verification."
      footer={<><span>Already have an account? </span><Link to="/login">Sign in</Link></>}
    >
      <CSButton variant="secondary" className="cs-registration-provider" onClick={handleGoogle}>
        <GoogleIcon aria-hidden="true" /> Continue with Google
      </CSButton>

      <div className="cs-registration-divider"><span>or use email</span></div>

      {error ? <CSAlert tone="danger" title="Account could not be created">{error}</CSAlert> : null}

      <form onSubmit={handleSubmit} className="cs-registration-form" noValidate>
        <CSField id="register-email" label="Email address" required>
          <input
            className="cs-auth-input"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@business.com"
            value={email}
            onChange={(event) => { setEmail(event.target.value); setError(""); }}
            required
          />
        </CSField>

        <CSField id="register-password" label="Password" hint="Use at least 8 characters with uppercase, lowercase, and a number." required>
          <input
            className="cs-auth-input"
            type="password"
            autoComplete="new-password"
            placeholder="Create a secure password"
            value={password}
            onChange={(event) => { setPassword(event.target.value); setError(""); }}
            required
          />
        </CSField>

        <CSField id="register-confirm-password" label="Confirm password" required>
          <input
            className="cs-auth-input"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(event) => { setConfirmPassword(event.target.value); setError(""); }}
            required
          />
        </CSField>

        <CSButton type="submit" className="cs-auth-submit" loading={loading}>
          Create secure account
        </CSButton>
      </form>
    </AuthLayout>
  );
}
