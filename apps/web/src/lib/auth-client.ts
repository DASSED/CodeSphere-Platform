import { createAuthClient } from "better-auth/react";

import { getServerUrl } from "./server-url";

export const authClient = createAuthClient({
  baseURL: new URL("/api/auth", getServerUrl()).toString(),
});
