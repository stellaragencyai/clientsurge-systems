import { useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Loader2, ShieldCheck } from 'lucide-react';
import AdminActionResult from './AdminActionResult';
import { errorToAdminActionResult, normalizeAdminActionResult } from '@/lib/adminActionResult';
import { QA_LEAD_PROOF_CONFIRM_PHRASE } from '@/lib/qaLeadProofFixtures';
import { generateQaLeadProofSet, getAdminQaError } from '@/lib/adminQaApi';

function SummaryBox({ result }) {
  if (!result?.summary) return null;
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
      <p className="font-semibold text-foreground">Fixture Summary</p>
      <p className="mt-1 text-muted-foreground">Total: {result.summary.total}</p>
      <p className="mt-1 text-xs text-muted-foreground">By entity: {Object.entries(result.summary.by_entity || {}).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>
      <p className="mt-1 text-xs text-muted-foreground">Expected buckets: {Object.entries(result.summary.expected_buckets || {}).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>
    </div>
  );
}

export default function QaLeadProofPanel() {
  const [running, setRunning] = useState(false);
  const [dryRun, setDryRun] = useState(null);
  const [actionResult, setActionResult] = useState(null);

  const runDryRun = async () => {
    setRunning(true);
    setActionResult(null);
    try {
      const result = await generateQaLeadProofSet({ apply: false });
      setDryRun(result);
      setActionResult(normalizeAdminActionResult({
        action: 'QA Lead Proof Dry Run',
        success: Boolean(result?.success),
        status: result?.success ? 'info' : 'error',
        message: result?.success ? 'Dry run completed. Review the fixture summary before creating records.' : result?.error || 'Dry run failed.',
        affected: result?.summary?.total || 0,
        failed: result?.success ? 0 : 1,
        retry: result?.success ? 'Click Create Proof Records only if you want these internal/test fixtures written to Base44.' : undefined,
        raw: result,
      }));
    } catch (error) {
      setActionResult(errorToAdminActionResult('QA Lead Proof Dry Run', error, getAdminQaError(error, 'Dry run failed.')));
    } finally {
      setRunning(false);
    }
  };

  const createProofRecords = async () => {
    const phrase = window.prompt(`This creates internal/test QA proof records. Type ${QA_LEAD_PROOF_CONFIRM_PHRASE} to continue.`);
    if (phrase !== QA_LEAD_PROOF_CONFIRM_PHRASE) {
      setActionResult(normalizeAdminActionResult({
        action: 'QA Lead Proof Generator',
        success: false,
        status: 'warning',
        message: 'Creation cancelled. Confirmation phrase did not match.',
        retry: 'Run dry-run again and copy the exact confirmation phrase if you want to create proof records.',
      }));
      return;
    }

    setRunning(true);
    setActionResult(null);
    try {
      const result = await generateQaLeadProofSet({
        apply: true,
        confirm_phrase: QA_LEAD_PROOF_CONFIRM_PHRASE,
        run_id: dryRun?.run_id,
      });
      const created = result?.created?.length || 0;
      const failed = result?.failed?.length || 0;
      setActionResult(normalizeAdminActionResult({
        action: 'QA Lead Proof Generator',
        success: Boolean(result?.success),
        status: result?.success ? 'success' : created > 0 ? 'partial' : 'error',
        message: result?.success ? 'QA lead proof records created safely.' : result?.error || 'QA proof creation completed with issues.',
        affected: created + failed,
        failed,
        details: [
          `${created} record(s) created`,
          `${failed} record(s) failed`,
          `Run ID: ${result?.run_id || dryRun?.run_id || 'unknown'}`,
        ],
        retry: result?.success ? 'Open CRM Data Quality, Lead Quality Control, Safe Outreach Queue, and Duplicate Keeper Review to verify expected placement.' : undefined,
        raw: result,
      }));
    } catch (error) {
      setActionResult(errorToAdminActionResult('QA Lead Proof Generator', error, getAdminQaError(error, 'QA proof creation failed.')));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-blue-50 p-2.5">
          <ClipboardCheck className="h-5 w-5 text-blue-700" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">QA Lead Proof Generator</h3>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">Admin-only</span>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">Confirmation required</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Creates clearly marked internal/test lead records to prove CRM quality filters, duplicate review, outreach blocking, and WebsiteLead archive behavior.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div>
          <p className="font-semibold">This never sends SMS/email and does not touch payments.</p>
          <p className="mt-1 text-xs">Generated records are hidden/test/duplicate/quarantine/no-contact fixtures with automation disabled or quality flags applied.</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={runDryRun}
          disabled={running}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Dry-Run Proof Set
        </button>
        <button
          type="button"
          onClick={createProofRecords}
          disabled={running || !dryRun?.success}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Create Proof Records
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <SummaryBox result={dryRun} />
        {dryRun?.fixtures?.length > 0 && (
          <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
            <p className="font-semibold text-foreground">Dry-Run Fixture Preview</p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {dryRun.fixtures.map((fixture) => (
                <li key={fixture.key}>{fixture.entity} · {fixture.expected_bucket} · {fixture.preview_name}</li>
              ))}
            </ul>
          </div>
        )}
        <AdminActionResult result={actionResult} onRetry={!running ? runDryRun : null} onDismiss={() => setActionResult(null)} />
      </div>
    </div>
  );
}
