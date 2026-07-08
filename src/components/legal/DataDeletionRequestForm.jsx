/**
 * Account and data deletion request form.
 * Allows users to request deletion of their account-related data and personal data.
 * Submits to the logPiiAccess backend function with action='request_data_deletion'.
 */
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";

export default function DataDeletionRequestForm() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email && !phone) {
      setError("Please provide your email or phone number so we can locate your account or data.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await base44.functions.invoke("logPiiAccess", {
        action: "request_data_deletion",
        request_type: "account_and_data_deletion",
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        reason: reason.trim() || "user_account_or_data_deletion_request",
      });
      if (!result?.data?.success) throw new Error(result?.data?.error || "Request failed");
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center" role="status" aria-live="polite">
        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">Request Received</h3>
        <p className="text-sm text-green-700">
          Your account or data deletion request has been logged. We will review and process it according to applicable privacy requirements.
          You will receive a confirmation when the request is complete or if more information is needed.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6" id="account-deletion-request-form">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-primary" aria-hidden="true" />
        <h3 id="account-deletion-form-title" className="text-lg font-semibold text-foreground">Request Account or Data Deletion</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Use this form to request deletion of your ClientSurge account-related data, lead/contact data, or other personal information.
        Provide the email or phone number connected to the account or record so we can locate it.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="account-deletion-form-title">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1" htmlFor="account-deletion-email">Email Address</label>
          <input
            id="account-deletion-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1" htmlFor="account-deletion-phone">Phone Number</label>
          <input
            id="account-deletion-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 000-0000"
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1" htmlFor="account-deletion-reason">Reason (optional)</label>
          <textarea
            id="account-deletion-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell us what account or data you want deleted."
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
          {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
          {loading ? "Submitting..." : "Submit Account/Data Deletion Request"}
        </button>
      </form>
    </div>
  );
}
