import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, ExternalLink, GitBranch, Globe, Server, ShieldCheck } from 'lucide-react';
import { evaluateReleaseRuntime, getReleaseProofChecklist, RELEASE_PROOF_CONFIG } from '@/lib/releaseProof';

const STATUS_STYLE = {
  expected: 'border-blue-200 bg-blue-50 text-blue-800',
  manual: 'border-amber-200 bg-amber-50 text-amber-800',
  ready: 'border-green-200 bg-green-50 text-green-800',
  blocked: 'border-red-200 bg-red-50 text-red-800',
};

function ProofRow({ item }) {
  const style = STATUS_STYLE[item.status] || STATUS_STYLE.expected;
  const Icon = item.status === 'blocked' ? AlertTriangle : item.status === 'ready' ? CheckCircle2 : ClipboardCheck;
  return (
    <div className={`rounded-lg border p-3 ${style}`}>
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground/90">{item.label}</p>
          <p className="mt-1 text-xs opacity-80">Expected: {item.expected}</p>
          <p className="mt-1 text-xs opacity-90">Evidence: {item.evidence}</p>
        </div>
      </div>
    </div>
  );
}

export default function ReleaseProofPanel() {
  const [runtime, setRuntime] = useState(() => evaluateReleaseRuntime({}));

  useEffect(() => {
    setRuntime(evaluateReleaseRuntime({
      hostname: window.location.hostname,
      href: window.location.href,
      appId: RELEASE_PROOF_CONFIG.base44AppId,
    }));
  }, []);

  const checklist = useMemo(() => getReleaseProofChecklist({ runtime }), [runtime]);
  const blocked = checklist.filter((item) => item.status === 'blocked');
  const manual = checklist.filter((item) => item.status === 'manual');

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Release Proof Panel</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Separates “merged in GitHub” from “published and verified in Base44 production.” Use this before treating a release as live.
          </p>
        </div>
        <a
          href={RELEASE_PROOF_CONFIG.productionUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold hover:bg-muted"
        >
          Open live site <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-900">
          <GitBranch className="h-4 w-4" />
          <p className="mt-2 text-xs font-bold uppercase tracking-wide">Repo</p>
          <p className="text-sm font-semibold">{RELEASE_PROOF_CONFIG.repoFullName}</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-900">
          <Server className="h-4 w-4" />
          <p className="mt-2 text-xs font-bold uppercase tracking-wide">Base44 App ID</p>
          <p className="break-all text-sm font-semibold">{RELEASE_PROOF_CONFIG.base44AppId}</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-900">
          <Globe className="h-4 w-4" />
          <p className="mt-2 text-xs font-bold uppercase tracking-wide">Domain</p>
          <p className="text-sm font-semibold">{RELEASE_PROOF_CONFIG.productionDomain}</p>
        </div>
        <div className={`rounded-lg border p-3 ${runtime.status === 'blocked' ? 'border-red-200 bg-red-50 text-red-900' : 'border-green-200 bg-green-50 text-green-900'}`}>
          {runtime.status === 'blocked' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <p className="mt-2 text-xs font-bold uppercase tracking-wide">Runtime</p>
          <p className="text-sm font-semibold">{runtime.status === 'blocked' ? 'Needs proof' : 'Ready for live proof'}</p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">GitHub merge is not enough.</p>
        <p className="mt-1 text-xs">A release is trusted only after green CI, Base44 publish/sync after the target commit, live admin verification, and public route smoke proof.</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {checklist.map((item) => <ProofRow key={item.key} item={item} />)}
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-muted px-2 py-1">Manual checks remaining: {manual.length}</span>
        <span className="rounded-full bg-muted px-2 py-1">Runtime blockers: {blocked.length}</span>
      </div>
    </div>
  );
}
