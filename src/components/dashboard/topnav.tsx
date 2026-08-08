"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Badge } from "@/components/ui/badge";
import { dashboardNav } from "@/config/dashboard-nav";
import { hasRole, type Role } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

interface TopNavProps {
  email: string;
  fullName: string | null;
  /** Optional — threaded to UserMenu for logout logging. See UserMenu's own doc comment. */
  userId?: string;
  /** Optional — threaded to the mobile drawer's nav list, same filtering behavior as Sidebar. */
  role?: Role;
}

export function TopNav({ email, fullName, userId, role }: TopNavProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  const visibleNav = dashboardNav.filter(
    (item) => !item.requiredRole || !role || hasRole(role, item.requiredRole)
  );

  // Accessibility: let Escape close the mobile drawer, matching expected
  // dialog behavior for an overlay with a backdrop.
  React.useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={17} />
        </button>
        <p className="hidden text-sm font-medium text-foreground-muted sm:block">
          {currentPageLabel(pathname)}
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <ThemeToggle />
        <UserMenu email={email} fullName={fullName} userId={userId} />
      </div>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
              className="fixed inset-0 z-50 bg-black/40 lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-background-alt lg:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b border-border px-5">
                <Link href="/" aria-label="GuardianX home">
                  <Logo iconSize={24} />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border"
                >
                  <X size={15} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-5">
                <ul className="flex flex-col gap-1">
                  {visibleNav.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    if (!item.enabled) {
                      return (
                        <li key={item.href}>
                          <div className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2.5 text-sm text-foreground-subtle opacity-60">
                            <span className="flex items-center gap-3">
                              <Icon size={17} strokeWidth={1.75} />
                              {item.label}
                            </span>
                            <Badge variant="neutral" className="px-2 py-0.5 text-[10px]">
                              Soon
                            </Badge>
                          </div>
                        </li>
                      );
                    }
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-teal/10 text-teal-strong dark:text-teal"
                              : "text-foreground-muted hover:bg-surface hover:text-foreground"
                          )}
                        >
                          <Icon size={17} strokeWidth={1.75} />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

function currentPageLabel(pathname: string) {
  const match = dashboardNav.find((item) => item.href === pathname);
  return match?.label ?? "Dashboard";
}