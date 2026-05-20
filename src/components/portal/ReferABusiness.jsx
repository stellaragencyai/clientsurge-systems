/**
 * ReferABusiness.jsx — #69
 * Client portal "Refer a Business" section with unique referral link.
 */
import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";

export default function ReferABusiness({ order_id, client_name }) {
  const [copied, setCopied] = useState(false);
  const ref_code = btoa(`ref_${order_id}`).slice(0, 12);
  const ref_url = `https://clientsurgesystems.com/?ref=${ref_code}`;

  const copy = () => {
    navigator.clipboard.writeText(ref_url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div style={{ background: "linear-gradient(135deg,rgba(0,212,255,0.06),rgba(0,255,179,0.04))", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 16, padding: "22px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <Share2 style={{ width: 18, height: 18, color: "#00D4FF" }} />
        <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 800, margin: 0 }}>Refer a Business</h3>
      </div>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, margin: "0 0 16px" }}>
        Know another local business that could use AI automation? Share your link — if they sign up, let Nolan know and you'll get a month free.
      </p>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", margin: "0 0 3px" }}>Your referral link</p>
          <p style={{ color: "#00D4FF", fontSize: 12, fontWeight: 600, margin: 0, wordBreak: "break-all" }}>{ref_url}</p>
        </div>
        <button onClick={copy} style={{ background: copied ? "rgba(0,255,179,0.15)" : "rgba(0,212,255,0.1)", border: `1px solid ${copied ? "rgba(0,255,179,0.3)" : "rgba(0,212,255,0.25)"}`, borderRadius: 8, padding: "10px 14px", cursor: "pointer", color: copied ? "#00FFB3" : "#00D4FF", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
          {copied ? <><Check style={{ width: 13, height: 13 }} /> Copied!</> : <><Copy style={{ width: 13, height: 13 }} /> Copy link</>}
        </button>
      </div>
    </div>
  );
}
