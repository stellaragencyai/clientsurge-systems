import { ShieldAlert, Filter } from "lucide-react";

const EXCLUSION_PATTERNS = [
  { category: "Test/Internal Emails", patterns: ["@test.", "@example.", "test@", "admin_test@", "clientsurge.test", "clientsurge-install.internal", "backfill-test", "smoke", "proof", "qa"] },
  { category: "Test Business Names", patterns: ["backfill test", "smoke qa", "admin test", "test business", "verification business", "clientsurge internal test", "runtime checkout proof", "stripe proof", "pricing checkout", "postfix checkout"] },
  { category: "Test Sources", patterns: ["smoke", "test", "backfill", "admin_test", "post_patch_verification", "ai_brain_backfill"] },
  { category: "Non-Production Environments", patterns: ["demo", "qa", "smoke", "internal", "test"] },
  { category: "Sample/Excluded Flags", patterns: ["is_sample=true", "dashboard_excluded=true", "dashboard_truth_status=blocked"] },
  { category: "Missing Provider IDs", patterns: ["Orders without stripe_session_id or stripe_customer_id", "CommLogs without provider_message_id"] },
];

export default function ProductionTrustFilterExplainer() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Production Trust Filter — Why Records Are Excluded</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Records matching any of these patterns are excluded from production-trusted metrics and launch proof.
        They are still visible in the "Internal/Test Cleanup Items" section but do not block launch.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {EXCLUSION_PATTERNS.map((group, i) => (
          <div key={i} className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-yellow-600" />
              <p className="text-xs font-bold text-foreground">{group.category}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {group.patterns.map((p, j) => (
                <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 font-mono">
                  {p}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}