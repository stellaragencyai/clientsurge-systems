import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAdminDashboardSearch,
  DEFAULT_ADMIN_TAB,
  INSTALL_QUEUE_TAB,
  parseAdminDashboardSearch,
} from "../src/lib/adminDashboardNavigation.js";

test("admin dashboard search preserves canonical install queue order selection", () => {
  const search = buildAdminDashboardSearch({
    tab: INSTALL_QUEUE_TAB,
    orderId: "order_123",
  });

  assert.equal(search, "?tab=install-queue&order=order_123");
  assert.deepEqual(parseAdminDashboardSearch(search), {
    tab: INSTALL_QUEUE_TAB,
    orderId: "order_123",
  });
});

test("admin dashboard search drops stray order ids outside the install queue", () => {
  assert.deepEqual(parseAdminDashboardSearch("?tab=overview&order=order_123"), {
    tab: DEFAULT_ADMIN_TAB,
    orderId: "",
  });
});
