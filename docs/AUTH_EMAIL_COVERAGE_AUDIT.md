# Auth Email Coverage Audit

Scope: forgot password, reset password, password changed, email verification, magic link, login alert, and related authentication emails.

## Current repository finding

Code search did not find app-owned email templates for:

- forgot password
- reset password
- password changed
- email verification
- magic link login
- login alert
- new device login

This strongly suggests these emails are handled by Base44's built-in authentication provider rather than by a custom function inside this GitHub repository.

## What this means

The app email-template upgrade can cover all custom ClientSurge emails that are sent by Base44 functions and Resend. It does not automatically replace Base44 platform-auth transactional emails unless Base44 exposes auth email branding/customization settings for this app.

## Required Base44 check

Before marking authentication emails complete, verify inside Base44 whether the app exposes branded auth email settings for:

- reset password
- verification email
- invitation / portal invite
- magic link login

If Base44 allows custom auth email templates, they should use the same shared ClientSurge Email Design System introduced in:

`base44/functions/_shared/clientSurgeEmailDesignSystem.ts`

If Base44 does not expose those templates, confirm whether auth branding can be controlled globally through app logo, app name, support email, sender domain, and custom domain settings.

## Standard for any auth email we can customize

- Never send passwords by email.
- Use only secure links.
- Use the top-left logo lockup.
- Use the electric ClientSurge theme.
- Keep copy short and trust-focused.
- Include a security note.
- Include support contact in footer.

## Recommended forgot password copy

Subject: `Reset your ClientSurge password`

Hero: `Reset your ClientSurge password.`

Body: `Use the secure button below to reset your password. This link should only be used by you. If you did not request this, you can safely ignore this email.`

CTA: `Reset Password`

Security note: `ClientSurge will never ask you to send passwords by email.`

## Recommended email verification copy

Subject: `Verify your ClientSurge email`

Hero: `Verify your email address.`

Body: `Confirm this email address so your ClientSurge account can receive setup updates, portal notifications, and support messages.`

CTA: `Verify Email`

## Recommended magic link copy

Subject: `Your ClientSurge sign-in link`

Hero: `Sign in to ClientSurge.`

Body: `Use this secure sign-in link to access your ClientSurge account. If you did not request this, ignore this email.`

CTA: `Sign In Securely`
