import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Zap,
  MessageSquare,
  Mail,
  CalendarCheck,
  RotateCcw,
  LayoutDashboard,
  HeadphonesIcon,
  Search,
  AlertCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Lock,
  CheckCircle2,
  Wrench,
  TestTube2,
  ShoppingBag,
  CircleOff,
} from "lucide-react";
import {
  CLIENT_PROJECT_PROGRESS_STEPS,
  getClientProjectCompletedProgressCount,
} from "@/lib/clientProjectMirrorControls";

const AUTOMATION_ICONS = {
  instant_response: Zap,
  booking_link: CalendarCheck,
  followup_sms: MessageSquare,
  lead_discovery: Search,
  missed_call: RotateCcw,
  email_sequence: Mail,
  reactivation: RefreshCw,
  crm_pipeline: LayoutDashboard,
  support: HeadphonesIcon,
};

function MirrorStatusBadge({ value }) {
  const tone =
    value === "complete"
      ? "bg-green-50 text-green-700"
      : value === "in_progress"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-600";

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${tone}`}>
      {value || "pending"}
    </span>
  );
}

function ClientProjectMirrorPanel({ project }) {
  const completedCount = getClientProjectCompletedProgressCount(project);

  return (
    <div className="mt-3 space-y-4 rounded-xl border border-border bg-muted/20 p-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
          <div>
            <p className="text-xs font-semibold text-amber-900">
              Client project progress is mirrored here
            </p>
            <p className="mt-1 text-xs text-amber-800">
              These progress fields support the client portal and reflect the
              canonical order/install workflow. Use the paid install workspace
              for install truth instead of editing project steps here.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-foreground">{project.business_name}</p>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{CLIENT_PROJECT_PROGRESS_STEPS.length} complete
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CLIENT_PROJECT_PROGRESS_STEPS.map((step) => (
          <div key={step.key} className="rounded-lg border border-border bg-white px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-muted-foreground">{step.label}</p>
              <Lock className="h-3 w-3 text-muted-foreground/70" />
            </div>
            <div className="mt-2">
              <MirrorStatusBadge value={project[step.key] || "pending"} />
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ state, stateLabel }) {
  const styles = {
    live: {
      className: "bg-green-50 text-green-700 border-green-200",
      Icon: CheckCircle2,
    },
    testing: {
      className: "bg-blue-50 text-blue-700 border-blue-200",
      Icon: TestTube2,
    },
    configuring: {
      className: "bg-amber-50 text-amber-700 border-amber-200",
      Icon: Wrench,
    },
    ready_for_install: {
      className: "bg-orange-50 text-orange-700 border-orange-200",
      Icon: ShoppingBag,
    },
    error: {
      className: "bg-red-50 text-red-700 border-red-200",
      Icon: AlertCircle,
    },
    not_purchased: {
      className: "bg-slate-100 text-slate-600 border-slate-200",
      Icon: Clock,
    },
    not_canonicalized: {
      className: "bg-slate-100 text-slate-600 border-slate-200",
      Icon: CircleOff,
    },
    paid: {
      className: "bg-slate-100 text-slate-700 border-slate-200",
      Icon: ShoppingBag,
    },
  };

  const config = styles[state] || styles.not_canonicalized;
  const Icon = config.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      <Icon className="h-3 w-3" /> {stateLabel}
    </span>
  );
}

function RuntimeSummary({ automation }) {
  const runtime = automation.runtime || {
    total_runs: 0,
    successful_runs: 0,
    failed_runs: 0,
    last_signal: null,
  };

  if (!automation.supported) {
    return (
      <div className="border-t border-border pt-3 text-xs text-muted-foreground">
        {automation.state_reason}
      </div>
    );
  }

  return (
    <div className="space-y-0.5 border-t border-border pt-3 text-xs text-muted-foreground">
      <div className="flex justify-between">
        <span>Tracked orders</span>
        <span className="font-semibold text-foreground">{automation.tracked_order_count}</span>
      </div>
      <div className="flex justify-between">
        <span>Runtime attempts</span>
        <span className="font-semibold text-foreground">{runtime.total_runs}</span>
      </div>
      <div className="flex justify-between">
        <span>Successful sends</span>
        <span className="font-semibold text-green-700">{runtime.successful_runs}</span>
      </div>
      <div className="flex justify-between">
        <span>Failed or blocked</span>
        <span className="font-semibold text-red-600">{runtime.failed_runs}</span>
      </div>
      <div className="pt-2">
        <p className="font-semibold text-foreground">Derived from canonical state</p>
        <p className="mt-1 leading-relaxed">
          {automation.state_reason}
          {runtime.last_signal
            ? ` Latest signal: ${runtime.last_signal.event_type} (${runtime.last_signal.status || "processed"}).`
            : " No runtime signal recorded yet."}
        </p>
      </div>
    </div>
  );
}

export default function AutomationsPanel() {
  const [automationSummary, setAutomationSummary] = useState({
    canonical_services_tracked: 0,
    live_services: 0,
    errored_services: 0,
  });
  const [automations, setAutomations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [expandedProject, setExpandedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const projs = await base44.entities.ClientProject.list("-created_date", 50);
      setProjects(projs);
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadAutomations = async () => {
    try {
      const res = await base44.functions.invoke("getAutomationStatus", {});
      setAutomations(res.data?.automations || []);
      setAutomationSummary(
        res.data?.summary || {
          canonical_services_tracked: 0,
          live_services: 0,
          errored_services: 0,
        }
      );
    } catch {
      setAutomations([]);
      setAutomationSummary({
        canonical_services_tracked: 0,
        live_services: 0,
        errored_services: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadAutomations();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">System Automations</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {automationSummary.canonical_services_tracked} canonical services tracked ·{" "}
            {automationSummary.live_services} live · {automationSummary.errored_services} errored
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            loadAutomations();
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary transition-opacity hover:opacity-70"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Automation cards are now derived only from canonical backend state
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Status comes from paid orders, tracked service install states, and
              CommunicationEvent signals. If a workflow is not yet on the canonical
              order/install path, it is shown explicitly instead of being guessed.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {automations.map((automation) => {
          const Icon = AUTOMATION_ICONS[automation.id] || LayoutDashboard;

          return (
            <div
              key={automation.id}
              className="rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md"
              style={{
                borderColor:
                  automation.state === "live"
                    ? "rgba(34,197,94,0.35)"
                    : automation.state === "error"
                      ? "rgba(220,38,38,0.3)"
                      : "hsl(var(--border))",
              }}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background:
                        automation.state === "live"
                          ? "linear-gradient(135deg,#16a34a,#22c55e)"
                          : "rgba(0,0,0,0.05)",
                    }}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{
                        color: automation.state === "live" ? "#fff" : "#9a5c2e",
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Step {automation.step}
                    </p>
                    <p className="text-sm font-semibold leading-tight text-foreground">
                      {automation.title}
                    </p>
                  </div>
                </div>
                <StatusBadge state={automation.state} stateLabel={automation.state_label} />
              </div>

              <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                {automation.description}
              </p>

              {automation.supported && (
                <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(automation.tracked_install_counts || {}).map(([status, count]) => (
                    <div key={status} className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {status}
                      </p>
                      <p className="mt-1 font-semibold text-foreground">{count}</p>
                    </div>
                  ))}
                  {Object.keys(automation.tracked_install_counts || {}).length === 0 && (
                    <div className="col-span-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-muted-foreground">
                      No paid orders include this canonical service yet.
                    </div>
                  )}
                </div>
              )}

              <RuntimeSummary automation={automation} />
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="mb-1 font-semibold text-foreground">Client Build Progress Mirrors</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          These project progress fields support the client portal and are read-only here.
          Canonical install changes for the first two services belong in the paid install workspace.
        </p>

        {loadingProjects ? (
          <p className="text-sm text-muted-foreground">Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No client projects yet.</p>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <div key={project.id} className="overflow-hidden rounded-xl border border-border">
                <button
                  onClick={() =>
                    setExpandedProject(expandedProject === project.id ? null : project.id)
                  }
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/20"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{project.business_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {project.client_email} · {project.plan}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {getClientProjectCompletedProgressCount(project)}/
                      {CLIENT_PROJECT_PROGRESS_STEPS.length}
                    </span>
                    {expandedProject === project.id ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
                {expandedProject === project.id && (
                  <ClientProjectMirrorPanel project={project} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
