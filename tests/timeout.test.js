import test from "node:test";
import assert from "node:assert/strict";

import { withTimeout } from "../base44/functions/_shared/timeout.js";

test("withTimeout resolves when the operation completes before the deadline", async () => {
  await assert.doesNotReject(withTimeout(Promise.resolve("ok"), 100, "fast op"));
});

test("withTimeout rejects when the operation exceeds the deadline", async () => {
  await assert.rejects(
    withTimeout(new Promise(() => {}), 5, "slow op"),
    /slow op timed out after 5ms/
  );
});
