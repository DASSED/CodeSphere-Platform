"use client";

import { Toaster } from "@codesphere/ui/components/atoms/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

import { setupPersistence } from "@/lib/persist";
import { createQueryClient } from "@/utils/orpc";

import { ThemeProvider } from "./theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  // One QueryClient per mount, never shared between server requests.
  const [queryClient] = useState(() => {
    const client = createQueryClient();
    setupPersistence(client);
    return client;
  });

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools />
      </QueryClientProvider>
      <Toaster richColors />
    </ThemeProvider>
  );
}
