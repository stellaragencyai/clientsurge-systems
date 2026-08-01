#!/usr/bin/env node

import { existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PACKAGE_OFFERS } from "../src/lib/salesCatalog.js";

const outDir = path.resolve("dist");
const appId = "69dc4a79656fdba136d413d3";
const checkoutFunction = "createCheckoutSession";
const checkoutEndpoint = `/api/apps/${appId}/functions/${checkoutFunction}`;
const fallbackPaths = ["product-signup", "product_signup", "product-sign-up"];
const checkoutPackages = PACKAGE_OFFERS.filter((offer) => offer.checkout_enabled);

if (!existsSync(outDir)) {
  throw new Error("dist directory not found. Run this script after vite build.");
}

mkdirSync(outDir, { recursive: true });

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatUsd(amount) {
  return Number(amount || 0).toLocaleString("en-US");
}

const planOptionsHtml = checkoutPackages
  .map((offer) => {
    const setupTotal = offer.implementation_fee || offer.setup_total;
    const isDefault = offer.package_key === "growth_system";
    const services = offer.included_services.map((service) => service.name).join(", ");

    return `<label class="plan"><input type="radio" name="package_key" value="${escapeHtml(offer.package_key)}" form="checkout-form"${isDefault ? " checked" : ""}> <strong>${escapeHtml(offer.name)}</strong><span class="plan-price">$${formatUsd(setupTotal)} setup + $${formatUsd(offer.monthly_total)}/mo after 30 days</span><span>${escapeHtml(services || offer.description)}</span></label>`;
  })
  .join("\n        ");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,follow">
    <title>Complete your ClientSurge signup</title>
    <style>
      :root { color-scheme: light; font-family: Montserrat, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; background: #f7f9fc; color: #0f172a; }
      main { width: 100%; max-width: 880px; margin: 0 auto; padding: 40px 18px 56px; }
      header { background: #fff; border-bottom: 1px solid #e5edf5; }
      header div { width: 100%; max-width: 880px; margin: 0 auto; padding: 18px; font-weight: 900; font-size: 1.25rem; overflow-wrap: anywhere; }
      h1 { margin: 0 0 10px; font-size: clamp(1.75rem, 4vw, 2.5rem); line-height: 1.08; overflow-wrap: anywhere; }
      h2 { font-size: 1.1875rem; margin: 28px 0 12px; }
      p { color: #475569; line-height: 1.55; }
      .fallback-alert { margin: 18px 0 20px; border: 1px solid #bfdbfe; border-radius: 8px; background: #eff6ff; padding: 14px; }
      .fallback-alert strong { display: block; color: #0f172a; margin-bottom: 4px; }
      .fallback-alert p { margin: 0; color: #334155; }
      .plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; margin-top: 18px; }
      label.plan { display: block; min-width: 0; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; padding: 16px; cursor: pointer; }
      label.plan strong { display: block; color: #0f172a; margin-bottom: 6px; }
      .plan-price { display: block; color: #005f91; font-weight: 900; margin-bottom: 6px; }
      form { margin-top: 24px; background: #fff; border: 1px solid #dbe5ef; border-radius: 8px; padding: 22px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.07); }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
      .full { grid-column: 1 / -1; }
      label { min-width: 0; }
      label span { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 800; color: #334155; }
      input, select { width: 100%; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; font: inherit; font-size: 16px; }
      button { width: 100%; min-height: 54px; margin-top: 18px; border: 0; border-radius: 8px; background: #0077b6; color: #fff; font-weight: 900; font-size: 16px; line-height: 1.2; padding: 14px 16px; cursor: pointer; white-space: normal; overflow-wrap: anywhere; }
      button:disabled { cursor: wait; opacity: 0.7; }
      .note { font-size: 13px; overflow-wrap: anywhere; }
      .checkout-endpoint { overflow-wrap: anywhere; word-break: break-word; }
      .error { display: none; margin-top: 14px; color: #991b1b; background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; }
      @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } main { padding: 28px 16px 44px; } form { padding: 18px; } }
    </style>
  </head>
  <body data-route-verify="product-signup" data-base44-app-id="${appId}">
    <header><div>ClientSurge Systems</div></header>
    <main>
      <p class="note">Secure Checkout</p>
      <h1>Complete your ClientSurge signup</h1>
      <p>Select Starter System, Growth System, or Pro System, then enter your information to retry secure checkout.</p>
      <div class="fallback-alert" role="status">
        <strong>Payment has not completed.</strong>
        <p>The live checkout page was unavailable, so this fallback is collecting the details needed to start a fresh Stripe checkout session. Choose a system, retry checkout, or contact support if the retry fails.</p>
      </div>
      <section class="plans" aria-label="Choose Your System">
        ${planOptionsHtml}
      </section>
      <form id="checkout-form" data-checkout-function="${checkoutFunction}" data-checkout-endpoint="${checkoutEndpoint}">
        <h2>Your Information</h2>
        <div class="grid">
          <label class="full"><span>Full Name</span><input name="customer_name" autocomplete="name" required></label>
          <label class="full"><span>Business Name</span><input name="business_name" autocomplete="organization" required></label>
          <label><span>Email Address</span><input name="customer_email" type="email" autocomplete="email" required></label>
          <label><span>Phone Number</span><input name="customer_phone" type="tel" autocomplete="tel" required></label>
          <label class="full"><span>Industry / Business Type</span><input name="industry" required></label>
        </div>
        <label class="full" style="display:flex;gap:10px;margin-top:14px;align-items:flex-start;">
          <input name="consent_given" type="checkbox" required style="width:auto;margin-top:4px;">
          <span>I agree that ClientSurge Systems may contact me about this purchase and setup.</span>
        </label>
        <button type="submit">Retry Secure Checkout</button>
        <div class="error" role="alert"></div>
        <p class="note checkout-endpoint">Checkout endpoint: ${checkoutEndpoint}</p>
      </form>
    </main>
    <script>
      const form = document.getElementById("checkout-form");
      const errorBox = form.querySelector(".error");
      const params = new URLSearchParams(window.location.search);
      const requestedPackage = params.get("package") || params.get("plan");
      const normalized = { starter: "starter_system", growth: "growth_system", pro: "pro_system" }[requestedPackage] || requestedPackage;
      if (normalized) {
        const selected = form.querySelector('input[name="package_key"][value="' + normalized + '"]');
        if (selected) selected.checked = true;
      }

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        errorBox.style.display = "none";
        const submit = form.querySelector("button");
        submit.disabled = true;
        submit.textContent = "Preparing secure checkout...";
        const data = new FormData(form);
        const packageKey = data.get("package_key") || "growth_system";
        const payload = {
          package_key: packageKey,
          customer_name: String(data.get("customer_name") || "").trim(),
          customer_email: String(data.get("customer_email") || "").trim(),
          customer_phone: String(data.get("customer_phone") || "").trim(),
          business_name: String(data.get("business_name") || "").trim(),
          industry: String(data.get("industry") || "").trim(),
          success_url: window.location.origin + "/order-success?session_id={CHECKOUT_SESSION_ID}",
          cancel_url: window.location.origin + "/product-signup?package=" + encodeURIComponent(packageKey),
          source: "product_signup_static_fallback",
          consent_given: true,
          consent_source: "product_signup_checkout_form",
          consent_text_version: "checkout_contact_consent_v1",
          requested_channels: ["email", "sms", "call"]
        };
        try {
          const response = await fetch("${checkoutEndpoint}", {
            method: "POST",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(payload)
          });
          const result = await response.json().catch(() => ({}));
          const checkoutUrl = result.url || result.data?.url;
          if (!response.ok || !checkoutUrl) throw new Error(result.error || result.data?.error || "Checkout could not be started.");
          window.location.assign(checkoutUrl);
        } catch (error) {
          errorBox.textContent = ((error && error.message) || "Checkout could not be started.") + " Payment has not completed. Retry checkout or contact support.";
          errorBox.style.display = "block";
          submit.disabled = false;
          submit.textContent = "Retry Secure Checkout";
        }
      });
    </script>
  </body>
</html>
`;

for (const fallbackPath of fallbackPaths) {
  const fallbackDir = path.join(outDir, fallbackPath);
  if (existsSync(fallbackDir) && !statSync(fallbackDir).isDirectory()) {
    rmSync(fallbackDir, { force: true });
  }
  mkdirSync(fallbackDir, { recursive: true });
  writeFileSync(path.join(fallbackDir, "index.html"), html, "utf8");
}

console.log(`Wrote product-signup fallback files: ${fallbackPaths.map((item) => `dist/${item}/index.html`).join(", ")}`);
