import { StatusPill, safeJsonParse, fmtDate, timeAgo } from "./helpers";
import { CheckCircle2, XCircle } from "lucide-react";

export default function RouteHealthPanel({ adminSettings, routeGate }) {
  const healthData = safeJsonParse(adminSettings?.last_webhook_test_result, null);
  const routes = healthData?.routes || {};
  const allHealthy = healthData?.all_healthy ?? (routeGate?.status === "proof_passed");
  const testedAt = healthData?.tested_at || adminSettings?.last_webhook_test_at;

  const routeLabels = {
    voice: { label: "Voice Route", url: adminSettings?.voice_webhook_url },
    sms: { label: "SMS (Inbound) Route", url: adminSettings?.sms_webhook_url },
    missed_call: { label: "Missed-Call Route", url: adminSettings?.missed_call_webhook_url },
    status_callback: { label: "SMS Status Callback", url: adminSettings?.sms_status_callback_url },
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-5 rounded-full" style={{ background: "#00AEEF" }} />
        <h3 className="text-sm font-bold text-gray-900">Route Health</h3>
        <StatusPill color={allHealthy ? "green" : "red"} label={allHealthy ? "All Healthy" : "Unhealthy"} />
        <span className="text-[11px] text-gray-400 ml-auto">Last tested: {timeAgo(testedAt)}</span>
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-2 font-bold text-gray-500 uppercase tracking-wide text-[10px]">Route</th>
              <th className="text-left px-4 py-2 font-bold text-gray-500 uppercase tracking-wide text-[10px]">URL</th>
              <th className="text-center px-4 py-2 font-bold text-gray-500 uppercase tracking-wide text-[10px]">HTTP</th>
              <th className="text-center px-4 py-2 font-bold text-gray-500 uppercase tracking-wide text-[10px]">Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(routeLabels).map(([key, meta]) => {
              const route = routes[key];
              const ok = route?.ok ?? (allHealthy && !route);
              return (
                <tr key={key} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-2.5 font-semibold text-gray-800">{meta.label}</td>
                  <td className="px-4 py-2.5 text-gray-500 truncate max-w-xs" title={meta.url}>{meta.url || "—"}</td>
                  <td className="px-4 py-2.5 text-center font-mono text-gray-700">{route?.http_status || (ok ? "200" : "—")}</td>
                  <td className="px-4 py-2.5 text-center">
                    {ok ? (
                      <span className="inline-flex items-center gap-1 text-green-600 font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> OK</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 font-bold"><XCircle className="w-3.5 h-3.5" /> {route?.error || "Failed"}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-gray-400 mt-2">Full detail: {fmtDate(testedAt)}</p>
    </div>
  );
}