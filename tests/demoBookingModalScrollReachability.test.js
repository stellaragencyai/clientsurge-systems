import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const modalSource = readFileSync("src/components/forms/DemoBookingModal.jsx", "utf8");

test("DemoBookingModal stays reachable inside a mobile fixed overlay", () => {
  assert.match(modalSource, /import \{ createPortal \} from "react-dom";/);
  assert.match(modalSource, /acquireBodyScrollLock\("demo-booking-modal"\)/);
  assert.match(modalSource, /className="fixed inset-0 z-\[9999\] flex items-center justify-center overflow-y-auto overscroll-contain p-4"/);
  assert.match(modalSource, /minHeight: "100svh"/);
  assert.match(modalSource, /WebkitOverflowScrolling: "touch"/);
  assert.match(modalSource, /role="dialog"/);
  assert.match(modalSource, /aria-modal="true"/);
  assert.match(modalSource, /Book a free ClientSurge demo/);
  assert.match(modalSource, /DemoBookingInline/);
  assert.match(modalSource, /document\.body/);
});
