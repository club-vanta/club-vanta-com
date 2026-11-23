// Alters served by the fake backend. Dates are relative to the moment of the
// request, so the scenarios never expire.

export const BACKEND_PORT = 4599;
export const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

const DAY_MS = 24 * 60 * 60 * 1000;
const cover = (name) => `${BACKEND_URL}/covers/${name}.png`;

// 20.30 in Buenos Aires (UTC-3) is 23.30 UTC.
function at(now, days) {
  const date = new Date(now.getTime() + days * DAY_MS);
  date.setUTCHours(23, 30, 0, 0);
  return date.toISOString();
}

export const NEXT = {
  short_name: "Discreet",
  title: "Alter San Telmo - D I S C R E E T",
  mazmo_url:
    "https://mazmo.net/+eventos-reuniones-argentina/alter-san-telmo-d-i-s-c-r-e-e-t-wz2xfb4pt0s",
  cover: "full",
  excerpt:
    "Recuperaremos las raíces, un Alter para venir a charlar, ser buena gente y no andar juzgando.",
  extra: { location_label: "Chile 1234", latitude: -34.6, longitude: -58.37 },
};

// Newest first, as the backend returns them.
export const PAST = [
  {
    short_name: "Spring Break",
    title: "Alter Tan Selmo - Spring Break",
    mazmo_url:
      "https://mazmo.net/+eventos-reuniones-argentina/alter-tan-selmo-spring-break-qbl9je7buxk",
    cover: "open",
    days: -60,
  },
  {
    short_name: "Nación BDSM",
    title: "Alter a la Vuelta: Nación BDSM",
    mazmo_url:
      "https://mazmo.net/+eventos-reuniones-argentina/alter-la-vuelta-san-telmo-2h2m522p91u",
    cover: "full",
    days: -120,
  },
  {
    short_name: "Full Contact",
    title: "Alter a la Vuelta: Full Contact",
    mazmo_url:
      "https://mazmo.net/+eventos-reuniones-argentina/alter-la-vuelta-san-telmo-0wj51wqghew",
    cover: "full",
    days: -150,
  },
  {
    short_name: "Secret Face",
    title: 'Alter Tan Selmo "Secret Face"',
    mazmo_url:
      "https://mazmo.net/+eventos-reuniones-argentina/alter-tal-selmo-secret-face-opgnjcy4d0u",
    cover: "open",
    days: -210,
  },
];

function toAlter(
  { short_name, title, mazmo_url, cover: name, excerpt, extra },
  date,
) {
  return {
    short_name,
    title,
    date,
    mazmo_url,
    cover_url: name ? cover(name) : null,
    excerpt: excerpt ?? null,
    // Private fields the backend must never expose. The site has to drop
    // them; the privacy e2e test fails if any reaches the HTML.
    ...(extra ?? {}),
  };
}

const past = (now) => PAST.map((a) => toAlter(a, at(now, a.days)));

/** Body of `GET /public/alters` for each scenario, or null for no body. */
export const SCENARIOS = {
  "with-next": (now) => ({
    alters: [toAlter(NEXT, at(now, 10)), ...past(now)],
  }),
  "no-next": (now) => ({ alters: past(now) }),
  empty: () => ({ alters: [] }),
  "past-next": (now) => ({
    alters: [toAlter(NEXT, at(now, -2)), ...past(now)],
  }),
  down: () => null,
  slow: (now) => ({ alters: [toAlter(NEXT, at(now, 10)), ...past(now)] }),
  "no-covers": (now) => ({
    alters: PAST.map((a) => toAlter({ ...a, cover: null }, at(now, a.days))),
  }),
  // Cover URLs that answer 404, as when mazmocdn fails or blocks a hotlink.
  "broken-covers": (now) => ({
    alters: [
      toAlter({ ...NEXT, cover: "missing" }, at(now, 10)),
      ...PAST.map((a, i) =>
        toAlter(
          i === BROKEN_PAST ? { ...a, cover: "missing" } : a,
          at(now, a.days),
        ),
      ),
    ],
  }),
};

/** Index in PAST of the alter whose cover is broken in `broken-covers`. */
export const BROKEN_PAST = 1;

export const SLOW_MS = 5000;
