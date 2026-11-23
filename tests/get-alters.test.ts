import { describe, expect, it } from "vitest";
import {
  getAlters,
  type GetAltersDeps,
  type Snapshot,
  type SnapshotStore,
} from "../src/lib/get-alters";
import { cacheSnapshotStore } from "../src/lib/snapshot-cache";
import type { PublicAlter } from "../src/lib/alters";

const NOW = new Date("2026-11-23T12:00:00.000Z");

function alter(n: number, over: Partial<PublicAlter> = {}): PublicAlter {
  return {
    short_name: `alter-${n}`,
    title: `Alter ${n}`,
    date: "2026-12-01T22:00:00.000Z",
    mazmo_url: `https://mazmo.net/e/${n}`,
    cover_url: null,
    excerpt: null,
    ...over,
  };
}

function memoryStore(initial: Snapshot | null) {
  let current = initial;
  const store: SnapshotStore & { current: () => Snapshot | null } = {
    get: async () => current,
    put: async (s) => {
      current = s;
    },
    current: () => current,
  };
  return store;
}

function snapshotAt(secondsAgo: number, alters: PublicAlter[]): Snapshot {
  return {
    fetchedAt: new Date(NOW.getTime() - secondsAgo * 1000).toISOString(),
    alters,
  };
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function makeDeps(
  store: SnapshotStore,
  respond: (signal: AbortSignal | undefined) => Promise<Response>,
  over: Partial<GetAltersDeps> = {},
) {
  const calls: string[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push(String(input));
    return respond(init?.signal ?? undefined);
  }) as typeof fetch;
  const deps: GetAltersDeps = {
    fetchImpl,
    store,
    apiUrl: "https://api.example.test",
    freshSeconds: 900,
    timeoutMs: 2500,
    now: NOW,
    ...over,
  };
  return { deps, calls };
}

