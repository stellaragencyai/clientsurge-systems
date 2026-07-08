import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  systemMetrics: readFileSync(new URL("../base44/functions/getSystemObservabilityMetrics/entry.ts", import.meta.url), "utf8"),
  automationActivity: readFileSync(new URL("../base44/functions/getAutomationActivity/entry.ts", import.meta.url), "utf8"),
  systemDashboard: readFileSync(new URL("../src/components/mission-control/SystemObservabilityDashboard.jsx", import.meta.url), "utf8"),
  automationPanel: readFileSync(new URL("../src/components/admin/AutomationActivityPanel.jsx", import.meta.url), "utf8"),
};

test("Area 5 observability endpoints return request IDs, no-store JSON, and admin/super-admin access", () => {
  for (const [name, source] of Object.entries({ systemMetrics: files.systemMetrics, automationActivity: files.automationActivity })) {
    assert.match(source, /requestId = `.*_\$\{Date\.now\(\)\}_/, `${name} creates request ids`);
    assert.match(source, /Cache-Control.*no-store/s, `${name} disables cache`);
    assert.match(source, /super_admin/, `${name} allows super_admin`);
    assert.match(source, /method_not_allowed/, `${name} rejects wrong methods`);
  }
});

test("Area 5 system observability labels missing evidence as Unknown instead of Healthy", () => {
  assert.match(files.systemMetrics, /return 'Unknown'/);
  assert.match(files.systemMetrics, /proof_label/);
  assert.match(files.systemMetrics, /Posted records only/);
  assert.match(files.systemMetrics, /data_coverage/);
  assert.match(files.systemDashboard, /Truth label/);
  assert.match(files.systemDashboard, /Dashboard numbers are based on posted Base44 records/);
  assert.doesNotMatch(files.systemDashboard, /Real-time system health and activity monitoring/);
});

test("Area 5 automation activity does not claim all systems are operational from empty samples", () => {
  assert.match(files.automationActivity, /No execution logs found/);
  assert.match(files.automationActivity, /unknown coverage/i);
  assert.match(files.automationActivity, /not proof/i);
  assert.match(files.automationPanel, /No failed rows in this view does not prove all automations are healthy/);
  assert.match(files.automationPanel, /No failed modules in the sampled results/);
  assert.doesNotMatch(files.automationPanel, /all systems operational/i);
});

test("Area 5 automation activity exposes coverage warnings and orphaned deployment records", () => {
  assert.match(files.automationActivity, /coverage_warnings/);
  assert.match(files.automationActivity, /logs_without_deployment_id/);
  assert.match(files.automationActivity, /orphaned_deployment_logs/);
  assert.match(files.automationActivity, /AutomationExecutionLog sample only/);
  assert.match(files.automationPanel, /Data Coverage/);
  assert.match(files.automationPanel, /Needs Evidence/);
});
