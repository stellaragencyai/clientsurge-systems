/**
 * ClientSurge Branded Email Templates
 *
 * Reusable email template builders for common conversion experiences.
 * Each function returns an HTML string using the csEmailShell framework.
 *
 * Usage in backend functions:
 *   import { csLeadReceivedEmail } from 'npm:@base44/sdk@...';
 *   const html = csLeadReceivedEmail({ leadName, businessName, ... });
 *
 * Templates:
 *   1. csLeadReceivedEmail       — Lead submitted confirmation
 *   2. csContactConfirmation     — Contact form submitted
 *   3. csAuditConfirmation      — Free audit requested
 *   4. csSignupConfirmation     — Account signup
 *   5. csOnboardingStarted     — Onboarding kicked off
 */
import {
  csEmailShell,
  csEmailEscape,
  csEmailClean,
  csPillButton,
  csInfoCard,
  CS_EMAIL_THEME,
  csLogoLockup,
  csEmailLogoUrl,
} from './clientSurgeEmailDesignSystem.ts';

const SUPPORT_EMAIL = () => Deno.env.get('CLIENTSURGE_SUPPORT_EMAIL') || 'support@clientsurgesystems.com';
const SUPPORT_PHONE = () => Deno.env.get('ADMIN_NOTIFICATION_PHONE') || '(602) 584-3227';
const WEBSITE_URL = () => Deno.env.get('CLIENTSURGE_WEBSITE_URL') || 'https://clientsurgesystems.com';

/**
 * 1. Lead Received Email — sent when a lead is submitted via any form.
 */
export function csLeadReceivedEmail(input: {
  leadName: string;
  businessName?: string;
  industryLabel?: string;
  leadSource: string;
  logoUrl?: string;
}): string {
  const name = csEmailClean(input.leadName) || 'there';
  const biz = csEmailClean(input.businessName);
  const industry = csEmailClean(input.industryLabel);

  const bodyParts: string[] = [];

  if (biz) {
    bodyParts.push(csInfoCard('Business', `${biz}${industry ? ` — ${industry}` : ''}`));
  }
  bodyParts.push(csInfoCard('What happens next', 'Our team reviews your information and reaches out to discuss your automation options. No demos, no sales pressure — just a tailored recommendation.', { accent: true }));

  return csEmailShell({
    badge: 'Lead Received',
    title: `Thanks, ${name}! We've got your info.`,
    subtitle: `Your request has been received and our team will reach out within 1 business day to discuss next steps.`,
    body: bodyParts.join(''),
    ctaHtml: csPillButton('Browse AI Systems', `${WEBSITE_URL()}/store`),
    footerTitle: 'ClientSurge Systems',
    footerText: `Reply to this email or contact ${SUPPORT_EMAIL()}. ${SUPPORT_PHONE()} · Phoenix, Arizona`,
    logoUrl: input.logoUrl || csEmailLogoUrl(),
  });
}

/**
 * 2. Contact Confirmation — sent when contact form is submitted.
 */
export function csContactConfirmationEmail(input: {
  name: string;
  topic?: string;
  logoUrl?: string;
}): string {
  const name = csEmailClean(input.name) || 'there';
  const topic = csEmailClean(input.topic);

  const bodyParts: string[] = [];
  if (topic) {
    bodyParts.push(csInfoCard('Your inquiry', topic, { accent: true }));
  }
  bodyParts.push(csInfoCard('Response time', 'We typically reply within a few hours during business days.'));

  return csEmailShell({
    badge: 'Message Received',
    title: `We got your message, ${name}.`,
    subtitle: `Thanks for reaching out. Our team will review your message and respond shortly.`,
    body: bodyParts.join(''),
    ctaHtml: csPillButton('Visit Our Store', `${WEBSITE_URL()}/store`),
    footerTitle: 'ClientSurge Systems',
    footerText: `Reply to this email or contact ${SUPPORT_EMAIL()}. ${SUPPORT_PHONE()} · Phoenix, Arizona`,
    logoUrl: input.logoUrl || csEmailLogoUrl(),
  });
}

