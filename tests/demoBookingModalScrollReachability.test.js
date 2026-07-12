import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const modalSource = readFileSync("src/components/forms/DemoBookingModal.jsx", "utf8");

test("DemoBookingModal stays reachable inside a mobile fixed overlay", () => {
  assert.match(modalSource, /import \{ createPortal \} from "react-dom";/);
  assert.match(modalSource, /acquireBodyScrollLock\("audit-request-modal"\)/);
  assert.match(modalSource, /fixed inset-0/);
  assert.match(modalSource, /overflow-y-auto/);
  assert.match(modalSource, /items-start/);
  assert.match(modalSource, /md:items-center/);
  assert.match(modalSource, /role="dialog"/);
  assert.match(modalSource, /aria-modal="true"/);
  assert.match(modalSource, /document\.body/);
});
