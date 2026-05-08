# Schema Field Additions — #464 #467 #471
**Date:** May 8, 2026 | **Author:** Agent Smith

## #464 — Order.install_configuration schema additions
Add to Order entity's install_configuration nested schema:
- `voice_sample_url` (string): URL to recorded voice sample in private storage
- `voice_clone_status` (enum): "not_started" | "intake_sent" | "recording_received" | "cloned" | "active"

## #467 — ClientInstallationOS.website_spec_id
Add field to ClientInstallationOS:
- `website_spec_id` (string): ID linking to the WebsiteSpec entity record

## #471 — Order.activation_errors array
Add field to Order entity:
- `activation_errors` (array of objects): Each entry: { service_key, error_message, failed_at, retried }
- Replaces ad-hoc activation_log error tracking with a dedicated structured field

**Implementation:** Update entity schemas via Base44 admin panel or manage_entity_schemas tool.
All three fields are additive — no breaking changes to existing records.