describe("getAlters", () => {
  it("calls fetchImpl without binding it to deps", async () => {
    // workerd's fetch throws "Illegal invocation" when `this` is not the
    // global scope, so `deps.fetchImpl(...)` breaks with `fetchImpl: fetch`.
    const fresh = [alter(1)];
    const { deps } = makeDeps(memoryStore(null), async () =>
      jsonResponse({ alters: [] }),
    );
    deps.fetchImpl = function (this: unknown) {
      if (this !== undefined && this !== globalThis) {
        throw new TypeError("Illegal invocation");
      }
      return Promise.resolve(jsonResponse({ alters: fresh }));
    } as typeof fetch;
    expect(await getAlters(deps)).toEqual({ alters: fresh, source: "backend" });
  });

  it("uses a fresh copy without calling the backend", async () => {
    const cached = [alter(1)];
    const store = memoryStore(snapshotAt(60, cached));
    const { deps, calls } = makeDeps(store, async () =>
      jsonResponse({ alters: [] }),
    );
    const result = await getAlters(deps);
    expect(result).toEqual({ alters: cached, source: "fresh-cache" });
    expect(calls).toHaveLength(0);
  });

  it("refreshes a stale copy from the backend", async () => {
    const store = memoryStore(snapshotAt(5000, [alter(1)]));
    const fresh = [alter(2)];
    const { deps, calls } = makeDeps(store, async () =>
      jsonResponse({ alters: fresh }),
    );
    const result = await getAlters(deps);
    expect(result).toEqual({ alters: fresh, source: "backend" });
    expect(calls).toEqual(["https://api.example.test/public/alters"]);
    expect(store.current()).toEqual({
      fetchedAt: NOW.toISOString(),
      alters: fresh,
    });
  });

  it("uses the backend when there is no copy", async () => {
    const store = memoryStore(null);
    const fresh = [alter(3)];
    const { deps } = makeDeps(store, async () =>
      jsonResponse({ alters: fresh }),
    );
    expect(await getAlters(deps)).toEqual({ alters: fresh, source: "backend" });
    expect(store.current()?.alters).toEqual(fresh);
  });

  it("falls back to the stale copy on a 503", async () => {
    const stale = [alter(1)];
    const store = memoryStore(snapshotAt(5000, stale));
    const { deps } = makeDeps(
      store,
      async () => new Response("down", { status: 503 }),
    );
    expect(await getAlters(deps)).toEqual({
      alters: stale,
      source: "stale-cache",
    });
  });

  it("falls back to the stale copy when the backend is slower than the timeout", async () => {
    const stale = [alter(1)];
    const store = memoryStore(snapshotAt(5000, stale));
    const { deps } = makeDeps(
      store,
      (signal) =>
        new Promise<Response>((_resolve, reject) => {
          signal?.addEventListener("abort", () => reject(signal.reason));
        }),
      { timeoutMs: 100 },
    );
    const started = Date.now();
    const result = await getAlters(deps);
    expect(Date.now() - started).toBeLessThan(100 + 200);
    expect(result).toEqual({ alters: stale, source: "stale-cache" });
  });

  it("returns none when there is no copy and the backend is down", async () => {
    const store = memoryStore(null);
    const { deps } = makeDeps(store, async () => {
      throw new TypeError("network down");
    });
    expect(await getAlters(deps)).toEqual({ alters: [], source: "none" });
  });

  const invalid: [string, () => Response][] = [
    [
      "html content",
      () =>
        new Response("<html></html>", {
          headers: { "Content-Type": "text/html" },
        }),
    ],
    ["wrong shape", () => jsonResponse({ foo: 1 })],
    [
      "missing date",
      () => jsonResponse({ alters: [{ ...alter(9), date: undefined }] }),
    ],
    [
      "unparseable date",
      () => jsonResponse({ alters: [alter(9, { date: "not a date" })] }),
    ],
    [
      "bad cover_url",
      () => jsonResponse({ alters: [{ ...alter(9), cover_url: 5 }] }),
    ],
    [
      "missing excerpt",
      () => jsonResponse({ alters: [{ ...alter(9), excerpt: undefined }] }),
    ],
  ];
  for (const [name, respond] of invalid) {
    it(`treats ${name} as a failure and keeps the copy`, async () => {
      const stale = snapshotAt(5000, [alter(1)]);
      const store = memoryStore(stale);
      const { deps } = makeDeps(store, async () => respond());
      expect(await getAlters(deps)).toEqual({
        alters: stale.alters,
        source: "stale-cache",
      });
      expect(store.current()).toEqual(stale);
    });
  }

  it("treats a throwing store.get as no copy", async () => {
    const store: SnapshotStore = {
      get: async () => {
        throw new Error("boom");
      },
      put: async () => {},
    };
    const fresh = [alter(4)];
    const { deps } = makeDeps(store, async () =>
      jsonResponse({ alters: fresh }),
    );
    expect(await getAlters(deps)).toEqual({ alters: fresh, source: "backend" });
  });

  it("still returns the backend data when store.put throws", async () => {
    const store: SnapshotStore = {
      get: async () => null,
      put: async () => {
        throw new Error("boom");
      },
    };
    const fresh = [alter(5)];
    const { deps } = makeDeps(store, async () =>
      jsonResponse({ alters: fresh }),
    );
    expect(await getAlters(deps)).toEqual({ alters: fresh, source: "backend" });
  });

  it("always refetches when freshSeconds is 0", async () => {
    const store = memoryStore(snapshotAt(0, [alter(1)]));
    const fresh = [alter(6)];
    const { deps, calls } = makeDeps(
      store,
      async () => jsonResponse({ alters: fresh }),
      {
        freshSeconds: 0,
      },
    );
    expect((await getAlters(deps)).source).toBe("backend");
    expect(calls).toHaveLength(1);
  });
});

describe("cacheSnapshotStore", () => {
  function fakeCache(): Cache {
    const map = new Map<string, Response>();
    return {
      match: async (req: RequestInfo | URL) =>
        map.get(new Request(req).url)?.clone(),
      put: async (req: RequestInfo | URL, res: Response) => {
        map.set(new Request(req).url, res);
      },
    } as unknown as Cache;
  }

  it("returns null when empty", async () => {
    expect(await cacheSnapshotStore(fakeCache()).get()).toBeNull();
  });

  it("round trips a snapshot", async () => {
    const store = cacheSnapshotStore(fakeCache());
    const snapshot = snapshotAt(10, [alter(1), alter(2)]);
    await store.put(snapshot);
    expect(await store.get()).toEqual(snapshot);
  });

  it("stores under the synthetic URL with a one week max-age", async () => {
    const seen: { url: string; cc: string | null }[] = [];
    const cache = {
      match: async () => undefined,
      put: async (req: Request, res: Response) => {
        seen.push({ url: req.url, cc: res.headers.get("Cache-Control") });
      },
    } as unknown as Cache;
    await cacheSnapshotStore(cache).put(snapshotAt(0, []));
    expect(seen).toEqual([
      {
        url: "https://club-vanta.com/__alters-snapshot/v1",
        cc: "max-age=604800",
      },
    ]);
  });
});
