import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("email/password login hydrates shared auth state before admin navigation", () => {
  const modal = read("src/components/forms/PortalLoginModal.jsx");
  const authContext = read("src/lib/AuthContext.jsx");

  assert.match(modal, /const \{ applyAuthenticatedUser \} = useAuth\(\)/);
  assert.match(modal, /const currentUser = await base44\.auth\.me\(\)/);
  assert.match(modal, /applyAuthenticatedUser\(currentUser\)/);
  assert.match(modal, /currentUser\?\.role === "admin" \? "\/admin" : "\/client-portal"/);

  assert.match(authContext, /applyAuthenticatedUser,/);
});

test("private route boot checks the stored Base44 session without requiring a URL token", () => {
  const authContext = read("src/lib/AuthContext.jsx");

  assert.match(authContext, /const currentPath = window\.location\.pathname/);
  assert.match(authContext, /shouldAllowLocalAuthBypass\(\) && isPublicRoute\(currentPath\)/);
  assert.match(authContext, /if \(!isPublicRoute\(currentPath\)\) \{/);
  assert.doesNotMatch(authContext, /appParams\.token && !isPublicRoute\(window\.location\.pathname\)/);
  assert.match(authContext, /const currentUser = await base44\.auth\.me\(\)/);
});

test("local Base44 env points auth proxy at the production app", () => {
  const envLocal = read(".env.local");
  const appConfig = read("base44/.app.jsonc");

  assert.match(appConfig, /69dc4a79656fdba136d413d3/);
  assert.match(envLocal, /VITE_BASE44_APP_ID=69dc4a79656fdba136d413d3/);
  assert.match(envLocal, /VITE_BASE44_APP_BASE_URL=https:\/\/clientsurgesystems\.com/);
});
