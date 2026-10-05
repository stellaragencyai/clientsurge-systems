# First 15 Remediation Issue Seed

Last updated: 2026-08-01

This file is ready to copy into GitHub issues or a project board after owner approval. It avoids creating external tracker state while the first remediation patch is still being validated.

## Milestone

Title: `First 15 completion gate`

Goal: stabilize the launch-remediation branch, close the highest-risk backend security gaps, and establish release proof before production publish.

## Issues

1. Title: `Create clean first-15 remediation branch`
   Labels: `release`, `security`, `workflow`
   Acceptance: branch is isolated from local checkout noise; known Windows filename collision is documented or removed; no production publish occurs.

2. Title: `Create first-15 GitHub project plan`
   Labels: `release`, `project-management`
   Acceptance: the 15-task issue list is approved, imported, and linked to the remediation branch or PR.

3. Title: `Add launch gate policy`
   Labels: `release`, `governance`
   Acceptance: checked-in policy documents local gates, live gates, approval-required actions, and rollback evidence.

4. Title: `Make repository lint pass`
   Labels: `quality`, `frontend`
   Acceptance: `npm run lint` exits 0 on the remediation branch.

5. Title: `Resolve or document production dependency audit`
   Labels: `security`, `dependencies`
   Acceptance: `npm audit --omit=dev` has no critical findings; remaining findings have safe upgrade decisions or explicit blockers.

6. Title: `Expand typecheck coverage`
   Labels: `quality`, `frontend`
   Acceptance: `npm run typecheck` covers `src/**/*.js` and `src/**/*.jsx` without excluding UI, API, or lib code.

7. Title: `Generate backend function authorization matrix`
   Labels: `security`, `backend`
   Acceptance: function audit output classifies admin, authenticated, owner-or-admin, signed-webhook, and signed-internal guards.

8. Title: `Add shared backend auth helpers`
   Labels: `security`, `backend`
   Acceptance: shared guards support admin-only, owner-or-admin, signed-internal, and admin-or-signed-internal paths with tests.

9. Title: `Guard cancelSubscription by owner or admin`
   Labels: `security`, `billing`
   Acceptance: cancellation requires the order owner or admin; unauthorized attempts return structured 401/403 responses.

10. Title: `Guard sendSMS by admin or signed internal call`
    Labels: `security`, `sms`
    Acceptance: direct public calls without admin session or internal secret are rejected.

11. Title: `Guard sendInstantLeadResponseSms by admin or signed internal call`
    Labels: `security`, `sms`
    Acceptance: direct public calls without admin session or internal secret are rejected.

12. Title: `Guard triggerVoiceCallToLead by admin or signed internal call`
    Labels: `security`, `voice`
    Acceptance: direct public calls without admin session or internal secret are rejected.

13. Title: `Make Order updates admin-only at RLS layer`
    Labels: `security`, `data`
    Acceptance: `Order` update RLS is restricted to admins and covered by a regression test.

14. Title: `Make Subscription updates admin-only at RLS layer`
    Labels: `security`, `data`
    Acceptance: `Subscription` update RLS is restricted to admins and covered by a regression test.

15. Title: `Make ClientInstallationOS updates admin-only at RLS layer`
    Labels: `security`, `data`
    Acceptance: `ClientInstallationOS` update RLS is restricted to admins and covered by a regression test.
