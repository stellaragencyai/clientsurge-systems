# Email Preview Fixtures

Generate local HTML previews without sending real customer emails:

```bash
npm run email:build-previews
```

The generator writes preview files into:

```text
docs/email/previews/generated/
```

Current fixture coverage:

- Weekly Digest
- Monthly Client Report
- Missing Credentials Alert
- Direct Follow-Up
- Nurture Step 1

## Rules

- Preview fixtures must never send email.
- Preview fixtures must use fake/sample data only.
- Preview fixtures should use the same ClientSurge visual language as production templates.
- Do not include customer emails, order IDs, secrets, passwords, private tokens, or Stripe live data in preview fixtures.

## Suggested QA workflow

1. Run `npm run email:build-previews`.
2. Open the generated HTML files in a browser.
3. Compare the output against `docs/email/QA_CHECKLIST.md`.
4. Run `npm run email:branding-check` before opening a pull request.
