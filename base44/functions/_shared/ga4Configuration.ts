export const DEFAULT_GA4_MEASUREMENT_ID = "G-H6QT342ZN9";
export const GA4_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{4,}$/i;

export const GA4_TRACKED_EVENTS = [
  "page_view",
  "scroll",
  "scroll_depth",
  "cta_click",
  "pricing_view",
  "link_click",
  "form_submit_attempt",
  "form_submit",
  "generate_lead",
  "contact_form_submit",
  "audit_request_started",
  "audit_request_submitted",
  "begin_checkout",
  "purchase",
  "purchase_client_confirmation",
  "demo_booked",
  "onboarding_complete",
] as const;

export const GA4_KEY_EVENTS = [
  "generate_lead",
  "begin_checkout",
  "purchase",
  "demo_booked",
] as const;

type Ga4Record = Record<string, any>;

function valuesArray(values: unknown) {
  return Array.isArray(values) ? values.map((value) => String(value || "").trim()).filter(Boolean) : [];
}

function uniqueAllowed(values: unknown, allowed: readonly string[], fallback: readonly string[]) {
  if (!Array.isArray(values)) return [...fallback];
  const allowedSet = new Set(allowed);
  const normalized = valuesArray(values).filter((value) => allowedSet.has(value));
  return [...new Set(normalized)];
}

export function isGa4Admin(user: Record<string, unknown> | null | undefined) {
  return user?.role === "admin" || user?.role === "super_admin";
}

export function containsLegacySecret(record: Ga4Record | null | undefined) {
  return typeof record?.api_secret === "string" && record.api_secret.trim().length > 0;
}

export function missingValues(values: unknown, requiredValues: readonly string[]) {
  const present = new Set(valuesArray(values));
  return requiredValues.filter((value) => !present.has(value));
}

export function buildGa4SetupGuide(measurementId = DEFAULT_GA4_MEASUREMENT_ID) {
  return `
GA4 SETUP GUIDE - ClientSurge Systems

1. WEB STREAM
Measurement ID: ${measurementId}
The browser only needs the Measurement ID. It is public configuration, not a secret.

2. SINGLE TAG INITIALIZATION
ClientSurge initializes GA4 through src/lib/ga4.js. Do not add a second gtag initialization in a page component, tag manager container, or layout.

3. SPA PAGE VIEWS
The app emits explicit page_view events for React Router navigation. Verify at least the home page, pricing, contact, book, product-signup, and order-success routes in GA4 DebugView.

4. CANONICAL EVENTS
Engagement events:
- page_view
- scroll / scroll_depth
- cta_click
- pricing_view
- link_click
- form_submit_attempt

Successful outcomes:
- form_submit
- generate_lead
- contact_form_submit
- audit_request_submitted
- begin_checkout
- purchase (server-verified Stripe webhook only)
- purchase_client_confirmation (browser confirmation; not a key event)
- demo_booked (only after the appointment is genuinely confirmed)

5. GA4 KEY EVENTS
In GA4 Admin -> Data display -> Key events, mark these exact event names:
- generate_lead
- begin_checkout
- purchase
- demo_booked

Do not mark page_view, scroll, cta_click, pricing_view, form_submit_attempt, contact_form_submit, audit_request_submitted, or purchase_client_confirmation as separate key events unless you intentionally want duplicate funnel counts.

6. MEASUREMENT PROTOCOL SECRET
Server-verified Stripe purchases use GA4 Measurement Protocol. Store the API secret only as Base44 Secret GA4_API_SECRET. Never store it in GA4Configuration, frontend code, logs, or entity records.

7. VERIFICATION
A database status is not proof. Confirm:
- exactly one GA4Configuration record remains;
- no GA4Configuration record contains api_secret;
- Measurement Protocol debug validation passes;
- a ga4_verification event is accepted for collection;
- the production homepage is healthy and does not expose Base44 internals;
- setup_status becomes active only after every mandatory check passes.
`.trim();
}

export function canonicalGa4Payload({
  body = {},
  measurementId = DEFAULT_GA4_MEASUREMENT_ID,
  notes,
}: {
  body?: Ga4Record;
  measurementId?: string;
  notes?: string;
}) {
  return {
    measurement_id: measurementId,
    enabled: body.enabled !== false,
    tracked_events: uniqueAllowed(body.tracked_events, GA4_TRACKED_EVENTS, GA4_TRACKED_EVENTS),
    conversion_events: uniqueAllowed(body.conversion_events, GA4_KEY_EVENTS, GA4_KEY_EVENTS),
    enhanced_measurement_enabled: body.enhanced_measurement_enabled !== false,
    server_side_tracking_enabled: false,
    setup_status: "configured",
    setup_guide: buildGa4SetupGuide(measurementId),
    last_verified_at: null,
    notes: notes ||
      "Configuration repaired. Status remains configured until Google Measurement Protocol delivery and production health checks pass.",
  };
}

