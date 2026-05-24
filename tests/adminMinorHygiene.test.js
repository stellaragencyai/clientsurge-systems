import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const installQueuePanel = readFileSync(
  new URL("../src/components/admin/InstallQueuePanel.jsx", import.meta.url),
  "utf8"
);
const leadManagementDashboard = readFileSync(
  new URL("../src/components/admin/LeadManagementDashboard.jsx", import.meta.url),
  "utf8"
);
const adminSettingsPanel = readFileSync(
  new URL("../src/components/admin/AdminSettingsPanel.jsx", import.meta.url),
  "utf8"
);
const installOrderWorkspace = readFileSync(
  new URL("../src/components/admin/InstallOrderWorkspace.jsx", import.meta.url),
  "utf8"
);

test("install queue exposes a refresh icon button", () => {
  assert.match(installQueuePanel, /RefreshCw/);
  assert.match(installQueuePanel, /aria-label="Refresh install queue"/);
  assert.match(installQueuePanel, /onClick=\{loadQueue\}/);
});

test("admin leads table exposes name email phone search controls", () => {
  assert.match(leadManagementDashboard, /filters\.search/);
  assert.match(leadManagementDashboard, /handleFilterChange\("search"/);
  assert.match(leadManagementDashboard, /Search name, business, email, phone/);
});

test("admin settings displays a save confirmation after successful save", () => {
  assert.match(adminSettingsPanel, /setSaved\(true\)/);
  assert.match(adminSettingsPanel, /Settings saved successfully/);
  assert.match(adminSettingsPanel, /setTimeout\(\(\) => setSaved\(false\), 3000\)/);
});

test("install order workspace renders Live as a green status badge", () => {
  assert.match(installOrderWorkspace, /Live:\s*"bg-green-50 text-green-700"/);
  assert.match(installOrderWorkspace, /function StatusBadge/);
  assert.match(installOrderWorkspace, /<StatusBadge value=\{service\.install_status\}/);
});
