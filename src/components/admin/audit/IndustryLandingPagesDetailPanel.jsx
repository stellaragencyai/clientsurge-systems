import {
  Globe,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  MousePointerClick,
  FileText,
  BarChart3,
} from "lucide-react";

const STATUS_COLORS = {
  Trusted: "#16a34a",
  "Needs Proof": "#d97706",
  Blocked: "#dc2626",
};

export default function IndustryLandingPagesDetailPanel({ detail }) {
  if (!detail) return null;
  const industries = detail.industries || [];

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-4 h-4 text-primary" />
        <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Industry Landing Pages Detail
        </h3>
      </div>

      {/* Industry table */}
      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Industry</th>
              <th className="text-center px-3 py-2 font-semibold text-muted-foreground">Route</th>
              <th className="text-center px-3 py-2 font-semibold text-muted-foreground">Page Views</th>
              <th className="text-center px-3 py-2 font-semibold text-muted-foreground">CTA Clicks</th>
              <th className="text-center px-3 py-2 font-semibold text-muted-foreground">Form Submits</th>
              <th className="text-center px-3 py-2 font-semibold text-muted-foreground">Analytics Row</th>
              <th className="text-center px-3 py-2 font-semibold text-muted-foreground">Score</th>
              <th className="text-center px-3 py-2 font-semibold text-muted-foreground">Status Label</th>
            </tr>
          </thead>
          <tbody>
            {industries.map((ind) => (
              <tr key={ind.key} className="border-t border-border">
                <td className="px-3 py-2 font-semibold text-foreground">{ind.label}</td>
                <td className="px-3 py-2 text-center">
                  {ind.route_exists ? (
                    <CheckCircle2 className="w-3.5 h-3.5 inline" style={{ color: "#16a34a" }} />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 inline" style={{ color: "#dc2626" }} />
                  )}
                </td>
                <td className="px-3 py-2 text-center text-foreground">{ind.page_view_count}</td>
                <td className="px-3 py-2 text-center text-foreground">{ind.cta_click_count}</td>
                <td className="px-3 py-2 text-center text-foreground">{ind.form_submit_count}</td>
                <td className="px-3 py-2 text-center">
                  {ind.landing_analytics_row ? (
                    <CheckCircle2 className="w-3.5 h-3.5 inline" style={{ color: "#16a34a" }} />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 inline" style={{ color: "#d97706" }} />
                  )}
                </td>
                <td className="px-3 py-2 text-center font-bold text-foreground">{ind.score}/100</td>
                <td className="px-3 py-2 text-center">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${STATUS_COLORS[ind.status] || "#6b7280"}15`, color: STATUS_COLORS[ind.status] || "#6b7280" }}>
                    {ind.status_label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary stats */}
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border p-3 text-center">
          <Eye className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-sm font-bold text-foreground">{industries.filter(i => i.page_view_count > 0).length}/{industries.length}</p>
          <p className="text-[10px] text-muted-foreground">Pages with Views</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <MousePointerClick className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-sm font-bold text-foreground">{industries.filter(i => i.cta_click_count > 0).length}/{industries.length}</p>
          <p className="text-[10px] text-muted-foreground">Pages with CTA Clicks</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <FileText className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-sm font-bold text-foreground">{industries.filter(i => i.form_submit_count > 0).length}/{industries.length}</p>
          <p className="text-[10px] text-muted-foreground">Pages with Form Submits</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <BarChart3 className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-sm font-bold text-foreground">{industries.filter(i => i.landing_analytics_row).length}/{industries.length}</p>
          <p className="text-[10px] text-muted-foreground">Pages with Analytics Row</p>
        </div>
      </div>
    </div>
  );
}