import { AlertCircle, Send, Zap } from "lucide-react";

const LEGACY_DRIP_DISABLED_MESSAGE =
  "Legacy drip scheduling has been quarantined. Use the Install Order Workspace nurture test flow for pilot verification.";

export default function DripCampaignPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Drip Campaigns</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This legacy drip scheduler is retained for reference only and is no longer an approved launch path.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Legacy Scheduler Quarantined</p>
            <p className="mt-1 text-amber-800">{LEGACY_DRIP_DISABLED_MESSAGE}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm space-y-1">
        <div className="flex items-center gap-2 font-semibold text-foreground mb-2">
          <Send className="w-4 h-4 text-primary" />
          Current Guidance
        </div>
        <ul className="list-disc list-inside text-xs text-foreground/75 space-y-1">
          <li>Do not use the old drip scheduler for live customer outreach.</li>
          <li>Use the Install Order Workspace nurture test to verify templates and provider proof during pilots.</li>
          <li>Do not represent this panel as a production scheduler until a canonical order-backed scheduler is promoted.</li>
        </ul>
      </div>

      <div className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground bg-muted/20">
        <Zap className="w-4 h-4" />
        Run Now is disabled while the legacy scheduler remains quarantined.
      </div>
    </div>
  );
}
