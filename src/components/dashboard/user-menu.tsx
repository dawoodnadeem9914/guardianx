"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, User as UserIcon, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UserMenuProps {
  email: string;
  fullName: string | null;
}

function getInitials(name: string | null, email: string) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return email[0]?.toUpperCase() ?? "?";
}

export function UserMenu({ email, fullName }: UserMenuProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-full border border-border py-1 pl-1 pr-3 transition-colors hover:border-teal"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-strong text-[11px] font-semibold text-white dark:bg-teal dark:text-[#04201c]">
            {getInitials(fullName, email)}
          </span>
          <span className="max-w-[120px] truncate text-sm text-foreground">
            {fullName || email}
          </span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="gx-glass z-50 w-64 rounded-2xl border p-1.5 shadow-[0_20px_50px_-12px_hsl(var(--shadow-color)/0.45)]"
        >
          <div className="flex items-center gap-3 rounded-xl px-3 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-strong text-xs font-semibold text-white dark:bg-teal dark:text-[#04201c]">
              {getInitials(fullName, email)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{fullName || "GuardianX user"}</p>
              <p className="truncate text-xs text-foreground-subtle">{email}</p>
            </div>
          </div>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-foreground-muted outline-none transition-colors data-[highlighted]:bg-background-alt data-[highlighted]:text-foreground"
            disabled
          >
            <UserIcon size={15} />
            Profile settings
            <span className="ml-auto text-[10px] text-foreground-subtle">Soon</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={(e) => {
              e.preventDefault();
              handleSignOut();
            }}
            disabled={signingOut}
            className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-critical outline-none transition-colors data-[highlighted]:bg-critical/10"
          >
            {signingOut ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
            {signingOut ? "Signing out…" : "Sign out"}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
