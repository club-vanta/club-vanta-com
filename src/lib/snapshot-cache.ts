import type { Snapshot, SnapshotStore } from "./get-alters";

const SNAPSHOT_URL = "https://club-vanta.com/__alters-snapshot/v1";
// One week as a fallback. Freshness is decided by `fetchedAt`, not by this TTL.
const MAX_AGE_SECONDS = 604800;

export function cacheSnapshotStore(cache: Cache): SnapshotStore {
  return {
    async get() {
      const response = await cache.match(new Request(SNAPSHOT_URL));
      if (!response) return null;
      return (await response.json()) as Snapshot;
    },
    async put(snapshot) {
      await cache.put(
        new Request(SNAPSHOT_URL),
        new Response(JSON.stringify(snapshot), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": `max-age=${MAX_AGE_SECONDS}`,
          },
        }),
      );
    },
  };
}
