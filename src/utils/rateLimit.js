// Rate limiting utility for backend functions
const requestCounts = new Map();

export function checkRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const key = `${identifier}_${Math.floor(now / windowMs)}`;
  
  const count = (requestCounts.get(key) || 0) + 1;
  requestCounts.set(key, count);
  
  // Cleanup old entries
  for (const [k] of requestCounts) {
    if (!k.includes(Math.floor(now / windowMs).toString())) {
      requestCounts.delete(k);
    }
  }
  
  if (count > maxRequests) {
    return { allowed: false, retryAfter: Math.ceil(windowMs / 1000) };
  }
  
  return { allowed: true };
}

export function getRateLimitMiddleware(maxRequests = 10, windowMs = 60000) {
  return function(req) {
    const clientId = req.headers.get('x-client-id') || req.headers.get('user-agent') || 'unknown';
    const limit = checkRateLimit(clientId, maxRequests, windowMs);
    
    if (!limit.allowed) {
      return {
        blocked: true,
        status: 429,
        message: `Rate limit exceeded. Try again in ${limit.retryAfter} seconds`,
      };
    }
    
    return { blocked: false };
  };
}