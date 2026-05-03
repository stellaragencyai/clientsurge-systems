import { expect, test } from "@playwright/test";

const PORTAL_TEST_FIXTURE_KEY = "clientsurge_portal_test_fixture";

const portalFixture = {
  user: {
    id: "qa-user-1",
    email: "qa.portal@example.com",
    full_name: "QA Portal User",
    role: "client",
  },
  project: {
    id: "project-qa-1",
    business_name: "Acme Smile Studio",
    plan: "Growth System",
    go_live_date: "2026-05-12T00:00:00.000Z",
    step_onboarding: "complete",
    step_payment: "complete",
    step_system_setup: "in_progress",
    step_sms: "in_progress",
    step_email: "pending",
    step_booking: "pending",
    step_followup: "pending",
    step_live: "pending",
  },
  order: {
    id: "order-qa-1",
    pipeline_status: "Testing",
    services: [
      { service_key: "instant_lead_response", display_name: "Instant Lead Response", install_status: "Testing" },
      { service_key: "ai_booking_agent", display_name: "AI Booking Agent", install_status: "Configuring" },
    ],
  },
  subscription: {
    plan_type: "Growth System",
    status: "active",
    current_period_end: "2026-06-01T00:00:00.000Z",
    services_included: ["instant_lead_response", "missed_call_text_back", "nurture_sequence_14d", "ai_booking_agent"],
    change_request_status: "none",
  },
  support_messages: [
    {
      id: "support-msg-1",
      role: "admin",
      message: "We have finished the first setup pass and are now verifying your lead response flow.",
      read: true,
    },
  ],
};

async function seedPortalFixture(page) {
  await page.addInitScript(
    ({ key, fixture }) => {
      window.localStorage.setItem(key, JSON.stringify(fixture));
    },
    { key: PORTAL_TEST_FIXTURE_KEY, fixture: portalFixture }
  );
}

test("[FE-208 FE-209 FE-210 FE-211] Authenticated portal opens and tab state persists", async ({
  page,
}) => {
  await seedPortalFixture(page);
  await page.goto("/client-portal");

  await expect(page.getByRole("heading", { name: /Acme Smile Studio/i })).toBeVisible();
  await expect(page.getByText(/^Target live review:/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /Customer Setup Checklist/i })).toBeVisible();

  await page.getByRole("button", { name: /My Plan/i }).click();
  await expect(page).toHaveURL(/tab=plan/);
  await expect(page.getByRole("heading", { name: /Subscription & Plan/i })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/tab=plan/);
  await expect(page.getByRole("heading", { name: /Subscription & Plan/i })).toBeVisible();
});

test("[FE-212 FE-213 FE-214] Authenticated portal support chat sends optimistically", async ({
  page,
}) => {
  await seedPortalFixture(page);
  await page.goto("/client-portal?tab=support");

  await expect(page.getByRole("heading", { name: /Support & Messaging/i })).toBeVisible();
  await expect(page.getByText(/We have finished the first setup pass/i)).toBeVisible();

  await page.getByPlaceholder(/Type your message/i).fill("Can you confirm the booking flow test?");
  await page.getByRole("button").filter({ has: page.locator("svg") }).last().click();

  await expect(page.getByText("Can you confirm the booking flow test?")).toBeVisible();
  await expect(page.getByText(/Last updated/i)).toBeVisible();
});

test("[FE-215 FE-216 FE-217] Authenticated portal plan requests are readable and confirmed", async ({
  page,
}) => {
  await seedPortalFixture(page);
  await page.goto("/client-portal?tab=plan");

  await expect(page.getByText(/Billing Status/i)).toBeVisible();
  await expect(page.getByText(/^Active$/i)).toBeVisible();

  await page.getByRole("button", { name: /Starter System/i }).click();
  await page.getByRole("button", { name: /Request Change/i }).click();
  await expect(page.getByText(/Confirm downgrade request/i)).toBeVisible();
  await page.getByRole("button", { name: /Confirm request/i }).click();
  await expect(page.getByText(/submitted for operator review/i)).toBeVisible();
});

test("[FE-218 FE-219] Authenticated portal logout returns to the homepage", async ({
  page,
}) => {
  await seedPortalFixture(page);
  await page.goto("/client-portal");

  await page.getByRole("button", { name: /Sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: /Turn Every Lead Into a Booked Appointment/i })
  ).toBeVisible();
});
