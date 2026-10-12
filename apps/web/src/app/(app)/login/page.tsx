import { redirect } from "next/navigation";

// Email/password is gone (SSO, plus the opt-in email code outside production, #59): the sign-in page is the SSO page under (auth).
export default function LoginPage() {
	redirect("/signin");
}
