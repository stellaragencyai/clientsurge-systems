function safeJson(value) {
  try {
    return JSON.stringify(value ?? null);
  } catch (error) {
    return JSON.stringify({
      serialization_error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function createSystemAuditLog(
  base44,
  {
    action,
    entityName,
    recordId,
    before = null,
    after = null,
    source = "system",
    provider = "",
    providerEventId = "",
    providerEventType = "",
    notes = {},
  }
) {
  const auditEntity = base44?.asServiceRole?.entities?.AuditLog;
  if (!auditEntity?.create || !action || !entityName) {
    return null;
  }

  return auditEntity.create({
    admin_email: "system@clientsurgesystems.com",
    action,
    entity_name: entityName,
    record_id: recordId || "",
    before: safeJson(before),
    after: safeJson(after),
    timestamp: new Date().toISOString(),
    notes: safeJson({
      source,
      provider,
      provider_event_id: providerEventId,
      provider_event_type: providerEventType,
      ...notes,
    }),
  }).catch(() => null);
}
