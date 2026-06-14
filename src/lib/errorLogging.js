/**
 * Centralized error logging for production monitoring
 * Logs errors to a SystemLogs entity for easier debugging
 */

import { base44 } from "@/api/base44Client";

export async function logError(error, context = {}) {
  try {
    // Only log in production
    if (typeof window === "undefined") return;

    const errorData = {
      message: error?.message || String(error),
      stack: error?.stack || null,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error("[Error Log]", errorData);

    // Attempt to persist to database if available
    if (base44?.entities?.SystemLog) {
      try {
        await base44.entities.SystemLog.create(errorData);
      } catch (e) {
        console.warn("Failed to log error to database", e);
      }
    }
  } catch (loggingError) {
    console.error("Error logging failed", loggingError);
  }
}

export async function logWarning(message, context = {}) {
  try {
    console.warn(`[Warning] ${message}`, context);
    if (base44?.entities?.SystemLog) {
      await base44.entities.SystemLog.create({
        level: "warning",
        message,
        context,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.warn("Failed to log warning", e);
  }
}