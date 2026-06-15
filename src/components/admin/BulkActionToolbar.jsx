/**
 * BulkActionToolbar — floating toolbar shown when leads are selected.
 * Supports: status change, drip sequence trigger, add note, nurture campaign enroll, CSV export.
 */

import { useState, useEffect } from "react";


import {
  X, ChevronDown, CheckCircle, Loader2, MessageSquare, StickyNote, Tag, AlertCircle,
  Download, Phone, BookOpen, BrainCircuit
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { buildLeadsCsv, downloadCsvFile } from "@/lib/leadCsvExport";

const STATUSES = ["New", "Contacted", "Replied", "Qualified", "Booking Prompt Sent", "Booked", "Closed"];

const SEQUENCES = [
  { key: "instant_response", label: "Instant Response" },
  { key: "missed_call_recovery", label: "Missed Call Recovery" },
  { key: "day1_followup", label: "Day 1 Follow-Up" },
  { key: "day3_followup", label: "Day 3 Follow-Up" },
  { key: "day7_followup", label: "Day 7 Follow-Up" },
  { key: "reactivation", label: "Reactivation" },
];

function DropdownMenu({ label, icon: Icon, items, onSelect, colorClass = "" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${colorClass || "border-border bg-white text-foreground hover:bg-muted"}`}
      >
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 min-w-[180px] rounded-xl border border-border bg-white shadow-xl overflow-hidden">
            {items.map((item) => (
              <button
                key={item.key}
                onClick={() => { onSelect(item.key); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NoteModal({ count, onConfirm, onClose, loading }) {
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Add Note to {count} Lead{count !== 1 ? "s" : ""}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="Type a note to add to all selected leads…"
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted">Cancel</button>
          <button
            onClick={() => onConfirm(note)}
            disabled={loading || !note.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
}

function NurtureCampaignModal({ count, onConfirm, onClose, loading }) {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  useEffect(() => {
    base44.entities.NurtureCampaign.list("-created_date", 50)
      .then(res => setCampaigns(res || []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoadingCampaigns(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Enroll {count} Lead{count !== 1 ? "s" : ""} in Nurture Campaign</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        {loadingCampaigns ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading campaigns…
          </div>
        ) : campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No nurture campaigns found. Create one in the Campaigns panel first.</p>
        ) : (
          <select
            value={selectedCampaign}
            onChange={e => setSelectedCampaign(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select a campaign…</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.name || c.campaign_name || c.id}</option>
            ))}
          </select>
        )}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted">Cancel</button>
          <button
            onClick={() => onConfirm(selectedCampaign)}
            disabled={loading || !selectedCampaign}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
            Enroll Leads
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BulkActionToolbar({ selectedIds, leads = [], onClearSelection, onActionComplete, onBulkAction }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { success, failed, message }
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showNurtureModal, setShowNurtureModal] = useState(false);

  const count = selectedIds.length;

  const runAction = async (action, extra = {}) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("bulkLeadAction", {
        action,
        lead_ids: selectedIds,
        ...extra,
      });
      const d = res.data;
      setResult({
        success: true,
        message: `✓ ${d.success} updated${d.failed > 0 ? ` · ${d.failed} failed` : ""}`,
      });
      onActionComplete?.();
      setTimeout(() => {
        setResult(null);
        onClearSelection();
      }, 2500);
    } catch (err) {
      setResult({ success: false, message: err?.response?.data?.error || "Action failed" });
    } finally {
      setLoading(false);
    }
  };

  // Task 18 — Route dangerous bulk actions through confirmation modal
  const withConfirm = (action, count, executeFn) => {
    if (onBulkAction) {
      onBulkAction(action, count, executeFn);
    } else {
      executeFn();
    }
  };

  const handleStatusChange = (status) => {
    const execute = () => runAction("status_change", { status });
    if (['Closed'].includes(status)) {
      withConfirm(`set to "${status}"`, count, execute);
    } else {
      execute();
    }
  };
  const handleSequence = (sequence_type) => runAction("trigger_sequence", { sequence_type });
  const handleNote = async (note) => {
    await runAction("add_note", { note });
    setShowNoteModal(false);
  };
  const handleRescore = async () => {
    setLoading(true);
    setResult(null);
    let successCount = 0;
    let failedCount = 0;
    for (const leadId of selectedIds) {
      try {
        await base44.functions.invoke("scoreLeadIntelligence", { lead_id: leadId });
        successCount++;
      } catch {
        failedCount++;
      }
    }
    setResult({
      success: failedCount === 0,
      message: `${successCount} rescored${failedCount > 0 ? ` · ${failedCount} failed` : ""}`,
    });
    onActionComplete?.();
    setLoading(false);
  };

  const handleMarkContacted = () => runAction("status_change", { status: "Contacted" });

  const handleNurtureEnroll = async (campaignId) => {
    setLoading(true);
    setResult(null);
    let successCount = 0;
    let failedCount = 0;
    for (const lead_id of selectedIds) {
      try {
        await base44.functions.invoke("startNurtureCampaign", { lead_id, campaign_id: campaignId });
        successCount++;
      } catch {
        failedCount++;
      }
    }
    setResult({
      success: true,
      message: `✓ ${successCount} enrolled in campaign${failedCount > 0 ? ` · ${failedCount} failed` : ""}`,
    });
    setShowNurtureModal(false);
    onActionComplete?.();
    setTimeout(() => { setResult(null); onClearSelection(); }, 2500);
    setLoading(false);
  };

  // CSV export — uses the leads array passed in (filtered list)
  const handleExportCSV = () => {
    const exportLeads = leads.length > 0
      ? leads.filter(l => selectedIds.length === 0 || selectedIds.includes(l.id))
      : [];
    if (exportLeads.length === 0) return;

    downloadCsvFile({
      csv: buildLeadsCsv(exportLeads),
      filename: `leads_export_${new Date().toISOString().split("T")[0]}.csv`,
    });
  };

  if (count === 0) return null;

  return (
    <>
      {/* Sticky toolbar */}
      <div className="sticky top-[73px] z-30 mx-auto">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-white shadow-lg px-4 py-3 mb-4">
          {/* Selection count */}
          <div className="flex items-center gap-2 mr-2">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <span className="text-[11px] font-bold text-primary-foreground">{count}</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {count} lead{count !== 1 ? "s" : ""} selected
            </span>
          </div>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Quick: Mark as Contacted */}
          <button
            onClick={handleMarkContacted}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            <Phone className="w-3.5 h-3.5" />
            Mark Contacted
          </button>

          {/* Status change */}
          <DropdownMenu
            label="Change Status"
            icon={Tag}
            items={STATUSES.map((s) => ({ key: s, label: s }))}
            onSelect={handleStatusChange}
          />

          {/* Sequence trigger */}
          <DropdownMenu
            label="Trigger Sequence"
            icon={MessageSquare}
            items={SEQUENCES}
            onSelect={handleSequence}
          />

          {/* Add note */}
          <button
            onClick={() => setShowNoteModal(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-border bg-white text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <StickyNote className="w-3.5 h-3.5" />
            Add Note
          </button>

          {/* Bulk enrich */}
          <button
            onClick={handleRescore}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
            title="Re-score selected leads with AI"
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            Rescore with AI
          </button>

          {/* Nurture Campaign enroll */}
          <button
            onClick={() => setShowNurtureModal(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Nurture Campaign
          </button>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-border bg-white text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            title="Export selected leads (or all filtered leads) to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          {/* Result feedback */}
          {result && (
            <div className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg ${result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {result.success ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {result.message}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Processing {count} leads…
            </div>
          )}

          {/* Clear */}
          <button
            onClick={onClearSelection}
            className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>

      {showNoteModal && (
        <NoteModal
          count={count}
          onConfirm={handleNote}
          onClose={() => setShowNoteModal(false)}
          loading={loading}
        />
      )}
      {showNurtureModal && (
        <NurtureCampaignModal
          count={count}
          onConfirm={handleNurtureEnroll}
          onClose={() => setShowNurtureModal(false)}
          loading={loading}
        />
      )}
    </>
  );
}