import { describe, expect, it } from "vitest";
import {
  formatNextDate,
  formatPastDate,
  selectAlters,
  tapeNames,
  type PublicAlter,
} from "../src/lib/alters";

function alter(overrides: Partial<PublicAlter> = {}): PublicAlter {
  return {
    short_name: "Discreet",
    title: "Discreet",
    date: "2026-11-19T23:30:00Z",
    mazmo_url: "https://mazmo.net/evento/1",
    cover_url: null,
    excerpt: null,
    ...overrides,
  };
}

describe("selectAlters", () => {
  it("returns nothing for an empty list", () => {
    expect(selectAlters([], new Date("2026-11-20T03:00:00Z"))).toEqual({
      next: null,
      past: [],
    });
  });

  it("keeps an alter as next inside the margin", () => {
    const a = alter();
    const { next, past } = selectAlters([a], new Date("2026-11-20T03:00:00Z"));
    expect(next).toBe(a);
    expect(past).toEqual([]);
  });

  it("moves an alter to past after the margin", () => {
    const a = alter();
    const { next, past } = selectAlters([a], new Date("2026-11-20T11:31:00Z"));
    expect(next).toBeNull();
    expect(past).toEqual([a]);
  });

  it("picks the closest of two future alters and hides the other", () => {
    const near = alter({ short_name: "Near", date: "2026-12-01T23:00:00Z" });
    const far = alter({ short_name: "Far", date: "2026-12-20T23:00:00Z" });
    const { next, past } = selectAlters(
      [far, near],
      new Date("2026-11-23T00:00:00Z"),
    );
    expect(next).toBe(near);
    expect(past).toEqual([]);
  });

  it("orders past alters from newest to oldest", () => {
    const upcoming = alter({ short_name: "Up", date: "2026-12-01T23:00:00Z" });
    const p1 = alter({ short_name: "P1", date: "2026-10-01T23:00:00Z" });
    const p2 = alter({ short_name: "P2", date: "2026-09-01T23:00:00Z" });
    const p3 = alter({ short_name: "P3", date: "2026-08-01T23:00:00Z" });
    const { next, past } = selectAlters(
      [p2, upcoming, p3, p1],
      new Date("2026-11-23T00:00:00Z"),
    );
    expect(next).toBe(upcoming);
    expect(past).toEqual([p1, p2, p3]);
  });
});

describe("formatNextDate", () => {
  it("formats in Buenos Aires time", () => {
    expect(formatNextDate("2026-11-19T23:30:00Z")).toBe("JUE 19.11 · 20.30");
  });

  it("uses the local day when UTC is already the next day", () => {
    expect(formatNextDate("2026-11-20T02:00:00Z")).toBe("JUE 19.11 · 23.00");
  });
});

describe("formatPastDate", () => {
  it("shows short month and year", () => {
    expect(formatPastDate("2026-04-16T23:30:00Z")).toBe("abr 2026");
  });

  it("cuts September to three letters", () => {
    expect(formatPastDate("2026-09-24T23:30:00Z")).toBe("sep 2026");
  });
});

describe("tapeNames", () => {
  it("dedupes and appends the fixed names", () => {
    const list = [
      alter({ short_name: "Discreet" }),
      alter({ short_name: "Spring Break" }),
      alter({ short_name: "Discreet" }),
    ];
    expect(tapeNames(list)).toEqual([
      "Discreet",
      "Spring Break",
      "Tan Selmo",
      "San Telmo",
    ]);
  });
});
