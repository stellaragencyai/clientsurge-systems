/**
 * validateAIOutputs — #476
 * Safety net: every AI-generated string passes through this before being saved or sent.
 * Checks: empty output, hallucinated business names, profanity, length limits, placeholder leakage.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const PLACEHOLDER_PATTERNS = [
  /\[BUSINESS_NAME\]/i,
  /\[INDUSTRY\]/i,
  /\[PHONE\]/i,
  /\[REVIEW_LINK\]/i,
  /\{\{.*?\}\}/,         // Handlebars-style unfilled tokens
  /undefined/i,
  /null/,
];

const PROFANITY = ['fuck', 'shit', 'ass', 'bitch', 'damn', 'crap'];

const LENGTH_LIMITS = {
  sms: 1600,
  email_subject: 120,
  email_body: 50000,
  default: 10000,
};

interface ValidationResult {
  valid: boolean;
  issues: string[];
  sanitized?: string;
}

function validateOutput(text: string, type: 'sms' | 'email_subject' | 'email_body' | 'default' = 'default', expected_biz?: string): ValidationResult {
  const issues: string[] = [];

  // 1. Empty check
  if (!text || text.trim().length === 0) {
    return { valid: false, issues: ['Output is empty'] };
  }

  // 2. Placeholder leakage
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(text)) {
      issues.push(`Unfilled placeholder detected: ${pattern.toString()}`);
    }
  }

  // 3. Length check
  const limit = LENGTH_LIMITS[type] || LENGTH_LIMITS.default;
  if (text.length > limit) {
    issues.push(`Output too long: ${text.length} chars (max ${limit} for ${type})`);
  }

  // 4. Minimum length — AI hallucinating a blank
  if (text.trim().length < 10) {
    issues.push(`Output suspiciously short: "${text.trim()}"`);
  }

  // 5. Profanity filter
  const lower = text.toLowerCase();
  for (const word of PROFANITY) {
    if (lower.includes(word)) {
      issues.push(`Profanity detected: "${word}"`);
    }
  }

  // 6. Business name hallucination check
  if (expected_biz && expected_biz.length > 3) {
    // If AI output references a completely different business name 3+ times, flag it
    const bizLower = expected_biz.toLowerCase();
    if (!lower.includes(bizLower.substring(0, Math.min(bizLower.length, 8)))) {
      issues.push(`Business name "${expected_biz}" not found in output — possible hallucination`);
    }
  }

  const valid = issues.length === 0;
  return { valid, issues, sanitized: valid ? text : undefined };
}

Deno.serve(async (req) => {
  try {
    const { text, type, expected_biz, batch } = await req.json();

    // Batch validation support
    if (batch && Array.isArray(batch)) {
      const results = batch.map((item: { text: string; type?: string; expected_biz?: string; key?: string }) => ({
        key: item.key || '',
        ...validateOutput(item.text, item.type as any, item.expected_biz),
      }));
      const all_valid = results.every(r => r.valid);
      return Response.json({ all_valid, results });
    }

    if (!text) return Response.json({ error: 'text is required' }, { status: 400 });

    const result = validateOutput(text, type, expected_biz);
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
