import { headers } from "next/headers";

import { authClient } from "@/lib/auth-client";

/** The session of the current request, read on the server with the visitor's cookies. */
export async function getServerSession() {
	const { data } = await authClient.getSession({
		fetchOptions: { headers: await headers() },
	});
	return data;
}
