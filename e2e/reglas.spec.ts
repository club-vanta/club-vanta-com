import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Locator } from "@playwright/test";
import { collectErrors, expectNoSeriousA11y, setScenario } from "./helpers";

const RED = "rgb(226, 87, 76)";
const MOCK = readFileSync(
  join(import.meta.dirname, "..", "docs", "mocks", "reglas.html"),
  "utf8",
);

const isMobile = (name: string) => name === "mobile";

/** Strips tags (a `<br>` counts as a space) and collapses whitespace. */
function plain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function mockAll(pattern: RegExp): string[] {
  return [...MOCK.matchAll(pattern)].map((m) => plain(m[1]));
}

/** Same normalization on the page side, from the rendered HTML. */
async function pageTexts(locator: Locator): Promise<string[]> {
  const htmls = await locator.evaluateAll((els) =>
    els.map((el) => el.innerHTML),
  );
  return htmls.map(plain);
}

test.describe("/reglas", () => {
  test("cabecera: título, insignia, franja y link de vuelta", async ({
    page,
  }) => {
    await page.goto("/reglas");
    await expect(page).toHaveTitle("Reglas de convivencia · Club Vanta");
    await expect(page.locator("h1")).toHaveText("REGLAS DE CONVIVENCIA", {
      useInnerText: true,
    });
    await expect(page.getByTestId("version")).toContainText("v0.2");
    await expect(page.getByTestId("must")).toHaveText(
      "LEER ESTE DOCUMENTO ES OBLIGATORIO PARA ENTRAR AL ALTER.",
      { useInnerText: true },
    );
    await expect(
      page.getByRole("link", { name: "← club-vanta.com", exact: true }),
    ).toHaveAttribute("href", "/");
  });

  test("bloques, reglas y cierre: el texto es el del mock", async ({
    page,
  }) => {
    await page.goto("/reglas");

    // The mock glues the block number to the title (`<small>01</small>Title`);
    // the page separates them with a space. Same words, same order.
    const expectedTitles = mockAll(
      /<h2 class="cond">(<small>[\s\S]*?)<\/h2>/g,
    ).map((t) => t.replace(/^(\d+)/, "$1 "));
    expect(expectedTitles).toEqual([
      "01 Convivencia",
      "02 Compromiso",
      "03 En el lugar",
    ]);
    expect(await pageTexts(page.locator(".block > h2"))).toEqual(
      expectedTitles,
    );

    const expectedRules = mockAll(/<li(?: class="key")?>([\s\S]*?)<\/li>/g);
    expect(expectedRules).toHaveLength(18);
    expect(await pageTexts(page.locator("main li"))).toEqual(expectedRules);

    expect(await pageTexts(page.locator(".block p"))).toEqual(
      mockAll(/<p class="note">([\s\S]*?)<\/p>/g).concat(
        mockAll(/<div class="penalty">[\s\S]*?<p>([\s\S]*?)<\/p>/g),
      ),
    );
    expect(await pageTexts(page.locator(".intro"))).toEqual(
      mockAll(/<p class="intro">([\s\S]*?)<\/p>/g),
    );

    const closing = MOCK.match(/<div class="closing">([\s\S]*?)<\/div>/)![1];
    expect(await pageTexts(page.locator(".closing p"))).toEqual(
      [...closing.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => plain(m[1])),
    );
  });

  test("la penalidad de 2 anotaciones en falso está destacada", async ({
    page,
  }) => {
    await page.goto("/reglas");
    const penalty = page.getByTestId("penalty");
    await expect(penalty).toBeVisible();
    await expect(penalty.locator(".n")).toHaveText("2");
    await expect(penalty.locator(".n")).toHaveCSS("color", RED);
    await expect(penalty.locator("b")).toHaveText([
      "2 anotaciones en falso",
      "1 fecha",
    ]);
  });

  test("las reglas en negrita llevan el número en rojo", async ({ page }) => {
    await page.goto("/reglas");
    const keyIndexes = [...MOCK.matchAll(/<li( class="key")?>/g)].flatMap(
      (m, i) => (m[1] ? [i] : []),
    );
    expect(keyIndexes).toEqual([0, 1, 4, 10, 16]);

    const items = page.locator("main li");
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      const { number, weight } = await items.nth(i).evaluate((el) => ({
        number: getComputedStyle(el, "::before").color,
        weight: getComputedStyle(el).fontWeight,
      }));
      if (keyIndexes.includes(i)) {
        expect(number, `regla ${i}`).toBe(RED);
        expect(weight, `regla ${i}`).toBe("700");
      } else {
        expect(number, `regla ${i}`).not.toBe(RED);
        expect(weight, `regla ${i}`).toBe("400");
      }
    }
  });

  test("VANTA: riel fijo en escritorio, banda horizontal en mobile", async ({
    page,
  }, testInfo) => {
    await page.goto("/reglas");
    const vanta = page.getByTestId("rail").locator("span");
    await expect(vanta).toHaveText("VANTA");
    const before = (await vanta.boundingBox())!;

    if (isMobile(testInfo.project.name)) {
      expect(before.width).toBeGreaterThan(before.height);
      await expect(vanta).toHaveCSS("writing-mode", "horizontal-tb");
      expect(before.y).toBeLessThan(40);

      // Blocks stack: the title sits above its list.
      const title = (await page.locator(".block > h2").first().boundingBox())!;
      const list = (await page.locator(".block ol").first().boundingBox())!;
      expect(list.y).toBeGreaterThanOrEqual(title.y + title.height);
      expect(list.x).toBeLessThan(title.x + title.width);
    } else {
      expect(before.height).toBeGreaterThan(before.width);
      await expect(vanta).toHaveCSS("writing-mode", "vertical-rl");
      await page.evaluate(() => window.scrollTo(0, 1500));
      await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeGreaterThan(1000);
      const after = (await vanta.boundingBox())!;
      expect(after.y).toBeGreaterThanOrEqual(0);
      expect(after.y).toBeLessThan(40);
      expect(after.x).toBeCloseTo(before.x, 0);

      const title = (await page.locator(".block > h2").first().boundingBox())!;
      const list = (await page.locator(".block ol").first().boundingBox())!;
      expect(list.x).toBeGreaterThan(title.x + title.width - 1);
    }
  });

  test("sin scroll horizontal", async ({ page }) => {
    await page.goto("/reglas");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("no depende del backend: con 'down' responde 200 igual", async ({
    page,
    request,
  }) => {
    await setScenario(request, "down");
    const errors = collectErrors(page);
    const response = await page.goto("/reglas");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("sin violaciones serias de accesibilidad", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/reglas");
    await expectNoSeriousA11y(page);
    expect(errors).toEqual([]);
  });
});
