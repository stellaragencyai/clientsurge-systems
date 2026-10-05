import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const authConfig = JSON.parse(
  readFileSync(new URL("../base44/auth/config.jsonc", import.meta.url), "utf8")
);
const loginPage = readFileSync(new URL("../src/pages/Login.jsx", import.meta.url), "utf8");
const registerPage = readFileSync(new URL("../src/pages/Register.jsx", import.meta.url), "utf8");
const forgotPasswordPage = readFileSync(new URL("../src/pages/ForgotPassword.jsx", import.meta.url), "utf8");
const portalLoginModal = readFileSync(new URL("../src/components/forms/PortalLoginModal.jsx", import.meta.url), "utf8");

test("Base44 auth config enables the email-password flows shipped in the UI", () => {
  assert.equal(authConfig.enableUsernamePassword, true);
  assert.match(loginPage, /loginViaEmailPassword/);
  assert.match(registerPage, /base44\.auth\.register/);
  assert.match(forgotPasswordPage, /resetPasswordRequest/);
  assert.match(portalLoginModal, /loginViaEmailPassword/);
});
