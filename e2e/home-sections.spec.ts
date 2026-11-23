import { expect, test, type Page } from "@playwright/test";
import { BROKEN_PAST, NEXT, PAST } from "./fixtures.mjs";
import { collectErrors, expectNoSeriousA11y, setScenario } from "./helpers";
import { formatPastDate } from "../src/lib/alters";

const MAZMO_PROFILE = "https://mazmo.net/@ClubVanta";
const TELEGRAM = "https://t.me/+0H-a1v8KRDYzMDMx";
const INK_2 = "rgb(21, 21, 21)";

const isMobile = (name: string) => name === "mobile";

// Same date the fake backend builds: `days` from now at 23.30 UTC.
function pastDate(days: number): string {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  date.setUTCHours(23, 30, 0, 0);
  return formatPastDate(date.toISOString());
}

async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
  });
}

test.describe("resto de la home", () => {
  test.describe("with-next", () => {
    test.beforeEach(async ({ request }) => setScenario(request, "with-next"));

    test("qué es", async ({ page }) => {
      await page.goto("/");
      const what = page.locator("#que-es");
      const lines = what.locator("h2 > span");
      await expect(lines).toHaveText(
        ["UN BAR.", "UN JUEVES.", "GENTE CHARLANDO."],
        { useInnerText: true },
      );
      await expect(what).toContainText(
        "Nos juntamos a las 20.30 en un bar de San Telmo. Es gratis y es un espacio público: no se permiten prácticas.",
      );
    });

    test("carnet: título, pasos en orden y link a las reglas", async ({
      page,
    }) => {
      await page.goto("/");
      const club = page.locator("#espacio");
      await expect(club.locator("h2 > *")).toHaveText(
        ["UN ESPACIO HUMANO", "HECHO POR HUMANOS."],
        { useInnerText: true },
      );
      await expect(club).toContainText(
        "Cada alter tiene códigos, dinámicas y juegos para que la gente se conozca y se dé la oportunidad de profundizar.",
      );
      const carnet = page.getByTestId("carnet");
      await expect(carnet).toContainText("PARA VENIR AL ALTER");
      const steps = carnet.locator("ol > li");
      await expect(steps).toHaveCount(3);
      await expect(steps.nth(0)).toContainText("Perfil en mazmo");
      await expect(steps.nth(0)).toContainText(
        "Sin perfil no se puede entrar.",
      );
      await expect(steps.nth(1)).toContainText("Anotate en el post");
      await expect(steps.nth(1)).toContainText(
        "¿No podés exponerte? Lista discreta, por privado.",
      );
      await expect(steps.nth(2)).toContainText("Leé las reglas");
      await expect(
        steps.nth(2).getByRole("link", { name: /club-vanta\.com\/reglas/ }),
      ).toHaveAttribute("href", "/reglas");
      await expect(carnet).not.toContainText("Club social");
    });

    test("cinta: todos los nombres, y quieta con movimiento reducido", async ({
      page,
    }) => {
      await page.goto("/");
      const tape = page.getByTestId("tape");
      for (const name of [NEXT.short_name, ...PAST.map((a) => a.short_name)]) {
        await expect(tape).toContainText(name);
      }
      const track = tape.locator(".track");
      await expect(track).not.toHaveCSS("animation-name", "none");

      await page.emulateMedia({ reducedMotion: "reduce" });
      const { name, state } = await track.evaluate((el) => {
        const style = getComputedStyle(el);
        return { name: style.animationName, state: style.animationPlayState };
      });
      expect(name === "none" || state === "paused").toBe(true);
    });

    test("alters pasados: un tile por alter", async ({ page }, testInfo) => {
      await page.goto("/");
      const section = page.locator("#pasados");
      await expect(
        section.getByRole("heading", { name: "Alters pasados" }),
      ).toBeAttached();
      const tiles = section.getByTestId("past-tile");
      await expect(tiles).toHaveCount(PAST.length);
      for (const [i, alter] of PAST.entries()) {
        const tile = tiles.nth(i);
        await expect(tile).toContainText(alter.short_name);
        await expect(tile).toContainText(pastDate(alter.days));
        await expect(tile.locator("a")).toHaveAttribute(
          "href",
          alter.mazmo_url,
        );
        const img = tile.locator("img");
        await expect(img).toHaveAttribute(
          "alt",
          `Flyer de ${alter.short_name}`,
        );
        await expect(img).toHaveAttribute("referrerpolicy", "no-referrer");
        await expect(img).toHaveAttribute("loading", "lazy");
      }

      const firstImg = tiles.first().locator("img");
      if (isMobile(testInfo.project.name)) {
        await expect(section.getByTestId("past-grid")).toHaveCSS(
          "scroll-snap-type",
          /x mandatory/,
        );
        await expect(firstImg).toHaveCSS("filter", "none");
      } else {
        await expect(firstImg).toHaveCSS("filter", /grayscale\(1\)/);
        await expect(firstImg).toHaveCSS("transition-property", /filter/);
        await tiles.first().hover();
        await expect(firstImg).toHaveCSS("filter", "none");
        await page.mouse.move(0, 0);
        await tiles.nth(1).locator("a").focus();
        await expect(tiles.nth(1).locator("img")).toHaveCSS("filter", "none");
      }
    });

    test("pie: mazmo, Telegram y reglas", async ({ page }) => {
      await page.goto("/");
      const footer = page.locator("footer");
      await expect(
        footer.getByRole("link", { name: "@ClubVanta" }),
      ).toHaveAttribute("href", MAZMO_PROFILE);
      await expect(
        footer.getByRole("link", { name: "canal de difusión" }),
      ).toHaveAttribute("href", TELEGRAM);
      for (const user of ["vananitadolc4", "ashrrou"]) {
        await expect(
          footer.getByRole("link", { name: `@${user}` }),
        ).toHaveAttribute("href", `https://t.me/${user}`);
      }
      await expect(
        footer.getByRole("link", { name: "club-vanta.com/reglas" }),
      ).toHaveAttribute("href", "/reglas");
      await expect(footer).toContainText("preguntas por privado");
      await expect(footer).toContainText(
        "versión 0.2 · leerlas es obligatorio",
      );
    });

    test("sin scroll horizontal en ningún ancho", async ({
      page,
    }, testInfo) => {
      test.skip(isMobile(testInfo.project.name), "widths are set by hand");
      for (const width of [375, 768, 1024, 1280, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/");
        await scrollThrough(page);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow, `at ${width} px`).toBeLessThanOrEqual(0);
      }
    });

    test("sin violaciones serias de accesibilidad abajo", async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto("/");
      await scrollThrough(page);
      await expectNoSeriousA11y(page);
      expect(errors).toEqual([]);
    });
  });

  test("no-covers: el nombre sobre el fondo, sin imágenes rotas", async ({
    page,
    request,
  }) => {
    await setScenario(request, "no-covers");
    const errors = collectErrors(page);
    await page.goto("/");
    const tiles = page.getByTestId("past-tile");
    await expect(tiles).toHaveCount(PAST.length);
    await expect(page.locator("#pasados img")).toHaveCount(0);
    for (const [i, alter] of PAST.entries()) {
      const blank = tiles.nth(i).getByTestId("no-cover");
      await expect(blank).toContainText(alter.short_name);
      await expect(blank).toHaveCSS("background-color", INK_2);
    }
    expect(errors).toEqual([]);
  });

  test("broken-covers: una portada que no carga no deja una imagen rota", async ({
    page,
    request,
  }) => {
    await setScenario(request, "broken-covers");
    await page.goto("/");
    await scrollThrough(page);
    await page.waitForLoadState("networkidle");

    // Every broken image removed itself; lazy images that never loaded
    // (hidden wall tiles) are not `complete` and do not count.
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            [...document.images].filter(
              (img) => img.complete && img.naturalWidth === 0,
            ).length,
        ),
      )
      .toBe(0);
    await expect(page.locator('#proximo img[src*="missing"]')).toHaveCount(0);
    // The failed cover leaves the logo, as when there is no cover.
    const logo = page.locator('#proximo .mask img[src="/vanta.svg"]');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveCSS("object-fit", "contain");
    await expect(page.locator("#proximo .mask")).toHaveCSS(
      "mask-image",
      "none",
    );

    const tiles = page.getByTestId("past-tile");
    await expect(tiles).toHaveCount(PAST.length);
    const broken = tiles.nth(BROKEN_PAST);
    await expect(broken.locator("img")).toHaveCount(0);
    const blank = broken.getByTestId("no-cover");
    await expect(blank).toBeVisible();
    await expect(blank).toContainText(PAST[BROKEN_PAST].short_name);
    await expect(blank).toHaveCSS("background-color", INK_2);
    await expect(tiles.nth(0).locator("img")).toHaveCount(1);
  });

  test("empty: sin cinta ni pasados, con el resto de la página", async ({
    page,
    request,
  }) => {
    await setScenario(request, "empty");
    await page.goto("/");
    await expect(page.getByTestId("tape")).toHaveCount(0);
    await expect(page.locator("#pasados")).toHaveCount(0);
    await expect(page.locator("#que-es")).toBeVisible();
    await expect(page.getByTestId("carnet")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });
});
