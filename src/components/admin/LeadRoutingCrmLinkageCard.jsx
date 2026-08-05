/**
 * LeadRoutingCrmLinkageCard — Admin card showing WebsiteLead routing + CRM linkage
 * health counts, with non-sending simulation and admin-controlled safe apply actions.
 *
 * Does NOT send messages. Does NOT call external providers.
 */
import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, RefreshCw, FlaskConical, ShieldCheck, AlertTriangle, CheckCircle2, ArrowRight, Ban } from "lucide-react";
import { StatusPill } from "@/components/admin/ops-verification/helpers";

export default function LeadRoutingCrmLinkageCard() {
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState(null);
  const [counts, setCounts] = useState(null);
  const [simResult, setSimResult] = useState(null);
  const [applyResult, setApplyResult] = useState(null);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch WebsiteLead records directly for counts
      const websiteLeads = await base44.admin.entities.WebsiteLead.list("", 500).catch(() => []);
      const wl = websiteLeads || [];

      // Fetch latest backfill result
      const results = await base44.admin.entities.LeadRoutingBackfillResult.list("-run_at", 5).catch(() => []);
      const latestResult = (results || [])[0] || null;

      setCounts({
        total: wl.length,
        missing_client_id: wl.filter((l) => !l.client_id).length,
        missing_client_project_id: wl.filter((l) => !l.client_project_id).length,
        missing_dedup_key: wl.filter((l) => !l.dedup_key).length,
        missing_crm_lead_id: wl.filter((l) => !l.crm_lead_id).length,
        missing_email_and_phone: wl.filter((l) => !l.email && !(l.phone_number || l.phone)).length,
        already_linked: wl.filter((l) => !!l.crm_lead_id).length,
        latest_result: latestResult,
      });
    } catch (err) {
      setError(err.message || "Failed to load lead routing data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const handleSimulate = useCallback(async () => {
    setSimulating(true);
    setError(null);
    setSimResult(null);
    try {
      const res = await base44.functions.invoke("simulateLeadRoutingBackfill", {});
      setSimResult(res.data);
      await fetchCounts();
    } catch (err) {
      setError(err.message || "Simulation failed");
    } finally {
      setSimulating(false);
    }
  }, [fetchCounts]);

  const handleApply = useCallback(async () => {
    setApplying(true);
    setError(null);
    setApplyResult(null);
    setShowApplyConfirm(false);
    try {
      const res = await base44.functions.invoke("applyLeadRoutingBackfillSafe", {});
      setApplyResult(res.data);
      await fetchCounts();
    } catch (err) {
      setError(err.message || "Safe apply failed");
    } finally {
      setApplying(false);
    }
  }, [fetchCounts]);

  const gapFields = counts ? [
    { label: "Missing client_id", value: counts.missing_client_id, key: "client_id" },
    { label: "Missing client_project_id", value: counts.missing_client_project_id, key: "client_project_id" },
    { label: "Missing dedup_key", value: counts.missing_dedup_key, key: "dedup_key" },
    { label: "Missing crm_lead_id", value: counts.missing_crm_lead_id, key: "crm_lead_id" },
  ] : [];

  const hasGaps = counts && (counts.missing_client_id > 0 || counts.missing_client_project_id > 0 || counts.missing_dedup_key > 0 || counts.missing_crm_lead_id > 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,174,239,0.10)" }}>
            <ShieldCheck className="w-4 h-4 text-[#00AEEF]" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Lead Routing + CRM Linkage</p>
            <p className="text-[11px] text-gray-400">Non-sending data hygiene — backfill client_id, dedup_key, crm_lead_id</p>
          </div>
        </div>
        <button
          onClick={fetchCounts}
          disabled={loading}
          className="p-1 rounded hover:bg-gray-50 disabled:opacity-50"
          title="Refresh"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" /> : <RefreshCw className="w-3.5 h-3.5 text-gray-500" />}
        </button>
      </div>

      <div className="px-4 py-3 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Count grid */}
        {counts && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <CountTile label="Total WebsiteLeads" value={counts.total} />
            <CountTile label="Already Linked to CRM" value={counts.already_linked} color="green" />
            <CountTile label="Missing client_id" value={counts.missing_client_id} color={counts.missing_client_id > 0 ? "amber" : "green"} />
            <CountTile label="Missing client_project_id" value={counts.missing_client_project_id} color={counts.missing_client_project_id > 0 ? "amber" : "green"} />
            <CountTile label="Missing dedup_key" value={counts.missing_dedup_key} color={counts.missing_dedup_key > 0 ? "amber" : "green"} />
            <CountTile label="Missing crm_lead_id" value={counts.missing_crm_lead_id} color={counts.missing_crm_lead_id > 0 ? "amber" : "green"} />
            <CountTile label="Missing email + phone" value={counts.missing_email_and_phone} color={counts.missing_email_and_phone > 0 ? "red" : "green"} />
            <CountTile label="Backfill Eligible" value={simResult?.counts?.production_eligible ?? "—"} color="blue" />
          </div>
        )}

        {/* Simulation result */}
        {simResult && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical className="w-3.5 h-3.5 text-blue-600" />
              <p className="text-xs font-bold text-blue-900">Simulation Result (read-only, no records modified)</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
              <SimStat label="Production eligible" value={simResult.counts?.production_eligible} />
              <SimStat label="Internal/test skipped" value={simResult.counts?.internal_test} />
              <SimStat label="Missing identity blocked" value={simResult.counts?.missing_identity_blocked} />
              <SimStat label="Would receive client_id" value={simResult.counts?.would_receive_client_id} />
              <SimStat label="Would receive client_project_id" value={simResult.counts?.would_receive_client_project_id} />
              <SimStat label="Would receive dedup_key" value={simResult.counts?.would_receive_dedup_key} />
              <SimStat label="Would link to existing Lead" value={simResult.counts?.would_link_to_existing_lead} />
              <SimStat label="Would create new Lead" value={simResult.counts?.would_create_new_lead} />
              <SimStat label="Already linked" value={simResult.counts?.already_linked_to_lead} />
            </div>
            {simResult.blockers?.length > 0 && (
              <div className="mt-2 space-y-1">
                {simResult.blockers.map((b, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-amber-700">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" /> {b}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-gray-400">Next:</span>
              <p className="text-[11px] text-blue-900">{simResult.next_step}</p>
            </div>
          </div>
        )}

        {/* Apply result */}
        {applyResult && (
          <div className="rounded-lg border p-3" style={{ borderColor: applyResult.blockers?.length > 0 ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.3)", background: applyResult.blockers?.length > 0 ? "rgba(245,158,11,0.05)" : "rgba(34,197,94,0.05)" }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              <p className="text-xs font-bold text-gray-900">Safe Apply Result — no messages sent, no records deleted</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
              <SimStat label="WebsiteLeads updated" value={applyResult.counts?.website_leads_updated} />
              <SimStat label="CRM links created" value={applyResult.counts?.crm_links_created} />
              <SimStat label="New Leads created" value={applyResult.counts?.leads_created} />
              <SimStat label="Internal/test flagged" value={applyResult.counts?.internal_test_skipped} />
              <SimStat label="Identity blocked" value={applyResult.counts?.missing_identity_blocked} />
              <SimStat label="Production eligible" value={applyResult.counts?.production_eligible} />
            </div>
            {applyResult.warnings?.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {applyResult.warnings.slice(0, 3).map((w, i) => (
                  <p key={i} className="text-[11px] text-amber-600">⚠ {w}</p>
                ))}
              </div>
            )}
            <div className="mt-2 flex items-center gap-2">
              <ArrowRight className="w-3 h-3 text-blue-500" />
              <p className="text-[11px] text-gray-700">{applyResult.next_step}</p>
            </div>
          </div>
        )}

        {/* Latest result record */}
        {counts?.latest_result && (
          <div className="text-[11px] text-gray-400">
            Last run: <span className="font-semibold text-gray-600">{counts.latest_result.mode}</span> at{" "}
            {new Date(counts.latest_result.run_at).toLocaleString()} —{" "}
            {counts.latest_result.website_leads_updated} updated, {counts.latest_result.leads_created} leads created
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-50">
          <button
            onClick={handleSimulate}
            disabled={simulating || loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
          >
            {simulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}
            {simulating ? "Simulating…" : "Run Simulation"}
          </button>

          {!showApplyConfirm ? (
            <button
              onClick={() => setShowApplyConfirm(true)}
              disabled={applying || loading || !simResult}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50 transition-all"
              style={{ background: "linear-gradient(90deg, #0079c1, #005691)", boxShadow: "0 2px 8px rgba(0,121,193,0.25)" }}
              title={!simResult ? "Run simulation first" : "Apply safe backfill"}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {applying ? "Applying…" : "Apply Safe Backfill"}
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-amber-700 font-bold">Confirm: apply routing + CRM linkage to production-eligible leads?</span>
              <button
                onClick={handleApply}
                disabled={applying}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(90deg, #059669, #047857)" }}
              >
                {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Confirm Apply
              </button>
              <button
                onClick={() => setShowApplyConfirm(false)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Readiness progress note */}
        {hasGaps && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700">
              Field gaps remain: {gapFields.filter((g) => g.value > 0).map((g) => `${g.label} (${g.value})`).join(", ")}.
              Run simulation → apply safe backfill to reduce gaps. Live follow-up stays blocked until failed/stale jobs and pending dead letters are cleared.
            </p>
          </div>
        )}
        {!hasGaps && counts && counts.total > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-green-700">
              All routing fields populated. Next step: clean failed/stale jobs and pending dead letters to unblock live follow-up.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CountTile({ label, value, color = "gray" }) {
  const colors = {
    gray: { bg: "bg-gray-50", border: "border-gray-100", text: "text-gray-900", val: "text-gray-900" },
    green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", val: "text-green-700" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", val: "text-amber-700" },
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", val: "text-red-700" },
    blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", val: "text-blue-700" },
  };
  const c = colors[color] || colors.gray;
  return (
    <div className={`rounded-lg ${c.bg} border ${c.border} px-2.5 py-2`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`text-lg font-bold ${c.val}`}>{value}</p>
    </div>
  );
}

function SimStat({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-bold ${value > 0 ? "text-gray-900" : "text-gray-300"}`}>{value ?? "—"}</span>
    </div>
  );
}