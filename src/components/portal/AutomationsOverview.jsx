import { useState, useMemo } from "react";
import { ToggleLeft, ToggleRight, CheckCircle2, AlertCircle, Clock, Zap } from "lucide-react";

const SAMPLE_AUTOMATIONS = [
  {
    id: 1,
    name: "Instant SMS Response",
    type: "sms",
    description: "Automatic text reply when leads call",
    status: "active",
    triggersPerDay: 24,
    successRate: 98,
    lastTriggered: "2 hours ago",
  },
  {
    id: 2,
    name: "Missed Call Recovery",
    type: "sms",
    description: "Follow-up text after missed calls",
    status: "active",
    triggersPerDay: 8,
    successRate: 95,
    lastTriggered: "45 minutes ago",
  },
  {
    id: 3,
    name: "Nurture Email Sequence",
    type: "email",
    description: "14-day email follow-up campaign",
    status: "active",
    triggersPerDay: 16,
    successRate: 92,
    lastTriggered: "1 hour ago",
  },
  {
    id: 4,
    name: "Booking Reminder",
    type: "email",
    description: "24-hour appointment confirmation",
    status: "inactive",
    triggersPerDay: 0,
    successRate: 89,
    lastTriggered: "3 days ago",
  },
  {
    id: 5,
    name: "Reactivation Campaign",
    type: "sms",
    description: "Win-back outreach for inactive leads",
    status: "active",
    triggersPerDay: 5,
    successRate: 78,
    lastTriggered: "12 hours ago",
  },
];

const TYPE_CONFIG = {
  sms: { label: "SMS", color: "text-blue-600", bg: "bg-blue-50" },
  email: { label: "Email", color: "text-amber-600", bg: "bg-amber-50" },
};

export default function AutomationsOverview() {
  const [automations, setAutomations] = useState(SAMPLE_AUTOMATIONS);

  const toggleAutomation = (id) => {
    setAutomations((prev) =>
      prev.map((auto) =>
        auto.id === id
          ? { ...auto, status: auto.status === "active" ? "inactive" : "active" }
          : auto
      )
    );
  };

  const activeCount = useMemo(() => automations.filter((a) => a.status === "active").length, [automations]);
  const totalTriggers = useMemo(() => automations.reduce((sum, a) => sum + a.triggersPerDay, 0), [automations]);
  const avgSuccessRate = useMemo(() => {
    const activeAutomations = automations.filter((a) => a.status === "active");
    return activeAutomations.length
      ? Math.round(activeAutomations.reduce((sum, a) => sum + a.successRate, 0) / activeAutomations.length)
      : 0;
  }, [automations]);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Active Automations</p>
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{activeCount}</p>
          <p className="text-xs text-muted-foreground mt-1">of {automations.length} configured</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Daily Triggers</p>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{totalTriggers}</p>
          <p className="text-xs text-muted-foreground mt-1">automated actions per day</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Avg Success Rate</p>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-foreground">{avgSuccessRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">across active automations</p>
        </div>
      </div>

      {/* Automations List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Your Automations</h3>
        </div>

        <div className="divide-y divide-border/50">
          {automations.map((automation) => (
            <div
              key={automation.id}
              className="p-6 hover:bg-muted/30 transition-colors flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TYPE_CONFIG[automation.type].bg}`}>
                    {TYPE_CONFIG[automation.type].label}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      automation.status === "active"
                        ? "bg-green-50 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {automation.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>
                <h4 className="font-semibold text-foreground mb-1">{automation.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">{automation.description}</p>

                <div className="flex flex-wrap gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Triggers/day:</span>{" "}
                    <span className="font-semibold text-foreground">{automation.triggersPerDay}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Success rate:</span>{" "}
                    <span className="font-semibold text-foreground">{automation.successRate}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last triggered:</span>{" "}
                    <span className="font-semibold text-foreground">{automation.lastTriggered}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => toggleAutomation(automation.id)}
                className="flex-shrink-0 mt-1 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg p-1"
                title={`Toggle ${automation.name}`}
              >
                {automation.status === "active" ? (
                  <ToggleRight className="w-7 h-7 text-green-600" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-muted-foreground" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}