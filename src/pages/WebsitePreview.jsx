import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  CheckCircle2, Loader2, AlertCircle, ArrowLeft, Edit3,
  Globe, Layers, Palette, Zap, ChevronRight, Send
} from "lucide-react";

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

function PageCard({ page, brand, index }) {
  const [expanded, setExpanded] = useState(index === 0);
  const copy = page.copy || {};
  const primaryColor = brand?.primary_color || "#00AEEF";

  return (
    <div style={{
      borderRadius: "16px",
      border: "1.5px solid rgba(0,136,204,0.15)",
      background: "#fff",
      overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,59,143,0.06)",
    }}>
      {/* Page header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", background: "linear-gradient(135deg, #0a1628, #0d1f40)",
          border: "none", cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: primaryColor, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", fontWeight: 800, color: "#fff",
          }}>
            {index + 1}
          </div>
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#fff" }}>/{page.slug}</p>
            <p style={{ margin: "1px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.55)" }}>{page.title} · {page.sections.length} sections</p>
          </div>
        </div>
        <ChevronRight style={{ width: 16, height: 16, color: "rgba(255,255,255,0.5)", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {expanded && (
        <div style={{ padding: "20px" }}>
          {/* AI Copy preview */}
          {copy.hero_headline && (
            <div style={{
              background: "linear-gradient(135deg, rgba(0,174,239,0.06), rgba(0,59,143,0.04))",
              borderRadius: "12px", padding: "16px 18px", marginBottom: "16px",
              border: "1px solid rgba(0,136,204,0.12)",
            }}>
              <p style={{ fontSize: "10px", fontWeight: 800, color: primaryColor, textTransform: "uppercase", letterSpacing: "0.18em", margin: "0 0 8px" }}>
                AI-Generated Copy
              </p>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0a1628", margin: "0 0 6px", lineHeight: 1.2 }}>
                {copy.hero_headline}
              </h3>
              <p style={{ fontSize: "13px", color: "rgba(10,22,40,0.65)", margin: "0 0 10px", lineHeight: 1.6 }}>
                {copy.hero_subheading}
              </p>
              {copy.proof_points?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                  {copy.proof_points.map((pt, i) => (
                    <span key={i} style={{
                      fontSize: "11px", fontWeight: 600, color: primaryColor,
                      background: `${primaryColor}15`, border: `1px solid ${primaryColor}30`,
                      padding: "3px 10px", borderRadius: "999px",
                    }}>✓ {pt}</span>
                  ))}
                </div>
              )}
              {copy.body_paragraphs?.map((p, i) => (
                <p key={i} style={{ fontSize: "12px", color: "rgba(10,22,40,0.55)", margin: "0 0 6px", lineHeight: 1.6 }}>{p}</p>
              ))}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: `linear-gradient(135deg, ${primaryColor}, #003B8F)`,
                color: "#fff", fontWeight: 700, fontSize: "11px",
                padding: "7px 16px", borderRadius: "999px", marginTop: "4px",
              }}>
                {copy.cta_text}
              </div>
            </div>
          )}

          {/* Sections list */}
          <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(10,22,40,0.4)", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 8px" }}>
            Page Sections
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {page.sections.map((s, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "8px 12px", borderRadius: "8px",
                background: "rgba(0,136,204,0.04)", border: "1px solid rgba(0,136,204,0.08)",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: primaryColor, flexShrink: 0 }} />
                <span style={{ fontSize: "12px", fontWeight: 500, color: "rgba(10,22,40,0.7)" }}>
                  {SECTION_LABELS[s] || s.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BrandCard({ brand }) {
  return (
    <div style={{
      borderRadius: "16px", border: "1.5px solid rgba(0,136,204,0.15)",
      background: "#fff", padding: "20px",
      boxShadow: "0 2px 12px rgba(0,59,143,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <Palette style={{ width: 16, height: 16, color: "#0088CC" }} />
        <p style={{ fontSize: "12px", fontWeight: 700, color: "#0a1628", margin: 0 }}>Brand Assets</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "rgba(10,22,40,0.5)" }}>Business Name</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#0a1628" }}>{brand.business_name || "—"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "rgba(10,22,40,0.5)" }}>Industry</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#0a1628", textTransform: "capitalize" }}>{brand.industry?.replace(/_/g, " ") || "—"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "rgba(10,22,40,0.5)" }}>Tone</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#0a1628", textTransform: "capitalize" }}>{brand.tone_of_voice || "Professional"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "rgba(10,22,40,0.5)" }}>Colors</span>
          <div style={{ display: "flex", gap: "6px" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: brand.primary_color || "#00AEEF", border: "2px solid rgba(0,0,0,0.1)" }} title={brand.primary_color} />
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: brand.secondary_color || "#003B8F", border: "2px solid rgba(0,0,0,0.1)" }} title={brand.secondary_color} />
          </div>
        </div>
        {brand.logo_url && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "rgba(10,22,40,0.5)" }}>Logo</span>
            <img src={brand.logo_url} alt="logo" style={{ height: 28, objectFit: "contain", borderRadius: 4 }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function WebsitePreview() {
  const { specId } = useParams();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const specIdFinal = specId || urlParams.get("spec_id");

  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [submittingRevision, setSubmittingRevision] = useState(false);
  const [revisionSubmitted, setRevisionSubmitted] = useState(false);

  useEffect(() => {
    if (!specIdFinal) {
      setError("No website spec ID provided.");
      setLoading(false);
      return;
    }
    loadSpec();
  }, [specIdFinal]);

  const loadSpec = async () => {
    try {
      const results = await base44.entities.WebsiteSpec.filter({ id: specIdFinal });
      if (results?.length > 0) {
        setSpec(results[0]);
        if (results[0].status === "approved") setApproved(true);
        if (results[0].revision_requested) setRevisionSubmitted(true);
      } else {
        setError("Website spec not found.");
      }
    } catch {
      setError("Unable to load your website preview.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      await base44.entities.WebsiteSpec.update(specIdFinal, {
        status: "approved",
        approved_at: new Date().toISOString(),
      });
      setApproved(true);
    } catch {
      alert("Failed to approve. Please try again.");
    } finally {
      setApproving(false);
    }
  };

  const handleRevisionSubmit = async () => {
    if (!revisionNotes.trim()) return;
    setSubmittingRevision(true);
    try {
      await base44.entities.WebsiteSpec.update(specIdFinal, {
        revision_requested: true,
        revision_notes: revisionNotes.trim(),
      });
      setRevisionSubmitted(true);
      setShowRevisionForm(false);
    } catch {
      alert("Failed to submit revision request. Please try again.");
    } finally {
      setSubmittingRevision(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f7fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 style={{ width: 32, height: 32, color: "#0088CC", animation: "spin 1s linear infinite", marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: "rgba(10,22,40,0.55)", margin: 0 }}>Loading your website preview…</p>
        </div>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f7fc", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <AlertCircle style={{ width: 32, height: 32, color: "#ef4444", marginBottom: 12 }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0a1628", margin: "0 0 8px" }}>Preview Not Found</h1>
          <p style={{ fontSize: 14, color: "rgba(10,22,40,0.55)", margin: "0 0 20px" }}>{error}</p>
          <button onClick={() => navigate(-1)} style={{ padding: "10px 24px", borderRadius: "9999px", border: "1.5px solid rgba(0,136,204,0.3)", background: "rgba(0,136,204,0.06)", color: "#0088CC", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Go Back
          </button>
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

      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "linear-gradient(135deg, #0a1628, #0d1f40)",
        borderBottom: "1px solid rgba(0,174,239,0.2)",
        padding: "12px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: "4px", fontSize: 13 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> Back
          </button>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Globe style={{ width: 14, height: 14, color: primaryColor }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
              {brand.business_name || "Website Preview"}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em",
              background: `${primaryColor}25`, border: `1px solid ${primaryColor}50`,
              color: primaryColor, padding: "2px 8px", borderRadius: "999px",
            }}>
              {tier} · {pages.length} {pages.length === 1 ? "page" : "pages"}
            </span>
          </div>
        </div>

        {spec?.ai_generated && (
          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            <Zap style={{ width: 12, height: 12, color: "#f59e0b" }} />
            AI-generated copy
          </div>
        )}
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 80px" }}>

        {/* Status banners */}
        {approved && (
          <div style={{
            display: "flex", alignItems: "center", gap: "12px",
            background: "rgba(16,185,129,0.08)", border: "1.5px solid rgba(16,185,129,0.25)",
            borderRadius: "14px", padding: "14px 18px", marginBottom: "24px",
          }}>
            <CheckCircle2 style={{ width: 20, height: 20, color: "#10b981", flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#065f46" }}>Website Approved!</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(6,95,70,0.7)" }}>
                Our team has been notified and will begin building your website. You'll receive an email when it's live.
              </p>
            </div>
          </div>
        )}

        {revisionSubmitted && !approved && (
          <div style={{
            display: "flex", alignItems: "center", gap: "12px",
            background: "rgba(245,158,11,0.08)", border: "1.5px solid rgba(245,158,11,0.25)",
            borderRadius: "14px", padding: "14px 18px", marginBottom: "24px",
          }}>
            <Edit3 style={{ width: 20, height: 20, color: "#f59e0b", flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#92400e" }}>Revision Request Submitted</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(146,64,14,0.7)" }}>
                Our team will review your notes and update the spec within 24 hours.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: primaryColor, textTransform: "uppercase", letterSpacing: "0.2em", margin: "0 0 6px" }}>
            Website Specification Preview
          </p>
          <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 800, color: "#0a1628", margin: "0 0 8px", lineHeight: 1.15, fontFamily: "Montserrat, sans-serif" }}>
            Your {tier.charAt(0).toUpperCase() + tier.slice(1)} Website
          </h1>
          <p style={{ fontSize: 14, color: "rgba(10,22,40,0.55)", margin: 0, lineHeight: 1.6, maxWidth: 560 }}>
            Review the AI-generated page structure and copy below. When you're happy, click <strong>Approve</strong> and our team will begin building. Or request revisions if you'd like changes.
          </p>
        </div>

        {/* 2-col layout on desktop */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "20px", alignItems: "start" }}>

          {/* Left — pages */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <Layers style={{ width: 15, height: 15, color: "#0088CC" }} />
              <p style={{ fontSize: 12, fontWeight: 700, color: "#0a1628", margin: 0 }}>
                {pages.length} Page{pages.length !== 1 ? "s" : ""} Included
              </p>
            </div>
            {pages.map((page, i) => (
              <PageCard key={page.slug} page={page} brand={brand} index={i} />
            ))}
          </div>

          {/* Right — sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "sticky", top: "72px" }}>
            <BrandCard brand={{ ...brand, industry: spec?.industry }} />

            {/* Action card */}
            {!approved && !revisionSubmitted && (
              <div style={{
                borderRadius: "16px", border: "1.5px solid rgba(0,136,204,0.18)",
                background: "#fff", padding: "20px",
                boxShadow: "0 2px 12px rgba(0,59,143,0.06)",
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0a1628", margin: "0 0 6px" }}>Ready to proceed?</p>
                <p style={{ fontSize: 12, color: "rgba(10,22,40,0.5)", margin: "0 0 16px", lineHeight: 1.6 }}>
                  Approving locks in this spec and notifies our team to start building.
                </p>

                <button
                  onClick={handleApprove}
                  disabled={approving}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    padding: "12px", borderRadius: "10px", border: "none", cursor: approving ? "wait" : "pointer",
                    background: `linear-gradient(135deg, ${primaryColor}, #003B8F)`,
                    color: "#fff", fontWeight: 700, fontSize: 13,
                    boxShadow: "0 4px 16px rgba(0,136,204,0.35)", marginBottom: "10px",
                    opacity: approving ? 0.7 : 1,
                  }}
                >
                  {approving ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <CheckCircle2 style={{ width: 14, height: 14 }} />}
                  {approving ? "Approving…" : "Approve This Spec"}
                </button>

                <button
                  onClick={() => setShowRevisionForm(!showRevisionForm)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    padding: "10px", borderRadius: "10px",
                    border: "1.5px solid rgba(0,136,204,0.2)", background: "rgba(0,136,204,0.05)",
                    color: "#0088CC", fontWeight: 600, fontSize: 13, cursor: "pointer",
                  }}
                >
                  <Edit3 style={{ width: 13, height: 13 }} />
                  Request Revisions
                </button>
              </div>
            )}

            {/* Revision form */}
            {showRevisionForm && !revisionSubmitted && !approved && (
              <div style={{
                borderRadius: "16px", border: "1.5px solid rgba(245,158,11,0.25)",
                background: "rgba(245,158,11,0.04)", padding: "18px",
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#92400e", margin: "0 0 4px" }}>What would you like changed?</p>
                <p style={{ fontSize: 11, color: "rgba(146,64,14,0.65)", margin: "0 0 12px" }}>
                  Describe any copy, structure, or brand changes needed.
                </p>
                <textarea
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="e.g. Change the hero headline to focus on emergency service. Add a section about our 10-year warranty."
                  rows={4}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: "10px",
                    border: "1.5px solid rgba(245,158,11,0.3)", background: "#fff",
                    fontSize: 12, color: "#0a1628", resize: "vertical",
                    fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={handleRevisionSubmit}
                  disabled={!revisionNotes.trim() || submittingRevision}
                  style={{
                    width: "100%", marginTop: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                    padding: "10px", borderRadius: "10px", border: "none", cursor: !revisionNotes.trim() ? "not-allowed" : "pointer",
                    background: revisionNotes.trim() ? "#f59e0b" : "rgba(0,0,0,0.08)",
                    color: revisionNotes.trim() ? "#fff" : "rgba(0,0,0,0.35)",
                    fontWeight: 700, fontSize: 13, opacity: submittingRevision ? 0.7 : 1,
                  }}
                >
                  {submittingRevision ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : <Send style={{ width: 13, height: 13 }} />}
                  {submittingRevision ? "Submitting…" : "Submit Revision Request"}
                </button>
              </div>
            )}

            {/* Status chip */}
            <div style={{
              borderRadius: "12px", padding: "12px 16px",
              background: approved ? "rgba(16,185,129,0.08)" : revisionSubmitted ? "rgba(245,158,11,0.08)" : "rgba(0,136,204,0.06)",
              border: `1px solid ${approved ? "rgba(16,185,129,0.2)" : revisionSubmitted ? "rgba(245,158,11,0.2)" : "rgba(0,136,204,0.15)"}`,
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 2px", color: approved ? "#065f46" : revisionSubmitted ? "#92400e" : "#0088CC" }}>
                Status
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0a1628", margin: 0, textTransform: "capitalize" }}>
                {approved ? "✅ Approved" : revisionSubmitted ? "🔄 Revision Requested" : "👀 Pending Review"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 280px"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="position: sticky"] {
            position: relative !important;
            top: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}