import {
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Globe,
  MousePointerClick,
  Eye,
  FormInput,
} from "lucide-react";

const STATUS_STYLES = {
  Trusted: { color: "#16a34a", bg: "rgba(22,163,74,0.1)", Icon: CheckCircle2 },
  "Needs Proof": { color: "#d97706", bg: "rgba(217,119,6,0.1)", Icon: AlertCircle },
  Blocked: { color: "#dc2626", bg: "rgba(220,38,38,0.1)", Icon: XCircle },
};

function PageRow({ page }) {
  const style = STATUS_STYLES[page.status] || STATUS_STYLES["Needs Proof"];
  const Icon = style.Icon;

  return (
    <div
      className="rounded-lg border p-2.5"
      style={{ borderColor: style.color + "30", background: style.bg + "40" }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" style={{ color: style.color }} />
          <span className="text-xs font-bold text-foreground">{page.label}</span>
          {page.critical && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
              CRITICAL
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold" style={{ color: style.color }}>
          {page.status}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 text-[11px]">
        <div className="flex items-center gap-1">
          <Globe className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">Route:</span>
          <span className="font-semibold" style={{ color: page.route_exists ? "#16a34a" : "#dc2626" }}>
            {page.route_exists ? "✓" : "✗"} {page.http_status || "—"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <FileText className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">Render:</span>
          <span className="font-semibold" style={{ color: page.renders_non_blank ? "#16a34a" : "#dc2626" }}>
            {page.renders_non_blank ? "Non-blank" : "Blank/Error"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <MousePointerClick className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">CTA:</span>
          <span className="font-semibold" style={{ color: page.has_cta ? "#16a34a" : "#d97706" }}>
            {page.has_cta ? "Yes" : "No"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">Tracking:</span>
          <span className="font-semibold" style={{ color: page.tracking_events > 0 ? "#16a34a" : "#d97706" }}>
            {page.tracking_events} event{page.tracking_events !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {page.has_form && (
        <div className="mt-1.5 flex items-center gap-1 text-[11px]">
          <FormInput className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">Form proof:</span>
          <span className="font-semibold" style={{ color: page.website_lead_records > 0 ? "#16a34a" : "#d97706" }}>
            {page.website_lead_records || 0} lead{(page.website_lead_records || 0) !== 1 ? "s" : ""}, {page.form_submit_events || 0} submit{(page.form_submit_events || 0) !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {page.fetch_error && (
        <p className="mt-1 text-[10px] text-red-600">Error: {page.fetch_error}</p>
      )}
    </div>
  );
}

export default function CoreWebsitePagesDetailPanel({ detail }) {
  const pages = detail?.page_results || [];
  const tracking = detail?.tracking_summary || {};

  const blockedPages = pages.filter((p) => p.status === "Blocked");
  const trustedPages = pages.filter((p) => p.status === "Trusted");

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-primary" />
        <h3
          className="text-base font-bold text-foreground"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          Core Website Pages
        </h3>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-xl border border-border p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Routes OK</p>
          <p className="text-lg font-bold text-foreground">
            {pages.filter((p) => p.route_exists).length}/{pages.length}
          </p>
        </div>
        <div className="rounded-xl border border-border p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Render Non-Blank</p>
          <p className="text-lg font-bold text-foreground">
            {pages.filter((p) => p.renders_non_blank).length}/{pages.length}
          </p>
        </div>
        <div className="rounded-xl border border-border p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Tracked</p>
          <p className="text-lg font-bold text-foreground">
            {tracking.pages_with_tracking || 0}/{pages.length}
          </p>
        </div>
        <div className="rounded-xl border border-border p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Blocked</p>
          <p className="text-lg font-bold" style={{ color: blockedPages.length > 0 ? "#dc2626" : "#16a34a" }}>
            {blockedPages.length}
          </p>
        </div>
      </div>

      {/* Blocked pages alert */}
      {blockedPages.length > 0 && (
        <div
          className="rounded-xl p-3 mb-3"
          style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }}
        >
          <p className="text-xs font-bold mb-1" style={{ color: "#dc2626" }}>
            ⚠ {blockedPages.length} page(s) are blocked (blank/error/forbidden):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {blockedPages.map((p) => (
              <span key={p.route} className="text-[11px] px-2 py-0.5 rounded-full bg-white font-mono" style={{ color: "#dc2626" }}>
                {p.route}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Page results */}
      <div className="space-y-2">
        {pages.map((page) => (
          <PageRow key={page.route} page={page} />
        ))}
      </div>

      {/* Tracking summary */}
      <div className="mt-4 rounded-xl border border-border p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Tracking Summary
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Total page_view events:</span>
            <span className="font-bold text-foreground ml-1">{tracking.total_page_view_events || 0}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Pages with tracking:</span>
            <span className="font-bold text-foreground ml-1">{tracking.pages_with_tracking || 0}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Form submit events:</span>
            <span className="font-bold text-foreground ml-1">{tracking.total_form_submit_events || 0}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Website leads:</span>
            <span className="font-bold text-foreground ml-1">{tracking.total_website_leads || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}