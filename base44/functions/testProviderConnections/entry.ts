function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(init.headers || {}) },
  });
}

async function resendFetch(url, options) {
  try { return await fetch(url, options); }
  catch (err) { throw new Error(`Resend request failed: ${err.message || "network error"}`); }
}

async function twilioFetch(url, options) {
  try { return await fetch(url, options); }
  catch (err) { throw new Error(`Twilio request failed: ${err.message || "network error"}`); }
}

function normalizePhone(value = "") {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return String(value || "").trim();
}

function isPlausiblePhone(value = "") {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
}

function isValidEmail(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function ok(message, extra = {}) {
  return { ok: true, status: "ok", message, ...extra };
}

function skipped(message, extra = {}) {
  return { ok: true, status: "skipped", message, ...extra };
}

function error(message, extra = {}) {
  return { ok: false, status: "error", error: message, message, ...extra };
}

function providerResponse(provider, result) {
  return secureJson({
    success: result.ok !== false,
    provider,
    message: result.message || result.error,
    [provider]: result,
    results: { [provider]: result },
  });
}

async function testTwilio(phoneInput) {
  const phone = normalizePhone(phoneInput);
  if (!phone || !isPlausiblePhone(phone)) {
    return error("Enter a valid US phone number. ClientSurge can provision a Twilio number during setup if needed.", { phone });
  }

  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const auth = Deno.env.get("TWILIO_AUTH_TOKEN");

  if (!sid || !auth) {
    return ok("Phone format passed. ClientSurge will verify or provision Twilio during setup.", {
      phone,
      provider_ready: false,
      provider_note: "Twilio environment credentials are not configured in this runtime.",
    });
  }

  try {
    const res = await twilioFetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
      headers: { Authorization: `Basic ${btoa(`${sid}:${auth}`)}` },
    });

    if (res.ok) {
      const data = await res.json();
      return ok(`Phone format passed. Twilio provider connected: ${data.friendly_name || sid}.`, {
        phone,
        provider_ready: true,
      });
    }

    const err = await res.json().catch(() => ({}));
    return error(`Phone format passed, but Twilio provider credentials need ClientSurge review: ${err?.message || `HTTP ${res.status}`}.`, {
      phone,
      provider_ready: false,
    });
  } catch (e) {
    return error(`Phone format passed, but Twilio provider check could not complete: ${e?.message || "network error"}.`, {
      phone,
      provider_ready: false,
    });
  }
}

async function testResend(emailInput) {
  const email = String(emailInput || "").trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    return error("Enter a valid notification email address.", { email });
  }

  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) {
    return ok("Email format passed. ClientSurge will verify Resend delivery during setup.", {
      email,
      provider_ready: false,
      provider_note: "Resend API key is not configured in this runtime.",
    });
  }

  try {
    const res = await resendFetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (res.ok) {
      const data = await res.json();
      const domains = (data?.data || []).map((domain) => domain.name).join(", ") || "verified provider";
      return ok(`Email format passed. Resend provider connected: ${domains}.`, {
        email,
        provider_ready: true,
      });
    }

    const err = await res.json().catch(() => ({}));
    return error(`Email format passed, but Resend provider credentials need ClientSurge review: ${err?.message || `HTTP ${res.status}`}.`, {
      email,
      provider_ready: false,
    });
  } catch (e) {
    return error(`Email format passed, but Resend provider check could not complete: ${e?.message || "network error"}.`, {
      email,
      provider_ready: false,
    });
  }
}

async function testCrm(input = {}) {
  const crm = String(input.crm_system || "").trim();
  if (!crm || crm === "None / Other") {
    return skipped("CRM is optional and has been skipped for this setup.", { crm_system: crm || "None / Other" });
  }

  return ok("CRM selection accepted. ClientSurge will complete final CRM/webhook connection during setup.", {
    crm_system: crm,
    has_api_key: Boolean(input.crm_api_key),
  });
}

Deno.serve(async (req) => {
  const body = await req.json().catch(() => ({}));
  const provider = body.provider;

  if (provider === "twilio") {
    return providerResponse("twilio", await testTwilio(body.phone || body.twilio_business_phone || body.business_phone));
  }

  if (provider === "resend" || provider === "email") {
    return providerResponse("resend", await testResend(body.email || body.lead_notification_email || body.business_email));
  }

  if (provider === "crm" || provider === "webhook") {
    return providerResponse("crm", await testCrm(body));
  }

  if (provider === "all") {
    const twilio = await testTwilio(body.phone || body.twilio_business_phone || body.business_phone);
    const resend = await testResend(body.email || body.lead_notification_email || body.business_email);
    const crm = await testCrm(body);
    return secureJson({
      success: [twilio, resend, crm].every((result) => result.ok !== false),
      results: { twilio, resend, crm },
      twilio,
      resend,
      crm,
    });
  }

  return secureJson({ success: false, message: "Unknown provider — use 'twilio', 'resend', 'crm', or 'all'" }, { status: 400 });
});
