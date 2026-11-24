import { expect, test, type Page } from "@playwright/test";
import { NEXT, PAST } from "./fixtures.mjs";
import { collectErrors, expectNoSeriousA11y, setScenario } from "./helpers";

const TELEGRAM = "https://t.me/+0H-a1v8KRDYzMDMx";
const NO_DATE_TEXT =
  "Hacemos un alter cada uno o dos meses y lo publicamos en mazmo unas tres semanas antes.";

const isMobile = (name: string) => name === "mobile";

async function expectNoDate(page: Page, lastName: string, project: string) {
  const next = page.locator("#proximo");
  await expect(next.getByRole("heading", { level: 2 })).toHaveText(
    "Todavía no hay fecha",
  );
  await expect(next).toContainText(
    `${NO_DATE_TEXT} El último fue ${lastName}.`,
  );
  await expect(
    next.getByRole("link", { name: "Anotarme en mazmo" }),
  ).toHaveCount(0);
  const telegram = next.getByRole("link", {
    name: "Enterate primero en Telegram",
  });
  await expect(telegram).toHaveAttribute("href", TELEGRAM);
  // The plain logo, never the last cover seen through it.
  await expect(next.locator(".mask img")).toHaveCount(1);
  await expect(next.locator(".mask img")).toHaveAttribute("src", "/vanta.svg");
  await expect(next.locator(".mask")).toHaveCSS("mask-image", "none");
  if (isMobile(project)) {
    await expect(page.getByTestId("sticky-next")).toHaveCount(0);
  }
}

test.describe("próximo alter", () => {
  test.describe("with-next", () => {
    test.beforeEach(async ({ request }) => setScenario(request, "with-next"));

    test("muestra el próximo alter", async ({ page }) => {
      const response = await page.goto("/");
      expect(response?.headers()["cache-control"]).toBe("public, max-age=60");

      const next = page.locator("#proximo");
      await expect(next.getByText("PRÓXIMO ALTER")).toBeVisible();
      await expect(next.getByRole("heading", { level: 2 })).toHaveText(
        NEXT.short_name.toUpperCase(),
        { ignoreCase: false },
      );
      await expect(next.getByTestId("when")).toHaveText(
        /^\s*[A-ZÁÉ]{3} \d{2}\.\d{2} · 20\.30 · SAN TELMO · GRATIS\s*$/,
      );
      await expect(next.getByText(NEXT.excerpt)).toBeVisible();
      const signup = next.getByRole("link", { name: "Anotarme en mazmo" });
      await expect(signup).toBeVisible();
      await expect(signup).toHaveAttribute("href", NEXT.mazmo_url);
    });

    test("barra fija en mobile", async ({ page }, testInfo) => {
      await page.goto("/");
      const sticky = page.getByTestId("sticky-next");
      if (!isMobile(testInfo.project.name)) {
        await expect(sticky).toBeHidden();
        return;
      }
      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight),
      );
      await expect(sticky).toBeVisible();
      await expect(sticky).toContainText(NEXT.short_name.toUpperCase());
      const link = sticky.getByRole("link", { name: "Anotarme →" });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", NEXT.mazmo_url);
    });

    test("el HTML no tiene datos de ubicación", async ({ request }) => {
      const html = await (await request.get("/")).text();
      expect(html).toContain(NEXT.short_name.toUpperCase());
      for (const word of [
        /Chile/,
        /\blat\b/,
        /\blng\b/,
        /\baddress\b/i,
        /latitude|longitude|location_label/,
      ]) {
        expect(html).not.toMatch(word);
      }
    });

    test("sin violaciones serias de accesibilidad", async ({ page }) => {
      await page.goto("/");
      await expectNoSeriousA11y(page);
    });
  });

  test.describe("no-next", () => {
    test.beforeEach(async ({ request }) => setScenario(request, "no-next"));

    test("muestra que no hay fecha", async ({ page }, testInfo) => {
      await page.goto("/");
      await expectNoDate(page, PAST[0].short_name, testInfo.project.name);
    });

    test("sin violaciones serias de accesibilidad", async ({ page }) => {
      await page.goto("/");
      await expectNoSeriousA11y(page);
    });
  });

  test("empty: sin fecha, sin último y muro vacío", async ({
    page,
    request,
  }) => {
    await setScenario(request, "empty");
    const errors = collectErrors(page);
    await page.goto("/");
    const next = page.locator("#proximo");
    await expect(next.getByRole("heading", { level: 2 })).toHaveText(
      "Todavía no hay fecha",
    );
    await expect(next).toContainText(NO_DATE_TEXT);
    await expect(next).not.toContainText("El último fue");
    await expect(page.getByTestId("wall")).toBeAttached();
    await expect(page.getByTestId("wall").locator("img")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("past-next: un alter vencido no figura como próximo", async ({
    page,
    request,
  }, testInfo) => {
    await setScenario(request, "past-next");
    await page.goto("/");
    await expectNoDate(page, NEXT.short_name, testInfo.project.name);
  });

  test("down: usa la copia en caché", async ({ browser, page, request }) => {
    await setScenario(request, "with-next");
    await page.goto("/");
    await expect(page.locator("#proximo h2")).toHaveText(
      NEXT.short_name.toUpperCase(),
    );

    await setScenario(request, "down");
    // A new context, so the browser cache cannot answer for the server.
    const context = await browser.newContext();
    const second = await context.newPage();
    await second.goto(new URL("/", page.url()).href);
    await expect(second.locator("#proximo h2")).toHaveText(
      NEXT.short_name.toUpperCase(),
    );
    await context.close();
  });

  test("slow: la página responde en menos de 4 s", async ({ request }) => {
    await setScenario(request, "slow");
    const start = Date.now();
    const response = await request.get("/");
    const elapsed = Date.now() - start;
    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(4000);
  });
});
