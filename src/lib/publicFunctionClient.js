import { appParams } from "@/lib/app-params";

const FALLBACK_APP_ID = "69dc4a79656fdba136d413d3";

function resolveAppId() {
  return appParams?.appId || FALLBACK_APP_ID;
}

async function parseJsonResponse(response) {
  const rawText = await response.text();
  if (!rawText) return {};

  try {
    return JSON.parse(rawText);
  } catch {
    return { error: rawText.slice(0, 500) };
  }
}

export async function invokePublicBase44Function(functionName, payload = {}) {
  if (!functionName || typeof functionName !== "string") {
    throw new Error("A public function name is required.");
  }

  const endpoint = `/api/apps/${resolveAppId()}/functions/${functionName}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });

  const result = await parseJsonResponse(response);
  const data = result?.data && typeof result.data === "object" ? result.data : result;

  if (!response.ok || data?.success === false) {
    const error = new Error(data?.error || result?.error || `Request failed with HTTP ${response.status}.`);
    error.status = response.status;
    error.code = data?.code || result?.code || null;
    error.request_id = data?.request_id || result?.request_id || null;
    error.data = data;
    throw error;
  }

  return {
    data,
    request_id: data?.request_id || result?.request_id || null,
    status: response.status,
  };
}
