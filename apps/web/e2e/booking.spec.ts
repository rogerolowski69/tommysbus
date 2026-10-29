import { expect, type Page, test } from "@playwright/test";

/** Pick the first bookable departure, moving forward a day at a time if today's have left. */
async function chooseFirstDeparture(page: Page) {
  const radios = page.locator('fieldset input[type="radio"]:not([disabled])');
  for (let i = 0; i < 5; i++) {
    await expect(page.getByText(/seats left|No departures|Sold out/).first()).toBeVisible();
    if ((await radios.count()) > 0) {
      await radios.first().check();
      return;
    }
    await page.getByRole("button", { name: "Next day" }).first().click();
  }
  throw new Error("No bookable departures found in the next 5 days");
}

test("books a one-way shuttle end to end and can cancel it", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("From", { exact: true }).selectOption("palatka");
  await page.getByLabel("To", { exact: true }).selectOption("orlando");
  await page.getByRole("button", { name: "Search Available Shuttles" }).click();

  await expect(page).toHaveURL(/\/book\?from=palatka&to=orlando/);
  await expect(page.getByRole("heading", { name: /Choose your departure/ })).toBeVisible();
  await chooseFirstDeparture(page);
  await page.getByRole("button", { name: /Continue to passenger details/ }).click();

  await page.getByLabel("Full name").fill("E2E Test Rider");
  await page.getByLabel("Email").fill("e2e.rider@example.com");
  await page.getByLabel("Mobile phone").fill("386-555-0188");
  await page.getByRole("button", { name: /Review reservation/ }).click();

  await expect(page.getByText("Calculated by the reservations server.")).toBeVisible();
  await expect(page.getByText(/Total/).first()).toBeVisible();
  const reserve = page.getByRole("button", { name: /Reserve seats/ });
  await expect(reserve).toBeDisabled(); // terms not yet accepted
  await page.getByRole("checkbox").check();
  await reserve.click();

  await expect(page).toHaveURL(/\/book\/confirmation\?ref=TB-[A-Z2-9]{6}#token=[0-9a-f]{64}$/);
  await expect(page.getByTestId("booking-reference")).toHaveText(/^TB-[A-Z2-9]{6}$/);
  await expect(page.getByText("DEMO · NOT PAID")).toBeVisible();
  await expect(page.getByTestId("booking-status")).toHaveText(/Held/);

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: /Cancel reservation/ }).click();
  await expect(page.getByTestId("booking-status")).toHaveText("Cancelled");
});

test("a confirmation link without its token reveals nothing", async ({ page }) => {
  await page.goto("/book/confirmation?ref=TB-ABCDEF");
  await expect(page.getByRole("heading", { name: "Reservation link incomplete" })).toBeVisible();
  await page.goto("/book/confirmation?ref=TB-ABCDEF#token=deadbeef");
  await expect(page.getByRole("heading", { name: "Reservation not found" })).toBeVisible();
});

test("validates passenger details before review", async ({ page }) => {
  await page.goto("/book?from=ocala&to=orlando");
  await page.getByRole("button", { name: /Find departures/ }).click();
  await chooseFirstDeparture(page);
  await page.getByRole("button", { name: /Continue to passenger details/ }).click();
  await page.getByRole("button", { name: /Review reservation/ }).click();
  await expect(page.getByText("Enter the lead passenger's full name")).toBeVisible();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
});

test("submits an hourly-hire request", async ({ page }) => {
  await page.goto("/services?type=HOURLY");
  const form = page.locator("form").filter({ has: page.getByLabel("What do you need?") });
  await expect(form.getByLabel("What do you need?")).toHaveValue("HOURLY");
  await form.getByLabel("Contact name").fill("E2E Hourly Rider");
  await form.getByLabel("Email").fill("e2e.hourly@example.com");
  await form.getByLabel("Phone").fill("386-555-0189");
  await form.getByLabel("Pickup city / area").fill("Crescent City");
  await form.getByLabel("Destination").fill("Errands around Palatka");
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  await form.getByLabel("Date", { exact: true }).fill(tomorrow);
  await form.getByRole("button", { name: /Request this trip/ }).click();
  await expect(form.getByText("Choose how many hours you need")).toBeVisible();
  await form.getByLabel("Hours needed").selectOption("3");
  await form.getByRole("button", { name: /Request this trip/ }).click();
  await expect(page.getByText("Request received")).toBeVisible();
});

test("routes page search filters cards", async ({ page }) => {
  await page.goto("/routes");
  await page.getByLabel("Search routes by city").fill("Ocala Palatka");
  await expect(page.getByText(/^2 routes found$/)).toBeVisible();
});
