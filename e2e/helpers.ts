import { expect, type APIRequestContext, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { BACKEND_URL } from "./fixtures.mjs";

/** Switches the fake backend to a scenario from e2e/fixtures.mjs. */
export async function setScenario(request: APIRequestContext, name: string) {
  const response = await request.post(`${BACKEND_URL}/__scenario/${name}`);
  expect(response.ok()).toBe(true);
}

/** Collects console errors and uncaught exceptions from the page. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

/** Fails on axe violations with impact `serious` or `critical`. */
export async function expectNoSeriousA11y(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const serious = violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(
    serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`),
  ).toEqual([]);
}
