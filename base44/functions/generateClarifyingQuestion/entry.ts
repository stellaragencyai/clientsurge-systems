import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const { lead, previousMessage } = await req.json();

    if (!lead) {
      return Response.json({ error: 'lead required' }, { status: 400 });
    }

    // Simple, contextual clarifying questions based on lead data
    const questions = [
      `What's the biggest challenge you're facing right now with ${lead.problem || 'your business'}?`,
      `When would be the best time to discuss this further?`,
      `Is this for your personal needs or your business?`,
      `Have you worked with someone like us before?`,
      `What would success look like for you?`,
    ];

    // Pick a random question
    const question = questions[Math.floor(Math.random() * questions.length)];

    return Response.json({
      message: question,
      intent: 'unsure',
      should_send: true,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});