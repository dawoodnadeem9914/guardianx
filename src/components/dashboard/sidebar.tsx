"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { dashboardNav } from "@/config/dashboard-nav";
import { hasRole, type Role } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

interface SidebarProps {
  /**
   * Optional — when provided, items whose `requiredRole` the user
   * doesn't hold are hidden entirely (not shown-and-disabled — that
   * treatment is reserved for features that simply aren't built yet).
   * Omitting this prop shows every enabled item, matching this
   * component's behavior before role-based navigation existed.
   */
  role?: Role;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const visibleNav = dashboardNav.filter(
    (item) => !item.requiredRole || !role || hasRole(role, item.requiredRole)
  );

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-background-alt lg:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href="/" aria-label="GuardianX home">
          <Logo iconSize={24} />
        </Link>
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

      <div className="border-t border-border p-4">
        <p className="text-xs leading-relaxed text-foreground-subtle">
          GuardianX is decision support, not a diagnostic device. In a real emergency, always
          call your local emergency number.
        </p>
      </div>
    </aside>
  );
}