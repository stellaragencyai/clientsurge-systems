import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  APPROVAL_REQUIRED_ACTIONS,
  ALLOWED_AUTOMATIC_ACTIONS,
  FULL_CAMPAIGN_REQUIRED_PROOFS,
  GATE_KEYS,
  LAUNCH_GATE_DEFINITIONS,
  buildGateVerdict,
  buildLaunchCommandCenterSnapshot,
  buildLaunchVerdict,
  evaluateProof,
} from "../src/lib/launchGates.js";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const launchGateSchema = JSON.parse(read("base44/entities/LaunchGate.jsonc"));
const launchApprovalSchema = JSON.parse(read("base44/entities/LaunchApproval.jsonc"));
const launchDoc = read("docs/LAUNCH_GATES_AND_PROOF_ENGINE.md");
const adminDashboard = read("src/internal-pages/AdminDashboard.jsx");
const launchPanel = read("src/components/admin/LaunchGatesPanel.jsx");

test("required launch gates and proof checks are modeled", () => {
  assert.equal(LAUNCH_GATE_DEFINITIONS.length, 13);

  for (const key of Object.values(GATE_KEYS)) {
    assert.ok(LAUNCH_GATE_DEFINITIONS.some((gate) => gate.gate_key === key), `${key} gate is missing`);
  }

  const allProofKeys = LAUNCH_GATE_DEFINITIONS.flatMap((gate) => gate.required_proofs.map((proof) => proof.key));
  for (const proofKey of [
    "homepage_returns_200",
    "book_returns_200",
    "contact_returns_200",
    "store_returns_200",
    "roofing_returns_200",
    "hvac_returns_200",
    "dental_returns_200",
    "no_public_coming_soon",
    "free_automation_audit_cta",
    "spf_exists",
    "mx_exists",
    "dmarc_exists",
    "google_dkim_exists",
    "resend_dkim_exists",
    "resend_txt_exists",
    "resend_api_key_present_secure_env",
    "safe_test_email_sent",
    "provider_delivery_confirmed",
    "test_checkout_completed",
    "stripe_webhook_received",
    "order_created",
    "client_created",
    "onboarding_client_created",
    "failed_payment_path_tested",
    "leads_schema_verified",
    "lead_count_calculated",
    "usable_lead_count_calculated",
    "duplicate_dry_run_completed",
    "suppression_fields_verified",
    "first_25_preview_dry_run_completed",
    "unsegmented_sends_rejected",
    "max_50_cap_enforced",
    "list_unsubscribe_headers",
    "no_real_campaign_without_approval",
  ]) {
    assert.ok(allProofKeys.includes(proofKey), `${proofKey} proof is missing`);
  }
});

test("gate schemas expose the required status, proof, and approval fields", () => {
  const gateProps = launchGateSchema.properties;
  for (const field of [
    "gate_key",
    "gate_name",
    "section_label",
    "status",
    "severity",
    "completion_percent",
    "proof_percent",
    "required_categories",
    "required_tasks",
    "required_proofs",
    "current_blocker",
    "next_action",
    "approval_required",
    "approved_by",
    "approved_at",
    "waived_by",
    "waived_at",
    "waiver_reason",
    "last_checked_at",
    "evidence_summary",
    "unlock_condition_summary",
    "last_verdict",
  ]) {
    assert.ok(gateProps[field], `${field} missing from LaunchGate`);
  }

  assert.deepEqual(gateProps.status.enum, [
    "locked",
    "blocked",
    "partial",
    "ready_for_proof",
    "proof_running",
    "proof_failed",
    "proof_passed",
    "approved",
    "waived",
  ]);

  const approvalProps = launchApprovalSchema.properties;
  for (const field of [
    "approval_id",
    "gate_key",
    "action_type",
    "action_title",
    "action_summary",
    "risk_level",
    "requested_by",
    "requested_at",
    "approved_by",
    "approved_at",
    "status",
    "notes",
    "linked_github_issue",
    "linked_google_drive_proof",
    "linked_base44_record",
    "expires_at",
    "revoked_at",
    "revoked_by",
    "revocation_reason",
  ]) {
    assert.ok(approvalProps[field], `${field} missing from LaunchApproval`);
  }
});

test("proof engine refuses pass states without evidence", () => {
  const result = evaluateProof(
    { key: "sample_proof", label: "Sample proof", source: "test", nextAction: "Attach evidence." },
    { sample_proof: { status: "proof_passed" } }
  );

  assert.equal(result.passed, false);
  assert.equal(result.status, "blocked");
  assert.match(result.current_blocker, /without evidence/);
});

