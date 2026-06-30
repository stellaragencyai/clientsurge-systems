import { AlertTriangle, BookOpen, CheckCircle2, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { CRM_GUIDE_PHASES, getCrmGuideSummary } from '@/lib/adminGuideChecklist';

function PhaseCard({ phase }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-foreground">{phase.title}</h3>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
              {phase.tab}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{phase.goal}</p>
          <ul className="mt-4 space-y-2">
            {phase.checks.map((check) => (
              <li key={check} className="flex gap-2 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <span>{check}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function CrmCleanupGuide() {
  const summary = getCrmGuideSummary();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-black text-foreground">CRM Cleanup Guide</h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Use this page as the operating checklist for cleaning CRM truth safely. It is intentionally ordered: prove the release, snapshot current counts, dry-run, apply non-destructive review labels, verify grouped records, confirm outreach readiness, run QA proof when needed, and only then use guarded removal.
            </p>
          </div>
          <div className="grid min-w-[260px] grid-cols-2 gap-3 text-center">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-900">
              <p className="text-2xl font-bold">{summary.phase_count}</p>
              <p className="text-xs font-semibold uppercase tracking-wide">Phases</p>
            </div>
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-green-900">
              <p className="text-2xl font-bold">{summary.check_count}</p>
              <p className="text-xs font-semibold uppercase tracking-wide">Checks</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="flex gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-semibold">Do not skip straight to removal.</p>
            <p className="mt-1 text-xs">The safe order is proof → snapshot → dry-run → non-destructive review → keeper review → outreach readiness → QA proof → guarded removal. Skipping steps can make the dashboard untrustworthy again.</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
        <div className="flex gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-semibold">This page is read-only.</p>
            <p className="mt-1 text-xs">It does not change records, trigger providers, or run cleanup by itself. It tells you where to go and what proof to check before each action.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {CRM_GUIDE_PHASES.map((phase) => <PhaseCard key={phase.id} phase={phase} />)}
      </div>
    </div>
  );
}
