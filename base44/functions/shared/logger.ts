/**
 * logger.ts — #158
 * Standardised console.log format for all functions.
 * Usage: import { log, warn, err } from "../shared/logger.ts";
 *        log("myFunction", "Processing lead", { lead_id: "..." });
 */
export function log(fn: string, msg: string, ctx: Record<string, unknown> = {}): void {
  console.log(`[${fn}] ${msg}`, Object.keys(ctx).length ? JSON.stringify(ctx) : "");
}

export function warn(fn: string, msg: string, ctx: Record<string, unknown> = {}): void {
  console.warn(`[${fn}] ⚠️ ${msg}`, Object.keys(ctx).length ? JSON.stringify(ctx) : "");
}

export function err(fn: string, msg: string, ctx: Record<string, unknown> = {}): void {
  console.error(`[${fn}] ❌ ${msg}`, Object.keys(ctx).length ? JSON.stringify(ctx) : "");
}
