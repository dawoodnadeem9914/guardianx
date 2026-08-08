import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, hasRole } from "@/lib/auth/roles";
import { RoleManagerClient, type AdminUserRow } from "@/components/admin/role-manager-client";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/admin");

  // Belt-and-suspenders with middleware.ts, matching every other
  // role-sensitive page in this milestone.
  const role = await getUserRole(supabase, user.id);
  if (!hasRole(role, ["admin"])) redirect("/dashboard");

  const [{ data: profiles }, { data: roleRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("roles").select("user_id, role"),
  ]);

  const roleByUserId = new Map((roleRows ?? []).map((r) => [r.user_id, r.role]));

  const users: AdminUserRow[] = (profiles ?? []).map((p) => ({
    userId: p.id,
    fullName: p.full_name,
    role: roleByUserId.get(p.id) ?? "user",
    createdAt: p.created_at,
  }));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Admin
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          Manage roles for every account on GuardianX — {users.length} user
          {users.length === 1 ? "" : "s"} total.
        </p>
      </div>

      {users.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 border-dashed p-10 text-center">
          <Users size={20} className="text-foreground-subtle" />
          <p className="text-sm text-foreground-muted">No users found.</p>
        </Card>
      ) : (
        <RoleManagerClient adminUserId={user.id} initialUsers={users} />
      )}
    </div>
  );
}