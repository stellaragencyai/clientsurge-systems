import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const queueEnhancements = fs.readFileSync(
  "C:/Base44Projects/clientsurge-systems-audit-20260509/src/components/admin/AdminQueueEnhancements.jsx",
  "utf8",
);

const installWorkspace = fs.readFileSync(
  "C:/Base44Projects/clientsurge-systems-audit-20260509/src/components/admin/InstallOrderWorkspace.jsx",
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
