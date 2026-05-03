import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..", "..");
const resultsDir = path.join(root, "qa", "results");
const jsonOutputPath = path.join(resultsDir, "customer-experience-change-aware.json");
const docOutputPath = path.join(root, "docs", "customer-experience-change-aware-checks.md");

fs.mkdirSync(resultsDir, { recursive: true });

function git(args) {
  try {
    return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function lines(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const branch = git(["branch", "--show-current"]) || "unknown";
const trackingBranch = git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"]) || "";

const branchDelta = lines(git(["diff", "--name-only", "origin/main...HEAD", "--", "src"]));
const workingTreeDelta = lines(git(["diff", "--name-only", "--", "src"]));
const stagedDelta = lines(git(["diff", "--cached", "--name-only", "--", "src"]));
const allChanged = [...new Set([...branchDelta, ...workingTreeDelta, ...stagedDelta])];

function isCustomerFacing(relativePath) {
  return [
    /^src\/pages\/(Home|Store|Book|Contact|ClientPortal|Industries|MedSpa|Start|OrderSuccess|LegalPage|Success|CaptureLeads|Onboarding)\.jsx$/,
    /^src\/components\/landing\//,
    /^src\/components\/store\//,
    /^src\/components\/portal\//,
    /^src\/components\/forms\//,
    /^src\/components\/medspa\//,
    /^src\/components\/ProtectedRoute\.jsx$/,
    /^src\/lib\/AuthContext\.jsx$/,
    /^src\/App\.jsx$/,
  ].some((pattern) => pattern.test(relativePath));
}

const changedCustomerFiles = allChanged.filter(isCustomerFacing);

let taskCounter = 1;
const tasks = [];

function addTask(file, title, reason, checks) {
  tasks.push({
    id: `CA-${String(taskCounter).padStart(3, "0")}`,
    file,
    title,
    reason,
    checks,
  });
  taskCounter += 1;
}

function addGenericTasks(file) {
  addTask(
    file,
    "Page/component still loads cleanly",
    "This customer-facing file changed, so we should re-verify the visible surface still renders without regressions.",
    [
      "Open the affected page or trigger the affected component.",
      "Confirm no broken layout, blank state, or obvious visual crash.",
      "Confirm the changed surface still works on desktop.",
    ]
  );
  addTask(
    file,
    "Copy still matches platform truth",
    "Customer-facing copy should stay honest after every content or UX change.",
    [
      "Check that the changed surface does not overclaim live readiness or unsupported integrations.",
      "Check that CTA language still matches the actual flow.",
      "Check that labels are consistent with the canonical admin/portal/store naming.",
    ]
  );
}

for (const file of changedCustomerFiles) {
  addGenericTasks(file);

  if (file === "src/App.jsx" || file === "src/components/ProtectedRoute.jsx" || file === "src/lib/AuthContext.jsx") {
    addTask(
      file,
      "Route/auth protection still behaves correctly",
      "Core routing or auth shell changed.",
      [
        "Verify public routes still load when logged out.",
        "Verify `/client-portal` redirects unauthenticated users correctly.",
        "Verify `/admin` still blocks non-admin users.",
        "Verify logout returns the user to the homepage in a logged-out state.",
      ]
    );
  }

  if (file.includes("/landing/Navbar.jsx")) {
    addTask(
      file,
      "Navigation flow still feels fast and correct",
      "Navbar changes affect first-click experience across the site.",
      [
        "Click AI Store and confirm navigation is fast on the published site.",
        "Verify Login and Book Demo buttons still open the right flows.",
        "Verify desktop and mobile nav both still work.",
      ]
    );
  }

  if (file.includes("/pages/Store.jsx") || file.includes("/components/store/")) {
    addTask(
      file,
      "Store, cart, and bundle flows still work end to end",
      "Store-facing changes can break pricing, search, cart behavior, or checkout entry.",
      [
        "Verify store hero stats and package section still render.",
        "Verify search and category filters still work.",
        "Verify Add to Cart, sticky summary, sidebar open/close, and package load flow.",
        "Verify manual-review offers still stay consultative and do not enter self-serve checkout.",
      ]
    );
  }

  if (file.includes("/landing/Pricing.jsx")) {
    addTask(
      file,
      "Pricing packages still match the store and deployment truth",
      "Pricing changes can drift from the canonical catalog.",
      [
        "Verify Starter, Growth, and Pro render correctly.",
        "Verify bundle CTA opens the correct package in the store.",
        "Verify pricing copy still matches the canonical install model.",
      ]
    );
  }

  if (file.includes("/pages/ClientPortal.jsx") || file.includes("/components/portal/")) {
    addTask(
      file,
      "Portal experience still works for a real customer",
      "Portal changes affect the logged-in client experience directly.",
      [
        "Verify portal login, logout, and tab switching.",
        "Verify Build Progress labels remain honest.",
        "Verify plan/billing visibility still makes sense.",
      ]
    );
  }

  if (file.includes("/pages/Book.jsx") || file.includes("/pages/Contact.jsx") || file.includes("/components/forms/") || file.includes("/pages/Start.jsx")) {
    addTask(
      file,
      "Lead/demo capture flow still works cleanly",
      "Booking/contact/forms changes affect a primary conversion path.",
      [
        "Open the related page or modal.",
        "Verify form fields, validation, and close behavior.",
        "Verify the flow still routes users into the expected booking/contact path.",
      ]
    );
  }

  if (file.includes("/pages/Home.jsx") || file.includes("/components/landing/") || file.includes("/pages/MedSpa.jsx") || file.includes("/components/medspa/")) {
    addTask(
      file,
      "Marketing sections still feel polished and trustworthy",
      "Homepage or vertical-page changes need truthfulness and presentation checks.",
      [
        "Verify section layout on desktop and mobile.",
        "Verify CTA buttons still go to the intended destination.",
        "Verify no section implies unsupported live capabilities.",
      ]
    );
  }
}

const payload = {
  generatedAt: new Date().toISOString(),
  branch,
  trackingBranch,
  changedCustomerFiles,
  totalTasks: tasks.length,
  tasks,
};

fs.writeFileSync(jsonOutputPath, `${JSON.stringify(payload, null, 2)}\n`);

const markdown = [
  "# Customer Experience Change-Aware Checks",
  "",
  `Generated: ${payload.generatedAt}`,
  "",
  "This file is generated from current website-facing changes in git. It adds QA tasks that should be reviewed because the related customer-facing files changed.",
  "",
  `- Current branch: \`${branch}\``,
  `- Tracking branch: \`${trackingBranch || "none"}\``,
  `- Changed customer-facing files detected: \`${changedCustomerFiles.length}\``,
  `- Generated change-aware tasks: \`${tasks.length}\``,
  "",
  "## Changed Customer-Facing Files",
  "",
];

if (changedCustomerFiles.length === 0) {
  markdown.push("- None detected.");
} else {
  for (const file of changedCustomerFiles) {
    markdown.push(`- \`${file}\``);
  }
}

markdown.push("", "## Generated QA Tasks", "");

if (tasks.length === 0) {
  markdown.push("- None generated.");
} else {
  for (const task of tasks) {
    markdown.push(`### ${task.id} - ${task.title}`);
    markdown.push(`- File: \`${task.file}\``);
    markdown.push(`- Why: ${task.reason}`);
    markdown.push("- What to check:");
    for (const check of task.checks) {
      markdown.push(`  - ${check}`);
    }
    markdown.push("");
  }
}

fs.writeFileSync(docOutputPath, `${markdown.join("\n")}\n`);
console.log(`Wrote change-aware QA JSON to ${jsonOutputPath}`);
console.log(`Wrote change-aware QA markdown to ${docOutputPath}`);
