import React from "react";

export default function DeploymentReleaseProofPanel({ evidence = {} }) {
  const items = [
    ["GitHub Repository", evidence.repository || "Not verified"],
    ["Branch", evidence.branch || "Not verified"],
    ["Commit", evidence.commit || "Not verified"],
    ["PR Status", evidence.pr_status || "Not verified"],
    ["Checks", evidence.checks || "Not verified"],
    ["Base44 Sync", evidence.base44_sync || "Not verified"],
    ["Last Checked", evidence.checked_at || "Not verified"],
  ];

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-bold text-gray-900">Deployment & Release Proof</h3>
      <p className="mt-1 text-xs text-gray-500">Evidence-backed release state only. Missing evidence remains unverified.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
            <p className="mt-1 text-xs font-semibold text-gray-800">{String(value)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
