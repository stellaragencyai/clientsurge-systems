import { secureJson } from "../_shared/response.ts";
/**
 * generateSocialContent
 * Generates blog posts and social media content for ClientSurge Systems.
 *
 * Payload:
 *   - industry: "general" | "med_spa" | "dental" | "chiropractic" | "hvac" | "roofing" | "contractors"
 *   - content_types: string[] e.g. ["blog_post", "linkedin", "instagram", "facebook", "twitter", "tiktok_script"]
 *   - topic_override: string (optional) — custom topic, otherwise AI picks one
 *
 * Returns: { logs: SocialContentLog[] } — also persists records to DB
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const INDUSTRY_META = {
  general: {
    label: 'ClientSurge Systems',
    niche: 'AI-powered lead automation for local service businesses',
    audience: 'small business owners and service business entrepreneurs',
    pain_points: 'missed leads, slow follow-up, no automation, losing revenue to competitors who respond faster',
    platforms: ['linkedin', 'instagram', 'facebook', 'twitter'],
  },
  med_spa: {
    label: 'Med Spa & Aesthetics',
    niche: 'AI automation for med spas, aesthetic clinics, and beauty businesses',
    audience: 'med spa owners and aesthetic clinic operators',
    pain_points: 'leads going cold within 5 minutes, missed consultation calls, staff too busy to follow up, seasonal demand spikes',
    platforms: ['instagram', 'facebook', 'tiktok_script'],
  },
  dental: {
    label: 'Dental & Orthodontics',
    niche: 'AI automation for dental practices and orthodontic clinics',
    audience: 'dental practice owners and office managers',
    pain_points: 'no-show appointments, missed new patient inquiries, outdated follow-up, front desk overload',
    platforms: ['facebook', 'linkedin', 'instagram'],
  },
  chiropractic: {
    label: 'Chiropractic & Physical Therapy',
    niche: 'AI automation for chiropractic and PT clinics',
    audience: 'chiropractors and physical therapy clinic owners',
    pain_points: 'missed calls during adjustments, slow lead response, no nurture sequence, losing patients to competitors',
    platforms: ['facebook', 'instagram', 'linkedin'],
  },
  hvac: {
    label: 'HVAC & Home Services',
    niche: 'AI automation for HVAC and home service contractors',
    audience: 'HVAC business owners and home service contractors',
    pain_points: 'missing emergency calls, seasonal demand surges with no system, slow quote follow-up, losing jobs to faster competitors',
    platforms: ['facebook', 'linkedin', 'twitter'],
  },
  roofing: {
    label: 'Roofing & Restoration',
    niche: 'AI automation for roofing contractors and storm restoration companies',
    audience: 'roofing business owners and restoration contractors',
    pain_points: 'slow storm-damage lead response, no follow-up on estimates, losing jobs to competitors who respond in 2 minutes',
    platforms: ['facebook', 'linkedin', 'instagram'],
  },
  contractors: {
    label: 'General Contractors & Trades',
    niche: 'AI automation for general contractors and trade businesses',
    audience: 'general contractors, remodelers, and trade business owners',
    pain_points: 'losing remodel leads, no follow-up on estimates, scattered lead management, missed calls on job sites',
    platforms: ['facebook', 'linkedin', 'instagram'],
  },
};

const BLOG_TOPICS = {
  general: [
    'How AI Automation Is Changing How Local Service Businesses Win Customers',
    'The 5-Minute Rule: Why Your Business Loses 80% of Leads After 5 Minutes',
    'What Is Missed Call Text-Back and Why Every Service Business Needs It',
    'From Lead to Booked: How Automated Follow-Up Sequences Work',
    'AI vs. Hiring: Which Grows Your Service Business Faster?',
    'The ROI of Automation: How to Calculate What a Missed Lead Really Costs',
  ],
  med_spa: [
    'Why Med Spas Lose 60% of Botox Consultation Requests (And How to Fix It)',
    'Automated Follow-Up for Med Spas: How to Convert Inquiries While You Are With Patients',
    'The Secret Weapon Top Med Spas Use to Book More Consultations',
    'AI Receptionist for Aesthetic Clinics: What It Is and Why It Works',
    'How to Recover Lost Med Spa Leads With Automated Text-Back',
  ],
  dental: [
    'Why Dental Practices Miss 40% of New Patient Calls and What To Do About It',
    'Automated Appointment Reminders: How Dental Offices Eliminate No-Shows',
    'How AI Follow-Up Helps Dental Practices Book More New Patients',
    'The Front Desk Problem: How Dental Offices Are Using AI to Handle Overflow',
    'Missed Call Recovery for Dental Practices: A Step-by-Step Guide',
  ],
  chiropractic: [
    'The Number 1 Reason Chiropractic Clinics Lose New Patients (It Is Not What You Think)',
    'How Automated Follow-Up Fills Chiropractic Appointment Slots Automatically',
    'AI for Chiropractic: How to Answer Every Lead Without Hiring More Staff',
    'Text-Back Automation for Chiropractors: How It Works in Real Life',
    'Converting Chiropractic Inquiries at 2AM: The Power of 24/7 AI Follow-Up',
  ],
  hvac: [
    'How HVAC Companies Win More Jobs by Responding in Under 2 Minutes',
    'HVAC Lead Follow-Up: Why Speed Beats Price Every Time',
    'Handling the Summer Rush: How HVAC Businesses Use AI to Never Miss a Lead',
    'Missed Call Text-Back for HVAC: Real Numbers from Real Contractors',
    'AI Dispatch for HVAC: Automating Quotes, Callbacks, and Booking',
  ],
  roofing: [
    'Storm Season Automation: How Roofers Close More Jobs When It Matters Most',
    'Why Roofing Contractors Lose 70% of Storm Damage Leads (and How to Stop It)',
    'AI for Roofing: How to Follow Up on Every Estimate Without Lifting a Finger',
    'The 2-Minute Advantage: How Fast Roofers Win Jobs Before Competitors Respond',
    'Automated Lead Follow-Up for Roofing Contractors: A Practical Guide',
  ],
  contractors: [
    'Why General Contractors Lose Remodel Leads in the First Hour',
    'AI Estimation Follow-Up: How Contractors Close More Jobs Automatically',
    'The Missed Call Problem in Construction: How AI Solves It',
    'How Trade Businesses Are Using Automation to Compete with Larger Companies',
    'Automated Quote Follow-Up for Contractors: Turn More Estimates Into Jobs',
  ],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function generateBlogPost(base44, industry, meta, topic) {
  const prompt = `You are a content strategist and SEO writer for ClientSurge Systems, an AI automation company for local service businesses.

Write a comprehensive, SEO-optimized blog post for the topic: "${topic}"

Target audience: ${meta.audience}
Industry: ${meta.label}
Core message: ${meta.niche}
Pain points addressed: ${meta.pain_points}

Requirements:
- 700-900 words
- SEO-friendly structure with H2 subheadings
- Include a compelling intro that hooks the reader immediately
- Use real-feeling statistics and examples (can be illustrative)
- Include a strong CTA at the end pointing to ClientSurge Systems
- Write in a confident, helpful, authoritative tone
- Do NOT use jargon — write for a busy business owner

Return JSON: {
  "title": "...",
  "meta_description": "...(150 chars max)",
  "body": "...(full HTML-ready blog post with <h2>, <p> tags)",
  "seo_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "word_count": 0
}`;

  return await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: { type: 'object' },
    model: 'claude_sonnet_4_6',
  });
}

async function generateSocialPost(base44, industry, meta, contentType, topic) {
  const platformGuides = {
    linkedin: 'LinkedIn (professional, 150-250 words, thought-leadership angle, 3-5 relevant hashtags, end with a question to drive comments)',
    instagram: 'Instagram (punchy caption, 80-120 words, heavy use of emojis, 10-15 hashtags, hook in first line, CTA to DM or link in bio)',
    facebook: 'Facebook (conversational, 100-150 words, storytelling angle, 2-3 hashtags, question or poll CTA)',
    twitter: 'Twitter/X (under 240 chars, punchy stat or hot take, 2-3 hashtags, strong opinion)',
    tiktok_script: 'TikTok video script (15-30 second hook + value + CTA format, conversational, energetic, includes on-screen text suggestions)',
  };

  const guide = platformGuides[contentType] || platformGuides.linkedin;

  const prompt = `You are a social media content creator for ClientSurge Systems, an AI automation company for local service businesses.

Create a ${contentType.replace('_', ' ')} post about: "${topic}"
Platform guidelines: ${guide}

Industry angle: ${meta.label}
Audience: ${meta.audience}
Pain points: ${meta.pain_points}

Brand voice: Direct, confident, relatable to business owners. Not corporate or salesy. Use the angle that automation = more revenue + less stress.
Always tie back to ClientSurge Systems naturally (not forcefully).

Return JSON: {
  "title": "Post title or hook line",
  "body": "Full post content ready to copy-paste",
  "hashtags": ["hashtag1", "hashtag2"],
  "platform_tip": "One tip for best posting time or format for this platform"
}`;

  return await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: { type: 'object' },
    model: 'claude_sonnet_4_6',
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow admin users or scheduled automation calls
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    const ua = req.headers.get('user-agent') || '';
    const isAutomation = ua.includes('base44');
    if (user && user.role !== 'admin') {
      return secureJson({ error: 'Admin access required' }, { status: 403 });
    }
    if (!user && !isAutomation) {
      return secureJson({ error: 'Forbidden' }, { status: 403 });
    }

    const { industry = 'general', content_types, topic_override } = await req.json();

    const meta = INDUSTRY_META[industry];
    if (!meta) {
      return secureJson({ error: `Unknown industry: ${industry}` }, { status: 400 });
    }

    const typesToGenerate = content_types && content_types.length > 0
      ? content_types
      : ['blog_post', ...meta.platforms];

    const topic = topic_override || pickRandom(BLOG_TOPICS[industry] || BLOG_TOPICS.general);

    console.log(`[generateSocialContent] industry=${industry} topic="${topic}" types=${typesToGenerate.join(',')}`);

    const savedLogs = [];

    await Promise.all(typesToGenerate.map(async (contentType) => {
      try {
        let generated;
        if (contentType === 'blog_post') {
          generated = await generateBlogPost(base44, industry, meta, topic);
        } else {
          generated = await generateSocialPost(base44, industry, meta, contentType, topic);
        }

        const log = await base44.asServiceRole.entities.SocialContentLog.create({
          industry,
          content_type: contentType,
          platform: contentType === 'blog_post' ? 'Blog / Website' : contentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          title: generated.title || topic,
          body: generated.body || generated.content || '',
          hashtags: generated.hashtags || generated.seo_keywords || [],
          seo_keywords: generated.seo_keywords || [],
          status: 'draft',
          topic,
          word_count: generated.word_count || 0,
          generated_by: user?.email || 'automation',
        });

        savedLogs.push(log);
        console.log(`[generateSocialContent] ✓ saved ${contentType} for ${industry}`);
      } catch (err) {
        console.error(`[generateSocialContent] ✗ failed ${contentType} for ${industry}: ${err.message}`);
      }
    }));

    return secureJson({
      success: true,
      industry,
      topic,
      generated: savedLogs.length,
      logs: savedLogs,
    });

  } catch (error) {
    console.error('[generateSocialContent] Fatal:', error.message);
    return secureJson({ error: error.message }, { status: 500 });
  }
});