test("critical launch verdict stays locked until critical gates are proven", () => {
  const snapshot = buildLaunchCommandCenterSnapshot();

  assert.equal(snapshot.verdict.verdict, "LAUNCH LOCKED");
  assert.equal(snapshot.verdict.launch_locked, true);
  assert.ok(snapshot.verdict.blockers.includes("Website Production Gate"));
});

test("25-lead, payment, and campaign verdicts require the intended proof boundaries", () => {
  const allProofInputs = {};
  for (const gate of LAUNCH_GATE_DEFINITIONS) {
    for (const proof of gate.required_proofs) {
      allProofInputs[proof.key] = {
        status: "proof_passed",
        evidence_summary: `${proof.key} evidence`,
      };
    }
  }

  const approvals = Object.fromEntries(
    LAUNCH_GATE_DEFINITIONS.map((gate) => [
      gate.gate_key,
      { status: "approved", approved_by: "owner@example.com", approved_at: "2026-06-06T12:00:00.000Z" },
    ])
  );

  const gates = buildLaunchCommandCenterSnapshot({
    proofInputs: allProofInputs,
    approvalInputs: approvals,
  }).gates;

  const paymentVerdict = buildLaunchVerdict(gates);
  assert.equal(paymentVerdict.verdict, "READY FOR LIVE PAYMENTS");
  assert.equal(paymentVerdict.ready_for_25_lead_test, true);
  assert.equal(paymentVerdict.ready_for_live_payments, true);

  const fullCampaignInputs = Object.fromEntries(
    FULL_CAMPAIGN_REQUIRED_PROOFS.map((proofKey) => [
      proofKey,
      { status: "proof_passed", evidence_summary: `${proofKey} evidence` },
    ])
  );
  const campaignVerdict = buildLaunchVerdict(gates, { fullCampaignProofInputs: fullCampaignInputs });

  assert.equal(campaignVerdict.verdict, "READY FOR FULL CAMPAIGN");
  assert.equal(campaignVerdict.ready_for_full_campaign, true);
});

test("Stripe gate needs approval in addition to proof for live payments", () => {
  const stripeGateDefinition = LAUNCH_GATE_DEFINITIONS.find((gate) => gate.gate_key === GATE_KEYS.stripePayments);
  const proofInputs = Object.fromEntries(
    stripeGateDefinition.required_proofs.map((proof) => [
      proof.key,
      { status: "proof_passed", evidence_summary: `${proof.key} evidence` },
    ])
  );

  const proofOnly = buildGateVerdict(stripeGateDefinition, proofInputs);
  assert.equal(proofOnly.status, "proof_passed");

  const approved = buildGateVerdict(stripeGateDefinition, proofInputs, {
    [GATE_KEYS.stripePayments]: {
      status: "approved",
      approved_by: "owner@example.com",
      approved_at: "2026-06-06T12:00:00.000Z",
    },
  });
  assert.equal(approved.status, "approved");
});

test("approval rules and governance docs cover manual boundaries", () => {
  for (const action of [
    "production_deploy",
    "real_campaign_send",
    "crm_dedupe_merge_delete",
    "stripe_live_action",
    "dns_change",
    "base44_production_env_change",
    "real_customer_email",
    "checkout_payment_logic_change",
    "provider_credential_change",
    "auth_security_behavior_change",
  ]) {
    assert.ok(APPROVAL_REQUIRED_ACTIONS.includes(action), `${action} missing`);
    assert.match(launchApprovalSchema.properties.action_type.enum.join("|"), new RegExp(action));
  }

  for (const action of ["read_only_scan", "local_test", "source_audit", "dry_run_preview", "create_github_issue", "create_proof_record", "update_dashboard_status_from_evidence"]) {
    assert.ok(ALLOWED_AUTOMATIC_ACTIONS.includes(action), `${action} missing`);
  }

  for (const phrase of [
    "READY FOR 25-LEAD TEST",
    "READY FOR LIVE PAYMENTS",
    "READY FOR FULL CAMPAIGN",
    "pass status without evidence is not a pass",
    "Manual Waiver Rules",
  ]) {
    assert.match(launchDoc, new RegExp(phrase));
  }
});

test("admin dashboard exposes the Launch Gates surface without mutating launch data", () => {
  assert.match(adminDashboard, /LaunchGatesPanel/);
  assert.match(adminDashboard, /launch-gates/);
  assert.match(launchPanel, /buildLaunchCommandCenterSnapshot/);
  assert.match(launchPanel, /LaunchApproval\.list/);
  assert.doesNotMatch(launchPanel, /LaunchGate\.(create|update|delete)/);
  assert.doesNotMatch(launchPanel, /LaunchApproval\.(create|update|delete)/);
});
