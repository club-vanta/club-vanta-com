import { describe, expect, it } from "vitest";
import { wwwRedirect } from "../src/lib/www-redirect";

describe("wwwRedirect", () => {
  it("sends www to the apex keeping path and query", () => {
    expect(wwwRedirect(new URL("https://www.club-vanta.com/reglas?x=1"))).toBe(
      "https://club-vanta.com/reglas?x=1",
    );
  });

  it("returns null for the apex", () => {
    expect(wwwRedirect(new URL("https://club-vanta.com/reglas"))).toBeNull();
  });

  it("returns null for localhost", () => {
    expect(wwwRedirect(new URL("http://localhost:4321/"))).toBeNull();
  });
});
