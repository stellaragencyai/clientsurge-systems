import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  ListChecks,
  Loader2,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  buildCrmHealthSnapshot,
  buildFirstCampaignDryRun,
  CRM_HEALTH_INDUSTRIES,
  CRM_HEALTH_MAX_FETCH,
} from "@/lib/crmHealth";

const VIEWS = [
  { id: "overview", label: "Overview" },
  { id: "industry", label: "Industry" },
  { id: "suppression", label: "Suppression" },
  { id: "missing", label: "Missing Data" },
  { id: "duplicates", label: "Duplicates" },
  { id: "preview", label: "First Preview" },
  { id: "backfill", label: "Backfill" },
];

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

function HealthCard({ label, value, helper, tone = "default" }) {
  const tones = {
    default: "bg-white text-foreground",
    blue: "bg-blue-50 text-blue-950",
    green: "bg-emerald-50 text-emerald-950",
    amber: "bg-amber-50 text-amber-950",
    red: "bg-red-50 text-red-950",
  };

  return (
    <div className={`rounded-lg border border-border p-4 ${tones[tone] || tones.default}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-2 text-3xl font-bold">{formatNumber(value)}</p>
      {helper ? <p className="mt-2 text-xs opacity-80">{helper}</p> : null}
    </div>
  );
}

function SectionShell({ title, icon: Icon, children, action }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SimpleTable({ columns, rows, empty }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-left font-semibold text-foreground">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length ? rows.map((row, index) => (
              <tr key={row.id || row.key || index}>
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-muted-foreground">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CrmHealthDashboard({ initialLeads = null } = {}) {
  const [leads, setLeads] = useState(initialLeads || []);
  const [loading, setLoading] = useState(!initialLeads);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("overview");
  const [previewIndustry, setPreviewIndustry] = useState("roofing");
  const [previewMaxCount, setPreviewMaxCount] = useState(25);
  const [excludeRecentlyContacted, setExcludeRecentlyContacted] = useState(true);

  const loadLeads = async () => {
    setLoading(true);
    setError("");
    try {
      const records = await base44.entities.Leads.list("-created_date", CRM_HEALTH_MAX_FETCH);
      setLeads(records || []);
    } catch (err) {
      setError(err?.message || "Unable to load CRM health data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialLeads) {
      loadLeads();
    }
  }, []);

  const snapshot = useMemo(() => buildCrmHealthSnapshot(leads, {
    previewIndustry,
    previewMaxCount,
  }), [leads, previewIndustry, previewMaxCount]);

  const preview = useMemo(() => buildFirstCampaignDryRun(leads, {
    industry: previewIndustry,
    maxCount: previewMaxCount,
    excludeRecentlyContacted,
  }), [leads, previewIndustry, previewMaxCount, excludeRecentlyContacted]);

  const suppressionRows = Object.entries(snapshot.suppression_breakdown || {}).map(([key, value]) => ({
    key,
    reason: key.replace(/_/g, " "),
    count: value,
  }));

  const missingRows = Object.entries(snapshot.missing_data || {}).map(([key, value]) => ({
    key,
    metric: key.replace(/_/g, " "),
    count: value,
  }));

  const backfillRows = Object.entries(snapshot.backfill_readiness || {}).map(([key, value]) => ({
    key,
    workstream: key.replace(/_/g, " "),
    count: value,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">CRM / Leads Health</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only Launch Command Center view for lead quality, suppression, dedupe risk, and first-campaign dry runs.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Source: {snapshot.source_of_truth}. Generated {new Date(snapshot.generated_at).toLocaleString()}.
          </p>
        </div>
        <button
          onClick={loadLeads}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Read-only and dry-run only</p>
            <p className="mt-1">
              This module does not send campaigns, update Leads, dedupe records, create recipients, or expose full email/phone values.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {VIEWS.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              activeView === view.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      {activeView === "overview" && (
        <SectionShell title="CRM Health Overview" icon={Database}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <HealthCard label="Total Leads" value={snapshot.summary.total_leads} helper="All fetched Leads records." tone="blue" />
            <HealthCard label="Usable Leads" value={snapshot.summary.usable_leads} helper="Email, not suppressed, and tagged by industry or CRM." tone="green" />
            <HealthCard label="Missing Email" value={snapshot.summary.missing_email} helper="Cannot be used for email outreach." tone="red" />
            <HealthCard label="Missing Website" value={snapshot.summary.missing_website} helper="Needs review before stronger personalization." tone="amber" />
            <HealthCard label="Missing Phone" value={snapshot.summary.missing_phone} helper="Limits SMS/call readiness." />
            <HealthCard label="Suppressed Leads" value={snapshot.summary.suppressed_leads} helper="DNC, unsubscribed, bounced, or terminal." tone="red" />
            <HealthCard label="Duplicate Groups" value={snapshot.summary.duplicate_groups} helper="Dry-run identity collisions only." tone="amber" />
            <HealthCard label="Campaign Eligible" value={snapshot.summary.campaign_eligible_leads} helper="Usable and not recently contacted." tone="green" />
            <HealthCard label="First Preview Eligible" value={preview.final_selected_count} helper={`${previewIndustry}, max ${preview.max_count}.`} tone="blue" />
            <HealthCard label="High-Risk Issues" value={snapshot.summary.high_risk_data_issues} helper="Suppression, missing email, or duplicate review." tone="red" />
          </div>
        </SectionShell>
      )}

      {activeView === "industry" && (
        <SectionShell title="Industry Breakdown" icon={SearchCheck}>
          <SimpleTable
            columns={[
              { key: "industry", label: "Industry" },
              { key: "total", label: "Total", render: (row) => formatNumber(row.total) },
              { key: "usable", label: "Usable", render: (row) => formatNumber(row.usable) },
              { key: "suppressed", label: "Suppressed", render: (row) => formatNumber(row.suppressed) },
              { key: "campaign_eligible", label: "Campaign Eligible", render: (row) => formatNumber(row.campaign_eligible) },
              {
                key: "ready_for_25",
                label: "25-Lead Ready",
                render: (row) => row.ready_for_25 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" /> Yes
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">No</span>
                ),
              },
            ]}
            rows={snapshot.industry_breakdown}
            empty="No industry data available."
          />
        </SectionShell>
      )}

      {activeView === "suppression" && (
        <SectionShell title="Suppression Breakdown" icon={ShieldCheck}>
          <SimpleTable
            columns={[
              { key: "reason", label: "Reason" },
              { key: "count", label: "Count", render: (row) => formatNumber(row.count) },
            ]}
            rows={suppressionRows}
            empty="No suppressed leads found in the fetched sample."
          />
        </SectionShell>
      )}

      {activeView === "missing" && (
        <SectionShell title="Missing Data Breakdown" icon={AlertCircle}>
          <SimpleTable
            columns={[
              { key: "metric", label: "Metric" },
              { key: "count", label: "Count", render: (row) => formatNumber(row.count) },
            ]}
            rows={missingRows}
            empty="No missing-data issues found."
          />
        </SectionShell>
      )}

      {activeView === "duplicates" && (
        <SectionShell title="Duplicate Risk Summary" icon={ListChecks}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <HealthCard label="Email Groups" value={snapshot.duplicate_risk.duplicate_email_groups} />
            <HealthCard label="Phone Groups" value={snapshot.duplicate_risk.duplicate_phone_groups} />
            <HealthCard label="Dedupe-Key Groups" value={snapshot.duplicate_risk.dedupe_key_groups} />
            <HealthCard label="Marked Candidates" value={snapshot.duplicate_risk.explicit_duplicate_candidates} />
          </div>
          <SimpleTable
            columns={[
              { key: "group_key_masked", label: "Masked Group Key" },
              { key: "count", label: "Count", render: (row) => formatNumber(row.count) },
              {
                key: "sample_leads",
                label: "Masked Sample",
                render: (row) => row.sample_leads.map((lead) => lead.email_masked || lead.phone_masked || lead.label).join(", "),
              },
            ]}
            rows={snapshot.duplicate_risk.dry_run_review}
            empty="No duplicate groups found by email, phone, or dedupe key."
          />
        </SectionShell>
      )}

      {activeView === "preview" && (
        <SectionShell
          title="First 25-Lead Campaign Preview"
          icon={SearchCheck}
          action={(
            <div className="flex flex-wrap gap-2">
              <select
                value={previewIndustry}
                onChange={(event) => setPreviewIndustry(event.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                {CRM_HEALTH_INDUSTRIES.map((industry) => (
                  <option key={industry} value={industry}>{industry.replace(/_/g, " ")}</option>
                ))}
              </select>
              <select
                value={previewMaxCount}
                onChange={(event) => setPreviewMaxCount(Number(event.target.value))}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={excludeRecentlyContacted}
                  onChange={(event) => setExcludeRecentlyContacted(event.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                Exclude recent
              </label>
            </div>
          )}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <HealthCard label="Total Matching" value={preview.total_matching} tone="blue" />
            <HealthCard label="Suppressed Excluded" value={preview.suppressed_excluded} tone="red" />
            <HealthCard label="Missing Email Excluded" value={preview.missing_email_excluded} tone="red" />
            <HealthCard label="Missing Website" value={preview.missing_website_count} tone="amber" />
            <HealthCard label="Duplicate Excluded" value={preview.duplicate_excluded_count} tone="amber" />
            <HealthCard label="Final Selected" value={preview.final_selected_count} tone="green" />
          </div>
          <SimpleTable
            columns={[
              { key: "label", label: "Business / Label" },
              { key: "email_masked", label: "Masked Email" },
              { key: "phone_masked", label: "Masked Phone" },
              { key: "industry", label: "Industry" },
              { key: "crm_stage", label: "CRM Stage" },
            ]}
            rows={preview.selected_preview_masked}
            empty="No eligible preview leads for the selected filters."
          />
        </SectionShell>
      )}

      {activeView === "backfill" && (
        <SectionShell title="Backfill Readiness" icon={ListChecks}>
          <SimpleTable
            columns={[
              { key: "workstream", label: "Workstream" },
              { key: "count", label: "Count", render: (row) => formatNumber(row.count) },
            ]}
            rows={backfillRows}
            empty="No backfill gaps found."
          />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-lg border border-border bg-white p-4">
              <h4 className="text-sm font-semibold text-foreground">Prepared Launch Tasks</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {snapshot.launch_command_center.tasks.map((task) => <li key={task}>- {task}</li>)}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-white p-4">
              <h4 className="text-sm font-semibold text-foreground">Prepared Launch Proofs</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {snapshot.launch_command_center.proofs.map((proof) => <li key={proof}>- {proof}</li>)}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Mode: {snapshot.launch_command_center.mode}. No live LaunchTask records are created by this dashboard.
              </p>
            </div>
          </div>
        </SectionShell>
      )}
    </div>
  );
}