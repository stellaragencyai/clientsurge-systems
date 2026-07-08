/**
 * Finding #147: GDPR/CCPA data deletion request form.
 * Allows users to request deletion of their personal data (right to be forgotten).
 * Submits to the logPiiAccess backend function with action='request_data_deletion'.
 */
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from "@/lib/formSanitizers";

export default function DataDeletionRequestForm() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanedEmail = normalizeEmail(email);
    const cleanedPhone = normalizePhone(phone);

    if (!cleanedEmail && !cleanedPhone) {
      setError("Please provide a valid email or phone number so we can locate your data.");
      return;
    }
    if (email.trim() && !isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (phone.trim() && !isValidPhone(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await base44.functions.invoke("logPiiAccess", {
        action: "request_data_deletion",
        email: cleanedEmail || undefined,
        phone: cleanedPhone || undefined,
        reason: reason.trim() || "user_request",
      });
      if (!result?.data?.success) throw new Error(result?.data?.error || "Request failed");
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to submit request. Please try again or email support@clientsurgesystems.com.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">Request Received</h3>
        <p className="text-sm text-green-700">
          Your data deletion request has been logged. We will process it within the legally required privacy-response window.
          You'll receive a confirmation email if we can match your record and email is available.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Request Data Deletion</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Under applicable privacy laws, you may request deletion of your personal data.
        Fill out the form below so we can locate and process your request.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="your@email.com"
            autoComplete="email"
            aria-invalid={Boolean(email && !isValidEmail(email))}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(""); }}
            placeholder="(555) 000-0000"
            autoComplete="tel"
            aria-invalid={Boolean(phone && !isValidPhone(phone))}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Reason (optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you requesting data deletion?"
            rows={2}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? "Submitting..." : "Submit Deletion Request"}
        </button>
      </form>
    </div>
  );
}
