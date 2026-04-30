/**
 * Validate Lead Quality - AI Spam/Bot Detection
 * Runs on form submission BEFORE lead is created
 * Returns quality score & recommendation
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const SPAM_DOMAINS = new Set([
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "temp-mail.org",
  "mailinator.com",
  "throwaway.email",
]);

const RED_FLAG_KEYWORDS = [
  "test",
  "spam",
  "demo",
  "fake",
  "asdf",
  "123456",
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { full_name, email, phone, message } = await req.json();

    console.log(`[QualityCheck] Validating lead: ${email}`);

    let score = 100;
    const flags = [];

    // 1. Check disposable email domains
    const emailDomain = email?.split("@")[1]?.toLowerCase() || "";
    if (SPAM_DOMAINS.has(emailDomain)) {
      score -= 40;
      flags.push("disposable_email");
    }

    // 2. Check email format validity
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      score -= 30;
      flags.push("invalid_email_format");
    }

    // 3. Check phone format
    if (phone) {
      const phoneClean = phone.replace(/\D/g, "");
      if (phoneClean.length < 10) {
        score -= 20;
        flags.push("invalid_phone");
      }
      // Check for sequential numbers (spam pattern)
      if (/0{4,}|1{4,}|2{4,}/.test(phoneClean)) {
        score -= 15;
        flags.push("sequential_numbers");
      }
    }

    // 4. Check name validity
    if (!full_name || full_name.length < 2 || /\d{5,}/.test(full_name)) {
      score -= 25;
      flags.push("suspicious_name");
    }

    // 5. Check message for red flags
    const messageLower = (message || "").toLowerCase();
    for (const keyword of RED_FLAG_KEYWORDS) {
      if (messageLower.includes(keyword)) {
        score -= 10;
        flags.push(`keyword_${keyword}`);
        break;
      }
    }

    // 6. Check for repeated characters (spam pattern)
    if (/(.)\1{6,}/.test(messageLower)) {
      score -= 15;
      flags.push("repeated_characters");
    }

    // Determine recommendation
    const isQuality = score >= 50;
    const shouldReject = score < 30;

    console.log(
      `[QualityCheck] Score: ${score}, Quality: ${isQuality}, Reject: ${shouldReject}`
    );

    return Response.json({
      success: true,
      email,
      quality_score: Math.max(0, score),
      is_quality: isQuality,
      should_reject: shouldReject,
      flags,
      recommendation: shouldReject
        ? "REJECT"
        : isQuality
        ? "ACCEPT"
        : "REVIEW",
    });
  } catch (error) {
    console.error("[QualityCheck] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});