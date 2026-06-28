# Call Recording + AI Disclosure Language

Last updated: 2026-06-28
Owner: ClientSurge Systems
Status: Draft operating language for review before broader deployment

This document provides disclosure language for phone, SMS, booking, AI receptionist, and customer-facing consent contexts. It is not legal advice. Recording and consent laws vary by jurisdiction and should be reviewed before use in production workflows.

---

## 1. Short Website / Booking Disclosure

Use near booking forms, audit forms, or contact forms where a phone call may follow.

> By submitting this form, you agree that ClientSurge Systems may contact you by phone, SMS, or email about your inquiry. Calls may be assisted, summarized, or reviewed using AI tools. If a call is recorded, we will use it for quality, training, support, and service improvement purposes where permitted by law.

---

## 2. SMS Consent Language

Use near SMS opt-in checkbox.

> I agree to receive automated and non-automated SMS messages from ClientSurge Systems about my inquiry, appointments, service updates, and follow-up. Message frequency varies. Message and data rates may apply. Consent is not a condition of purchase. Reply STOP to opt out.

---

## 3. AI Receptionist Greeting Disclosure

Use at the start of AI voice receptionist calls.

> Thanks for calling ClientSurge Systems. This call may be handled or assisted by an AI receptionist and may be recorded or summarized for quality, training, and follow-up. How can I help you today?

Alternative shorter version:

> Thanks for calling ClientSurge Systems. You may be speaking with an AI assistant, and this call may be recorded or summarized for quality and follow-up.

---

## 4. Missed-Call Text-Back Disclosure

Use in templates or documentation for missed-call automation.

> Sorry we missed your call. This is ClientSurge Systems. We use automated SMS follow-up to respond faster to inquiries. Reply STOP to opt out.

---

## 5. Client-Facing Service Disclosure

Use in onboarding, contracts, or service descriptions.

> ClientSurge Systems may use automation and AI-assisted tools to help capture leads, respond to inquiries, summarize conversations, route messages, schedule appointments, and support follow-up workflows. AI-assisted outputs may be reviewed or edited by our team. Clients are responsible for providing accurate business information and maintaining legally sufficient consent for their own customer communications.

---

## 6. Internal Operator Notes

Before enabling call recording, confirm:
- Whether recording is enabled by Twilio, ElevenLabs, or another provider
- Whether the caller hears a disclosure before recording starts
- Whether customer/client industries have extra requirements
- Whether the client has consent language on their own website/forms
- Whether call summaries are stored, where, and for how long
- Whether opt-out requests stop future SMS follow-up

Do not claim:
- Calls are always recorded unless recording is truly enabled
- AI is always human-supervised unless that is operationally true
- ClientSurge provides legal compliance guarantees
- AI output is error-free

---

## 7. Recommended Legal Page Addition

Suggested Privacy Policy section:

Title: Call Recording, AI Voice, and Conversation Summaries

Body: We may use AI-assisted voice tools, call summaries, and conversation analysis to support customer service, appointment scheduling, lead routing, training, quality assurance, and service improvement. Where enabled and permitted by law, calls may be recorded or summarized. We may store call metadata, transcripts, summaries, caller details, message history, and follow-up notes as part of our business records. You may contact support@clientsurgesystems.com with questions about your communication preferences.

Suggested Terms section:

Title: AI Voice and Call Recording Responsibilities

Body: Some ClientSurge services may include AI-assisted phone, SMS, email, or booking workflows. Clients are responsible for approving customer-facing scripts, providing accurate business details, honoring opt-outs, and ensuring their own use of call recording, AI voice, SMS, email, and customer communications complies with laws, regulations, and platform rules that apply to their business.

---

## 8. Launch Rule

Do not mark call-recording/AI disclosure as fully deployed until:
- the public legal page contains the disclosure language,
- booking/contact forms show appropriate consent copy,
- AI/voice greetings include disclosure when applicable,
- SMS templates include STOP/opt-out language,
- and the owner confirms the final language is acceptable.
