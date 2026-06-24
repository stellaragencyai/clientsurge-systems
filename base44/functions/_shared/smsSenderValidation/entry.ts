/**
 * SMS Sender Validation Utility
 * Enforces +16025843227 as the only valid ClientSurge Twilio sender.
 * Blocks +18778123630 (toll-free disabled).
 */

function normalizePhoneE164(rawPhone) {
  if (!rawPhone) return null;
  const digits = String(rawPhone).replace(/\D/g, "");
  if (digits.length === 0) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return null;
}

async function resolveSmsFromAddress(base44) {
  let fromNumber = null;

  try {
    const settings = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
    if (settings?.[0]?.twilio_from_number) {
      fromNumber = normalizePhoneE164(settings[0].twilio_from_number);
    }
  } catch (e) {
    console.warn(`[smsSenderValidation] AdminSettings load failed: ${e.message}`);
  }

  if (!fromNumber) {
    fromNumber = normalizePhoneE164(Deno.env.get("TWILIO_PHONE_NUMBER"));
  }

  // Hard-block deprecated sender
  if (fromNumber === "+18778123630") {
    throw new Error(
      "SMS sender +18778123630 is PERMANENTLY BLOCKED. Toll-free compliance failure (Twilio 30032). " +
      "Use +16025843227 instead. Update AdminSettings.twilio_from_number."
    );
  }

  if (!fromNumber) {
    throw new Error("Twilio SMS sender not configured");
  }

  return fromNumber;
}

Deno.serve(async (req) => {
  try {
    const { base44, phone } = await req.json();
    const sender = await resolveSmsFromAddress(base44);
    const recipient = normalizePhoneE164(phone);

    if (!recipient) {
      return new Response(JSON.stringify({ error: "Invalid recipient phone" }), { status: 400 });
    }

    return new Response(
      JSON.stringify({
        sender_from: sender,
        recipient_to: recipient,
        status_callback_url: Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL") ? "configured" : "missing",
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});