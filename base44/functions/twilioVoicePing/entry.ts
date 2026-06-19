/**
 * twilioVoicePing — Bare-minimum Twilio voice responder.
 *
 * Purpose: Prove Twilio can reach Base44 without application error.
 * NO database, NO entities, NO auth, NO AI, NO imports, NO external calls.
 *
 * Temporarily point Twilio Console → Phone Numbers → Voice → A Call Comes In
 * to: https://clientsurgesystems.com/api/twilioVoicePing
 */

const TWIML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Welcome to ClientSurge Systems. The voice webhook is connected.</Say>
</Response>`;

Deno.serve((req) => {
  if (req.method === 'GET') {
    return new Response('twilio voice ping ok', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return new Response(TWIML, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
});