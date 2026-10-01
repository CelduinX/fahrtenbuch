import { expect, test } from "@playwright/test";

test("A4-Druck fasst 15 zweizeilige Fahrten pro Zwischen-Seite", async ({ page }) => {
  test.setTimeout(120_000);
  await page.request.post("/api/auth/login", { data: { username: "admin", password: "admin" } });
  const routeResponse = await page.request.post("/api/routes", { data: {
    placeA: "HO", placeB: "AG", placeAFullName: "Homeoffice", placeBFullName: "Arnold Gymnasium",
    distanceKm: 17, reimbursedKm: 14, durationMinutes: 20,
  } });
  expect(routeResponse.ok()).toBe(true);
  const routePairId = (await routeResponse.json()).route.id;
  for (let index = 0; index < 43; index++) {
    const day = String(Math.floor(index / 2) + 1).padStart(2, "0");
    const hour = index % 2 ? "09" : "08";
    const response = await page.request.post("/api/trips", { data: {
      date: `2044-09-${day}`, startTime: `${hour}:00`, endTime: `${hour}:20`, odometerStart: 1000 + index * 17,
      routePairId, direction: index % 2 ? "B_TO_A" : "A_TO_B", accompanyingStaff: "", remark: "IT",
    } });
    expect(response.ok()).toBe(true);
  }
  const columnsResponse = await page.request.patch("/api/settings/print-columns", { data: { visibleColumns: [
    "sequenceNumber", "date", "startTime", "endTime", "routeLabel", "odometerStart", "odometerEnd", "distanceKm", "accompanyingStaff", "remark",
  ] } });
  expect(columnsResponse.ok()).toBe(true);
  await page.goto("/print?month=2044-09");
  await expect(page.getByTestId("print-table-wrap")).toHaveAttribute("data-ready", "true");
  const frames = page.locator(".print-pages .print-page-frame");
  await expect(frames).toHaveCount(3);
  expect(await frames.evaluateAll((elements) => elements.map((element) => element.querySelectorAll("tbody tr").length))).toEqual([15, 15, 13]);
  expect(await frames.evaluateAll((elements) => elements.every((element) => element.querySelector("table")!.getBoundingClientRect().bottom < element.querySelector("footer")!.getBoundingClientRect().top))).toBe(true);
  await expect(page.locator(".print-pages tfoot")).toHaveCount(1);
  await page.emulateMedia({ media: "print" });
  const pdf = await page.pdf({ preferCSSPageSize: true, path: "test-results/print-density.pdf" });
  expect((pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) ?? []).length).toBe(3);
});
