import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  Download,
  Flame,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  Upload,
  Users,
  SlidersHorizontal,
  Gauge,
} from "lucide-react";
import {
  executeLeadImport,
  fetchLeadPipelineSummary,
  getLeadPipelineError,
  previewLeadImport,
  triggerLeadScoring,
} from "@/lib/leadPipelineApi";
import LeadCRMDrawer from "./LeadCRMDrawer";
import LeadScoreBadge from "./LeadScoreBadge";

const intakeTypeLabels = {
  lead_capture: "Lead Capture",
  contact_inquiry: "Contact Inquiry",
  demo_booking: "Demo Booking",
  legacy: "Legacy / Unlabeled",
};

const stageGroupLabels = {
  new: "New",
  working: "Working",
  qualified: "Qualified",
  booked: "Booked",
  closed: "Closed",
};

const segmentLabels = {
  reactivation: "Reactivation Ready",
  nurture: "Nurture Ready",
  qualification: "Qualification Priority",
  follow_up: "Follow-Up Due",
  high_value_outreach: "High-Value Outreach",
  demo_requested: "Demo Requested",
  awaiting_close: "Awaiting Close",
};

function formatDate(value) {
  if (!value) {
    return "Not tracked";
  }
  return new Date(value).toLocaleString();
}

function getStatusColor(status) {
  const colors = {
    New: "bg-blue-100 text-blue-800",
    Contacted: "bg-purple-100 text-purple-800",
    Replied: "bg-indigo-100 text-indigo-800",
    Qualified: "bg-green-100 text-green-800",
    "Booking Prompt Sent": "bg-amber-100 text-amber-800",
    Booked: "bg-emerald-100 text-emerald-800",
    Closed: "bg-gray-100 text-gray-800",
  };

  return colors[status] || "bg-gray-100 text-gray-800";
}

function formatOfferLabel(offer) {
  if (!offer) {
    return "No suggestion";
  }

  if (offer.package_name) {
    return `${offer.package_name} -> ${offer.primary_service_name}`;
  }

  return offer.primary_service_name || "Suggested Service";
}

function renderActionabilityChips(lead) {
  if (!(lead.actionability || []).length) {
    return <span className="text-xs text-muted-foreground">No active activation segment</span>;
  }

  return lead.actionability.map((segment) => (
    <span
      key={`${lead.id}-${segment}`}
      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
    >
      {segmentLabels[segment] || segment}
    </span>
  ));
}

function parseImportRows(rawValue) {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return [];
  }

  const parsed = JSON.parse(trimmed);
  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (Array.isArray(parsed?.rows)) {
    return parsed.rows;
  }

  if (Array.isArray(parsed?.leads)) {
    return parsed.leads;
  }

  throw new Error("Paste a JSON array of lead objects or an object with rows/leads.");
}

