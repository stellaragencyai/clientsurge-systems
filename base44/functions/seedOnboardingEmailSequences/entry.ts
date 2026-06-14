import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Seed default onboarding email sequences into the database
 * Call once via backend or automation to initialize
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Check if already seeded
    const existing = await base44.asServiceRole.entities.EmailSequence.filter(
      { type: 'onboarding', name: 'Default Onboarding Sequence' },
      '-created_date',
      1
    ).catch(() => []);

    if (existing && existing.length > 0) {
      return Response.json({
        success: true,
        skipped: true,
        reason: 'Onboarding sequences already exist',
      });
    }

    // Create default onboarding sequence
    const sequence = await base44.asServiceRole.entities.EmailSequence.create({
      name: 'Default Onboarding Sequence',
      description: 'Automated onboarding emails for paid clients',
      type: 'onboarding',
      trigger_type: 'status_changed',
      status: 'active',
      active: true,
      steps: [
        {
          id: 'welcome',
          order: 1,
          delay_days: 0,
          delay_hours: 0,
          subject: 'Welcome to ClientSurge Systems, {{business_name}}!',
          body: `Welcome to the ClientSurge Systems family!

We're excited to get {{business_name}} set up and capturing more leads automatically.

Over the next few days, you'll receive setup guides and onboarding instructions. Our team is here to help at every step.

What to expect:
• Setup guidance for your specific services
• Integration walkthroughs (SMS, email, booking)
• Training on using your automated lead capture system
• Live system activation

Questions? Reply to this email anytime.`,
          condition_type: 'none',
          enabled: true,
        },
        {
          id: 'setup_guidance',
          order: 2,
          delay_days: 1,
          delay_hours: 0,
          subject: 'Setup Next Steps for {{business_name}}',
          body: `Hi {{owner_name}},

Thanks for purchasing ClientSurge Systems! Let's get you up and running.

Your next steps:
1. Verify your contact information (phone, email)
2. Connect your calendar/booking system
3. Authorize SMS channel (Twilio)
4. Customize your first automated response

You have a dedicated onboarding specialist ready to help. Check your client dashboard for the setup checklist.`,
          condition_type: 'none',
          enabled: true,
        },
        {
          id: 'setup_progress',
          order: 3,
          delay_days: 3,
          delay_hours: 0,
          subject: 'Your {{business_name}} Setup Progress',
          body: `Hi {{owner_name}},

Hope your setup is going smoothly! We're tracking your progress on the dashboard.

If you're stuck on any step, our team is just an email away. We can also schedule a brief call to walk through setup together.

Next: Configure your missed-call text-back automation. This captures 30-50% more leads automatically.`,
          condition_type: 'none',
          enabled: true,
        },
        {
          id: 'testing_ready',
          order: 4,
          delay_days: 5,
          delay_hours: 0,
          subject: 'Ready to Test Your {{business_name}} Automation?',
          body: `Great progress, {{owner_name}}!

Your system is ready for testing. Here's what to do:
1. Send a test message from your booking page
2. Verify you receive the automated response
3. Check your dashboard for the captured lead
4. Reply to the lead to test follow-up

Once you confirm everything works, we'll schedule your live activation call.`,
          condition_type: 'none',
          enabled: true,
        },
        {
          id: 'activation_ready',
          order: 5,
          delay_days: 7,
          delay_hours: 0,
          subject: 'Activation Day: {{business_name}} Goes Live! 🚀',
          body: `It's time, {{owner_name}}!

Your system is ready to go live and start capturing leads 24/7.

What happens now:
• Your automated responses activate immediately
• Missed calls trigger instant text-backs
• Leads are routed to your system in real-time
• Your dashboard updates live with all activity

Congratulations on taking the leap to lead automation! Your {{business_name}} is now positioned to capture more leads and close more deals.

Questions? We're here for you.`,
          condition_type: 'none',
          enabled: true,
        },
      ],
      created_by: 'system',
      total_enrolled: 0,
      total_completed: 0,
    });

    return Response.json({
      success: true,
      sequence_id: sequence.id,
      sequence_name: sequence.name,
      steps_created: sequence.steps.length,
    });
  } catch (error) {
    console.error('[seedOnboardingEmailSequences] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});