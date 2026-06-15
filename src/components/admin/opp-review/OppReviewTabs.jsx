import { useState } from "react";
import OppRecordCard from "./OppRecordCard";
import { isImportedRecord, needsVerification } from "@/internal-pages/OpportunityReviewQueue";

const TABS = [
  { key: "priority",   label: "Priority Review" },
  { key: "imported",   label: "Imported Prospects" },
  { key: "verify",     label: "Needs Verification" },
  { key: "duplicates", label: "Duplicate Candidates" },
  { key: "internal",   label: "Internal QA / Proof" },
  { key: "suppressed", label: "Suppressed Records" },
  { key: "missing",    label: "Missing Contact Info" },
];

// Tab notes — display only, no actions
const TAB_NOTES = {
  imported: {
    color: "#7c3aed",
    bg: "rgba(139,92,246,0.07)",
    border: "rgba(139,92,246,0.2)",
    title: "Imported Prospects",
    body: "Imported prospects are not the same as inbound leads. Verify business details and contact permissions before outreach.",
  },
  internal: {
    color: "#d97706",
    bg: "rgba(245,158,11,0.07)",
    border: "rgba(245,158,11,0.2)",
    title: "Internal QA / Proof Records",
    body: "These records are excluded from sales metrics and should not be contacted.",
  },
  suppressed: {
    color: "#dc2626",
    bg: "rgba(220,38,38,0.07)",
    border: "rgba(220,38,38,0.2)",
    title: "Suppressed Records",
    body: "These records are blocked from outreach review unless manually investigated by an admin.",
  },
};

function TabNote({ tabKey }) {
  const note = TAB_NOTES[tabKey];
  if (!note) return null;
  return (
    <div style={{
      background: note.bg,
      border: `1px solid ${note.border}`,
      borderRadius: "12px",
      padding: "12px 16px",
      marginBottom: "16px",
      display: "flex",
      gap: "8px",
    }}>
      <span style={{ fontSize: "13px", fontWeight: "700", color: note.color, whiteSpace: "nowrap" }}>{note.title}:</span>
      <span style={{ fontSize: "13px", color: "rgba(10,22,40,0.65)" }}>{note.body}</span>
    </div>
  );
}

function getTabRecords(key, classified) {
  switch (key) {
    case "priority":
      // High-score/high-intent real records only — explicitly excludes QA, proof, suppressed, DNC
      return (classified.highPriority || []).filter(
        (r) => !r.do_not_contact && r.outreach_status !== "do_not_contact"
      );
    case "imported":
      return classified.imported || [];
    case "verify":
      return (classified.real || []).filter(
        (r) =>
          !(classified.highPriority || []).includes(r) &&
          !(classified.imported || []).includes(r) &&
          needsVerification(r)
      );
    case "duplicates":
      return classified.duplicates || [];
    case "internal":
      return classified.internal || [];
    case "suppressed":
      return classified.suppressed || [];
    case "missing":
      return classified.missingContact || [];
    default:
      return [];
  }
}

export default function OppReviewTabs({ classified }) {
  const [activeTab, setActiveTab] = useState("priority");
  const [search, setSearch] = useState("");

  const rawRecords = getTabRecords(activeTab, classified);
  const records = search.trim()
    ? rawRecords.filter((r) => {
        const q = search.toLowerCase();
        return (
          (r.business_name || "").toLowerCase().includes(q) ||
          (r.full_name || "").toLowerCase().includes(q) ||
          (r.email || "").toLowerCase().includes(q) ||
          (r.industry || r.business_type || "").toLowerCase().includes(q)
        );
      })
    : rawRecords;

  return (
    <div>
      {/* Tab bar */}
      <div style={{
        display: "flex",
        gap: "2px",
        borderBottom: "1px solid rgba(0,174,239,0.12)",
        marginBottom: "20px",
        overflowX: "auto",
        paddingBottom: "0",
      }}>
        {TABS.map((tab) => {
          const count = getTabRecords(tab.key, classified).length;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearch(""); }}
              style={{
                padding: "10px 14px",
                fontSize: "13px",
                fontWeight: active ? "700" : "500",
                color: active ? "#0088CC" : "rgba(10,22,40,0.5)",
                background: "transparent",
                border: "none",
                borderBottom: active ? "2px solid #00AEEF" : "2px solid transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
                marginBottom: "-1px",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {tab.label}
              <span style={{
                fontSize: "11px", fontWeight: "700", padding: "1px 6px", borderRadius: "9999px",
                background: active ? "rgba(0,174,239,0.12)" : "rgba(10,22,40,0.06)",
                color: active ? "#0088CC" : "rgba(10,22,40,0.4)",
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab-specific note */}
      <TabNote tabKey={activeTab} />

      {/* Search/filter row */}
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by name, email, or industry…"
          style={{
            width: "100%", maxWidth: "420px",
            padding: "9px 14px", borderRadius: "9999px",
            border: "1px solid rgba(0,174,239,0.22)",
            fontSize: "13px", color: "#0A1628",
            background: "rgba(255,255,255,0.9)",
            outline: "none",
          }}
        />
      </div>

      {/* Queue list */}
      {records.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 24px",
          border: "1px dashed rgba(0,174,239,0.2)", borderRadius: "14px",
          color: "rgba(10,22,40,0.4)", fontSize: "14px",
        }}>
          {search ? "No records match that filter." : "No records in this category."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {records.map((record) => (
            <OppRecordCard key={record.id} record={record} activeTab={activeTab} />
          ))}
        </div>
      )}
    </div>
  );
}