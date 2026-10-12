import {
	emailOTPClient,
	inferAdditionalFields,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { getServerUrl } from "./server-url";

export const authClient = createAuthClient({
	baseURL: new URL("/api/auth", getServerUrl()).toString(),
	// Typed mirror of the server's additional user fields (packages/auth): set server-side only.
	plugins: [
		emailOTPClient(),
		inferAdditionalFields({
			user: {
				role: { type: "string", required: false, input: false },
				kind: { type: "string", required: false, input: false },
			},
		}),
	],
});
