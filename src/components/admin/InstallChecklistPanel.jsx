import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, Check, AlertCircle, Loader2 } from "lucide-react";

const SERVICE_LABELS = {
  instant_lead_response: "Instant Lead Response",
  missed_call_text_back: "Missed Call Text-Back",
  nurture_sequence_14d: "14-Day Nurture Sequence",
  ai_booking_agent: "AI Booking Agent",
  lead_reactivation: "Old Lead Reactivation",
  review_request: "Review Request Automation",
};

export default function InstallChecklistPanel({ orderId }) {
  const [checklist, setChecklist] = useState(null);
  const [steps, setSteps] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedServices, setExpandedServices] = useState({});

  useEffect(() => {
    loadChecklistData();
  }, [orderId]);

  const loadChecklistData = async () => {
    try {
      setLoading(true);
      // Load order to get services
      const order = await base44.asServiceRole.entities.Order.get(orderId);
      if (!order?.items) return;

      // Load checklist records for each service
      const serviceKeys = order.items.map((i) => i.service_key);
      const stepsMap = {};

      for (const serviceKey of serviceKeys) {
        const checklists = await base44.asServiceRole.entities.AutomationChecklist.filter({
          order_id: orderId,
          service_key: serviceKey,
        });

        if (checklists?.[0]) {
          setChecklist(checklists[0]);
          const stepRecords = await base44.asServiceRole.entities.AutomationChecklistStep.filter({
            automation_checklist_id: checklists[0].id,
          });
          stepsMap[serviceKey] = stepRecords || [];
        }
      }

      setSteps(stepsMap);
    } catch (error) {
      console.error("Error loading checklist:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = async (stepRecord) => {
    try {
      const newStatus =
        stepRecord.status === "complete"
          ? "pending"
          : stepRecord.status === "pending"
          ? "in_progress"
          : "complete";

      await base44.asServiceRole.entities.AutomationChecklistStep.update(stepRecord.id, {
        status: newStatus,
        completed_at: newStatus === "complete" ? new Date().toISOString() : null,
        completed_by: newStatus === "complete" ? (await base44.auth.me())?.email : null,
      });

      loadChecklistData();
    } catch (error) {
      console.error("Error updating step:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading checklist...
      </div>
    );
  }

  const serviceKeys = Object.keys(steps);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Automation Checklists</h3>
        <button
          onClick={loadChecklistData}
          className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
        >
          Refresh
        </button>
      </div>

      {serviceKeys.length === 0 ? (
        <p className="text-sm text-muted-foreground">No automations in this order</p>
      ) : (
        serviceKeys.map((serviceKey) => {
          const stepRecords = steps[serviceKey] || [];
          const completedCount = stepRecords.filter((s) => s.status === "complete").length;
          const totalCount = stepRecords.length;
          const isExpanded = expandedServices[serviceKey];

          return (
            <div
              key={serviceKey}
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() =>
                  setExpandedServices({
                    ...expandedServices,
                    [serviceKey]: !isExpanded,
                  })
                }
                className="w-full flex items-center justify-between gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{SERVICE_LABELS[serviceKey]}</p>
                  <p className="text-xs text-muted-foreground">
                    {completedCount}/{totalCount} steps complete
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${(completedCount / totalCount) * 100}%` }}
                    />
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Steps */}
              {isExpanded && (
                <div className="border-t border-border bg-background/50">
                  <div className="divide-y divide-border">
                    {stepRecords.map((step) => (
                      <button
                        key={step.id}
                        onClick={() => toggleStep(step)}
                        className="w-full flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors text-left group"
                      >
                        {/* Checkbox */}
                        <div
                          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
                            step.status === "complete"
                              ? "bg-green-500 border-green-500"
                              : step.status === "failed"
                              ? "border-red-500 bg-red-50"
                              : step.status === "in_progress"
                              ? "border-amber-500 bg-amber-50"
                              : "border-border bg-white"
                          }`}
                        >
                          {step.status === "complete" && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                          {step.status === "failed" && (
                            <AlertCircle className="w-3 h-3 text-red-600" />
                          )}
                        </div>

                        {/* Label & Notes */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              step.status === "complete"
                                ? "text-green-700 line-through"
                                : step.status === "failed"
                                ? "text-red-700"
                                : step.status === "in_progress"
                                ? "text-amber-700"
                                : "text-foreground"
                            }`}
                          >
                            {step.step_label}
                          </p>
                          {step.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{step.notes}</p>
                          )}
                          {step.error_message && (
                            <p className="text-xs text-red-600 mt-1">{step.error_message}</p>
                          )}
                          {step.completed_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              ✓ {new Date(step.completed_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        {/* Status Indicator */}
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap ${
                            step.status === "complete"
                              ? "bg-green-100 text-green-700"
                              : step.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : step.status === "in_progress"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {step.status === "complete"
                            ? "Done"
                            : step.status === "failed"
                            ? "Failed"
                            : step.status === "in_progress"
                            ? "In Progress"
                            : "Pending"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}