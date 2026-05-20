/**
 * configureServiceChecklistPatch.ts — #412 #412a
 * After each successful configureService call, update AutomationChecklistStep.status = "completed".
 * Query by order_id + service_key to find the right record (#412a).
 */

// This patch is injected into configureService/entry.ts after successful config
// #412a: query pattern
export async function markChecklistStepComplete(base44, order_id, service_key) {
  try {
    const steps = await base44.asServiceRole.entities.AutomationChecklistStep
      .filter({ order_id, service_key }).catch(() => []);
    if (steps?.length > 0) {
      await base44.asServiceRole.entities.AutomationChecklistStep.update(steps[0].id, {
        status: "completed",
        completed_at: new Date().toISOString(),
      });
      console.log(`[configureService] Checklist step marked complete: ${service_key} for order ${order_id}`);
    }
  } catch (e) {
    console.warn("[configureService] Failed to update checklist step:", e.message);
  }
}
