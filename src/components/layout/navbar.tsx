"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { navGroups } from "@/config/nav";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [openGroup, setOpenGroup] = React.useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "py-2" : "py-4"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "flex items-center justify-between rounded-full border px-4 py-2 transition-all duration-300",
            scrolled
              ? "gx-glass shadow-[0_8px_30px_-12px_hsl(var(--shadow-color)/0.35)]"
              : "border-transparent bg-transparent"
          )}
        >
          <Link href="/" className="flex items-center py-1" aria-label="GuardianX home">
            <Logo iconSize={26} />
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden items-center gap-1 lg:flex"
            onMouseLeave={() => setOpenGroup(null)}
          >
            {navGroups.map((group) => (
              <div key={group.label} className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setOpenGroup(group.label)}
                  onClick={() => setOpenGroup((g) => (g === group.label ? null : group.label))}
                  className="flex items-center gap-1 rounded-full px-3.5 py-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
                  aria-expanded={openGroup === group.label}
                >
                  {group.label}
                  <ChevronDown
                    size={14}
                    className={cn(
                      "transition-transform duration-200",
                      openGroup === group.label && "rotate-180"
                    )}
                  />
                </button>

                <AnimatePresence>
                  {openGroup === group.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      className="gx-glass absolute left-1/2 top-full mt-3 w-72 -translate-x-1/2 rounded-2xl border p-2 shadow-[0_20px_50px_-12px_hsl(var(--shadow-color)/0.45)]"
                    >
                      {group.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setOpenGroup(null)}
                          className="block rounded-xl px-3.5 py-2.5 transition-colors hover:bg-background-alt"
                        >
                          <p className="text-sm font-medium text-foreground">{link.label}</p>
                          {link.description && (
                            <p className="mt-0.5 text-xs text-foreground-subtle">{link.description}</p>
                          )}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <ThemeToggle />
            <Button asChild variant="secondary" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild variant="primary" size="sm">
              <Link href="/register">Get started</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground"
            >
              {mobileOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="gx-glass mx-4 mt-2 overflow-hidden rounded-3xl border sm:mx-6 lg:hidden"
          >
            <div className="max-h-[75vh] overflow-y-auto p-5">
              {navGroups.map((group) => (
                <div key={group.label} className="mb-4 last:mb-0">
                  <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                    {group.label}
                  </p>
                  <div className="flex flex-col">
                    {group.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-background-alt"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              <div className="mt-4 flex gap-2 border-t border-border pt-4">
                <Button asChild variant="secondary" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild variant="primary" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Link href="/register">Get started</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
