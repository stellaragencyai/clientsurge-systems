export const DEFAULT_ADMIN_SETTINGS = {
  lead_notification_email: "",
  resend_from_email: "",
  twilio_from_number: "",
  twilio_enabled: false,
  resend_enabled: false,
  webhook_enabled: false,
  webhook_url: "",
  webhook_secret_token: "",
  booking_link_default: "",
  sms_template: "",
  email_confirmation_template: "",
  admin_notification_template: "",
  twilio_account_sid_present: false,
  twilio_auth_token_present: false,
  last_webhook_test_result: "",
  last_webhook_test_at: "",
};

export const ADMIN_SETTINGS_MUTABLE_FIELDS = [
  "lead_notification_email",
  "resend_from_email",
  "twilio_from_number",
  "twilio_enabled",
  "resend_enabled",
  "webhook_enabled",
  "webhook_url",
  "webhook_secret_token",
  "booking_link_default",
  "sms_template",
  "email_confirmation_template",
  "admin_notification_template",
  "last_webhook_test_result",
  "last_webhook_test_at",
];

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

export function normalizeAdminSettings(record = {}) {
  return {
    ...DEFAULT_ADMIN_SETTINGS,
    ...(record || {}),
  };
}

export function buildAdminSettingsPatch(input = {}) {
  const patch = {};

  for (const field of ADMIN_SETTINGS_MUTABLE_FIELDS) {
    if (hasOwn(input, field)) {
      patch[field] = input[field];
    }
  }

  return patch;
}

export async function loadAdminSettings(base44) {
  const records = await base44.asServiceRole.entities.AdminSettings.list();
  const record = Array.isArray(records) && records.length > 0 ? records[0] : null;

  return {
    record,
    settings: normalizeAdminSettings(record || {}),
  };
}

export async function logAdminSettingsChange({ base44, actor, changedFields }) {
  if (!changedFields?.length) {
    return;
  }

  await base44.asServiceRole.entities.CommunicationEvent.create({
    channel: "internal",
    direction: "system",
    event_type: "status_update",
    provider: "internal",
    status: "processed",
    subject: "Admin settings updated",
    message_body: `Admin settings updated by ${actor?.email || actor?.id || "admin"}.`,
    metadata_json: JSON.stringify({
      context_type: "admin_settings",
      changed_fields: changedFields,
    }),
  });
}

export async function saveAdminSettings({ base44, actor, patch }) {
  const filteredPatch = buildAdminSettingsPatch(patch);
  const changedFields = Object.keys(filteredPatch);
  const { record, settings: currentSettings } = await loadAdminSettings(base44);

  let savedRecord;
  if (record?.id) {
    savedRecord = await base44.asServiceRole.entities.AdminSettings.update(record.id, filteredPatch);
  } else {
    savedRecord = await base44.asServiceRole.entities.AdminSettings.create({
      ...currentSettings,
      ...filteredPatch,
    });
  }

  await logAdminSettingsChange({
    base44,
    actor,
    changedFields,
  });

  return normalizeAdminSettings(savedRecord || {});
}
