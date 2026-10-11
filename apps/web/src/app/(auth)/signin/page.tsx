import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/server-session";

import SignInForm from "./sign-in-form";

// A Member already signed in has nothing to do here: the server sends them on through
// /post-signin before the page renders (#121).
export default async function SignInPage() {
	const session = await getServerSession();
	if (session?.user) {
		redirect("/post-signin");
	}
	return <SignInForm />;
}
