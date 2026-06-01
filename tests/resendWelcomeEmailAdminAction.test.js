import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const queueEnhancements = fs.readFileSync(
  new URL("../src/components/admin/AdminQueueEnhancements.jsx", import.meta.url),
  "utf8",
);

const installWorkspace = fs.readFileSync(
  new URL("../src/components/admin/InstallOrderWorkspace.jsx", import.meta.url),
  "utf8",
);

test("admin resend welcome button uses sendPortalWelcomeEmail with client payload", () => {
  assert.match(
    queueEnhancements,
    /functions\.invoke\("sendPortalWelcomeEmail",\s*\{/,
  );
  assert.match(queueEnhancements, /client_name,/);
  assert.match(queueEnhancements, /client_email,/);
  assert.match(queueEnhancements, /business_name,/);
});

test("install workspace mounts the resend welcome button for admin operators", () => {
  assert.match(
    installWorkspace,
    /import \{ ResendWelcomeButton \} from "@\/components\/admin\/AdminQueueEnhancements"/,
  );
  assert.match(installWorkspace, /<ResendWelcomeButton/);
});
