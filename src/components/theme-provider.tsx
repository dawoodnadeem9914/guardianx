"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Wraps next-themes:
 * - attribute="class" toggles the `.dark` class consumed by globals.css
 * - defaultTheme="system" reads the OS preference on first visit
 * - enableSystem keeps listening to OS changes unless the user overrides it
 * - next-themes persists the resolved choice to localStorage automatically
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
