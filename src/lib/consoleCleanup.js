// Task #47: Remove all console.log statements in production
// This utility ensures console logs are stripped in production builds

export function isProduction() {
  return typeof import.meta !== "undefined" && import.meta.env?.MODE === "production";
}

export function safeLog(...args) {
  if (!isProduction()) {
    console.log(...args);
  }
}

export function safeError(...args) {
  if (!isProduction()) {
    console.error(...args);
  }
}

export function safeWarn(...args) {
  if (!isProduction()) {
    console.warn(...args);
  }
}

export function stripconsoleLogsInProduction() {
  if (isProduction()) {
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};
    // Keep console.error and console.warn for debugging in production
  }
}