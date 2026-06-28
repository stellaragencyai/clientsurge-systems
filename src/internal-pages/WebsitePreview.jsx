import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Loader2, AlertCircle, ArrowLeft, Edit3, Globe, Palette, Send } from "lucide-react";

const SECTION_LABELS = {
  hero: "Hero Section",
  hero_video: "Hero + Video",
  services_overview: "Services Overview",
  services_detail: "Services Detail",
  lead_capture_form: "Lead Capture Form",
  social_proof: "Testimonials & Social Proof",
  cta_banner: "CTA Banner",
  pricing_snapshot: "Pricing Preview",
  pricing_full: "Full Pricing Page",
  faq: "FAQ Section",
  map_embed: "Map & Location",
  calendly_embed: "Online Booking",
  before_after: "Before / After Results",
  founder_story: "Founder Story",
  mission: "Our Mission",
  interactive_journey: "Interactive Journey",
  portal_login: "Client Portal Login",
  footer: "Footer",
};

function getPreviewToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token") || params.get("preview_token") || params.get("access_token") || "";
}

function PageCard({ page, brand, index }) {
  const copy = page.copy || {};
  const primaryColor = brand?.primary_color || "#00AEEF";
  return (
    <div style={{ borderRadius: 16, border: "1.5px solid rgba(0,136,204,0.15)", background: "#fff", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,59,143,0.06)" }}>
      <div style={{ padding: "16px 20px", background: "linear-gradient(135deg, #0a1628, #0d1f40)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: primaryColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>{index + 1}</div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#fff" }}>/{page.slug}</p>
          <p style={{ margin: "1px 0 0", fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{page.title} · {(page.sections || []).length} sections</p>
        </div>
      </div>
      <div style={{ padding: 20 }}>
        {copy.hero_headline && (
          <div style={{ background: "linear-gradient(135deg, rgba(0,174,239,0.06), rgba(0,59,143,0.04))", borderRadius: 12, padding: "16px 18px", marginBottom: 16, border: "1px solid rgba(0,136,204,0.12)" }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: primaryColor, textTransform: "uppercase", letterSpacing: "0.18em", margin: "0 0 8px" }}>AI-Generated Copy</p>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0a1628", margin: "0 0 6px", lineHeight: 1.2 }}>{copy.hero_headline}</h3>
            {copy.hero_subheading && <p style={{ fontSize: 13, color: "rgba(10,22,40,0.65)", margin: "0 0 10px", lineHeight: 1.6 }}>{copy.hero_subheading}</p>}
            {copy.proof_points?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {copy.proof_points.map((pt, i) => <span key={i} style={{ fontSize: 11, fontWeight: 600, color: primaryColor, background: `${primaryColor}15`, border: `1px solid ${primaryColor}30`, padding: "3px 10px", borderRadius: 999 }}>✓ {pt}</span>)}
              </div>
            )}
            {copy.body_paragraphs?.map((p, i) => <p key={i} style={{ fontSize: 12, color: "rgba(10,22,40,0.55)", margin: "0 0 6px", lineHeight: 1.6 }}>{p}</p>)}
            {copy.cta_text && <div style={{ display: "inline-flex", background: `linear-gradient(135deg, ${primaryColor}, #003B8F)`, color: "#fff", fontWeight: 700, fontSize: 11, padding: "7px 16px", borderRadius: 999, marginTop: 4 }}>{copy.cta_text}</div>}
          </div>
        )}
        <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(10,22,40,0.4)", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 8px" }}>Page Sections</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {(page.sections || []).map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(0,136,204,0.04)", border: "1px solid rgba(0,136,204,0.08)" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: primaryColor, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(10,22,40,0.7)" }}>{SECTION_LABELS[s] || String(s).replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BrandCard({ brand, industry }) {
  return (
    <div style={{ borderRadius: 16, border: "1.5px solid rgba(0,136,204,0.15)", background: "#fff", padding: 20, boxShadow: "0 2px 12px rgba(0,59,143,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Palette style={{ width: 16, height: 16, color: "#0088CC" }} />
        <p style={{ fontSize: 12, fontWeight: 700, color: "#0a1628", margin: 0 }}>Brand Assets</p>
      </div>
      {[
        ["Business Name", brand.business_name || "—"],
        ["Industry", String(industry || "—").replace(/_/g, " ")],
        ["Tone", brand.tone_of_voice || "Professional"],
      ].map(([label, value]) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 16 }}>
          <span style={{ fontSize: 12, color: "rgba(10,22,40,0.5)" }}>{label}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#0a1628", textTransform: "capitalize", textAlign: "right" }}>{value}</span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "rgba(10,22,40,0.5)" }}>Colors</span>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: brand.primary_color || "#00AEEF", border: "2px solid rgba(0,0,0,0.1)" }} />
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: brand.secondary_color || "#003B8F", border: "2px solid rgba(0,0,0,0.1)" }} />
        </div>
      </div>
    </div>
  );
}

export default function WebsitePreview() {
  const { specId } = useParams();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const specIdFinal = specId || urlParams.get("spec_id");
  const previewToken = getPreviewToken();

  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(false);
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [submittingRevision, setSubmittingRevision] = useState(false);

  const approved = spec?.status === "approved";
  const revisionSubmitted = Boolean(spec?.revision_requested);

  useEffect(() => {
    if (!specIdFinal) {
      setError("No website spec ID provided.");
      setLoading(false);
      return;
    }
    loadSpec();
  }, [specIdFinal, previewToken]);

  const loadSpec = async () => {
    try {
      const response = await base44.functions.invoke("getWebsiteSpecPreview", {
        spec_id: specIdFinal,
        preview_token: previewToken || undefined,
      });
      const nextSpec = response?.data?.spec || response?.spec;
      if (nextSpec) setSpec(nextSpec);
      else setError("Website spec not found or access was denied.");
    } catch {
      setError("Unable to load your website preview. Sign in or use the secure preview link from your email.");
    } finally {
      setLoading(false);
    }
  };

  const updateReview = async (action, notes = "") => {
    const response = await base44.functions.invoke("updateWebsiteSpecReview", {
      spec_id: specIdFinal,
      action,
      revision_notes: notes,
      preview_token: previewToken || undefined,
    });
    const nextSpec = response?.data?.spec || response?.spec;
    if (nextSpec) setSpec(nextSpec);
    return nextSpec;
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      await updateReview("approve");
    } catch {
      alert("Failed to approve. Please sign in or use the secure preview link from your email.");
    } finally {
      setApproving(false);
    }
  };

  const handleRevisionSubmit = async () => {
    if (!revisionNotes.trim()) return;
    setSubmittingRevision(true);
    try {
      await updateReview("request_revision", revisionNotes.trim());
      setShowRevisionForm(false);
    } catch {
      alert("Failed to submit revision request. Please sign in or use the secure preview link from your email.");
    } finally {
      setSubmittingRevision(false);
    }
  };

  if (loading) {
    return <div style={{ minHeight: "100vh", background: "#f5f7fc", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ textAlign: "center" }}><Loader2 style={{ width: 32, height: 32, color: "#0088CC", animation: "spin 1s linear infinite", marginBottom: 12 }} /><p style={{ fontSize: 14, color: "rgba(10,22,40,0.55)", margin: 0 }}>Loading your website preview…</p><style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style></div></div>;
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f7fc", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <AlertCircle style={{ width: 32, height: 32, color: "#ef4444", marginBottom: 12 }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0a1628", margin: "0 0 8px" }}>Preview Not Available</h1>
          <p style={{ fontSize: 14, color: "rgba(10,22,40,0.55)", margin: "0 0 20px" }}>{error}</p>
          <button onClick={() => navigate("/login")} style={{ padding: "10px 24px", borderRadius: 999, border: "1.5px solid rgba(0,136,204,0.3)", background: "rgba(0,136,204,0.06)", color: "#0088CC", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Sign In</button>
        </div>
      </div>
    );
  }

  const brand = spec?.brand || {};
  const pages = spec?.pages || [];
  const primaryColor = brand.primary_color || "#00AEEF";
  const tier = spec?.package_key || "starter";

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fc", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "linear-gradient(135deg, #0a1628, #0d1f40)", borderBottom: "1px solid rgba(0,174,239,0.2)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}><ArrowLeft style={{ width: 14, height: 14 }} /> Back</button>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)" }} />
          <Globe style={{ width: 14, height: 14, color: primaryColor }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{brand.business_name || "Website Preview"}</span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", background: `${primaryColor}25`, border: `1px solid ${primaryColor}50`, color: primaryColor, padding: "2px 8px", borderRadius: 999 }}>{tier} · {pages.length} {pages.length === 1 ? "page" : "pages"}</span>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "32px 20px 80px" }}>
        {approved && <StatusBanner type="approved" />}
        {revisionSubmitted && !approved && <StatusBanner type="revision" />}

        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: primaryColor, textTransform: "uppercase", letterSpacing: "0.2em", margin: "0 0 6px" }}>Website Specification Preview</p>
          <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 800, color: "#0a1628", margin: "0 0 8px", lineHeight: 1.15 }}>Your {tier.charAt(0).toUpperCase() + tier.slice(1)} Website</h1>
          <p style={{ fontSize: 14, color: "rgba(10,22,40,0.55)", margin: 0, lineHeight: 1.6, maxWidth: 620 }}>Review the page structure and copy below. Approval and revision requests are sent through a guarded backend function tied to your account or secure preview token.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 280px", gap: 20, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {pages.map((page, i) => <PageCard key={page.slug || i} page={page} brand={brand} index={i} />)}
            {pages.length === 0 && <div style={{ borderRadius: 16, background: "#fff", padding: 24, color: "rgba(10,22,40,0.55)" }}>No pages found in this website spec.</div>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 72 }}>
            <BrandCard brand={brand} industry={spec?.industry} />
            {!approved && !revisionSubmitted && (
              <div style={{ borderRadius: 16, border: "1.5px solid rgba(0,136,204,0.18)", background: "#fff", padding: 20, boxShadow: "0 2px 12px rgba(0,59,143,0.06)" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0a1628", margin: "0 0 6px" }}>Ready to proceed?</p>
                <p style={{ fontSize: 12, color: "rgba(10,22,40,0.5)", margin: "0 0 16px", lineHeight: 1.6 }}>Approving locks in this spec and notifies our team to start building.</p>
                <button onClick={handleApprove} disabled={approving} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderRadius: 10, border: "none", cursor: approving ? "wait" : "pointer", background: `linear-gradient(135deg, ${primaryColor}, #003B8F)`, color: "#fff", fontWeight: 700, fontSize: 13, boxShadow: "0 4px 16px rgba(0,136,204,0.35)", marginBottom: 10, opacity: approving ? 0.7 : 1 }}>{approving ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <CheckCircle2 style={{ width: 14, height: 14 }} />}{approving ? "Approving…" : "Approve This Spec"}</button>
                <button onClick={() => setShowRevisionForm(!showRevisionForm)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 10, borderRadius: 10, border: "1.5px solid rgba(0,136,204,0.2)", background: "rgba(0,136,204,0.05)", color: "#0088CC", fontWeight: 600, fontSize: 13, cursor: "pointer" }}><Edit3 style={{ width: 13, height: 13 }} />Request Revisions</button>
              </div>
            )}
            {showRevisionForm && !revisionSubmitted && !approved && (
              <div style={{ borderRadius: 16, border: "1.5px solid rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.04)", padding: 18 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#92400e", margin: "0 0 4px" }}>What would you like changed?</p>
                <textarea value={revisionNotes} onChange={(e) => setRevisionNotes(e.target.value)} placeholder="Describe any copy, structure, or brand changes needed." rows={4} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid rgba(245,158,11,0.3)", background: "#fff", fontSize: 12, color: "#0a1628", resize: "vertical", boxSizing: "border-box" }} />
                <button onClick={handleRevisionSubmit} disabled={!revisionNotes.trim() || submittingRevision} style={{ width: "100%", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: 10, borderRadius: 10, border: "none", cursor: !revisionNotes.trim() ? "not-allowed" : "pointer", background: revisionNotes.trim() ? "#f59e0b" : "rgba(0,0,0,0.08)", color: revisionNotes.trim() ? "#fff" : "rgba(0,0,0,0.35)", fontWeight: 700, fontSize: 13, opacity: submittingRevision ? 0.7 : 1 }}>{submittingRevision ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : <Send style={{ width: 13, height: 13 }} />}{submittingRevision ? "Submitting…" : "Submit Revision Request"}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBanner({ type }) {
  const approved = type === "approved";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: approved ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)", border: `1.5px solid ${approved ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`, borderRadius: 14, padding: "14px 18px", marginBottom: 24 }}>
      {approved ? <CheckCircle2 style={{ width: 20, height: 20, color: "#10b981", flexShrink: 0 }} /> : <Edit3 style={{ width: 20, height: 20, color: "#f59e0b", flexShrink: 0 }} />}
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: approved ? "#065f46" : "#92400e" }}>{approved ? "Website Approved" : "Revision Request Submitted"}</p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: approved ? "rgba(6,95,70,0.7)" : "rgba(146,64,14,0.7)" }}>{approved ? "Our team has been notified and will begin building." : "Our team will review your notes and update the spec."}</p>
      </div>
    </div>
  );
}
