import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pauseSource = readFileSync(
  new URL("../base44/functions/pauseSubscription/entry.ts", import.meta.url),
  "utf8"
);

const resumeSource = readFileSync(
  new URL("../base44/functions/resumeSubscription/entry.ts", import.meta.url),
  "utf8"
);

test("pauseSubscription is admin-only and pauses Stripe payment collection", () => {
  assert.match(pauseSource, /requireAdminUser/);
  assert.match(pauseSource, /AuthGuardError/);
  assert.match(pauseSource, /PAUSE_BEHAVIORS/);
  assert.match(pauseSource, /pause_collection\[behavior\]/);
  assert.match(pauseSource, /pause_collection\[resumes_at\]/);
  assert.match(pauseSource, /stripeRequest\(\s*`\/subscriptions\/\$\{order\.stripe_subscription_id\}`/);
});

test("pauseSubscription mirrors pause state locally and writes an audit event", () => {
  assert.match(pauseSource, /billing_status:\s*"paused_collection"/);
  assert.match(pauseSource, /subscription_pause_behavior/);
  assert.match(pauseSource, /Subscription\.update/);
  assert.match(pauseSource, /CommunicationEvent\.create/);
  assert.match(pauseSource, /context_type:\s*"subscription_pause"/);
});

test("resumeSubscription is admin-only and clears Stripe pause_collection", () => {
  assert.match(resumeSource, /requireAdminUser/);
  assert.match(resumeSource, /AuthGuardError/);
  assert.match(resumeSource, /params\.set\("pause_collection",\s*""\)/);
  assert.match(resumeSource, /stripeRequest\(\s*`\/subscriptions\/\$\{order\.stripe_subscription_id\}`/);
});

test("resumeSubscription clears local pause markers and writes an audit event", () => {
  assert.match(resumeSource, /subscription_pause_behavior:\s*null/);
  assert.match(resumeSource, /subscription_resumed_at/);
  assert.match(resumeSource, /Subscription\.update/);
  assert.match(resumeSource, /CommunicationEvent\.create/);
  assert.match(resumeSource, /context_type:\s*"subscription_resume"/);
});
