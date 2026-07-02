// FORM-02: TCPA/CTIA Opt-out & Contact Preference Management Page
// Linked from all SMS/email footers — must be publicly accessible with no login required

import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { setPageMetadata } from "@/lib/seo";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { CheckCircle, Mail, Phone, Settings } from "lucide-react";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";

const PREFERENCES = [
  { value: "email_only", label: "Email Only", description: "Only receive emails, no SMS messages", icon: "📧" },
  { value: "sms_only", label: "SMS Only", description: "Only receive text messages, no emails", icon: "📱" },
  { value: "reduce_frequency", label: "Reduce Frequency", description: "Receive fewer messages overall", icon: "📉" },
  { value: "stop_all", label: "Stop All Communications", description: "Opt out of all automated messages", icon: "🚫" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneDigits = (value) => String(value || "").replace(/\D/g, "");

export default function OptOut() {
  const [form, setForm] = useState({ email: "", phone: "" });
  const [preference, setPreference] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPageMetadata({
      title: "Communication Preferences | ClientSurge Systems",
      description: "Manage your communication preferences with ClientSurge Systems. Opt out of SMS or email, or adjust your contact frequency.",
      robots: "noindex,nofollow",
    });

    // Pre-fill from URL params (from SMS/email links)
    const params = new URLSearchParams(window.location.search);
    if (params.get("email")) setForm(f => ({ ...f, email: params.get("email") }));
    if (params.get("phone")) setForm(f => ({ ...f, phone: params.get("phone") }));
    if (params.get("action") === "stop") setPreference("stop_all");
  }, []);

  const validate = () => {
    const trimmedEmail = form.email.trim();
    const trimmedPhone = form.phone.trim();

    if (!trimmedEmail && !trimmedPhone) {
      return "Please enter your email or phone number.";
    }
    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      return "Please enter a valid email address.";
    }
    if (trimmedPhone && phoneDigits(trimmedPhone).length < 10) {
      return "Please enter a valid phone number.";
    }
    if (!preference) {
      return "Please select a preference.";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await base44.functions.invoke("updateContactPreferences", {
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        preference,
      });
      if (result?.data?.success === false) {
        throw new Error(result.data.error || "Preference update failed");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <DemoBookingProvider>
        <div style={{ minHeight: "100vh", background: "#fff" }}>
          <Navbar />
          <div style={{ maxWidth: "560px", margin: "0 auto", padding: "calc(var(--cs-nav-height) + 80px) 24px 80px", textAlign: "center" }}>
            <CheckCircle style={{ width: "56px", height: "56px", color: "#00AEEF", margin: "0 auto 20px" }} />
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#000", marginBottom: "12px" }}>Preferences Updated</h1>
            <p style={{ fontSize: "15px", color: "#444", lineHeight: 1.7 }}>
              Your communication preferences have been saved. Changes take effect immediately.
            </p>
            <p style={{ fontSize: "13px", color: "#888", marginTop: "16px" }}>
              You can always email us at{" "}
              <a href="mailto:support@clientsurgesystems.com" style={{ color: "#00AEEF" }}>
                support@clientsurgesystems.com
              </a>{" "}
              to update your preferences again.
            </p>
          </div>
          <Footer />
        </div>
      </DemoBookingProvider>
    );
  }

  return (
    <DemoBookingProvider>
      <div style={{ minHeight: "100vh", background: "#fff" }}>
        <Navbar />

        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "calc(var(--cs-nav-height) + 48px) 24px 80px" }}>
          <div style={{ marginBottom: "32px" }}>
            <p style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#00AEEF", marginBottom: "10px" }}>
              Communication Preferences
            </p>
            <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, color: "#000", marginBottom: "12px", lineHeight: 1.1 }}>
              Manage Your Preferences
            </h1>
            <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>
              Update how ClientSurge Systems contacts you. Your preferences are applied immediately and we honor all opt-out requests as required by TCPA/CTIA guidelines.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Contact identification */}
            <div style={{ marginBottom: "24px", padding: "20px", borderRadius: "12px", border: "1px solid rgba(0,174,239,0.15)", background: "rgba(0,174,239,0.03)" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#00AEEF", marginBottom: "16px" }}>
                Your Contact Info
              </p>
              <div style={{ display: "grid", gap: "12px" }}>
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#555", marginBottom: "6px" }}>
                    <Mail style={{ width: "13px", height: "13px" }} /> Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setError(""); }}
                    placeholder="your@email.com"
                    aria-invalid={Boolean(error && form.email && !EMAIL_REGEX.test(form.email.trim()))}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#555", marginBottom: "6px" }}>
                    <Phone style={{ width: "13px", height: "13px" }} /> Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); setError(""); }}
                    placeholder="+1 (602) 555-0123"
                    aria-invalid={Boolean(error && form.phone && phoneDigits(form.phone).length < 10)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>
              </div>
            </div>

            {/* Preference selection */}
            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", marginBottom: "12px" }}>
                <Settings style={{ width: "13px", height: "13px", display: "inline", marginRight: "6px" }} />
                Select Your Preference
              </p>
              <div style={{ display: "grid", gap: "10px" }}>
                {PREFERENCES.map(pref => (
                  <label key={pref.value} style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    border: `1.5px solid ${preference === pref.value ? "#00AEEF" : "rgba(0,0,0,0.1)"}`,
                    background: preference === pref.value ? "rgba(0,174,239,0.05)" : "#fff",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}>
                    <input
                      type="radio"
                      name="preference"
                      value={pref.value}
                      checked={preference === pref.value}
                      onChange={() => { setPreference(pref.value); setError(""); }}
                      style={{ marginTop: "3px", accentColor: "#00AEEF" }}
                    />
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "#000", margin: "0 0 3px" }}>
                        {pref.icon} {pref.label}
                      </p>
                      <p style={{ fontSize: "12px", color: "#777", margin: 0 }}>{pref.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <p style={{ fontSize: "13px", color: "#d14343", fontWeight: 600, marginBottom: "16px" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "9999px",
                background: "linear-gradient(90deg, #0079c1, #005691)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "15px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Saving..." : "Update My Preferences"}
            </button>

            <p style={{ fontSize: "11px", color: "#999", textAlign: "center", marginTop: "14px", lineHeight: 1.6 }}>
              To opt out of all SMS messages immediately, text <strong>STOP</strong> to any message from us. For assistance, contact{" "}
              <a href="mailto:support@clientsurgesystems.com" style={{ color: "#00AEEF" }}>support@clientsurgesystems.com</a>
            </p>
          </form>
        </div>

        <Footer />
      </div>
    </DemoBookingProvider>
  );
}
