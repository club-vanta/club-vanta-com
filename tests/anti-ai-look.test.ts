import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, test } from "vitest";

// Guards the look of the site: every page and component built later is
// scanned for the patterns that make a site look machine-made.

const SRC = join(import.meta.dirname, "..", "src");
const EXTENSIONS = [".astro", ".css", ".ts"];
const GENERATED = ["api/types.ts"];
const TOKENS = "styles/tokens.css";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const files = walk(SRC)
  .map((path) => ({
    name: relative(SRC, path).split(sep).join("/"),
    text: readFileSync(path, "utf8"),
  }))
  .filter(
    (f) =>
      EXTENSIONS.some((ext) => f.name.endsWith(ext)) &&
      !GENERATED.includes(f.name),
  );

function find(pattern: RegExp, scope = files): string[] {
  const hits: string[] = [];
  for (const file of scope) {
    for (const match of file.text.matchAll(pattern)) {
      const line = file.text.slice(0, match.index).split("\n").length;
      hits.push(`${file.name}:${line} ${match[0].trim()}`);
    }
  }
  return hits;
}

describe("anti AI look", () => {
  test("scans the source files", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  test("colors only in tokens.css", () => {
    const hex =
      /(?<![&\w])(?<!href=["'])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/gi;
    const functions = /\b(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch)\(/gi;
    const scope = files.filter((f) => f.name !== TOKENS);
    expect([...find(hex, scope), ...find(functions, scope)]).toEqual([]);
  });

  test("no forbidden fonts", () => {
    const sensitive = /\b(?:Inter|Roboto|Georgia)\b/g;
    const insensitive = /\b(?:ui-)?monospace\b/gi;
    expect([...find(sensitive), ...find(insensitive)]).toEqual([]);
  });

  test("no default easing", () => {
    // The name --ease-out is allowed: the lookbehind skips a leading dash.
    const declaration = /(?:transition|animation)[\w-]*\s*:[^;}]*/g;
    const offenders: string[] = [];
    for (const file of files) {
      for (const match of file.text.matchAll(declaration)) {
        if (/(?<![-\w])ease(?:-in-out|-in|-out)?(?![-\w])/.test(match[0])) {
          const line = file.text.slice(0, match.index).split("\n").length;
          offenders.push(`${file.name}:${line} ${match[0].trim()}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  test("no em dashes", () => {
    expect(find(/—/g)).toEqual([]);
  });

  test("no marketing filler", () => {
    expect(find(/Elevate|Seamless|Transformá|Descubrí el poder/gi)).toEqual([]);
  });

  test("no border-radius except carnet", () => {
    const radius = /border-radius\s*:\s*([^;}]+)/g;
    const offenders: string[] = [];
    for (const file of files) {
      for (const match of file.text.matchAll(radius)) {
        if (/^0(?:px)?$/.test(match[1].trim())) continue;
        const before = file.text.slice(0, match.index);
        const open = before.lastIndexOf("{");
        const selector = before.slice(
          Math.max(
            before.lastIndexOf("}", open),
            before.lastIndexOf("{", open - 1),
          ) + 1,
          open,
        );
        if (!/\.carnet\b/.test(selector)) {
          const line = before.split("\n").length;
          offenders.push(`${file.name}:${line} ${match[0].trim()}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
