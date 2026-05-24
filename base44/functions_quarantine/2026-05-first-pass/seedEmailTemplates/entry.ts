/**
 * Seed Email Campaign Templates
 * Run once to populate default email sequences
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const templates = [
      {
        name: "Case Study Sequence (Uncertain)",
        campaign_type: "case_study",
        for_intent: "uncertain",
        for_industries: ["all"],
        status: "active",
        steps: [
          {
            order: 1,
            subject_template: "{{name}}, see how {{business}} solved this...",
            body_template: `Hi {{name}},

Thanks for reaching out to {{business}}. I wanted to share a success story from a similar business that might help:

[Case Study 1: Business that went from struggling with X to achieving Y]

Key takeaway: This business saved {{amount}} in the first month.

Next step? Let's chat about your situation.

Best,
The {{business}} Team`,
            delay_hours: 0,
            type: "main",
          },
          {
            order: 2,
            subject_template: "One thing {{name}} might be missing...",
            body_template: `Hi {{name}},

Just wanted to follow up with one more resource that many of our customers find valuable:

[Feature Highlight or Testimonial]

"This one change increased our booking rate by 35%." - Sarah, Med Spa Owner

If you'd like to explore how this could work for {{business}}, I'm here to help.

{{business}} Team`,
            delay_hours: 24,
            type: "followup",
          },
          {
            order: 3,
            subject_template: "Last thing: Your free {{service}} assessment",
            body_template: `Hi {{name}},

No pressure, but I didn't want you to miss this:

We're offering a free 15-minute assessment for {{business}} owners right now to identify quick wins.

Ready? [Schedule Here]

{{business}} Team`,
            delay_hours: 48,
            type: "followup",
          },
        ],
      },
      {
        name: "Pricing Clarification Sequence",
        campaign_type: "pricing",
        for_intent: "pricing_concern",
        for_industries: ["all"],
        status: "active",
        steps: [
          {
            order: 1,
            subject_template: "{{name}}, pricing options for {{business}}...",
            body_template: `Hi {{name}},

Thanks for asking about pricing! I want to be transparent because cost matters.

Here's the reality:
- Our base service: $X/month
- Includes: Features A, B, C
- ROI: Typical client sees 3x return in month 1

And here's the best part: You only pay when you see results.

[See Pricing Page]

Let's talk more if you have questions.

{{business}} Team`,
            delay_hours: 0,
            type: "main",
          },
          {
            order: 2,
            subject_template: "How {{business}} is saving money with us...",
            body_template: `Hi {{name}},

Quick question: What's your biggest cost right now?

Many of our customers cut that by 40% in the first month. Here's how:

[Customer Story: How they reduced costs]

Want to see if this applies to {{business}}?

{{business}} Team`,
            delay_hours: 24,
            type: "followup",
          },
        ],
      },
      {
        name: "Question Answering Sequence",
        campaign_type: "feature_highlight",
        for_intent: "asking_question",
        for_industries: ["all"],
        status: "active",
        steps: [
          {
            order: 1,
            subject_template: "{{name}}, answering your question about {{service}}",
            body_template: `Hi {{name}},

Great question! Here's the detailed answer you asked for:

[Answer with details, examples, and proof points]

The bottom line: This works for businesses like {{business}} because [specific reason].

Got more questions? Reply anytime.

{{business}} Team`,
            delay_hours: 0,
            type: "main",
          },
          {
            order: 2,
            subject_template: "One more thing about {{service}}...",
            body_template: `Hi {{name}},

Since you asked about {{service}}, I thought you'd want to know:

[Additional insight or tip]

This often surprises people, but it makes a huge difference.

Let me know if you'd like to explore further.

{{business}} Team`,
            delay_hours: 24,
            type: "followup",
          },
        ],
      },
    ];

    let created = 0;
    for (const template of templates) {
      try {
        await base44.asServiceRole.entities.EmailCampaignTemplate.create(
          template
        );
        created++;
        console.log(`[Seed] Created template: ${template.name}`);
      } catch (err) {
        console.warn(`[Seed] Failed to create ${template.name}:`, err.message);
      }
    }

    return Response.json({
      success: true,
      templates_created: created,
      message: `${created} email templates seeded`,
    });
  } catch (error) {
    console.error("[Seed] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});