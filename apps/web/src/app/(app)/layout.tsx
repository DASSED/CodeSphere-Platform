import SiteHeader from "@/components/site-header";

// Pages of the application share the site's bar (#129). Standalone pages such as
// /design-system, /signin and /admin live outside this group and render without it.
export default function AppLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="min-h-svh">
			<SiteHeader />
			{children}
		</div>
	);
}
