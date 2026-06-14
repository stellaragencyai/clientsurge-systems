/**
 * Consolidated webhook validation and security core
 * Replaces duplicated logic in webhookValidation.js and webhookValidationV2.js
 * Supports HMAC-SHA256 signatures for all providers
 */

export async function validateWebhookSignature(body, signature, secret, algorithm = 'sha256') {
  if (!signature || !secret) {
    throw new Error('Missing signature or secret');
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: algorithm === 'sha256' ? 'SHA-256' : 'SHA-1' },
      false,
      ['sign']
    );

    const bodyBytes = typeof body === 'string' ? encoder.encode(body) : body;
    const signatureBytes = await crypto.subtle.sign('HMAC', key, bodyBytes);
    const computedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const providedSignature = signature.replace(/^sha256=|^sha1=/, '');
    
    // Constant-time comparison to prevent timing attacks
    if (computedSignature.length !== providedSignature.length) {
      return false;
    }

    let match = true;
    for (let i = 0; i < computedSignature.length; i++) {
      if (computedSignature[i] !== providedSignature[i]) {
        match = false;
      }
    }

    return match;
  } catch (error) {
    console.error('Signature validation error:', error);
    throw error;
  }
}

export function parseRequestBody(req) {
  try {
    const body = req.body;
    if (typeof body === 'string') {
      return JSON.parse(body);
    }
    return body;
  } catch (error) {
    throw new Error('Invalid JSON payload');
  }
}

export function normalizePhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Ensure E.164 format
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  if (cleaned.length >= 11) {
    return `+${cleaned}`;
  }
  
  return null;
}

export function createErrorResponse(message, status = 400) {
  return {
    status,
    body: JSON.stringify({ error: message }),
    headers: { 'Content-Type': 'application/json' },
  };
}

export function createSuccessResponse(data, status = 200) {
  return {
    status,
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  };
}