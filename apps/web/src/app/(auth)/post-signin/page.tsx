import { redirect } from "next/navigation";

import { postSignInPath } from "@/lib/post-signin";
import { getServerSession } from "@/lib/server-session";

// Landing of every sign-in (#121): sends an Admin to /admin and any other Member home.
export default async function PostSignInPage() {
	const session = await getServerSession();
	redirect(postSignInPath(session?.user));
}
