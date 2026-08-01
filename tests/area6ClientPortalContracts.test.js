import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  portalContextMain: readFileSync(new URL("../base44/functions/getClientPortalContext/main.ts", import.meta.url), "utf8"),
  portalContextEntry: readFileSync(new URL("../base44/functions/getClientPortalContext/entry.ts", import.meta.url), "utf8"),
  clientPortalAccess: readFileSync(new URL("../src/components/portal/ClientPortalAccess.jsx", import.meta.url), "utf8"),
  clientPortal: readFileSync(new URL("../src/internal-pages/ClientPortal.jsx", import.meta.url), "utf8"),
  businessSetup: readFileSync(new URL("../src/internal-pages/BusinessSetup.jsx", import.meta.url), "utf8"),
  credentialsSetup: readFileSync(new URL("../src/internal-pages/CredentialsSetup.jsx", import.meta.url), "utf8"),
  setupStatus: readFileSync(new URL("../src/internal-pages/SetupStatus.jsx", import.meta.url), "utf8"),
};

test("Area 6 portal context uses one canonical handler and returns support/debug evidence", () => {
  assert.match(files.portalContextEntry, /import '\.\/main\.ts';/);
  assert.match(files.portalContextMain, /request_id: requestId/);
  assert.match(files.portalContextMain, /Cache-Control/);
  assert.match(files.portalContextMain, /no-store/);
  assert.match(files.portalContextMain, /data_coverage/);
  assert.match(files.portalContextMain, /portal_truth_label/);
  assert.match(files.portalContextMain, /Portal status is based on Base44 records only/);
});

test("Area 6 portal context distinguishes unsafe customer states instead of pretending the portal is ready", () => {
  for (const status of ["no_paid_order", "direct_project_link", "ambiguous_paid_orders", "missing_canonical_links", "linked_records_missing", "linked"]) {
    assert.match(files.portalContextMain, new RegExp(status), `${status} should be explicit`);
  }
  assert.match(files.portalContextMain, /Payment confirmed, but canonical client\/project linkage is incomplete/);
  assert.match(files.portalContextMain, /Multiple paid businesses are linked/);
});

test("Area 6 client portal access renders the full portal with truth-labeled loading states", () => {
  assert.match(files.clientPortalAccess, /import ClientPortal/);
  assert.doesNotMatch(files.clientPortalAccess, /import ClientDashboard/);
  assert.match(files.clientPortalAccess, /not proof that your setup status changed/);
  assert.match(files.clientPortalAccess, /Portal data is private/);
});

test("Area 6 admin client mode reaches the portal dashboard without weakening client ownership checks", () => {
  assert.match(files.clientPortal, /const canPreviewPortalWithoutProject =/);
  assert.match(files.clientPortal, /isAdminPreview \|\|/);
  assert.match(files.clientPortal, /userRole === "admin"/);
  assert.match(files.clientPortal, /user\?\.role === "super_admin"/);
  assert.match(files.clientPortal, /if \(\(notFound \|\| !project\) && !canPreviewPortalWithoutProject\)/);
  assert.match(files.clientPortal, /canPreviewPortalWithoutProject && !project/);
  assert.doesNotMatch(files.clientPortal, /Go to Admin Dashboard/);
});

test("Area 6 setup status never shows progress without a verified order id", () => {
  assert.match(files.setupStatus, /missing an order ID/);
  assert.match(files.setupStatus, /No setup progress is shown without a verified order record/);
  assert.match(files.setupStatus, /requestId/);
  assert.match(files.setupStatus, /Data source: getOrderStatus \+ getActivationProgress/);
  assert.match(files.setupStatus, /not live provider proof/);
});

test("Area 6 setup and credentials flows return clients to portal progress, not admin", () => {
  assert.match(files.businessSetup, /client-portal\/progress/);
  assert.doesNotMatch(files.businessSetup, /navigate\("\/admin"\)/);
  assert.match(files.credentialsSetup, /No credentials form is shown until the order source is verified/);
  assert.match(files.credentialsSetup, /View Setup Progress/);
  assert.match(files.credentialsSetup, /Reference:/);
});
