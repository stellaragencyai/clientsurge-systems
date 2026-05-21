import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Rate limiting check
const requestCounts = new Map();
function checkRateLimit(identifier, maxRequests = 5, windowMs = 60000) {
  const now = Date.now();
  const key = `${identifier}_${Math.floor(now / windowMs)}`;
  const count = (requestCounts.get(key) || 0) + 1;
  requestCounts.set(key, count);
  
  if (count > maxRequests) {
    return false;
  }
  return true;
}

// Input sanitization
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, 500);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Rate limiting
    const clientId = req.headers.get('user-agent') || 'unknown';
    if (!checkRateLimit(clientId, 5, 60000)) {
      return secureJson({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    // Check authentication
    const user = await base44.auth.me();
    if (!user) {
      return secureJson({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    
    // Sanitize inputs
    const sanitized = {};
    for (const key in data) {
      sanitized[key] = sanitizeInput(data[key]);
    }

    // Validate required fields
    if (!sanitized.email || !sanitized.full_name) {
      return secureJson({ error: 'Missing required fields' }, { status: 400 });
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized.email)) {
      return secureJson({ error: 'Invalid email' }, { status: 400 });
    }

    return secureJson({ success: true, data: sanitized });
  } catch (error) {
    return secureJson({ error: error.message }, { status: 500 });
  }
});