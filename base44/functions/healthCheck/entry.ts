/**
 * healthCheck + errorAlerting — #212 #215
 * UptimeRobot/Better Stack compatible endpoint.
 * Returns 200 OK with status JSON.
 * Also exposes alert utility for other functions to import.
 */

const TELEGRAM_BOT = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const TELEGRAM_NOLAN = Deno.env.get("TELEGRAM_NOLAN_ID") || "7776809236";
const RESEND_KEY = Deno.env.get("RESEND_API_KEY") || "";

export async function alertOn5xx(functionName: string, status: number, error: string) {
  const msg = `<b>5xx Error</b> in <code>${functionName}</code>\nStatus: ${status}\nError: ${error.slice(0, 300)}`;
  if (TELEGRAM_BOT) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_NOLAN, text: msg, parse_mode: "HTML" }),
    }).catch(console.warn);
  }
  if (RESEND_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "system@clientsurgesystems.com",
        to: "nolan@clientsurgesystems.com",
        subject: `[ClientSurge] 5xx Error: ${functionName}`,
        text: `Function: ${functionName}\nStatus: ${status}\nError: ${error}\nTime: ${new Date().toISOString()}`,
      }),
    }).catch(console.warn);
  }
}

// #212: UptimeRobot/Better Stack healthCheck
Deno.serve(async (_req) => {
  return Response.json({
    status: "ok",
    service: "ClientSurge Systems",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  }, { status: 200 });
});
