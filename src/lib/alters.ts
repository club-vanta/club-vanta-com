import type { components } from "../api/types";

export type PublicAlter = components["schemas"]["PublicAlter"];

export const AFTER_START_MARGIN_MS = 12 * 60 * 60 * 1000;

const TIME_ZONE = "America/Argentina/Buenos_Aires";

export function selectAlters(
  alters: PublicAlter[],
  now: Date,
): { next: PublicAlter | null; past: PublicAlter[] } {
  const time = (a: PublicAlter) => new Date(a.date).getTime();
  const upcoming = alters
    .filter((a) => time(a) + AFTER_START_MARGIN_MS > now.getTime())
    .sort((a, b) => time(a) - time(b));
  const past = alters
    .filter((a) => time(a) + AFTER_START_MARGIN_MS <= now.getTime())
    .sort((a, b) => time(b) - time(a));
  return { next: upcoming[0] ?? null, past };
}

function parts(iso: string, options: Intl.DateTimeFormatOptions) {
  const formatter = new Intl.DateTimeFormat("es-AR", {
    timeZone: TIME_ZONE,
    hourCycle: "h23",
    ...options,
  });
  const map: Record<string, string> = {};
  for (const p of formatter.formatToParts(new Date(iso))) {
    map[p.type] = p.value.replace(/\./g, "");
  }
  return map;
}

export function formatNextDate(iso: string): string {
  const p = parts(iso, {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${p.weekday.toUpperCase()} ${p.day}.${p.month} · ${p.hour}.${p.minute}`;
}

export function formatPastDate(iso: string): string {
  const p = parts(iso, { month: "short", year: "numeric" });
  return `${p.month.toLowerCase()} ${p.year}`;
}

export function tapeNames(alters: PublicAlter[]): string[] {
  const sorted = [...alters].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const names = new Set(sorted.map((a) => a.short_name));
  for (const fixed of ["Tan Selmo", "San Telmo"]) names.add(fixed);
  return [...names];
}
