/**
 * CredentialsWizard — #407a #407b #407c
 * Tier-gated credential collection wizard.
 * Starter: 3 fields | Growth: 6 fields | Elite: 10-field wizard with logo upload
 */
import { useState } from "react";
import { useOrderGuard } from "@/hooks/useOrderGuard";
import { base44 } from "@/api/base44Client";

// #407a: Starter — 3 fields
const StarterForm = ({ onSubmit, loading }) => {
  const [form, setForm] = useState({ business_phone: "", business_name: "", booking_link: "" });
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
      <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>Starter Setup (3 fields)</h3>
      {[["business_phone","Business Phone","tel"],["business_name","Business Name","text"],["booking_link","Booking Link (URL)","url"]].map(([key, label, type]) => (
        <div key={key} style={{ marginBottom: 14 }}>
          <label style={{ color: "#9CA3AF", fontSize: 12, display: "block", marginBottom: 4 }}>{label} *</label>
          <input type={type} required value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", borderRadius: 8, padding: "9px 12px", fontSize: 14, boxSizing: "border-box" }} />
        </div>
      ))}
      <button type="submit" disabled={loading} style={{ background: "linear-gradient(135deg,#00D4FF,#00FFB3)", color: "#0A0F1E", border: "none", borderRadius: 9999, padding: "11px 24px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
        {loading ? "Saving..." : "Save & Continue →"}
      </button>
    </form>
  );
};

// #407b: Growth — 6 fields
const GrowthForm = ({ onSubmit, loading }) => {
  const [form, setForm] = useState({ business_phone: "", business_name: "", booking_link: "", booking_platform: "", services_offered: "", tone_of_voice: "" });
  const fields = [["business_phone","Business Phone","tel"],["business_name","Business Name","text"],["booking_link","Booking Link","url"],["booking_platform","Booking Platform (e.g. Vagaro, Calendly)","text"],["services_offered","Services Offered (comma-separated)","text"],["tone_of_voice","Tone of Voice (e.g. friendly, professional)","text"]];
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
      <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>Growth Setup (6 fields)</h3>
      {fields.map(([key, label, type]) => (
        <div key={key} style={{ marginBottom: 14 }}>
          <label style={{ color: "#9CA3AF", fontSize: 12, display: "block", marginBottom: 4 }}>{label} *</label>
          <input type={type} required value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", borderRadius: 8, padding: "9px 12px", fontSize: 14, boxSizing: "border-box" }} />
        </div>
      ))}
      <button type="submit" disabled={loading} style={{ background: "linear-gradient(135deg,#00D4FF,#00FFB3)", color: "#0A0F1E", border: "none", borderRadius: 9999, padding: "11px 24px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
        {loading ? "Saving..." : "Save & Continue →"}
      </button>
    </form>
  );
};

// #407c: Elite — 10-field wizard with logo upload
const EliteForm = ({ onSubmit, loading }) => {
  const [form, setForm] = useState({ business_phone: "", business_name: "", booking_link: "", booking_platform: "", services_offered: "", tone_of_voice: "", logo_url: "", primary_color: "#00D4FF", instagram_handle: "", website: "" });
  const [logoUploading, setLogoUploading] = useState(false);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await base44.functions.invoke("uploadClientLogo", { file_name: file.name, file_type: file.type });
      if (res?.url) setForm(f => ({...f, logo_url: res.url}));
    } catch {} finally { setLogoUploading(false); }
  };

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
      <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>Elite Setup (10 fields)</h3>
      {[["business_phone","Business Phone","tel"],["business_name","Business Name","text"],["booking_link","Booking Link","url"],["booking_platform","Booking Platform","text"],["services_offered","Services Offered","text"],["tone_of_voice","Tone of Voice","text"],["instagram_handle","Instagram Handle","text"],["website","Website URL","url"]].map(([key, label, type]) => (
        <div key={key} style={{ marginBottom: 14 }}>
          <label style={{ color: "#9CA3AF", fontSize: 12, display: "block", marginBottom: 4 }}>{label} *</label>
          <input type={type} required={["business_phone","business_name","booking_link"].includes(key)} value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", borderRadius: 8, padding: "9px 12px", fontSize: 14, boxSizing: "border-box" }} />
        </div>
      ))}
      <div style={{ marginBottom: 14 }}>
        <label style={{ color: "#9CA3AF", fontSize: 12, display: "block", marginBottom: 4 }}>Brand Color</label>
        <input type="color" value={form.primary_color} onChange={e => setForm(f => ({...f, primary_color: e.target.value}))} style={{ height: 36, borderRadius: 6, border: "none", cursor: "pointer" }} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ color: "#9CA3AF", fontSize: 12, display: "block", marginBottom: 4 }}>Logo (optional)</label>
        <input type="file" accept="image/*" onChange={handleLogoUpload} />
        {logoUploading && <span style={{ color: "#9CA3AF", fontSize: 12 }}> Uploading...</span>}
        {form.logo_url && <div style={{ color: "#00FFB3", fontSize: 12, marginTop: 4 }}>✅ Logo uploaded</div>}
      </div>
      <button type="submit" disabled={loading} style={{ background: "linear-gradient(135deg,#00D4FF,#00FFB3)", color: "#0A0F1E", border: "none", borderRadius: 9999, padding: "11px 24px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
        {loading ? "Saving..." : "Complete Setup →"}
      </button>
    </form>
  );
};

const FORM_BY_TIER = { starter: StarterForm, growth: GrowthForm, elite: EliteForm };

export default function CredentialsWizard() {
  const { order, loading: orderLoading, error: orderError } = useOrderGuard();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (orderLoading) return <div style={{ color: "#9CA3AF", padding: 40 }}>Verifying order...</div>;
  if (orderError) return <div style={{ color: "#EF4444", padding: 40 }}>{orderError}</div>;
  if (!order) return null;

  const TierForm = FORM_BY_TIER[order.package_key] || StarterForm;

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      await base44.functions.invoke("saveClientCredentials", { ...formData, order_id: order.id, package_key: order.package_key });
      setDone(true);
    } catch (e) {
      alert("Error saving credentials. Please try again.");
    } finally { setSubmitting(false); }
  };

  if (done) return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 48 }}>🚀</div>
      <h3 style={{ color: "#00FFB3", fontSize: 20, fontWeight: 800, margin: "16px 0 8px" }}>Setup complete!</h3>
      <p style={{ color: "#9CA3AF" }}>We're building your system now. You'll hear from us within 24–48 hours.</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "40px 20px" }}>
      <TierForm onSubmit={handleSubmit} loading={submitting} />
    </div>
  );
}
