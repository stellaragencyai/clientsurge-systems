# Client Onboarding Access Checklist

Use this checklist after payment and before build work. Never store raw passwords, API keys, recovery codes, private tokens, or unrestricted credentials in GitHub, markdown, chat, or screenshots.

Status values:

- Not Requested
- Requested
- Received
- Verified
- Blocked
- Not Needed

| Access Item | Required / Optional | Why It Is Needed | Who Provides It | Secure Collection Method | Verification Step | Blocker If Missing |
| --- | --- | --- | --- | --- | --- | --- |
| Website/CMS | Required if ClientSurge edits site/forms | Connect forms, embeds, pixels, and visible customer flow | Client owner or web admin | Delegated user invite or approved secure credential vault | Admin can access the needed CMS area without raw password exposure | Cannot install forms or verify website path |
| Domain/DNS | Required when email, tracking, landing, or domain routing changes are needed | Verify domain, email records, tracking, and routing | Domain admin | Delegated DNS access or screen-share update with client | DNS zone is visible and permissions are sufficient | Cannot verify domain/email/routing |
| Google Workspace/email | Required when sending domain email or routing inboxes | Configure sender, aliases, support inbox, or email routing | Google Workspace admin | Admin invite/delegated access; no password sharing | Required inbox/alias/sender exists and can receive mail | Client cannot receive onboarding/support/billing mail |
| CRM/tools | Required if package includes CRM sync | Create or verify lead records and statuses | CRM owner/admin | OAuth/delegated app access or scoped test credentials | Test lead can be created or viewed safely | No CRM update proof |
| Google Business Profile | Optional unless package includes GBP work | Verify profile and lead source context | Business owner | Manager invite to ClientSurge account | Access role visible and sufficient | GBP tasks blocked |
| Phone/Twilio | Required if SMS/voice/missed-call is included | Configure SMS, phone routing, voice, missed-call flows | Phone/Twilio owner | Twilio subaccount/invite or scoped provider access | Test number/sender can be inspected and configured | SMS/voice cannot go live |
| Booking/calendar | Required if booking automation is included | Send booking links and verify appointment flow | Client or scheduling admin | Calendar booking admin invite or booking link setup access | Test booking path reaches correct calendar or request flow | AI booking agent cannot be accepted |
| Stripe/payment if needed | Optional unless payment integration is included | Verify payment links, billing, or checkout recovery | Billing owner | Stripe team invite with scoped role; never share secret keys in chat | Test-mode or dashboard proof is available | Payment automation blocked |
| Brand assets | Required for client-facing templates | Keep messaging on-brand | Client owner/marketing contact | Portal upload or shared drive link | Logo, colors, tone, and approved images are accessible | Handoff/templates remain generic |
| Contact preferences | Required | Route alerts and support correctly | Client owner | Onboarding form or portal settings | Admin notification destination confirmed | Notifications may route to wrong person |
| Business hours | Required for lead/booking behavior | Avoid off-hours confusion and set fallback behavior | Client owner | Onboarding form | Hours are present and timezone is clear | Automation may answer with wrong availability |
| Service areas | Required for qualification | Qualify leads and route inquiries correctly | Client owner | Onboarding form | Service areas are listed and usable | Lead qualification incomplete |
| Emergency contacts | Required for support escalation | Contact client for urgent down events | Client owner | Portal settings or onboarding form | Primary and backup contacts exist | Urgent incidents lack escalation path |
| Existing lead sources | Required | Connect forms, calls, ads, GBP, and referral sources | Client owner/marketing contact | Onboarding form and admin audit | Each lead source has current destination | Lead capture audit incomplete |
| Existing forms | Required if forms exist | Verify capture, routing, consent, and hidden fields | Website/CMS admin | CMS access or form admin invite | Test submission path is identified | Form capture cannot be verified |
| Existing tracking pixels if applicable | Optional unless analytics/reporting is included | Preserve attribution and avoid duplicate tracking | Marketing/admin contact | Tag manager/analytics delegated access | Pixel/container IDs are documented without secrets | Reporting attribution incomplete |

## Access Review Rules

- Required access must be `Verified` or explicitly marked `Not Needed` before go-live.
- `Received` is not enough for go-live; the fulfillment owner must verify the access works.
- If access is `Blocked`, record the missing item, owner, requested date, and client-facing impact.
- Provider secrets must remain in approved provider dashboards, environment stores, or secure vaults, not in docs.

