# Twilio Proof

This checklist proves SMS, link-click, status callback, and voice behavior.

## SMS proof

1. Send a controlled SMS through the app path, not directly from the Twilio console.
2. Confirm a `CommunicationEvent` or `CommunicationLog` row stores the Twilio message SID.
3. Confirm status callback updates the row to sent, delivered, or failed.
4. Treat queued/accepted as incomplete proof.
5. Confirm STOP/opt-out language is present where required.

## Link-click proof

1. Send an SMS with a long URL through the Messaging Service that uses `sms.clientsurgesystems.com`.
2. Click the shortened link.
3. Confirm `receiveTwilioLinkClick` creates a `CommunicationEvent` with event type `sms_link_clicked` or `sms_link_previewed`.
4. Confirm matched clicks update the lead; unmatched clicks must be warning/unmatched, not trusted.

## Voice proof

1. Place a real test call to the configured ClientSurge number.
2. Confirm the voice webhook responds.
3. Confirm any missed-call text-back is logged with call SID and SMS SID.
4. Confirm duplicate callbacks do not create duplicate trusted proof.

## Pass condition

Twilio passes only when provider IDs, callback rows, lead linkage, and manual device/call proof agree.
