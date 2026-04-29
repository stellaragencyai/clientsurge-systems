import { ShieldAlert, Webhook } from "lucide-react";
import { PORTAL_AUTOMATION_ACCESS_NOTE } from "@/lib/portalSettingsConfig";

export default function WebhookSettings() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Webhook className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
              {PORTAL_AUTOMATION_ACCESS_NOTE.eyebrow}
            </p>
            <h2 className="text-lg font-semibold text-foreground">
              {PORTAL_AUTOMATION_ACCESS_NOTE.title}
            </h2>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {PORTAL_AUTOMATION_ACCESS_NOTE.body}
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Customer portal webhook editing is intentionally disabled
            </p>
            <p className="mt-1 text-sm text-amber-800">
              This view is read-only. It does not call admin settings functions and does not expose live provider configuration in the browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