/**
 * 3. Audit Confirmation — sent when free automation audit is requested.
 */
export function csAuditConfirmationEmail(input: {
  name: string;
  businessName?: string;
  logoUrl?: string;
}): string {
  const name = csEmailClean(input.name) || 'there';
  const biz = csEmailClean(input.businessName);

  const bodyParts: string[] = [];
  if (biz) {
    bodyParts.push(csInfoCard('Business', biz));
  }
  bodyParts.push(csInfoCard('What your audit includes', 'Review of your current lead response, missed-call recovery, follow-up automation, and booking pipeline. We identify gaps and recommend packaged AI systems to close them.', { accent: true }));

  return csEmailShell({
    badge: 'Audit Requested',
    title: `Your free audit is queued, ${name}.`,
    subtitle: `We'll review your current setup and send a tailored recommendation within 1 business day.`,
    body: bodyParts.join(''),
    ctaHtml: csPillButton('Browse AI Systems', `${WEBSITE_URL()}/store`),
    footerTitle: 'ClientSurge Systems',
    footerText: `Reply to this email or contact ${SUPPORT_EMAIL()}. ${SUPPORT_PHONE()} · Phoenix, Arizona`,
    logoUrl: input.logoUrl || csEmailLogoUrl(),
  });
}

/**
 * 4. Signup Confirmation — sent when a new account is created.
 */
export function csSignupConfirmationEmail(input: {
  email: string;
  logoUrl?: string;
}): string {
  const email = csEmailClean(input.email);

  const bodyParts: string[] = [];
  bodyParts.push(csInfoCard('Your account', email, { accent: true }));
  bodyParts.push(csInfoCard('What you can do now', 'Browse our store of packaged AI systems, add systems to your cart, and check out — done-for-you setup included.'));

  return csEmailShell({
    badge: 'Welcome Aboard',
    title: `Welcome to ClientSurge Systems.`,
    subtitle: `Your account has been created. Browse our AI systems and add them to your cart — no demos required.`,
    body: bodyParts.join(''),
    ctaHtml: csPillButton('Browse the Store', `${WEBSITE_URL()}/store`),
    footerTitle: 'ClientSurge Systems',
    footerText: `Reply to this email or contact ${SUPPORT_EMAIL()}. ${SUPPORT_PHONE()} · Phoenix, Arizona`,
    logoUrl: input.logoUrl || csEmailLogoUrl(),
  });
}

/**
 * 5. Onboarding Started — sent when a purchase triggers onboarding.
 */
export function csOnboardingStartedEmail(input: {
  name: string;
  packageName?: string;
  logoUrl?: string;
}): string {
  const name = csEmailClean(input.name) || 'there';
  const pkg = csEmailClean(input.packageName);

  const bodyParts: string[] = [];
  if (pkg) {
    bodyParts.push(csInfoCard('Your system', pkg, { accent: true }));
  }
  bodyParts.push(csInfoCard('Setup timeline', 'We configure, test, and install your system within 5-7 business days. You\'ll receive setup instructions and access collection links shortly.'));

  return csEmailShell({
    badge: 'Onboarding Started',
    title: `Let's get your system live, ${name}.`,
    subtitle: `Your purchase is confirmed and our team is already preparing your setup. Here's what to expect next.`,
    body: bodyParts.join(''),
    ctaHtml: csPillButton('Go to Client Portal', `${WEBSITE_URL()}/client-portal`),
    footerTitle: 'ClientSurge Systems',
    footerText: `Reply to this email or contact ${SUPPORT_EMAIL()}. ${SUPPORT_PHONE()} · Phoenix, Arizona`,
    logoUrl: input.logoUrl || csEmailLogoUrl(),
  });
}