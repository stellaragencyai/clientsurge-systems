import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..", "..");
const resultsDir = path.join(root, "qa", "results");
const outputPath = path.join(resultsDir, "customer-experience-code-audit.json");

fs.mkdirSync(resultsDir, { recursive: true });

const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const appSource = read("src/App.jsx");
const adminDashboardSource = read("src/pages/AdminDashboard.jsx");
const navbarSource = read("src/components/landing/Navbar.jsx");
const productCardSource = read("src/components/store/ProductCard.jsx");
const buildTrackerSource = read("src/components/portal/BuildTracker.jsx");
const clientPortalSource = read("src/pages/ClientPortal.jsx");

const salesCatalogModule = await import(
  pathToFileURL(path.join(root, "src/lib/salesCatalog.js")).href
);

const results = {};

function record(id, passed, note) {
  results[id] = {
    status: passed ? "passed" : "failed",
    source: "code-audit",
    note,
  };
}

record(
  "FE-010",
  navbarSource.includes('{ label: "AI Store", href: "/store", isPage: true }'),
  "Navbar includes an AI Store route entry that points to /store."
);

record(
  "FE-030",
  appSource.includes('<Route path="/client-portal" element={<ClientPortal />} />') &&
    appSource.includes("<ProtectedRoute unauthenticatedElement={<AuthRedirectFallback />} />"),
  "Client portal route remains protected by ProtectedRoute."
);

record(
  "FE-031",
  appSource.includes('allowedRoles={["admin"]}') &&
    adminDashboardSource.includes("if (!user || user.role !== 'admin')"),
  "Admin access is guarded both at the route layer and inside AdminDashboard."
);

record(
  "FE-033",
  adminDashboardSource.includes("base44.auth.logout('/')"),
  "Admin logout redirects to the main page as a logged-out visitor."
);

record(
  "FE-034",
  appSource.includes('allowedRoles={["admin"]}') &&
    adminDashboardSource.includes("base44.auth.logout('/')"),
  "Admin routes remain protected after logout because /admin is route-guarded and logout sends the user to /."
);

record(
  "FE-139",
  salesCatalogModule.PUBLIC_STORE_PRODUCTS.length === 12,
  `Public store catalog count is ${salesCatalogModule.PUBLIC_STORE_PRODUCTS.length}.`
);

record(
  "FE-140",
  salesCatalogModule.SELF_SERVE_PRODUCTS.length === 6,
  `Self-serve product count is ${salesCatalogModule.SELF_SERVE_PRODUCTS.length}.`
);

record(
  "FE-141",
  salesCatalogModule.PACKAGE_OFFERS.length === 3,
  `Package offer count is ${salesCatalogModule.PACKAGE_OFFERS.length}.`
);

record(
  "FE-148",
  productCardSource.includes("Add to Cart"),
  "Product cards expose an Add to Cart state for checkout-enabled products."
);

record(
  "FE-149",
  productCardSource.includes("Manual Review") &&
    productCardSource.includes("Book Demo to Scope"),
  "Manual-review products visibly use consultative wording."
);

record(
  "FE-150",
  salesCatalogModule.PUBLIC_STORE_PRODUCTS.filter((product) => product.checkout_enabled === false).length === 6,
  "Six public store offers are explicitly excluded from self-serve checkout."
);

record(
  "FE-163",
  salesCatalogModule.PUBLIC_STORE_PRODUCTS
    .filter((product) => product.checkout_enabled === false)
    .every((product) => !product.service_key),
  "Unsupported public offers do not map into canonical service_key checkout items."
);

record(
  "FE-215",
  buildTrackerSource.includes("Booking Flow Setup") &&
    buildTrackerSource.includes("Follow-Up Setup") &&
    buildTrackerSource.includes("System Live"),
  "Portal build tracker uses the current honest labels."
);

record(
  "FE-216",
  buildTrackerSource.includes("Your paid setup order is marked live."),
  "Portal build tracker no longer claims the system is 'fully live and running'."
);

record(
  "FE-229",
  clientPortalSource.includes('onClick={() => base44.auth.logout("/")}'),
  "Client portal exposes a logout path that returns to the homepage."
);

const payload = {
  generatedAt: new Date().toISOString(),
  checks: results,
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote code-audit results to ${outputPath}`);
