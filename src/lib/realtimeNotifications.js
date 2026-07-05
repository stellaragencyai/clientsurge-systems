/**
 * Real-time Admin Notification Helper
 * Fixes Audit Issue #53: No real-time notifications for critical admin events
 *
 * Subscribes to Alert entity changes and shows browser notifications.
 */

import { base44 } from "@/api/base44Client";

let subscription = null;
let permissionRequested = false;

/**
 * Request notification permission from the user.
 */
export async function requestNotificationPermission() {
  if (permissionRequested) return Notification.permission;
  permissionRequested = true;

  if (typeof Notification === "undefined") return "denied";
  if (Notification.permission === "granted") return "granted";

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return "denied";
  }
}

/**
 * Show a browser notification for a critical alert.
 */
export function showNotification(title, body, options = {}) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

  try {
    const notification = new Notification(title, {
      body,
      icon: "/pwa-icon.svg",
      badge: "/pwa-icon.svg",
      tag: options.tag || "cs-admin-alert",
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      if (options.url) {
        window.location.href = options.url;
      }
      notification.close();
    };

    // Auto-close after 10 seconds
    setTimeout(() => notification.close(), 10000);
  } catch (e) {
    console.warn("Notification failed:", e?.message);
  }
}

/**
 * Subscribe to Alert entity changes and show notifications for critical alerts.
 * Call this once on admin dashboard mount.
 */
export function subscribeToAdminAlerts() {
  if (subscription || typeof window === "undefined") return;

  try {
    subscription = base44.entities.Alert.subscribe((event) => {
      if (event.type === "create" && event.data) {
        const alert = event.data;
        // Only notify for high/critical severity
        if (alert.severity === "critical" || alert.severity === "high") {
          const title = alert.severity === "critical" ? "🚨 Critical Alert" : "⚠️ High Priority Alert";
          showNotification(title, alert.message || "New alert received", {
            tag: `alert-${alert.id}`,
            url: `/admin?tab=inbox`,
          });
        }
      }
    });
  } catch (e) {
    console.warn("Alert subscription failed:", e?.message);
  }
}

/**
 * Unsubscribe from admin alerts.
 */
export function unsubscribeFromAdminAlerts() {
  if (subscription && typeof subscription === "function") {
    subscription();
    subscription = null;
  }
}