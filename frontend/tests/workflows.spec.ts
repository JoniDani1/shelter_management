import { test, expect } from "@playwright/test";
test("worker publishes draft availability to map and another tab", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("6,032");
  await page.screenshot({ path: "/tmp/tonight-home.png", fullPage: true });
  await page.getByRole("button", { name: "View Map", exact: true }).click();
  const marker = page.getByRole("button", {
    name: "Franklinstraße: 12 demonstration beds",
    exact: true,
  });
  await expect(marker).toBeVisible();
  await page.getByRole("button", { name: "Worker login", exact: true }).click();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("wrong@example.com");
  await page.getByLabel("Password", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Log In", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("incorrect");
  await page.getByRole("button", { name: "Use Anna's demo account ↗" }).click();
  await page.getByRole("button", { name: "Log In", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Franklinstraße", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Available beds", { exact: true }).fill("7");
  await expect(marker).toHaveCount(1);
  await page.getByLabel("Operational bed capacity").fill("40");
  await expect(page.getByLabel("Occupied beds", { exact: true })).toHaveValue(
    "43",
  );
  await expect(page.getByRole("alert")).toContainText("exceed");
  await expect(
    page.getByRole("button", { name: "Update Availability", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Operational bed capacity").fill("50");
  const other = await context.newPage();
  await other.goto("/");
  await other.getByRole("button", { name: "View Map", exact: true }).click();
  await page
    .getByRole("button", { name: "Update Availability", exact: true })
    .click();
  await expect(
    page.getByText("Availability updated successfully.", { exact: false }),
  ).toBeVisible();
  await expect(
    other.getByRole("button", {
      name: "Franklinstraße: 7 demonstration beds",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Close worker panel", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Franklinstraße: 7 demonstration beds",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Franklinstraße: 7 demonstration beds",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Franklinstraße", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Get directions" }),
  ).toHaveAttribute("href", /google.com\/maps\/dir/);
  await page.waitForTimeout(700);
  const box = await page
    .getByRole("dialog", { name: "Franklinstraße", exact: true })
    .boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(1100);
  await page.screenshot({ path: "/tmp/tonight-map.png" });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Franklinstraße", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Berlin shelter map" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close Map", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "View Map", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("mobile search, filtering, list details, and map without tiles", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/tile.openstreetmap.org/**", (route) => route.abort());
  await page.goto("/");
  await page.screenshot({
    path: "/tmp/tonight-mobile-home.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "View Map", exact: true }).click();
  await page
    .getByRole("button", { name: "Search shelters", exact: true })
    .click();
  await page.getByLabel("Where are you looking?").fill("Franklin");
  await expect(
    page.getByRole("button", {
      name: "Franklinstraße: 12 demonstration beds",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Lehrter Straße: 23/ }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Search shelters", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Charlottenburg.*Franklinstraße/ })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Franklinstraße" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Close Details", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Filter shelters", exact: true })
    .click();
  await page.getByLabel("Confirmed wheelchair access only").check();
  await expect(
    page.getByRole("heading", { name: "No shelters match" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Franklinstraße: 12 demonstration beds",
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/tonight-mobile-map.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});

test("mobile worker controls, focus containment, and persisted publication", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Shelter Worker Login", exact: true })
    .click();
  await page.getByRole("button", { name: "Use Anna's demo account ↗" }).click();
  await page.getByRole("button", { name: "Log In", exact: true }).click();
  await expect(page.getByLabel("Available beds", { exact: true })).toHaveValue(
    "12",
  );
  await page.getByLabel("Available beds", { exact: true }).fill("7");
  await page
    .getByRole("button", { name: "Update Availability", exact: true })
    .click();
  await expect(
    page.getByText("Availability updated successfully.", { exact: false }),
  ).toBeVisible();
  await page.screenshot({ path: "/tmp/tonight-mobile-worker.png" });
  const dialog = page.getByRole("dialog", {
    name: "Shelter management",
    exact: true,
  });
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
  await page.getByRole("button", { name: "Log out", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Close worker panel", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Close worker panel", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: "View Map", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Franklinstraße: 7 demonstration beds",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Franklinstraße: 7 demonstration beds",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Franklinstraße", exact: true }),
  ).toBeVisible();
  const details = await page
    .getByRole("dialog", { name: "Franklinstraße", exact: true })
    .boundingBox();
  expect(details!.y + details!.height).toBeLessThanOrEqual(844);
  await page.screenshot({ path: "/tmp/tonight-mobile-details.png" });
});
