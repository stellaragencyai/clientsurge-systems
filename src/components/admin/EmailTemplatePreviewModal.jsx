/**
 * EmailTemplatePreviewModal.jsx — #176
 * AdminSettings: preview email template with sample variable substitution.
 */
import { useState } from "react";
import { Eye } from "lucide-react";

const SAMPLE_VARS = {
  "{{client_name}}": "Maria Rodriguez",
  "{{business_name}}": "Sculpt Med Spa",
  "{{package_key}}": "Growth",
  "{{booking_link}}": "https://vagaro.com/sculptmedspa",
  "{{portal_url}}": "https://clientsurgesystems.com/client-portal?order_id=sample",
  "{{month}}": "May 2026",
  "{{monthly_rate}}": "$997",
  "{{setup_fee}}": "$1,297",
  "{{nolan_email}}": "nolan@clientsurgesystems.com",
};

function substituteVars(template, vars) {
  return Object.entries(vars).reduce((t, [k, v]) => t.replaceAll(k, v), template);
}

export default function EmailTemplatePreviewModal({ template_html, template_name, onClose }) {
  const [customVars, setCustomVars] = useState({});
  const allVars = { ...SAMPLE_VARS, ...customVars };
  const preview = substituteVars(template_html || "<p>No template content.</p>", allVars);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#0D1B2E", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 18, width: "100%", maxWidth: 640, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Eye style={{ width: 15, height: 15, color: "#00D4FF" }} />
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>Preview: {template_name}</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 18 }}>×</button>
        </div>
        {/* Sample var overrides */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["client_name","business_name","package_key"].map(k => (
            <input key={k} placeholder={k.replace(/_/g," ")}
              defaultValue={SAMPLE_VARS[`{{${k}}}`]}
              onChange={e => setCustomVars(v => ({ ...v, [`{{${k}}}`]: e.target.value }))}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 6, padding: "5px 8px", fontSize: 11, width: 140 }} />
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden" }}
            dangerouslySetInnerHTML={{ __html: preview }} />
        </div>
      </div>
    </div>
  );
}
