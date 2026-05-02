import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Loader2,
  Plus,
  Power,
  Trash2,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

export default function AutomationRulesPanel({ projectId }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedRule, setExpandedRule] = useState(null);

  useEffect(() => {
    loadRules();
    const interval = setInterval(loadRules, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [projectId]);

  const loadRules = async () => {
    try {
      const result = await base44.entities.AutomationRule.filter(
        { project_id: projectId },
        "priority",
        100
      );
      setRules(result || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRuleEnabled = async (rule) => {
    try {
      await base44.entities.AutomationRule.update(rule.id, {
        enabled: !rule.enabled,
      });
      await loadRules();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteRule = async (ruleId) => {
    if (confirm("Delete this rule? This cannot be undone.")) {
      try {
        await base44.entities.AutomationRule.delete(ruleId);
        await loadRules();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        <p className="text-muted-foreground">Loading rules...</p>
      </div>
    );

  if (error)
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
        <AlertCircle className="w-4 h-4 inline mr-2" />
        {error}
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Automation Rules
        </h3>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="p-8 text-center bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">
            No custom rules yet. Industry defaults are applied.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`border rounded-lg transition-all ${
                rule.enabled
                  ? "border-border bg-card"
                  : "border-gray-300 bg-gray-50"
              }`}
            >
              <button
                onClick={() =>
                  setExpandedRule(
                    expandedRule === rule.id ? null : rule.id
                  )
                }
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRuleEnabled(rule);
                    }}
                    className={`w-10 h-6 rounded-full flex items-center transition-colors ${
                      rule.enabled ? "bg-green-600" : "bg-gray-400"
                    }`}
                  >
                    <Power
                      className={`w-3 h-3 text-white mx-auto ${
                        rule.enabled ? "" : "opacity-50"
                      }`}
                    />
                  </button>

                  <div className="text-left">
                    <h4 className="font-semibold text-foreground">
                      {rule.rule_name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Trigger: {rule.trigger_type} • {rule.conditions?.length || 0}{" "}
                      condition{rule.conditions?.length !== 1 ? "s" : ""} •{" "}
                      {rule.actions?.length || 0} action
                      {rule.actions?.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${
                    expandedRule === rule.id ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedRule === rule.id && (
                <div className="border-t border-border p-4 bg-muted/50 space-y-4">
                  <div>
                    <h5 className="text-xs font-semibold text-foreground mb-2">
                      CONDITIONS
                    </h5>
                    {rule.conditions?.length > 0 ? (
                      <ul className="space-y-1 text-sm">
                        {rule.conditions.map((cond, i) => (
                          <li key={i} className="text-muted-foreground">
                            {cond.field} {cond.operator} {cond.value}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No conditions (always fires)
                      </p>
                    )}
                  </div>

                  <div>
                    <h5 className="text-xs font-semibold text-foreground mb-2">
                      ACTIONS
                    </h5>
                    {rule.actions?.length > 0 ? (
                      <ul className="space-y-1 text-sm">
                        {rule.actions.map((action, i) => (
                          <li key={i} className="text-muted-foreground">
                            {action.action_type}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">No actions</p>
                    )}
                  </div>

                  {rule.last_fired_at && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Last fired:{" "}
                        {new Date(rule.last_fired_at).toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="flex items-center gap-1 px-3 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}