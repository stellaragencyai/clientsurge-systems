# Email Launch Hardening

## Manual Verification Required

- Confirm `support@clientsurgesystems.com` receives public form mail.
- Confirm `system@clientsurgesystems.com` receives backend/admin alerts.
- Confirm `nolan@clientsurgesystems.com` receives direct sales replies.
- Confirm `billing@clientsurgesystems.com` and `onboarding@clientsurgesystems.com` exist or alias correctly before paid-client launch.
- Confirm catch-all routing is disabled unless intentionally configured.
- Confirm SPF, DKIM, DMARC, MX, and Resend domain verification in the DNS control plane.

## Safe Test Harness

Run only with a single safe inbox:

```powershell
npm run email:safe-test
```

The harness refuses missing `TEST_EMAIL_RECIPIENT`, uses fake `.test` lead data, labels all subjects with `[TEST]`, and never reads CRM lead or campaign recipient entities.
