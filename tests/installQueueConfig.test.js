import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  INSTALL_QUEUE_PRIMARY_ACTION_LABEL,
  LEGACY_INSTALL_QUEUE_STATUS_CONTROLS_ENABLED,
  resolveSelectedInstallOrderId,
} from "../src/lib/installQueueConfig.js";

test("canonical install queue defaults to workspace selection instead of status mutation controls", () => {
  assert.equal(LEGACY_INSTALL_QUEUE_STATUS_CONTROLS_ENABLED, false);
  assert.equal(INSTALL_QUEUE_PRIMARY_ACTION_LABEL, "Open Workspace");
});

test("install queue selection resolves to a real paid order before mounting the workspace", () => {
  const orders = [{ id: "order_a" }, { id: "order_b" }];

  assert.equal(resolveSelectedInstallOrderId(orders, "order_b"), "order_b");
  assert.equal(resolveSelectedInstallOrderId(orders, "missing"), "order_a");
  assert.equal(resolveSelectedInstallOrderId([], "missing"), "");
});

test("mounted install queue no longer uses old installPipeline status mutation controls", () => {
  const source = readFileSync(
    new URL("../src/components/admin/InstallQueuePanel.jsx", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /installPipeline/);
  assert.doesNotMatch(source, /update_status/);
  assert.match(source, /listInstallQueue/);
  assert.match(source, /InstallOrderWorkspace/);
});
