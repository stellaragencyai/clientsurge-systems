/**
 * ROI Context for Checkout
 * Fixes Audit Issue #5: No time-to-value ROI justification at checkout
 *
 * Stores ROI calculation results from the ROI calculator and
 * exposes them for display in the checkout flow.
 */

const ROI_STORAGE_KEY = "cs_roi_context";

/**
 * Save ROI calculation result for use in checkout.
 * @param {object} roiData - { monthly_recovery, annual_recovery, industry, monthly_inquiries }
 */
export function saveRoiContext(roiData) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ROI_STORAGE_KEY, JSON.stringify({
      ...roiData,
      saved_at: new Date().toISOString(),
    }));
  } catch {}
}

/**
 * Get the saved ROI context for display in checkout.
 * @returns {object|null}
 */
export function getRoiContext() {
  if (typeof window === "undefined") return null;
  try {
    const data = sessionStorage.getItem(ROI_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Clear ROI context (after checkout is completed).
 */
export function clearRoiContext() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ROI_STORAGE_KEY);
  } catch {}
}

/**
 * Format a dollar amount for display.
 */
export function formatDollar(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}