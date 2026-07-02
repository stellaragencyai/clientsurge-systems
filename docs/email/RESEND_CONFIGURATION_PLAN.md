# Resend Configuration Plan — ClientSurge Systems

## Sender identities

| Identity | Display name | Address | Reply-to | Purpose |
|---|---|---|---|---|
| system | ClientSurge Systems | system@clientsurgesystems.com | support@clientsurgesystems.com | Automated lifecycle notifications |
| support | ClientSurge Support | support@clientsurgesystems.com | support@clientsurgesystems.com | Customer help and setup support |
| founder | Nolan Strommer · ClientSurge Systems | nolan@clientsurgesystems.com | nolan@clientsurgesystems.com | Reports and high-trust client communication |
| sales | ClientSurge Sales | sales@clientsurgesystems.com | nolan@clientsurgesystems.com | Demo, nurture, and lead follow-up |
| billing | ClientSurge Billing | billing@clientsurgesystems.com | billing@clientsurgesystems.com | Invoices, payment, and subscription notices |

## Required Resend/domain checks

- Domain `clientsurgesystems.com` verified in Resend.
- DKIM records pass.
- SPF includes the active sending provider and aligns.
- DMARC exists and aligns.
- Bounce and complaint monitoring enabled where available.
- Default sender names are professional display names, not raw inbox names.

## Tag taxonomy

Use these tags consistently:

- `sender_identity`: `system`, `support`, `founder`, `sales`, `billing`
- `category`: `activation`, `order_confirmation`, `portal_welcome`, `demo_confirmation`, `demo_prep`, `went_live`, `milestone`, `daily_digest`, `weekly_digest`, `monthly_client_report`, `missing_credentials_alert`, `direct_follow_up`, `nurture_step_1` through `nurture_step_8`

## Reply-to policy

- System emails: support@clientsurgesystems.com
- Support/setup emails: support@clientsurgesystems.com
- Founder/report emails: nolan@clientsurgesystems.com
- Sales/demo/nurture emails: nolan@clientsurgesystems.com or sales@clientsurgesystems.com depending on sender availability
- Billing emails: billing@clientsurgesystems.com

## Production safety

- Do not send marketing/nurture campaigns unless `EMAIL_CAMPAIGN_ENABLED=true`.
- Do not send campaign/outreach emails unless `EMAIL_DELIVERABILITY_PROOF_STATUS` is `verified`, `passed`, or `production_verified`.
- Do not ask customers to email credentials or passwords.
- Credentials should only be submitted through a secure ClientSurge setup link.

## Recommended next Resend portal actions

1. Confirm every sender address exists or aliases correctly in Google Workspace.
2. Confirm Resend can send from the verified domain.
3. Send one test message from each sender identity.
4. Verify Gmail inbox rendering and sender display names.
5. Verify replies route to the intended inbox.
6. Review bounces/complaints weekly during the first month of production use.
