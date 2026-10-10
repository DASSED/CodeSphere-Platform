import Header from "@/components/header";

// Pages of the application share the top bar. Standalone pages such as
// /design-system live outside this group and render without it.
export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="grid h-svh grid-rows-[auto_1fr]">
      <Header />
      {children}
    </div>
  );
}
