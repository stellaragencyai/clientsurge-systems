import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("operational install functions require admin authorization", () => {
  for (const path of [
    "base44/functions/installPipeline/entry.ts",
    "base44/functions/listInstallQueue/entry.ts",
    "base44/functions/updateInstallConfiguration/entry.ts",
    "base44/functions/initializeInstallOS/entry.ts",
    "base44/functions/retryFailedServiceActivation/entry.ts",
  ]) {
    const source = read(path);
    assert.match(source, /requireAdminUser/);
    assert.match(source, /authGuards\.js/);
  }
});

test("frontend auth relies on the canonical route security map", () => {
  const app = read("src/App.jsx");
  const authContext = read("src/lib/AuthContext.jsx");
  const base44Client = read("src/api/base44Client.js");

  assert.match(app, /isPublicRoute/);
  assert.match(app, /shouldNoindexRoute/);
  assert.match(authContext, /import \{ isPublicRoute \} from "@\/lib\/routeSecurity"/);
  assert.doesNotMatch(authContext, /PUBLIC_AUTH_OPTIONAL_PREFIXES/);
  assert.match(base44Client, /requiresAuth: false/);
  assert.match(base44Client, /Private routes and operational functions enforce auth/);
});

test("sensitive setup and internal pages are not mounted as hidden public routes", () => {
  const app = read("src/App.jsx");
  const hiddenPublicBlock = app.match(/const HIDDEN_PUBLIC_ROUTES = \[[\s\S]*?\];/)[0];
  const clientPrivateBlock = app.match(/const CLIENT_PRIVATE_ROUTES = \[[\s\S]*?\];/)[0];
  const internalAdminBlock = app.match(/const INTERNAL_ADMIN_ROUTES = \[[\s\S]*?\];/)[0];

  assert.doesNotMatch(hiddenPublicBlock, /onboarding|setup|WebsitePreview|MotionLab/);
  assert.match(clientPrivateBlock, /Onboarding/);
  assert.match(clientPrivateBlock, /BusinessSetup/);
  assert.match(clientPrivateBlock, /CredentialsSetup/);
  assert.match(internalAdminBlock, /WebsitePreview/);
  assert.match(app, /routePath\("motion-lab"\)/);
});
