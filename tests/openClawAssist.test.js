import test from "node:test";
import assert from "node:assert/strict";

import { buildOpenClawInstallAssist } from "../base44/functions/_shared/openClawAssist.js";

test("openclaw install assist returns machine-readable operator summary without write semantics", () => {
  const assist = buildOpenClawInstallAssist({
    orderDetail: {
      id: "order_1",
      business_name: "Signal Med Spa",
      customer_name: "Jamie Owner",
      customer_email: "owner@example.com",
      payment_status: "paid",
      pipeline_status: "Testing",
      order_status: "installing",
      pipeline_error: null,
      provider_readiness: {
        twilio: { derived_status: "healthy" },
      },
      latest_provider_tests: {
        twilio: { at: "2026-04-22T12:10:00.000Z", status: "processed" },
      },
      required_actions: {
        order: [
          {
            code: "order:linked_records_required",
            title: "Verify linked records",
            detail: "Linked records need review.",
            level: "blocker",
          },
        ],
      },
      workspace_summary: {
        command_view: {
          configure_first: {
            service_key: "instant_lead_response",
            display_name: "Instant Lead Response",
          },
          move_to_testing_now: null,
          test_now: null,
          go_live_now: null,
          primary_blocker: {
            title: "Verify linked records",
            detail: "Linked records need review.",
          },
        },
        next_best_actions: [
          {
            title: "Verify linked records",
            detail: "Linked records need review.",
            level: "blocker",
          },
        ],
        shared_configuration: {
          required: true,
          complete: false,
        },
        setup_assist: {
          safe_autofill_count: 1,
          manual_required_count: 2,
          safe_autofill: [],
          manual_required: [],
          blocker_summary: [],
        },
      },
      assisted_deployment: {
        overview: {
          can_prepare_setup: true,
          can_run_setup_sequence: true,
          services_ready_for_sequence: [
            {
              service_key: "instant_lead_response",
              display_name: "Instant Lead Response",
              install_status: "Testing",
            },
          ],
          services_requiring_manual_input: [],
          services_ready_for_live: [],
          expected_blockers: [],
          counts: {
            safe_autofill: 1,
            manual_required: 2,
            sequence_ready: 1,
            live_ready: 0,
          },
        },
      },
      services: [
        {
          service_key: "instant_lead_response",
          display_name: "Instant Lead Response",
          install_status: "Testing",
          configuration_complete: true,
          allowed_next_statuses: ["Live"],
          required_actions: [
            {
              code: "test:successful_runtime_required",
              title: "Run a successful remote test",
              detail: "A successful test is still required.",
              level: "blocker",
            },
          ],
          go_live_readiness: {
            can_move_to_testing: false,
            can_move_to_live: false,
            tested: false,
            blocking_items: ["Run a successful remote test"],
          },
          test_summary: {
            latest_runtime_event_type: "runtime_attempt_blocked",
            latest_runtime_at: "2026-04-22T12:12:00.000Z",
            successful_test_exists: false,
          },
          operator_summary: {
            blocker_count: 1,
            next_action_title: "Run a successful remote test",
            next_action_detail: "A successful test is still required.",
          },
        },
      ],
      timeline: [
        {
          id: "evt_1",
          created_date: "2026-04-22T12:12:00.000Z",
          event_type: "runtime_attempt_blocked",
          provider: "twilio",
          status: "blocked",
          service_key: "instant_lead_response",
          subject: "Runtime blocked",
          error_message: "Missing target phone",
        },
      ],
    },
  });

  assert.equal(assist.mode, "operator_assist");
  assert.equal(assist.order.id, "order_1");
  assert.equal(assist.command_view.configure_first?.service_key, "instant_lead_response");
  assert.equal(assist.blocker_queue.length, 2);
  assert.equal(assist.assisted_deployment.overview.can_prepare_setup, true);
  assert.equal(assist.assisted_deployment.safe_commands[1].requires_confirmation, true);
  assert.equal(assist.install_copilot.package_tier, "basic");
  assert.equal(assist.install_copilot.current_phase, "intake_or_configuration_blocked");
  assert.equal(assist.install_copilot.next_service_key, "instant_lead_response");
  assert.equal(assist.install_copilot.ai_engagements.length, 3);
  assert.equal(assist.services[0].timeline_summary.latest_event_type, "runtime_attempt_blocked");
  assert.equal(assist.timeline_summary.blocked_events, 1);
  assert.equal(assist.manual_approval_required.length > 0, true);
});
