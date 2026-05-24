#!/usr/bin/env node

const STRIPE_API = "https://api.stripe.com/v1";

const PACKAGES = [
  {
    package_key: "starter_system",
    name: "ClientSurge Systems - Starter",
    description: "Instant Lead Response + Missed Call Text-Back",
    setup_amount: 79700,
    monthly_amount: 49700,
  },
  {
    package_key: "growth_system",
    name: "ClientSurge Systems - Growth",
    description: "Starter + Appointment Booking AI + Follow-Up Sequences",
    setup_amount: 129700,
    monthly_amount: 99700,
  },
  {
    package_key: "elite_system",
    name: "ClientSurge Systems - Elite",
    description: "All 6 automations including Review Request + AI Receptionist",
    setup_amount: 249700,
    monthly_amount: 199700,
  },
];

function requireTestKey() {
  const key = process.env.STRIPE_SECRET_KEY || "";
  if (!key.startsWith("sk_test_") && !key.startsWith("rk_test_")) {
    throw new Error("STRIPE_SECRET_KEY must be a Stripe test-mode key for this script.");
  }
  return key;
}

async function stripeRequest(path, { method = "GET", body = null, key }) {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Stripe ${method} ${path} failed: ${response.status} ${payload.error?.message || JSON.stringify(payload)}`);
  }
  return payload;
}

function form(entries) {
  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    params.append(key, String(value));
  }
  return params;
}

async function findProduct(key, packageKey) {
  const query = encodeURIComponent(`metadata['clientsurge_package_key']:'${packageKey}' AND metadata['clientsurge_env']:'test'`);
  const payload = await stripeRequest(`/products/search?query=${query}&limit=1`, { key });
  return payload.data?.[0] || null;
}

async function findPrice(key, packageKey, kind) {
  const query = encodeURIComponent(`metadata['clientsurge_package_key']:'${packageKey}' AND metadata['clientsurge_price_kind']:'${kind}' AND active:'true'`);
  const payload = await stripeRequest(`/prices/search?query=${query}&limit=1`, { key });
  return payload.data?.[0] || null;
}

async function createProduct(key, pkg) {
  return stripeRequest("/products", {
    method: "POST",
    key,
    body: form([
      ["name", `${pkg.name} (Test)`],
      ["description", `${pkg.description} (test mode)`],
      ["metadata[clientsurge_package_key]", pkg.package_key],
      ["metadata[clientsurge_env]", "test"],
    ]),
  });
}

async function createPrice(key, productId, pkg, kind) {
  const isMonthly = kind === "monthly";
  const entries = [
    ["product", productId],
    ["currency", "usd"],
    ["unit_amount", isMonthly ? pkg.monthly_amount : pkg.setup_amount],
    ["metadata[clientsurge_package_key]", pkg.package_key],
    ["metadata[clientsurge_price_kind]", kind],
    ["metadata[clientsurge_env]", "test"],
  ];

  if (isMonthly) {
    entries.push(["recurring[interval]", "month"]);
  }

  return stripeRequest("/prices", {
    method: "POST",
    key,
    body: form(entries),
  });
}

async function main() {
  const key = requireTestKey();
  const results = [];

  for (const pkg of PACKAGES) {
    const product = (await findProduct(key, pkg.package_key)) || (await createProduct(key, pkg));
    const setupPrice = (await findPrice(key, pkg.package_key, "setup")) || (await createPrice(key, product.id, pkg, "setup"));
    const monthlyPrice = (await findPrice(key, pkg.package_key, "monthly")) || (await createPrice(key, product.id, pkg, "monthly"));

    results.push({
      package_key: pkg.package_key,
      test_product_id: product.id,
      test_setup_price_id: setupPrice.id,
      test_monthly_price_id: monthlyPrice.id,
      setup_amount: setupPrice.unit_amount,
      monthly_amount: monthlyPrice.unit_amount,
    });
  }

  process.stdout.write(`${JSON.stringify({ packages: results }, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
