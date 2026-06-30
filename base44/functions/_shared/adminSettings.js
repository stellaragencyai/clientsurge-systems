export const DEFAULT_ADMIN_SETTINGS = {
  description: "",
  twilio_enabled: false,
  twilio_from_number: "",
  twilio_account_sid_present: false,
  twilio_auth_token_present: false,
  whatsapp_enabled: false,
  whatsapp_from_number: "",
  resend_enabled: false,
  resend_from_email: "",
  gmail_enabled: false,
  gmail_from_email: "",
  lead_notification_email: "",
  booking_link_default: "",
  allowed_admin_ips: [],
  webhook_enabled: false,
  webhook_url: "",
  voice_webhook_url: "",
  sms_webhook_url: "",
  missed_call_webhook_url: "",
  sms_status_callback_url: "",
  last_webhook_test_result: "",
  last_webhook_test_at: "",
  sms_template: "",
  email_confirmation_template: "",
  missed_call_sms_template: "",
  follow_up_day1_sms: "",
  follow_up_day3_sms: "",
  follow_up_day7_sms: "",
  missed_call_followup_email_1: "",
  missed_call_followup_email_2: "",
  follow_up_booking_prompt_sms: "",
  follow_up_booking_prompt_email: "",
  admin_notification_template: "",
  nurture_step1_subject: "",
  nurture_step1_body: "",
  nurture_step2_subject: "",
  nurture_step2_body: "",
  nurture_step3_subject: "",
  nurture_step3_body: "",
  nurture_step4_subject: "",
  nurture_step4_body: "",
  nurture_step5_subject: "",
  nurture_step5_body: "",
  nurture_step6_subject: "",
  nurture_step6_body: "",
  nurture_step7_subject: "",
  nurture_step7_body: "",
  nurture_step8_subject: "",
  nurture_step8_body: "",
  cadence_default_mode: "auto",
  cadence_switch_attempts: 3,
  cadence_pause_on_reply: true,
  cadence_engagement_threshold: 50,
  cadence_max_attempts: 6,
  voice_calls_enabled: false,
  inbound_voice_enabled: false,
  payment_recovery_voice_enabled: false,
  voice_briefing_enabled: false,
  voice_briefing_phone: "",
  voice_forwarding_phone: "",
  elevenlabs_agent_ids: {},
  elevenlabs_phone_number_ids: {},
};

export const ADMIN_SETTINGS_MUTABLE_FIELDS = Object.freeze(Object.keys(DEFAULT_ADMIN_SETTINGS));

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
  const records = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
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
  }).catch((error) => {
    console.error("Failed to log admin settings change:", error?.message || error);
  });
}

export async function saveAdminSettings({ base44, actor, patch }) {
  const filteredPatch = buildAdminSettingsPatch(patch);
  const changedFields = Object.keys(filteredPatch);
  const { record, settings: currentSettings } = await loadAdminSettings(base44);

  if (!changedFields.length) {
    return currentSettings;
  }

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
