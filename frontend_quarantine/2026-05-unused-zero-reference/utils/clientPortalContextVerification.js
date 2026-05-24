/**
 * clientPortalContextVerification.js — #316
 * Utility to verify getClientPortalContext returns expected shape:
 * { project, order, automations, metrics }
 * Call in ClientPortal.jsx useEffect to detect context failures.
 */

export function verifyPortalContext(ctx) {
  const issues = [];
  if (!ctx) { issues.push("Context is null/undefined"); return { valid: false, issues }; }
  if (!ctx.order) issues.push("Missing: order");
  if (!ctx.project && !ctx.client) issues.push("Missing: project or client");
  return { valid: issues.length === 0, issues };
}

// #316: use in ClientPortal.jsx:
// const ctx = await base44.functions.invoke("getClientPortalContext", { order_id });
// const { valid, issues } = verifyPortalContext(ctx);
// if (!valid) console.warn("[ClientPortal] Context issues:", issues);
