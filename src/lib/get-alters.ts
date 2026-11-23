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
const isStringOrNull = (v: unknown): v is string | null =>
  v === null || isString(v);

function isPublicAlter(v: unknown): v is PublicAlter {
  if (typeof v !== "object" || v === null) return false;
  const a = v as Record<string, unknown>;
  return (
    isString(a.short_name) &&
    isString(a.title) &&
    isString(a.date) &&
    !Number.isNaN(Date.parse(a.date)) &&
    isString(a.mazmo_url) &&
    isStringOrNull(a.cover_url) &&
    isStringOrNull(a.excerpt)
  );
}

function parseAlters(body: unknown): PublicAlter[] | null {
  if (typeof body !== "object" || body === null) return null;
  const alters = (body as { alters?: unknown }).alters;
  if (!Array.isArray(alters) || !alters.every(isPublicAlter)) return null;
  return alters;
}

async function readSnapshot(store: SnapshotStore): Promise<Snapshot | null> {
  try {
    const snapshot = await store.get();
    if (!snapshot || !Array.isArray(snapshot.alters)) return null;
    return snapshot;
  } catch {
    return null;
  }
}

async function fetchAlters(deps: GetAltersDeps): Promise<PublicAlter[] | null> {
  try {
    const response = await deps.fetchImpl(`${deps.apiUrl}/public/alters`, {
      signal: AbortSignal.timeout(deps.timeoutMs),
    });
    if (response.status !== 200) return null;
    return parseAlters(await response.json());
  } catch {
    return null;
  }
}

export async function getAlters(
  deps: GetAltersDeps,
): Promise<{ alters: PublicAlter[]; source: AltersSource }> {
  const cached = await readSnapshot(deps.store);
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
