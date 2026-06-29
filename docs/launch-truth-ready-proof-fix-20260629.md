# Launch Truth Ready-for-Proof Fix — 2026-06-29

This patch corrects the Launch Truth Sprint status logic so the dashboard does not lie.

## What changed

- Manual/external verification gates now move to `ready_for_proof` when their prerequisites exist.
- `twilio_voice_gate` becomes `ready_for_proof` only when a valid voice webhook URL exists.
- `booking_flow_gate` becomes `ready_for_proof` only when a valid booking link exists.
- `voice_frontline_gate` becomes `ready_for_proof` only when the ElevenLabs agent ID and phone number secrets exist.
- `elevenlabs_postcall_logging_gate` becomes `ready_for_proof` only when ElevenLabs webhook secret configuration exists, or when a real post-call record exists.
- `stripe_payment_gate` remains blocked until there is a real non-test paid order with Stripe identity evidence.
- Internal/test/orphan SMS, automation job, and dead-letter records are excluded from production blockers and moved into cleanup/warning evidence.

## What this intentionally does not do

- It does not mark gates `approved`.
- It does not fake `proof_passed`.
- It does not make Stripe look ready without a real checkout.

## Verification steps

1. Merge/publish the branch.
2. Open Admin Dashboard → Launch Truth Sprint.
3. Click Re-run Sprint.
4. Confirm Booking, Twilio Voice, Voice Front-Line, and ElevenLabs Post-Call move to `ready_for_proof` only when their prerequisites exist.
5. Confirm Stripe stays `blocked` until a real paid order exists.
6. Confirm Dashboard Truth no longer treats legacy/orphan/test jobs as production blockers.
