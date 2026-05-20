import { useState } from "react";
import { Bot, Loader2, Play, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { fetchLeadPipelineSummary } from "@/lib/leadPipelineApi";

const COMMANDS = [
  {
    key: "automation_status",
    match: /automation|status|health/i,
    label: "Automation status",
    description: "Refresh canonical automation state.",
    run: async () => {
      const res = await base44.functions.invoke("getAutomationStatus", {});
      const summary = res.data?.summary || res.summary || {};
      return {
        title: "Automation status refreshed",
        detail: `${summary.live_services || 0} live services, ${summary.errored_services || 0} errored, ${summary.canonical_services_tracked || 0} tracked.`,
      };
    },
  },
  {
    key: "win_back_preview",
    match: /win.?back|churn|cancel/i,
    label: "Preview win-back",
    description: "Dry-run churned-client win-back eligibility.",
    run: async () => {
      const res = await base44.functions.invoke("runWinBackSequence", { dry_run: true });
      const data = res.data || res;
      return {
        title: "Win-back preview complete",
        detail: `${data.preview?.length || 0} eligible clients found across ${data.processed || 0} processed churned orders. No email was sent.`,
      };
    },
  },
  {
    key: "lead_pipeline",
    match: /lead|pipeline|priority|med spa|rescore/i,
    label: "Lead pipeline",
    description: "Refresh lead priority and package summary.",
    run: async () => {
      const snapshot = await fetchLeadPipelineSummary({ limit: 10, offset: 0 });
      const priority = snapshot.summary?.priority_queue?.length || 0;
      return {
        title: "Lead pipeline refreshed",
        detail: `${snapshot.summary?.total_leads || 0} total leads, ${priority} priority leads in the current queue.`,
      };
    },
  },
  {
    key: "provider_tests",
    match: /provider|twilio|resend|stripe|connection|test/i,
    label: "Provider tests",
    description: "Run non-sending provider connection tests.",
    run: async () => {
      const res = await base44.functions.invoke("testProviderConnections", { dry_run: true });
      const data = res.data || res;
      return {
        title: "Provider test completed",
        detail: data.summary || "Provider connection test returned successfully.",
      };
    },
  },
];

function resolveCommand(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  return COMMANDS.find((command) => command.match.test(trimmed)) || COMMANDS[2];
}

export default function AdminAICommandBar() {
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const command = resolveCommand(input);

  const runCommand = async () => {
    if (!command || running) return;
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const output = await command.run(input.trim());
      setResult({ ...output, command: command.label });
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Command failed.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bot className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">AI Command Bar</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <ShieldCheck className="h-3 w-3" />
                Safe mode
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Natural-language admin commands run safe internal checks and previews.
            </p>
          </div>
        </div>
        <div className="flex flex-1 gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && runCommand()}
            placeholder='Try "preview win-back" or "show automation status"'
            className="min-w-0 flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={runCommand}
            disabled={!input.trim() || running}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Run
          </button>
        </div>
      </div>

      {command && input.trim() && (
        <p className="mt-2 text-xs text-muted-foreground">
          Matched: <span className="font-semibold text-foreground">{command.label}</span> - {command.description}
        </p>
      )}

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <p className="font-semibold">{result.title}</p>
          <p className="mt-0.5">{result.detail}</p>
        </div>
      )}
    </div>
  );
}
