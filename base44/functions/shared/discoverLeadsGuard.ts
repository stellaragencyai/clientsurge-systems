/**
 * discoverLeadsGuard.ts — #103
 * Patch: return 503 with clear error if Google Maps API key is missing.
 * Inject at top of discoverLeads/entry.ts.
 */
export function resolveGoogleMapsKey(key?: string | null): string {
  if (!key) {
    throw Object.assign(
      new Error("Google Maps API key is not configured. Set GOOGLE_MAPS_API_KEY in environment variables."),
      { status: 503 }
    );
  }
  return key;
}

export function requireGoogleMapsKey(): string {
  return resolveGoogleMapsKey(Deno.env.get("GOOGLE_MAPS_API_KEY"));
}

// Wrapper for any function that needs the Maps key
export async function withMapsKey<T>(fn: (key: string) => Promise<T>): Promise<Response> {
  try {
    const key = requireGoogleMapsKey();
    const result = await fn(key);
    return Response.json({ success: true, ...( typeof result === "object" ? result : { data: result } ) });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message },
      { status: err.status || 500 }
    );
  }
}
