"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/logging/activity-log";
import { ALL_ROLES, ROLE_LABELS, type Role } from "@/lib/auth/roles";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface AdminUserRow {
  userId: string;
  fullName: string | null;
  role: Role;
  createdAt: string;
}

interface RoleManagerClientProps {
  /** The signed-in admin performing changes — used for the role_changed activity log, and to disable self-demotion. */
  adminUserId: string;
  initialUsers: AdminUserRow[];
}

const selectClass =
  "flex h-9 rounded-lg border border-border-strong bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/25 disabled:cursor-not-allowed disabled:opacity-50";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function RoleManagerClient({ adminUserId, initialUsers }: RoleManagerClientProps) {
  const [users, setUsers] = React.useState(initialUsers);
  const [pendingRoles, setPendingRoles] = React.useState<Record<string, Role>>({});
  const [savingId, setSavingId] = React.useState<string | null>(null);

  function selectedRole(user: AdminUserRow): Role {
    return pendingRoles[user.userId] ?? user.role;
  }

  function handleSelectChange(userId: string, role: Role) {
    setPendingRoles((prev) => ({ ...prev, [userId]: role }));
  }

  async function handleSave(user: AdminUserRow) {
    const newRole = pendingRoles[user.userId];
    if (!newRole || newRole === user.role) return;

    setSavingId(user.userId);
    const supabase = createClient();
    const { error } = await supabase
      .from("roles")
      .update({ role: newRole })
      .eq("user_id", user.userId);
    setSavingId(null);

    if (error) {
      toast.error(error.message || "Couldn't update this role.");
      return;
    }

    await logActivity(supabase, adminUserId, "role_changed", {
      target_user_id: user.userId,
      old_role: user.role,
      new_role: newRole,
    });

    setUsers((prev) => prev.map((u) => (u.userId === user.userId ? { ...u, role: newRole } : u)));
    setPendingRoles((prev) => {
      const next = { ...prev };
      delete next[user.userId];
      return next;
    });
    toast.success("Role updated.");
  }

  return (
    <div className="flex flex-col gap-3">
      {users.map((user) => {
        const isSelf = user.userId === adminUserId;
        const current = selectedRole(user);
        const isDirty = current !== user.role;

        return (
          <Card
            key={user.userId}
            className="flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {user.fullName || "Unnamed user"}
                {isSelf && <span className="ml-1.5 text-xs text-foreground-subtle">(you)</span>}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground-subtle">
                Joined {formatDate(user.createdAt)} · Current:
                <Badge variant="neutral">{ROLE_LABELS[user.role]}</Badge>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={current}
                onChange={(e) => handleSelectChange(user.userId, e.target.value as Role)}
                disabled={isSelf || savingId === user.userId}
                className={selectClass}
                aria-label={`Role for ${user.fullName || "user"}`}
              >
                {ALL_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleSave(user)}
                disabled={isSelf || !isDirty || savingId === user.userId}
              >
                {savingId === user.userId ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Save size={13} />
                )}
                Save
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}