import { expect, test } from "@playwright/test";

test("[FE-001 FE-003 FE-005 FE-018 FE-041 FE-042 FE-043] Home page shell and hero render", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Turn Every Lead Into a Booked Appointment/i })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^AI Store$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Book Your Free Demo/i }).first()).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
});

test("[FE-035 FE-036 FE-207] Portal login modal opens and closes from the navbar", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Login$/i }).click();
  await expect(page.getByText("Client Portal")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Welcome Back/i })).toBeVisible();
  await page.getByLabel("Close dialog").click();
  await expect(page.getByRole("heading", { name: /Welcome Back/i })).not.toBeVisible();
});

test("[FE-010 FE-138] AI Store link opens the store page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^AI Store$/i }).click();
  await expect(page).toHaveURL(/\/store$/);
  await expect(page.getByText("AI Service Catalog")).toBeVisible();
});

test("[FE-131 FE-132 FE-133 FE-134 FE-137] Pricing section shows the three package cards", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#pricing").scrollIntoViewIfNeeded();
  await expect(page.getByText("Starter System")).toBeVisible();
  await expect(page.getByText("Growth System")).toBeVisible();
  await expect(page.getByText("Pro System")).toBeVisible();
  await expect(
    page.getByText("We handle the implementation work, not just the strategy")
  ).toBeVisible();
});

test("[FE-136] Pricing section CTA opens the canonical store", async ({ page }) => {
  await page.goto("/");
  await page.locator("#pricing").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /Book Your Free Demo/i }).last().click();
  await expect(page.getByText("Tell us about your business")).toBeVisible();
});

test("[FE-139 FE-140 FE-141 FE-142 FE-145 FE-146 FE-147] Store page renders catalog controls and package section", async ({
  page,
}) => {
  await page.goto("/store");
  await expect(page.getByText("AI Services in Catalog", { exact: true })).toBeVisible();
  await expect(page.getByText("Self-Serve Checkout", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /Packaged Systems/i })).toBeVisible();
  await expect(page.getByPlaceholder("Search canonical services...")).toBeVisible();
  await expect(page.getByRole("button", { name: "All" })).toBeVisible();
});

test("[FE-148 FE-154 FE-155 FE-156 FE-166 FE-167] Cart and builder activate when a self-serve service is selected", async ({
  page,
}) => {
  await page.goto("/store");
  await expect(page.getByText("Bundle Pricing Summary")).not.toBeVisible();
  await page.getByRole("button", { name: /Add to Cart/i }).first().click();
  await expect(page.getByText(/installable service selected/i)).toBeVisible();
  await expect(page.getByText("Bundle Pricing Summary")).toBeVisible();
  await expect(page.getByText("Canonical Service Bundle")).toBeVisible();
  await page.mouse.click(10, 10);
  await expect(page.getByText("Canonical Service Bundle")).not.toBeVisible();
  await page.getByText(/installable service selected/i).click({ force: true });
  await expect(page.getByText("Canonical Service Bundle")).toBeVisible();
});

test("[FE-143 FE-144 FE-165] Loading a package populates the bundle and savings summary", async ({
  page,
}) => {
  await page.goto("/store");
  await page.getByRole("button", { name: /Load This Bundle/i }).first().click();
  await expect(page.getByText("Canonical Service Bundle")).toBeVisible();
  await expect(page.getByText(/Bundle Savings/i).first()).toBeVisible();
});

test("[FE-149 FE-150] Manual-review offers stay consultative and route to demo scoping", async ({
  page,
}) => {
  await page.goto("/store");
  await page.getByPlaceholder("Search canonical services...").fill("AI Email Follow-Up");
  await expect(page.getByText("Manual Review")).toBeVisible();
  await page.getByRole("button", { name: /Book Demo to Scope/i }).click();
  await expect(page).toHaveURL(/\/book$/);
  await expect(page.getByRole("heading", { name: /Book Your Free Demo/i })).toBeVisible();
});

test("[FE-176 FE-178] Book page and demo booking modal render correctly", async ({ page }) => {
  await page.goto("/book");
  await expect(page.getByRole("heading", { name: /Book Your Free Demo/i })).toBeVisible();
  await expect(page.getByText("Tell us about your business")).toBeVisible();
});

test("[FE-183 FE-186] Contact page renders and can open the demo booking modal", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByRole("heading", { name: /Let's Talk About Your Business/i })).toBeVisible();
  await page.getByRole("button", { name: /Book Your Free Demo/i }).nth(1).click();
  await expect(page.getByText("Tell us about your business")).toBeVisible();
});

test("[FE-187] Start page launches the med spa demo modal", async ({ page }) => {
  await page.goto("/start");
  await expect(page.getByText(/Tell us about your med spa/i)).toBeVisible();
});

test("[FE-198 FE-199 FE-200] Industries page renders and live industry navigation works", async ({
  page,
}) => {
  await page.goto("/industries");
  await expect(
    page.getByRole("heading", { name: /Automation for Appointment-Based Businesses/i })
  ).toBeVisible();
  await page.getByRole("link", { name: /Explore this industry/i }).click();
  await expect(page).toHaveURL(/\/med-spa$/);
});

test("[FE-201 FE-202] Legal pages load", async ({ page }) => {
  await page.goto("/legal/privacy");
  await expect(page.locator("body")).toContainText(/privacy/i);
  await page.goto("/legal/terms");
  await expect(page.locator("body")).toContainText(/terms/i);
});

test("[FE-170 FE-171 FE-173 FE-174] Order success page stays honest and links back into the product flow", async ({
  page,
}) => {
  await page.goto("/order-success?session_id=qa_session");
  await expect(page.getByRole("heading", { name: /You're All Set/i })).toBeVisible();
  await expect(page.locator("body")).toContainText(
    /configuration, testing, and live review inside our admin workspace/i
  );
  await page.getByRole("link", { name: /Add more AI services/i }).click();
  await expect(page).toHaveURL(/\/store$/);
});

test("[FE-231 FE-233] Med spa page loads its hero content", async ({ page }) => {
  await page.goto("/med-spa");
  await expect(page.getByRole("heading", { name: /Stop Losing Med Spa Leads/i })).toBeVisible();
});
