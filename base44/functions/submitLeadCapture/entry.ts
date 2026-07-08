import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import {
  buildDedupKey,
  cleanString,
  createLeadCaptureRateLimiter,
  findDuplicateWebsiteLead,
  isDisposableEmail,
  normalizeEmail,
  normalizePhone,
} from './leadCapture.shared.js';
import { validatePublicFormOrigin } from '../_shared/publicFormOriginGuard.js';

const MAX_MESSAGE_LENGTH = 1000;
const rateLimiter = createLeadCaptureRateLimiter();

const DANGEROUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<embed/gi,
  /<object/gi,
];

const ALLOWED_SOURCE_VALUES = new Set([
  'website_form',
  'contact_page',
  'pricing_page',
  'landing_page',
  'home_page',
  'industry_page',
  'exit_intent',
  'chat_widget',
  'sam_chat_widget',
  'lead_capture_page',
  'elevenlabs_sarah_ai_receptionist',
]);

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...(init.headers || {}),
    },
  });
}

function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  let sanitized = input;
  DANGEROUS_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '');
  });
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  return sanitized.trim();
}

function getRequestIp(req) {
  const forwardedFor = cleanString(req.headers.get('x-forwarded-for')).split(',')[0]?.trim();
  return (
    cleanString(req.headers.get('cf-connecting-ip')) ||
    forwardedFor ||
    cleanString(req.headers.get('x-real-ip')) ||
    'unknown'
  );
}

function parseRequestedChannels(value) {
  if (!Array.isArray(value)) return [];
  return value.map((channel) => cleanString(channel).toLowerCase()).filter(Boolean);
}

function normalizeLeadSource(value, sourcePage = '') {
  const source = cleanString(value).toLowerCase();
  const page = cleanString(sourcePage).toLowerCase();
  const combined = `${source} ${page}`;

  if (source && ALLOWED_SOURCE_VALUES.has(source)) return source;
  if (combined.includes('contact')) return 'contact_page';
  if (combined.includes('pricing')) return 'pricing_page';
  if (combined.includes('industry')) return 'industry_page';
  if (combined.includes('exit')) return 'exit_intent';
  if (combined.includes('chat') || combined.includes('sam')) return 'chat_widget';
  if (combined.includes('lead')) return 'lead_capture_page';
  if (combined.includes('landing')) return 'landing_page';
  if (page === '/' || combined.includes('home')) return 'home_page';
  return 'website_form';
}

function uniqueById(leads) {
  const seen = new Set();
  return (leads || []).filter((lead) => {
    const id = lead?.id || `${lead?.email || ''}:${lead?.phone_number || ''}:${lead?.created_date || ''}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

Deno.serve(async (req) => {
  const requestId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    if (req.method !== 'POST') {
      return secureJson(
        { error: 'Method not allowed', code: 'method_not_allowed', request_id: requestId },
        { status: 405, headers: { Allow: 'POST' } }
      );
    }

    const originGuard = validatePublicFormOrigin(req);
    if (!originGuard.ok) {
      return secureJson({ error: originGuard.error, code: 'invalid_origin', request_id: requestId }, { status: originGuard.status });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return secureJson({ error: 'Invalid JSON body', code: 'invalid_json', request_id: requestId }, { status: 400 });
    }

    const honeypot = cleanString(body.website_url);
    if (honeypot) {
      return secureJson({ success: true, ignored: true, reason: 'bot_detected', request_id: requestId });
    }

    const ipAddress = getRequestIp(req);
    if (rateLimiter.isRateLimited(ipAddress)) {
      return secureJson({ error: 'Too many submissions. Please try again later.', code: 'rate_limited', request_id: requestId }, { status: 429 });
    }

    const fullName = sanitizeString(cleanString(body.full_name));
    const businessName = sanitizeString(cleanString(body.business_name));
    const email = normalizeEmail(body.email);
    const submittedPhone = cleanString(body.phone_number || body.phone);
    const normalizedPhone = normalizePhone(submittedPhone);
    const requestedChannels = parseRequestedChannels(body.requested_channels);
    const consentGiven = body.consent_given === true || body.consent_given === 'true';
    const message = sanitizeString(cleanString(body.message || body.problem || body.biggest_problem)).slice(0, MAX_MESSAGE_LENGTH);
    const businessType = sanitizeString(cleanString(body.business_type || body.niche || body.industry)) || 'Other';
    const sourcePage = sanitizeString(cleanString(body.source_page || body.page_path || body.pathname));
    const source = normalizeLeadSource(body.source, sourcePage);
    const consentSource = sanitizeString(cleanString(body.consent_source)) || `${source}_form`;
    const consentTextVersion = sanitizeString(cleanString(body.consent_text_version)) || 'lead_capture_explicit_checkbox_v1';

    const errors = [];
    if (!fullName) errors.push('Full name is required');
    if (!businessName) errors.push('Business name is required');
    if (!email) errors.push('Email is required');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email must be valid');
    if (email && isDisposableEmail(email)) errors.push('Disposable email addresses are not allowed');
    if (!submittedPhone) errors.push('Phone number is required');
    if (submittedPhone && !normalizedPhone) errors.push('Phone number must be valid');
    if (!consentGiven) errors.push('SMS and email consent is required');

    if (errors.length > 0) {
      return secureJson({ error: errors[0], errors, code: 'validation_failed', request_id: requestId }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const emailMatches = await base44.asServiceRole.entities.WebsiteLead.filter({ email }, '-created_date', 10);
    const phoneMatches = normalizedPhone
      ? await base44.asServiceRole.entities.WebsiteLead.filter({ phone_number: normalizedPhone }, '-created_date', 10)
      : [];
    const duplicate = findDuplicateWebsiteLead({
      leads: uniqueById([...emailMatches, ...phoneMatches]),
      email,
      phone: normalizedPhone,
    });

    if (duplicate) {
      return secureJson({
        success: true,
        lead_id: duplicate.id,
        action: 'duplicate_recent',
        duplicate: true,
        request_id: requestId,
      });
    }

    const nowIso = new Date().toISOString();
    const newLead = await base44.asServiceRole.entities.WebsiteLead.create({
      full_name: fullName,
      email,
      phone_number: normalizedPhone,
      business_name: businessName,
      business_type: businessType,
      message,
      problem: message,
      source,
      source_page: sourcePage || null,
      routing_key: cleanString(body.routing_key) || null,
      requested_channels: requestedChannels,
      lead_status: 'new',
      reply_status: 'none',
      booking_status: 'none',
      follow_up_step: 0,
      automation_enabled: true,
      engagement_score: 0,
      consent_given: consentGiven,
      consent_given_at: nowIso,
      consent_ip: ipAddress,
      consent_source: consentSource,
      consent_text_version: consentTextVersion,
      user_agent: cleanString(req.headers.get('user-agent')),
      ip_address: ipAddress,
      dedup_key: buildDedupKey({ email, phone: normalizedPhone }),
      sms_permission: consentGiven && requestedChannels.includes('sms'),
      request_id: requestId,
    });

    base44.asServiceRole.functions.invoke('processWebsiteLeadInitialResponse', { lead_id: newLead.id, request_id: requestId }).catch((err) =>
      console.warn('[submitLeadCapture] Initial response trigger failed (non-blocking):', err.message)
    );

    return secureJson({
      success: true,
      lead_id: newLead.id,
      action: 'created',
      request_id: requestId,
    });
  } catch (error) {
    console.error('submitLeadCapture error:', error);
    return secureJson(
      { error: error.message || 'Failed to submit lead', request_id: requestId },
      { status: 500 }
    );
  }
});
