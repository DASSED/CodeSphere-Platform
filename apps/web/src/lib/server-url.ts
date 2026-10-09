/** Base URL of the API: the internal one on the server (Docker), the public one in the browser. */
export function getServerUrl() {
  const url =
    typeof window === "undefined" && process.env.SERVER_URL
      ? process.env.SERVER_URL
      : process.env.NEXT_PUBLIC_SERVER_URL!;
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
