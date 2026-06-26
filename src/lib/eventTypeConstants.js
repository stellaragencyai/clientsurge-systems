/**
 * Event Type Constants — single source of truth for all event_type strings.
 * Fixes FLAW #67: Hardcoded magic strings for event_type.
 * Import from here instead of using raw strings.
 */
export const EVENT_TYPES = {
  // Lead lifecycle
  LEAD_CREATED: "lead_created",
  LEAD_UPDATED: "lead_updated",
  LEAD_DELETED: "lead_deleted",
  LEAD_REACTIVATED: "lead_reactivated",
  LEAD_QUALIFIED: "lead_qualified",
  LEAD_DISQUALIFIED: "lead_disqualified",
  LEAD_CONVERTED: "lead_converted",

  // SMS events
  SMS_SENT: "sms_sent",
  SMS_FAILED: "sms_failed",
  SMS_SKIPPED: "sms_skipped",
  SMS_RECEIVED: "sms_received",
  SMS_DELIVERED: "sms_delivered",

  // Email events
  EMAIL_SENT: "email_sent",
  EMAIL_FAILED: "email_failed",
  EMAIL_SKIPPED: "email_skipped",
  EMAIL_OPENED: "email_opened",
  EMAIL_CLICKED: "email_clicked",

  // Webhook events
  WEBHOOK_SENT: "webhook_sent",
  WEBHOOK_RECEIVED: "webhook_received",

  // Payment events
  ORDER_PAID: "order_paid",
  ORDER_REFUNDED: "order_refunded",
  PAYMENT_FAILED: "payment_failed",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",

  // Onboarding events
  INSTALL_INITIALIZED: "install_initialized",
  ONBOARDING_COMPLETED: "onboarding_completed",
  SERVICE_CONFIGURED: "service_configuration_updated",
  SERVICE_ACTIVATED: "service_status_changed",

  // Voice events
  VOICE_CALL_INITIATED: "voice_call_initiated",
  VOICE_CALL_ANSWERED: "voice_call_answered",
  VOICE_CALL_NO_ANSWER: "voice_call_no_answer",
  VOICE_CALL_COMPLETED: "voice_call_completed",

  // System events
  STATUS_UPDATE: "status_update",
  AI_GENERATED: "ai_generated",
  WORKFLOW_TRIGGERED: "workflow_triggered",
  PORTAL_LOGIN: "portal_login",
  REVIEW_REQUEST: "review_request_trigger_simulated",

  // Error events
  TRANSITION_BLOCKED: "service_transition_blocked",
  RUNTIME_BLOCKED: "runtime_attempt_blocked",
  PROVIDER_SEND_ATTEMPTED: "provider_send_attempted",
  PROVIDER_SEND_SUCCEEDED: "provider_send_succeeded",
  PROVIDER_SEND_FAILED: "provider_send_failed",
};

export const CHANNELS = {
  SMS: "sms",
  EMAIL: "email",
  WEBHOOK: "webhook",
  INTERNAL: "internal",
  VOICE: "voice",
};

export const DIRECTIONS = {
  OUTBOUND: "outbound",
  INBOUND: "inbound",
  SYSTEM: "system",
};

export const PROVIDERS = {
  TWILIO: "twilio",
  RESEND: "resend",
  STRIPE: "stripe",
  GMAIL: "gmail",
  ZAPIER: "zapier",
  N8N: "n8n",
  INTERNAL: "internal",
  ELEVENLABS: "elevenlabs",
};

export const COMM_STATUSES = {
  PENDING: "pending",
  SENT: "sent",
  DELIVERED: "delivered",
  FAILED: "failed",
  OPENED: "opened",
  RECEIVED: "received",
  PROCESSED: "processed",
};