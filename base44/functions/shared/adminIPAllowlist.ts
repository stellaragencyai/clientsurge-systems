/**
 * adminIPAllowlist.ts — #90
 * IP allowlist check for admin panel access.
 * AdminSettings.admin_ip_allowlist: string[] of allowed IPs/CIDRs.
 * Middleware: call at top of every admin-only function.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

export async function checkIPAllowlist(req: Request, base44: any): Promise<{ allowed: boolean; ip?: string; reason?: string }> {
  // Get client IP
  const ip = req.headers.get("x-real-ip")
    || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";

  // Load allowlist from AdminSettings
  const settings = await base44.asServiceRole.entities.AdminSettings?.list?.().catch(() => []);
  const allowlist: string[] = settings?.[0]?.admin_ip_allowlist || [];

  // If no allowlist configured, allow all
  if (!allowlist.length) return { allowed: true, ip };

  // Check exact match or wildcard prefix
  const match = allowlist.some(allowed => {
    if (allowed === "*") return true;
    if (allowed === ip) return true;
    // Simple CIDR /24 check
    if (allowed.endsWith("/24")) {
      const prefix = allowed.replace("/24", "").split(".").slice(0, 3).join(".");
      return ip.startsWith(prefix + ".");
    }
    return false;
  });

  return match
    ? { allowed: true, ip }
    : { allowed: false, ip, reason: `IP ${ip} not in admin allowlist` };
}

// Convenience wrapper — returns 403 Response if blocked
export async function requireIPAllowlist(req: Request, base44: any): Promise<Response | null> {
  const result = await checkIPAllowlist(req, base44);
  if (!result.allowed) {
    return new Response(JSON.stringify({ error: "Access denied", reason: result.reason }), {
      status: 403,
      headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
    });
  }
  return null; // proceed
}
