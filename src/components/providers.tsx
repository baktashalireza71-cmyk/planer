"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { AppConfigProvider } from "@/lib/app-config-context";
import { DEFAULT_THEME, THEME_IDS } from "@/lib/themes";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/* سیستم ۴ تم برنامه: شکوفه / زمرد / شب / غروب — روی data-theme تگ html سوار می‌شود */}
      <ThemeProvider
        attribute="data-theme"
        themes={THEME_IDS}
        defaultTheme={DEFAULT_THEME}
        enableSystem={false}
        disableTransitionOnChange
      >
        <AppConfigProvider>{children}</AppConfigProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
