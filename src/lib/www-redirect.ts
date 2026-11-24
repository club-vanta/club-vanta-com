const APEX = "club-vanta.com";

/** Returns the apex URL to redirect to when the request is for `www`, or null. */
export function wwwRedirect(url: URL): string | null {
  if (url.hostname !== `www.${APEX}`) return null;
  return `https://${APEX}${url.pathname}${url.search}`;
}
