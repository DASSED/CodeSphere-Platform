import { redirect } from "next/navigation";

// The KPI page moved to /dashboard; /admin/kpi stays the API path (#113).
export default function Page() {
	redirect("/dashboard");
}