function SummaryCard({ label, value, helper = null, tone = "default" }) {
  const tones = {
    default: "bg-white text-foreground",
    blue: "bg-blue-50 text-blue-900",
    green: "bg-green-50 text-green-900",
    amber: "bg-amber-50 text-amber-900",
    purple: "bg-purple-50 text-purple-900",
    emerald: "bg-emerald-50 text-emerald-900",
  };

  return (
    <div className={`rounded-xl border border-border p-4 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {helper ? <p className="mt-2 text-xs opacity-80">{helper}</p> : null}
    </div>
  );
}

export default function LeadManagementDashboard() {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState({
    generated_at: null,
    summary: {
      total_leads: 0,
      filtered_leads: 0,
      actionable_leads: 0,
      status_counts: {},
      stage_counts: {},
      source_counts: {},
      intake_counts: {},
      segment_counts: {},
      recommended_offer_counts: {},
      recent_imports: [],
      recent_lead_activity: [],
      priority_queue: [],
      activation_segments: [],
      last7Days: [],
    },
    leads: [],
    pagination: {
      limit: 100,
      offset: 0,
      returned: 0,
      total_filtered: 0,
      has_more: false,
    },
    filter_options: {
      statuses: [],
      stage_groups: [],
      intake_types: [],
      segments: [],
      sources: [],
    },
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    source: "all",
    intake_type: "all",
    stage_group: "all",
    segment: "all",
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [error, setError] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [drawerLead, setDrawerLead] = useState(null);
  const [importSource, setImportSource] = useState("manual_import");
  const [importRaw, setImportRaw] = useState("");
  const [importPreview, setImportPreview] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");

  const loadSnapshot = async ({ append = false, nextOffset = 0, activeFilters = filters } = {}) => {
    const setLoadingState = append ? setLoadingMore : setLoading;

    try {
      setLoadingState(true);
      setError("");
      const response = await fetchLeadPipelineSummary({
        ...activeFilters,
        limit: 100,
        offset: nextOffset,
      });

      setSnapshot((current) => ({
        ...response,
        leads: append ? [...current.leads, ...(response.leads || [])] : response.leads || [],
      }));
    } catch (err) {
      setError(getLeadPipelineError(err, "Unable to load leads right now."));
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSnapshot({ append: false, nextOffset: 0 });
    }, 250);

    return () => clearTimeout(timer);
  }, [filters.search, filters.status, filters.source, filters.intake_type, filters.stage_group, filters.segment]);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleRunScoring = async () => {
    setScoringLoading(true);
    try {
      await triggerLeadScoring();
      await loadSnapshot({ append: false, nextOffset: 0 });
    } catch (err) {
      setError(getLeadPipelineError(err, "Failed to run lead scoring."));
    } finally {
      setScoringLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!snapshot.pagination?.has_more || loadingMore) {
      return;
    }

    loadSnapshot({
      append: true,
      nextOffset: snapshot.pagination.offset + snapshot.pagination.returned,
    });
  };

  const handlePreviewImport = async () => {
    try {
      setImportLoading(true);
      setImportError("");
      setImportSuccess("");
      const rows = parseImportRows(importRaw);
      const preview = await previewLeadImport({
        rows,
        import_source: importSource,
      });
      setImportPreview(preview);
    } catch (err) {
      setImportError(getLeadPipelineError(err, "Unable to preview lead import."));
      setImportPreview(null);
    } finally {
      setImportLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    try {
      setImportLoading(true);
      setImportError("");
      const rows = parseImportRows(importRaw);
      const result = await executeLeadImport({
        rows,
        import_source: importSource,
      });

      setImportSuccess(
        `Imported batch ${result.import_batch_id}. Created ${result.counts.creates}, updated ${result.counts.updates}, skipped ${result.counts.skipped}.`
      );
      setImportPreview(null);
      setImportRaw("");
      await loadSnapshot({ append: false, nextOffset: 0 });
    } catch (err) {
      setImportError(getLeadPipelineError(err, "Unable to import leads."));
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      setImportRaw(text);
      setImportError("");
      setImportSuccess("");
    } catch {
      setImportError("Unable to read the selected JSON file.");
    } finally {
      event.target.value = "";
    }
  };

  const sourceOptions = useMemo(() => snapshot.filter_options?.sources || [], [snapshot.filter_options]);
  const leads = snapshot.leads || [];
  const activationQueue = snapshot.summary.priority_queue || [];
  const activationSegments = snapshot.summary.activation_segments || [];
  const offerMix = snapshot.summary.recommended_offer_counts || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Customer Leads</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Canonical paid-customer CRM pipeline for import, dedupe, segmentation, and daily operator follow-up.
          </p>
          {snapshot.generated_at ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Snapshot generated {new Date(snapshot.generated_at).toLocaleString()}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => loadSnapshot({ append: false, nextOffset: 0 })}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleRunScoring}
            disabled={scoringLoading || loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            title="Recalculate lead scores now (runs automatically every hour)"
          >
            {scoringLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gauge className="h-4 w-4" />}
            Score Leads
          </button>
          <button
            onClick={() => setImportOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Upload className="h-4 w-4" />
            {importOpen ? "Hide Import" : "Import Leads"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Lead model boundaries</p>
        <p className="mt-1">
          Customer Leads live here. Platform Website Leads from ClientSurge&apos;s own site are stored separately, and legacy `Lead` discovery records are not canonical CRM.
        </p>
      </div>

      {error ? (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard
          label="Customer Leads"
          value={snapshot.summary.total_leads}
          helper="All canonical paid-customer Leads records available for daily operator work."
          tone="blue"
        />
        <SummaryCard
          label="Actionable Now"
          value={snapshot.summary.actionable_leads}
          helper="Leads with a current activation segment or clear next action."
          tone="emerald"
        />
        <SummaryCard
          label="Reactivation Ready"
          value={snapshot.summary.segment_counts?.reactivation || 0}
          helper="Dormant leads usable by Old Lead Reactivation."
          tone="amber"
        />
        <SummaryCard
          label="Nurture Ready"
          value={snapshot.summary.segment_counts?.nurture || 0}
          helper="Active leads that can feed nurture/follow-up."
          tone="green"
        />
        <SummaryCard
          label="Follow-Up Due"
          value={snapshot.summary.segment_counts?.follow_up || 0}
          helper="Leads needing operator attention now."
          tone="purple"
        />
        <SummaryCard
          label="Demo Requested"
          value={snapshot.summary.segment_counts?.demo_requested || 0}
          helper="Demo leads still waiting on qualification or booking follow-up."
          tone="green"
        />
        <SummaryCard
          label="Awaiting Close"
          value={snapshot.summary.segment_counts?.awaiting_close || 0}
          helper="Booked demo leads that need close-oriented operator attention."
          tone="default"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr,1fr]">
        <div className="rounded-xl border border-border bg-white p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Activation Command View</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Backend-ranked lead queue showing who to work first, why, and which offer is the best fit.
          </p>

          <div className="space-y-3">
            {activationQueue.length ? (
              activationQueue.slice(0, 6).map((lead, index) => (
                <button
                  key={`priority-${lead.id}`}
                  onClick={() => navigate(`/admin/leads/${lead.id}`)}
                  className="w-full rounded-xl border border-border bg-muted/20 p-4 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                          Priority #{index + 1}
                        </span>
                        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{lead.full_name}</p>
                        <p className="text-xs text-muted-foreground">{lead.business_name}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">{renderActionabilityChips(lead)}</div>
                    </div>

                    <div className="grid gap-3 text-sm lg:min-w-[360px] lg:grid-cols-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Next Action</p>
                        <p className="mt-1 font-medium text-foreground">{lead.next_action?.label || "Review lead"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{lead.next_action?.detail || "Review lead context."}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Recommended Offer</p>
                        <p className="mt-1 font-medium text-foreground">{formatOfferLabel(lead.recommended_offer)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{lead.recommended_offer?.angle || lead.recommended_offer?.reason || "No advisory offer yet."}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Recent Movement</p>
                        <p className="mt-1 font-medium text-foreground">{lead.recent_movement?.label || "No movement"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{lead.recent_movement?.detail || "No tracked activity yet."}</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No actionable leads are currently ranked for immediate outreach.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-white p-4">
            <div className="mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Activation Segments</h3>
            </div>
            <div className="space-y-3">
              {activationSegments.map((segment) => (
                <button
                  key={segment.key}
                  onClick={() => handleFilterChange("segment", filters.segment === segment.key ? "all" : segment.key)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    filters.segment === segment.key
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/20 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{segment.label}</p>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-foreground">
                      {segment.count}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{segment.helper}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white p-4">
            <div className="mb-4 flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Recommended Offer Mix</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SummaryCard
                label="Starter"
                value={offerMix.starter_system || 0}
                helper="Leads best matched to response + booking."
                tone="default"
              />
              <SummaryCard
                label="Growth"
                value={offerMix.growth_system || 0}
                helper="Leads best matched to response + nurture."
                tone="green"
              />
              <SummaryCard
                label="Elite"
                value={offerMix.elite_system || 0}
                helper="Leads best matched to the full stack."
                tone="purple"
              />
              <SummaryCard
                label="Single Service"
                value={offerMix.single_service || 0}
                helper="Leads with one clear first-service fit."
                tone="amber"
              />
            </div>
          </div>
        </div>
      </div>

      {importOpen ? (
        <div className="rounded-xl border border-border bg-white p-6 space-y-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Structured Lead Import</h3>
              <p className="text-sm text-muted-foreground">
                Paste a JSON array of lead objects or upload a JSON file. The import previews exact email/phone dedupe before writing.
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
              <Download className="h-4 w-4" />
              Load JSON File
              <input type="file" accept=".json,application/json" className="hidden" onChange={handleImportFile} />
            </label>
          </div>

          {importError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {importError}
            </div>
          ) : null}
          {importSuccess ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              {importSuccess}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px,1fr]">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Import Source</label>
              <input
                type="text"
                value={importSource}
                onChange={(event) => setImportSource(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="manual_import"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                This label is stored on imported Leads and in the CommunicationEvent summary.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Lead Rows JSON</label>
              <textarea
                value={importRaw}
                onChange={(event) => setImportRaw(event.target.value)}
                rows={10}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder='[{"full_name":"Alex Doe","business_name":"Signal Med Spa","email":"alex@example.com","phone":"6025550101","status":"Contacted"}]'
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handlePreviewImport}
              disabled={importLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              {importLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Preview Import
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={importLoading || !importPreview}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {importLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Import Previewed Rows
            </button>
          </div>

          {importPreview ? (
            <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <SummaryCard label="Rows" value={importPreview.counts.total_rows} tone="default" />
                <SummaryCard label="Create" value={importPreview.counts.creates} tone="green" />
                <SummaryCard label="Update" value={importPreview.counts.updates} tone="blue" />
                <SummaryCard label="Ambiguous" value={importPreview.counts.ambiguous} tone="amber" />
                <SummaryCard label="Invalid" value={importPreview.counts.invalid} tone="purple" />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Preview Actions</p>
                <div className="space-y-2">
                  {importPreview.actions.slice(0, 8).map((action) => (
                    <div key={`${action.row_index}-${action.action}`} className="rounded-lg border border-border bg-white p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">Row {action.row_index + 1}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                          {action.action}
                        </span>
                        <span className="text-muted-foreground">{action.reason}</span>
                      </div>
                      {action.warnings?.length ? (
                        <p className="mt-2 text-xs text-amber-700">{action.warnings.join(" ")}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {action.normalized_lead?.full_name || "Unknown"} • {action.normalized_lead?.business_name || "Unknown Business"} •{" "}
                        {action.normalized_lead?.email || action.normalized_lead?.phone || "No direct contact"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-white p-4 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Actionable Customer Lead Queue</h3>
              <p className="text-sm text-muted-foreground">
                Search, filter, and work canonical Customer Leads without leaving the admin control surface.
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {leads.length} of {snapshot.pagination.total_filtered} filtered leads
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange("segment", "all")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                filters.segment === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All
            </button>
            {(activationSegments || []).map((segment) => (
              <button
                key={`chip-${segment.key}`}
                onClick={() => handleFilterChange("segment", segment.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filters.segment === segment.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {segment.label} ({segment.count})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="relative xl:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search name, business, email, phone..."
                value={filters.search}
                onChange={(event) => handleFilterChange("search", event.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <select
              value={filters.status}
              onChange={(event) => handleFilterChange("status", event.target.value)}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              {(snapshot.filter_options.statuses || []).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={filters.segment}
              onChange={(event) => handleFilterChange("segment", event.target.value)}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Segments</option>
              {(snapshot.filter_options.segments || []).map((segment) => (
                <option key={segment} value={segment}>
                  {segmentLabels[segment] || segment}
                </option>
              ))}
            </select>

            <select
              value={filters.stage_group}
              onChange={(event) => handleFilterChange("stage_group", event.target.value)}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Stages</option>
              {(snapshot.filter_options.stage_groups || []).map((stageGroup) => (
                <option key={stageGroup} value={stageGroup}>
                  {stageGroupLabels[stageGroup] || stageGroup}
                </option>
              ))}
            </select>

            <select
              value={filters.source}
              onChange={(event) => handleFilterChange("source", event.target.value)}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Sources</option>
              {sourceOptions.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>

            <select
              value={filters.intake_type}
              onChange={(event) => handleFilterChange("intake_type", event.target.value)}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Intake Types</option>
              {(snapshot.filter_options.intake_types || []).map((intakeType) => (
                <option key={intakeType} value={intakeType}>
                  {intakeTypeLabels[intakeType] || intakeType}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Lead</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Score</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Why Now</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Next Action</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Recommended Offer</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Recent Movement</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                        Loading lead pipeline...
                      </td>
                    </tr>
                  ) : leads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                        No leads match the current filters.
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-muted/20">
                        <td className="px-4 py-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-foreground">{lead.full_name}</p>
                              <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${getStatusColor(lead.status)}`}>
                                {lead.status}
                              </span>
                              <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                                {stageGroupLabels[lead.stage_group] || lead.stage_group}
                              </span>
                              {lead.lead_score != null && (
                                <LeadScoreBadge score={lead.lead_score} />
                              )}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{lead.business_name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {lead.email || "No email"} • {lead.phone || "No phone"}
                            </p>
                            <p className="mt-2 text-[11px] text-muted-foreground">
                              {lead.source || "unknown"} • {intakeTypeLabels[lead.intake_type] || lead.intake_type || "Legacy"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col items-start gap-1">
                            {lead.lead_score != null ? (
                              <LeadScoreBadge score={lead.lead_score} size="lg" />
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1">{renderActionabilityChips(lead)}</div>
                            <p className="text-xs font-medium text-foreground">
                              {lead.outreach_status?.label || "Working"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {lead.recommended_offer?.reason || lead.outreach_status?.helper || "Review lead context."}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{lead.next_action?.label || "Review lead"}</p>
                            <p className="text-xs text-muted-foreground">{lead.next_action?.detail || "Review lead and choose the next step."}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-3.5 w-3.5 text-primary" />
                              <p className="font-medium text-foreground">{formatOfferLabel(lead.recommended_offer)}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">{lead.recommended_offer?.angle || "No advisory offer yet."}</p>
                            {(lead.recommended_offer?.source_fields || []).length ? (
                              <p className="text-[11px] text-muted-foreground">
                                Suggested from: {lead.recommended_offer.source_fields.join(", ")}
                              </p>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{lead.recent_movement?.label || "No movement"}</p>
                            <p className="text-xs text-muted-foreground">{lead.recent_movement?.detail || "No tracked activity yet."}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                         <div className="flex items-center justify-end gap-2">
                           <button
                             onClick={() => setDrawerLead(lead)}
                             className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                             title="Quick CRM actions"
                           >
                             <SlidersHorizontal className="h-3.5 w-3.5" />
                             CRM
                           </button>
                           <button
                             onClick={() => navigate(`/admin/leads/${lead.id}`)}
                             className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                           >
                             Open
                             <ArrowRight className="h-3.5 w-3.5" />
                           </button>
                         </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {snapshot.pagination.has_more ? (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                Load More Leads
              </button>
            </div>
          ) : null}
      </div>

      {drawerLead && (
        <LeadCRMDrawer
          lead={drawerLead}
          onClose={() => setDrawerLead(null)}
          onLeadUpdated={(updated) => {
            setDrawerLead(updated);
            setSnapshot((prev) => ({
              ...prev,
              leads: prev.leads.map((l) => l.id === updated.id ? { ...l, ...updated } : l),
            }));
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-border bg-white p-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Imports</h3>
            <div className="mt-4 space-y-3">
              {(snapshot.summary.recent_imports || []).length ? (
                snapshot.summary.recent_imports.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-sm font-semibold text-foreground">{item.subject || "Lead import"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(item.created_date)} • {item.import_source || "manual_import"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Created {item.created_count}, updated {item.updated_count}, skipped {item.skipped_count}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No import batches recorded yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white p-4">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Recent Lead Movement</h3>
            </div>
            <div className="mt-4 space-y-3">
              {(snapshot.summary.recent_lead_activity || []).length ? (
                snapshot.summary.recent_lead_activity.map((lead) => (
                  <div key={lead.id} className="rounded-lg border border-border bg-muted/20 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{lead.full_name}</p>
                        <p className="text-xs text-muted-foreground">{lead.business_name}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {lead.recent_movement?.detail || `Last activity: ${formatDate(lead.last_activity_at)}`}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(lead.actionability || []).map((segment) => (
                        <span key={`${lead.id}-recent-${segment}`} className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-700">
                          {segmentLabels[segment] || segment}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent lead activity yet.</p>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}
