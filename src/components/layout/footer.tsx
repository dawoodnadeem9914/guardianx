import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { footerLinks } from "@/config/nav";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background-alt">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 md:grid-cols-6 md:gap-10">
          <div className="sm:col-span-2 md:col-span-2">
            <Logo iconSize={26} />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-foreground-muted">
              The AI Emergency Copilot. Recognize, verify, assess, explain, guide, connect,
              protect — in the first sixty seconds that matter most.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <SocialIcon href="#" label="GitHub">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a10.98 10.98 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.8 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14 0 1.54-.01 2.79-.01 3.17 0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="#" label="LinkedIn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.45 20.45h-3.56v-5.58c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.15 1.45-2.15 2.94v5.68H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="#" label="X">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.24 2.5h3.3l-7.2 8.23 8.47 10.77h-6.63l-5.19-6.78-5.94 6.78H1.75l7.7-8.8L1.35 2.5h6.8l4.69 6.2L18.24 2.5Zm-1.16 17.02h1.83L7.02 4.4H5.06l12.02 15.12Z" />
                </svg>
              </SocialIcon>
            </div>
          </div>

          {footerLinks.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                {group.label}
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground-muted transition-colors hover:text-teal-strong dark:hover:text-teal"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 sm:flex-row sm:items-center">
          <p className="text-xs leading-relaxed text-foreground-subtle">
            © {new Date().getFullYear()} GuardianX. Built for SDG 3, 9 &amp; 11. Not a substitute
            for professional emergency services.
          </p>
          <div className="flex gap-5 text-xs text-foreground-subtle">
            <Link href="/security-privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="/security-privacy" className="transition-colors hover:text-foreground">
              Security
            </Link>
            <Link href="/contact" className="transition-colors hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-teal hover:text-teal-strong dark:hover:text-teal"
    >
      {children}
    </Link>
  );
}