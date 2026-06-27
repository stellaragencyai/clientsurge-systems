import { createClientFromRequest } from 'npm:@base44/sdk@0.8.34';

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(init.headers || {}) },
  });
}

Deno.serve(async (req) => {
  try {
    const { lead } = await req.json();

    if (!lead || !lead.full_name) {
      return secureJson({ error: 'Lead data required' }, { status: 400 });
    }

    const firstName = lead.full_name.split(' ')[0];
    const message = `Hey ${firstName}, thanks for reaching out — what service were you interested in?`;

    return secureJson({ message, success: true });
  } catch (error) {
    return secureJson({ error: error.message }, { status: 500 });
  }
});