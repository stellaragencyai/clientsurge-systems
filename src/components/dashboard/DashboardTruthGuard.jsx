import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function DashboardTruthGuard({ clientProjectId, userEmail, children }) {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [clientMsg, setClientMsg] = useState("");

  useEffect(() => {
    if (!clientProjectId) {
      setStatus("no_project");
      setClientMsg("Your account is not linked to a project yet. Our team is verifying your setup — we'll connect everything shortly.");
      return;
    }

    async function check() {
      try {
        const res = await base44.functions.invoke("getDashboardTruthStatus", {
          client_project_id: clientProjectId,
          customer_email: userEmail,
          include_non_production: false,
        });
        const data = res.data;

        if (data.safe_to_show_client) {
          setStatus("ok");
          setMessage("");
          setClientMsg("");
        } else if (data.truth_status === "blocked") {
          setStatus("blocked");
          setMessage(data.blockers?.map(b => b.message).join("; ") || "Setup verification in progress.");
          setClientMsg("Your dashboard is being verified before we expose install data. This typically takes 1–2 business days.");
        } else if (data.truth_status === "warning") {
          setStatus("warning");
          setClientMsg("Setup in progress — some modules are still being configured.");
        } else {
          setStatus("unknown");
          setClientMsg("Setup info needed — we're gathering your configuration details.");
        }
      } catch {
        setStatus("error");
        setClientMsg("Unable to verify dashboard status. Please try again or contact support.");
      }
    }

    check();
  }, [clientProjectId, userEmail]);

  if (status === "loading") {
    return (
      <div className="rounded-xl border border-primary/15 bg-primary/5 p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">Verifying your dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === "no_project") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 mb-6">
        <p className="text-sm font-semibold text-amber-800 mb-2">Setup In Progress</p>
        <p className="text-sm text-amber-700 leading-relaxed">{clientMsg}</p>
      </div>
    );
  }

  if (status === "blocked") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 mb-6">
        <p className="text-sm font-semibold text-red-800 mb-2">Verification In Progress</p>
        <p className="text-sm text-red-700 leading-relaxed">{clientMsg}</p>
        <p className="text-xs text-red-500 mt-3">
          <a href="mailto:support@clientsurgesystems.com" className="underline hover:opacity-80">Contact support</a> if this takes longer than expected.
        </p>
      </div>
    );
  }

  if (status === "warning") {
    return (
      <>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6">
          <p className="text-sm font-semibold text-amber-800 mb-1">Setup In Progress</p>
          <p className="text-xs text-amber-700">{clientMsg}</p>
        </div>
        {children}
      </>
    );
  }

  return children;
}