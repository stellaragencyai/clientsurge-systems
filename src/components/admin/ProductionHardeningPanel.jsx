// PL-56: Admin settings save confirmation + PL-47/PL-50/PL-55 admin hardening tools
import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, Shield, Database, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ProductionHardeningPanel() {
  const [checks, setChecks] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("runLaunchReadinessCheck", {});
        setChecks(res?.data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">Production Readiness</h3>
        {loading && <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground ml-auto" />}
      </div>
      {checks ? (
        <div className="space-y-2">
          {Object.entries(checks).filter(([k]) => k !== "score").map(([key, val]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              {val ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
              <span className={val ? "text-foreground" : "text-red-600 font-medium"}>{key.replace(/_/g, " ")}</span>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-sm font-bold text-foreground">Score: {checks.score ?? "—"}/100</p>
          </div>
        </div>
      ) : !loading ? (
        <p className="text-sm text-muted-foreground">Run `runLaunchReadinessCheck` to see results.</p>
      ) : null}
    </div>
  );
}