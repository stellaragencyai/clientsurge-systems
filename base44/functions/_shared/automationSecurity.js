function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}

function getBearerToken(req) {
  const authorization = req.headers.get("authorization") || "";
  const [scheme, token] = authorization.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return "";
  }

  return token.trim();
}

export function allowAnonymousAutomation(req) {
  const configuredSecret = Deno.env.get("AUTOMATION_SHARED_SECRET");
  if (!configuredSecret) {
    return true;
  }

  const candidateSecret = req.headers.get("x-automation-secret") || getBearerToken(req);
  return constantTimeEqual(candidateSecret || "", configuredSecret);
}
