import { redirect } from "next/navigation";

// Email/password is gone (SSO only, #59): the sign-in page is the SSO page under (auth).
export default function LoginPage() {
	redirect("/signin");
}
