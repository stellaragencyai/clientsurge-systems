# Manual Onboarding SOP

## Goal

Bring a newly paid client from order to install-ready without relying on hidden assumptions.

## Steps

1. Confirm the paid `Order` exists and has:
   - `payment_status = paid`
   - `client_id`
   - `client_project_id`
   - `install_configuration`
2. Confirm linked records exist:
   - `Client`
   - `ClientProject`
   - `OnboardingClient`
3. Send or resend the portal welcome/invite email if the client has not activated access.
4. Verify the credentials intake is complete or send the credentials request flow.
5. Review `Order.items[].install_status` and `pipeline_status`.
6. Use the install workspace to continue any remaining manual steps.
7. Confirm the client can access `/client-portal` and sees canonical install state.

## Failure Handling

- Do not invent or backfill client/project links by guessing.
- If a paid order is missing `client_id` or `client_project_id`, stop and repair linkage first.
- If portal activation did not send, use the admin resend flow and inspect recent `CommunicationEvent` records.
