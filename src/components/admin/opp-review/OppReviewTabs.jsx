import { useState } from "react";
import OppRecordCard from "./OppRecordCard";

const TABS = [
  { key: "priority", label: "Priority Review" },
  { key: "imported", label: "Imported Prospects" },
  { key: "verify", label: "Needs Verification" },
  { key: "duplicates", label: "Duplicate Candidates" },
  { key: "internal", label: "Internal QA / Proof" },
  { key: "suppressed", label: "Suppressed Records" },
  { key: "missing", label: "Missing Contact Info" },
];

function getTabRecords(key, classified) {
  switch (key) {
    case "priority": return classified.highPriority;
    case "imported": return classified.imported;
    case "verify": return classified.real.filter(
      (r) => !classified.highPriority.includes(r) && !classified.imported.includes(r)
    );
    case "duplicates": return classified.duplicates;
    case "internal": return classified.internal;
    case "suppressed": return classified.suppressed;
    case "missing": return classified.missingContact;
    default: return [];
  }
}

export default function OppReviewTabs({ classified }) {
  const [activeTab, setActiveTab] = useState("priority");

  const records = getTabRecords(activeTab, classified);

  return (
    <div>
      {/* Tab bar */}
      <div style={{
        display: "flex",
        gap: "4px",
        borderBottom: "1px solid rgba(0,174,239,0.12)",
        marginBottom: "24px",
        overflowX: "auto",
        paddingBottom: "0",
      }}>
        {TABS.map((tab) => {
          const count = getTabRecords(tab.key, classified).length;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "10px 16px",
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
                fontSize: "11px",
                fontWeight: "700",
                padding: "1px 6px",
                borderRadius: "9999px",
                background: active ? "rgba(0,174,239,0.12)" : "rgba(10,22,40,0.06)",
                color: active ? "#0088CC" : "rgba(10,22,40,0.4)",
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Records */}
      {records.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 24px",
          border: "1px dashed rgba(0,174,239,0.2)", borderRadius: "14px",
          color: "rgba(10,22,40,0.4)", fontSize: "14px",
        }}>
          No records in this category.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {records.map((record) => (
            <OppRecordCard key={record.id} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}