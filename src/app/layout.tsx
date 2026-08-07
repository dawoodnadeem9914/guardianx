import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

/**
 * Font strategy: this dev sandbox has no network access to Google Fonts,
 * so the type system is defined as a refined system-font stack instead of
 * next/font/google. The stack leads with the same platform-native
 * geometric sans Vercel/Linear/Stripe rely on (San Francisco / Segoe UI /
 * Inter fallback chain), which keeps the "Vercel-inspired" typographic
 * intent from the brand brief without a network fetch at build time.
 * Swap in next/font/google(Geist) once deployed with network access.
 *
 * Layout strategy: this root layout is intentionally minimal — it's the
 * shared shell (theme, fonts, toasts) for every route. The public
 * Navbar/Footer live in the (marketing) route group, and /dashboard,
 * /login, /register etc. each define their own chrome, matching how a
 * real SaaS product (marketing site vs. app shell) is actually built.
 */

export const metadata: Metadata = {
  title: {
    default: "GuardianX — The AI Emergency Copilot",
    template: "%s — GuardianX",
  },
  description:
    "GuardianX recognizes, verifies, assesses, explains, guides, connects, and protects — the AI Emergency Copilot that closes the full loop in the first sixty seconds that matter most.",
  keywords: [
    "GuardianX",
    "AI emergency copilot",
    "emergency recognition AI",
    "first aid AI",
    "campus safety app",
    "SDG 3",
  ],
  openGraph: {
    title: "GuardianX — The AI Emergency Copilot",
    description:
      "Recognize. Verify. Assess. Explain. Guide. Connect. Protect. GuardianX is the AI Emergency Copilot built for the first sixty seconds that matter most.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-center" theme="system" />
        </ThemeProvider>
      </body>
    </html>
  );
}