export function summarizeGa4Records(records: Ga4Record[] = []) {
  const config = records[0] || null;
  const missingTrackedEvents = missingValues(config?.tracked_events, GA4_TRACKED_EVENTS);
  const missingKeyEvents = missingValues(config?.conversion_events, GA4_KEY_EVENTS);
  const legacySecretPresent = records.some(containsLegacySecret);
  const expectedStatus = config?.setup_status === "configured" || config?.setup_status === "active";
  const operationallyVerified = Boolean(
    config &&
      config.setup_status === "active" &&
      config.server_side_tracking_enabled === true &&
      config.last_verified_at,
  );

  return {
    config,
    record_count: records.length,
    has_legacy_secret: legacySecretPresent,
    canonical_tracked_events: missingTrackedEvents.length === 0,
    canonical_key_events: missingKeyEvents.length === 0,
    missing_tracked_events: missingTrackedEvents,
    missing_key_events: missingKeyEvents,
    operationally_verified: operationallyVerified,
    clean: Boolean(
      config &&
        records.length === 1 &&
        !legacySecretPresent &&
        config.measurement_id === DEFAULT_GA4_MEASUREMENT_ID &&
        config.enabled === true &&
        config.enhanced_measurement_enabled === true &&
        missingTrackedEvents.length === 0 &&
        missingKeyEvents.length === 0 &&
        expectedStatus,
    ),
  };
}

async function queryGa4Records(base44: any, measurementId: string) {
  return await base44.asServiceRole.entities.GA4Configuration.filter(
    { measurement_id: measurementId },
    "-created_date",
    100,
  ).catch(() => []);
}

async function deleteRecords(base44: any, records: Ga4Record[]) {
  const results = await Promise.all(
    records.map(async (record) => {
      try {
        await base44.asServiceRole.entities.GA4Configuration.delete(record.id);
        return { id: record.id, deleted: true };
      } catch (error) {
        return {
          id: record.id,
          deleted: false,
          error: error instanceof Error ? error.message : "Delete failed",
        };
      }
    }),
  );
  return results;
}

export async function repairGa4Configuration(base44: any, {
  body = {},
  measurementId = DEFAULT_GA4_MEASUREMENT_ID,
  notes,
}: {
  body?: Ga4Record;
  measurementId?: string;
  notes?: string;
} = {}) {
  const existing = await queryGa4Records(base44, measurementId);
  const payload = canonicalGa4Payload({ body, measurementId, notes });
  const legacySecretDetected = existing.some(containsLegacySecret);
  const duplicateRecordsDetected = existing.length > 1;

  let config: Ga4Record | null = null;
  let deletionResults: Array<{ id: string; deleted: boolean; error?: string }> = [];

  if (legacySecretDetected) {
    config = await base44.asServiceRole.entities.GA4Configuration.create(payload);
    deletionResults = await deleteRecords(base44, existing);
  } else if (existing[0]?.id) {
    config = await base44.asServiceRole.entities.GA4Configuration.update(existing[0].id, payload);
    deletionResults = await deleteRecords(base44, existing.slice(1));
  } else {
    config = await base44.asServiceRole.entities.GA4Configuration.create(payload);
  }

  const failedDeletes = deletionResults.filter((result) => !result.deleted);
  if (failedDeletes.length > 0) {
    const error = new Error("GA4 repair could not delete every duplicate or legacy secret-bearing record.");
    (error as any).code = "GA4_RECORD_DELETE_INCOMPLETE";
    (error as any).deletion_results = deletionResults;
    (error as any).config = config;
    throw error;
  }

  const verifiedRecords = await queryGa4Records(base44, measurementId);
  const summary = summarizeGa4Records(verifiedRecords);

  if (summary.record_count !== 1) {
    const error = new Error(`GA4 repair left ${summary.record_count} records; expected exactly one.`);
    (error as any).code = "GA4_RECORD_COUNT_INVALID";
    (error as any).summary = summary;
    throw error;
  }
  if (summary.has_legacy_secret) {
    const error = new Error("GA4 repair left a legacy api_secret value in GA4Configuration.");
    (error as any).code = "GA4_LEGACY_SECRET_REMAINED";
    (error as any).summary = summary;
    throw error;
  }
  if (!summary.canonical_tracked_events || !summary.canonical_key_events) {
    const error = new Error("GA4 repair left an incomplete canonical event catalog.");
    (error as any).code = "GA4_CANONICAL_EVENTS_INCOMPLETE";
    (error as any).summary = summary;
    throw error;
  }

  return {
    success: true,
    migrated: legacySecretDetected || duplicateRecordsDetected,
    legacy_secret_detected: legacySecretDetected,
    legacy_secret_scrubbed: legacySecretDetected ? deletionResults.every((result) => result.deleted) : false,
    duplicate_records_detected: duplicateRecordsDetected,
    duplicate_records_removed: deletionResults.filter((result) => result.deleted).length,
    deleted_record_ids: deletionResults.filter((result) => result.deleted).map((result) => result.id),
    secret_required_for_browser_tracking: false,
    secret_store_name: "GA4_API_SECRET",
    ...summary,
  };
}
