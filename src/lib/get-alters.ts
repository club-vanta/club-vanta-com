import type { PublicAlter } from "./alters";

export interface Snapshot {
  fetchedAt: string; // ISO
  alters: PublicAlter[];
}

export interface SnapshotStore {
  get(): Promise<Snapshot | null>;
  put(snapshot: Snapshot): Promise<void>;
}

export interface GetAltersDeps {
  fetchImpl: typeof fetch;
  store: SnapshotStore;
  apiUrl: string; // base, no trailing slash
  freshSeconds: number; // 900 in production, 0 in e2e
  timeoutMs: number; // 2500
  now: Date;
}

export type AltersSource = "fresh-cache" | "backend" | "stale-cache" | "none";

const isString = (v: unknown): v is string => typeof v === "string";

const LOCAL_ORIGIN = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/;

/** True when the configured API itself is a local one (the e2e fake backend). */
export function isLocalApi(apiUrl: string): boolean {
  return LOCAL_ORIGIN.test(apiUrl);
}

function isSafeUrl(v: unknown, allowInsecureLocal: boolean): v is string {
  if (!isString(v)) return false;
  if (v.startsWith("https://")) return true;
  return allowInsecureLocal && LOCAL_ORIGIN.test(v);
}

/**
 * Maps one backend item to exactly the public fields, so nothing else the
 * backend may send (locations, for example) reaches the cache or the page.
 */
function toPublicAlter(
  v: unknown,
  allowInsecureLocal: boolean,
): PublicAlter | null {
  if (typeof v !== "object" || v === null) return null;
  const a = v as Record<string, unknown>;
  if (
    !isString(a.short_name) ||
    !isString(a.title) ||
    !isString(a.date) ||
    Number.isNaN(Date.parse(a.date)) ||
    !isSafeUrl(a.mazmo_url, allowInsecureLocal)
  ) {
    return null;
  }
  if (a.cover_url !== null && !isString(a.cover_url)) return null;
  if (a.excerpt !== null && !isString(a.excerpt)) return null;
  return {
    short_name: a.short_name,
    title: a.title,
    date: a.date,
    mazmo_url: a.mazmo_url,
    cover_url: isSafeUrl(a.cover_url, allowInsecureLocal) ? a.cover_url : null,
    excerpt: a.excerpt,
  };
}

function parseList(
  list: unknown,
  allowInsecureLocal: boolean,
): PublicAlter[] | null {
  if (!Array.isArray(list)) return null;
  const alters: PublicAlter[] = [];
  for (const item of list) {
    const alter = toPublicAlter(item, allowInsecureLocal);
    if (!alter) return null;
    alters.push(alter);
  }
  return alters;
}

function parseAlters(
  body: unknown,
  allowInsecureLocal: boolean,
): PublicAlter[] | null {
  if (typeof body !== "object" || body === null) return null;
  return parseList((body as { alters?: unknown }).alters, allowInsecureLocal);
}

async function readSnapshot(
  store: SnapshotStore,
  allowInsecureLocal: boolean,
): Promise<Snapshot | null> {
  try {
    const snapshot = await store.get();
    if (!snapshot || !isString(snapshot.fetchedAt)) return null;
    const alters = parseList(snapshot.alters, allowInsecureLocal);
    if (!alters) return null;
    return { fetchedAt: snapshot.fetchedAt, alters };
  } catch {
    return null;
  }
}

async function fetchAlters(deps: GetAltersDeps): Promise<PublicAlter[] | null> {
  // Called unbound: workerd's fetch throws "Illegal invocation" when `this`
  // is `deps`.
  const { fetchImpl } = deps;
  try {
    const response = await fetchImpl(`${deps.apiUrl}/public/alters`, {
      signal: AbortSignal.timeout(deps.timeoutMs),
    });
    if (response.status !== 200) return null;
    return parseAlters(await response.json(), isLocalApi(deps.apiUrl));
  } catch {
    return null;
  }
}

export async function getAlters(
  deps: GetAltersDeps,
): Promise<{ alters: PublicAlter[]; source: AltersSource }> {
  const cached = await readSnapshot(deps.store, isLocalApi(deps.apiUrl));
  if (cached) {
    const ageMs = deps.now.getTime() - Date.parse(cached.fetchedAt);
    if (ageMs >= 0 && ageMs < deps.freshSeconds * 1000) {
      return { alters: cached.alters, source: "fresh-cache" };
    }
  }

  const alters = await fetchAlters(deps);
  if (alters) {
    try {
      await deps.store.put({ fetchedAt: deps.now.toISOString(), alters });
    } catch {
      // The data is good even if we could not keep a copy.
    }
    return { alters, source: "backend" };
  }

  if (cached) return { alters: cached.alters, source: "stale-cache" };
  return { alters: [], source: "none" };
}
