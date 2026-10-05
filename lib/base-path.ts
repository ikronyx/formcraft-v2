/** Sub-folder the app is served from, e.g. "/formcraft". Empty string when served from the domain root. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
/** Prefix for plain <a href> links (next/link and router.push add the base path themselves). */
export const withBase = (path: string) => `${BASE_PATH}${path}`;
