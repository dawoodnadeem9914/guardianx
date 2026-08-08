"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Copy, X, Users, Eye, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/logging/activity-log";
import {
  generateInvitationToken,
  computeInvitationExpiry,
  defaultFamilyPermissions,
  buildInvitationUrl,
} from "@/lib/family/family-service";
import type { FamilyInvitation, FamilyPermissions } from "@/types/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export interface EnrichedRelationship {
  id: string;
  otherPartyUserId: string;
  otherPartyName: string;
  relationship: string;
  permissions: FamilyPermissions;
  createdAt: string;
}

interface FamilyClientProps {
  userId: string;
  initialSentInvitations: FamilyInvitation[];
  /** People who can see MY data (I am primary_user_id on the relationship). */
  initialMonitoringMe: EnrichedRelationship[];
  /** People whose data I can see (I am family_user_id on the relationship). Read-only in this component — never mutated here. */
  monitoredByMe: EnrichedRelationship[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard.");
  } catch {
    toast.error("Couldn't copy. Please copy it manually.");
  }
}

export function FamilyClient({
  userId,
  initialSentInvitations,
  initialMonitoringMe,
  monitoredByMe,
}: FamilyClientProps) {
  const router = useRouter();

  const [sentInvitations, setSentInvitations] = React.useState(initialSentInvitations);
  const [monitoringMe, setMonitoringMe] = React.useState(initialMonitoringMe);

  const [showInviteForm, setShowInviteForm] = React.useState(false);
  const [inviteRelationship, setInviteRelationship] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [invitePermissions, setInvitePermissions] = React.useState<FamilyPermissions>(
    defaultFamilyPermissions()
  );
  const [inviting, setInviting] = React.useState(false);
  const [newInviteLink, setNewInviteLink] = React.useState<string | null>(null);

  const [revokingId, setRevokingId] = React.useState<string | null>(null);
  const [editingRelationshipId, setEditingRelationshipId] = React.useState<string | null>(null);
  const [editPermissions, setEditPermissions] = React.useState<FamilyPermissions | null>(null);
  const [savingPermissions, setSavingPermissions] = React.useState(false);

  function updateInvitePermission(key: keyof FamilyPermissions, value: boolean) {
    setInvitePermissions((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreateInvitation(e: React.FormEvent) {
    e.preventDefault();
    if (inviteRelationship.trim().length < 2) {
      toast.error('Enter a relationship, like "Spouse" or "Parent".');
      return;
    }

    setInviting(true);
    const supabase = createClient();
    const token = generateInvitationToken();

    const { data, error } = await supabase
      .from("family_invitations")
      .insert({
        inviter_user_id: userId,
        invitee_email: inviteEmail.trim() || null,
        relationship: inviteRelationship.trim(),
        token,
        permissions: invitePermissions,
        expires_at: computeInvitationExpiry(),
      })
      .select()
      .single();

    setInviting(false);

    if (error || !data) {
      toast.error(error?.message || "Couldn't create the invitation. Please try again.");
      return;
    }

    await logActivity(supabase, userId, "invitation_sent", {
      invitation_id: data.id,
      relationship: data.relationship,
    });

    setSentInvitations((prev) => [data, ...prev]);
    setNewInviteLink(buildInvitationUrl(token, siteOrigin()));
    setInviteRelationship("");
    setInviteEmail("");
    setInvitePermissions(defaultFamilyPermissions());
    toast.success("Invitation created.");
    router.refresh();
  }

  function handleCopyInvitationLink(token: string) {
    void copyText(buildInvitationUrl(token, siteOrigin()));
  }

  async function handleRevokeInvitation(id: string) {
    setRevokingId(id);
    const supabase = createClient();
    const { error } = await supabase
      .from("family_invitations")
      .update({ status: "revoked" })
      .eq("id", id);
    setRevokingId(null);

    if (error) {
      toast.error(error.message || "Couldn't revoke this invitation.");
      return;
    }
    setSentInvitations((prev) => prev.filter((inv) => inv.id !== id));
    toast.success("Invitation revoked.");
    router.refresh();
  }

  async function handleRevokeRelationship(id: string) {
    setRevokingId(id);
    const supabase = createClient();
    const { error } = await supabase
      .from("family_relationships")
      .update({ status: "revoked" })
      .eq("id", id);
    setRevokingId(null);

    if (error) {
      toast.error(error.message || "Couldn't revoke access.");
      return;
    }
    setMonitoringMe((prev) => prev.filter((r) => r.id !== id));
    toast.success("Access revoked.");
    router.refresh();
  }

  function startEditPermissions(rel: EnrichedRelationship) {
    setEditingRelationshipId(rel.id);
    setEditPermissions(rel.permissions);
  }

  async function handleSavePermissions(id: string) {
    if (!editPermissions) return;
    setSavingPermissions(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("family_relationships")
      .update({ permissions: editPermissions })
      .eq("id", id);
    setSavingPermissions(false);

    if (error) {
      toast.error(error.message || "Couldn't save permissions.");
      return;
    }
    setMonitoringMe((prev) =>
      prev.map((r) => (r.id === id ? { ...r, permissions: editPermissions } : r))
    );
    setEditingRelationshipId(null);
    setEditPermissions(null);
    toast.success("Permissions updated.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Invite a family member */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
            Invite a family member
          </h2>
          {!showInviteForm && (
            <Button size="sm" onClick={() => setShowInviteForm(true)}>
              <Plus size={15} />
              Invite
            </Button>
          )}
        </div>

        {showInviteForm && (
          <Card className="mt-3 border-teal/25 p-5 sm:p-6">
            <form onSubmit={handleCreateInvitation} className="flex flex-col gap-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="invite-relationship">Relationship</Label>
                  <Input
                    id="invite-relationship"
                    value={inviteRelationship}
                    onChange={(e) => setInviteRelationship(e.target.value)}
                    placeholder="Spouse, parent, sibling…"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="invite-email">Email (optional, for your reference)</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="jane@example.com"
                  />
                </div>
              </div>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-foreground">What they can see</legend>
                <div className="flex flex-col gap-2">
                  <PermissionCheckbox
                    label="Emergency status"
                    checked={invitePermissions.view_emergency_status}
                    onChange={(v) => updateInvitePermission("view_emergency_status", v)}
                  />
                  <PermissionCheckbox
                    label="Guardian Card"
                    checked={invitePermissions.view_guardian_card}
                    onChange={(v) => updateInvitePermission("view_guardian_card", v)}
                  />
                  <PermissionCheckbox
                    label="Medical profile"
                    checked={invitePermissions.view_medical_profile}
                    onChange={(v) => updateInvitePermission("view_medical_profile", v)}
                  />
                </div>
              </fieldset>

              <div className="flex gap-3">
                <Button type="submit" size="sm" disabled={inviting}>
                  {inviting && <Loader2 size={14} className="animate-spin" />}
                  {inviting ? "Creating…" : "Create invitation"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setShowInviteForm(false);
                    setNewInviteLink(null);
                  }}
                  disabled={inviting}
                >
                  Cancel
                </Button>
              </div>
            </form>

            {newInviteLink && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-teal/25 bg-teal/[0.05] px-3.5 py-3">
                <p className="flex-1 truncate text-xs text-foreground-muted">{newInviteLink}</p>
                <Button size="sm" variant="secondary" onClick={() => copyText(newInviteLink)}>
                  <Copy size={13} />
                  Copy
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Pending invitations sent */}
      {sentInvitations.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
            Pending invitations
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {sentInvitations.map((inv) => (
              <Card key={inv.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {inv.relationship}
                    {inv.invitee_email && (
                      <span className="ml-1.5 font-normal text-foreground-muted">
                        · {inv.invitee_email}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-foreground-subtle">Expires {formatDate(inv.expires_at)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleCopyInvitationLink(inv.token)}>
                    <Copy size={13} />
                    Copy link
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRevokeInvitation(inv.id)}
                    disabled={revokingId === inv.id}
                    aria-label="Revoke invitation"
                  >
                    {revokingId === inv.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <X size={13} />
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* People monitoring me */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          People monitoring me
        </h2>
        {monitoringMe.length === 0 ? (
          <Card className="mt-3 flex flex-col items-center gap-2 border-dashed p-8 text-center">
            <Users size={20} className="text-foreground-subtle" />
            <p className="text-sm text-foreground-muted">
              No one is monitoring your emergency status yet.
            </p>
          </Card>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {monitoringMe.map((rel) => (
              <Card key={rel.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {rel.otherPartyName}{" "}
                      <span className="font-normal text-foreground-muted">({rel.relationship})</span>
                    </p>
                    <p className="text-xs text-foreground-subtle">Linked {formatDate(rel.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => startEditPermissions(rel)}>
                      Edit access
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevokeRelationship(rel.id)}
                      disabled={revokingId === rel.id}
                    >
                      {revokingId === rel.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        "Revoke"
                      )}
                    </Button>
                  </div>
                </div>

                {editingRelationshipId === rel.id && editPermissions && (
                  <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
                    <PermissionCheckbox
                      label="Emergency status"
                      checked={editPermissions.view_emergency_status}
                      onChange={(v) =>
                        setEditPermissions((p) => (p ? { ...p, view_emergency_status: v } : p))
                      }
                    />
                    <PermissionCheckbox
                      label="Guardian Card"
                      checked={editPermissions.view_guardian_card}
                      onChange={(v) =>
                        setEditPermissions((p) => (p ? { ...p, view_guardian_card: v } : p))
                      }
                    />
                    <PermissionCheckbox
                      label="Medical profile"
                      checked={editPermissions.view_medical_profile}
                      onChange={(v) =>
                        setEditPermissions((p) => (p ? { ...p, view_medical_profile: v } : p))
                      }
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSavePermissions(rel.id)}
                        disabled={savingPermissions}
                      >
                        {savingPermissions && <Loader2 size={13} className="animate-spin" />}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingRelationshipId(null);
                          setEditPermissions(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* People I monitor */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          People I monitor
        </h2>
        {monitoredByMe.length === 0 ? (
          <Card className="mt-3 flex flex-col items-center gap-2 border-dashed p-8 text-center">
            <Eye size={20} className="text-foreground-subtle" />
            <p className="text-sm text-foreground-muted">
              You&apos;re not monitoring anyone yet. Accept an invitation to get started.
            </p>
          </Card>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {monitoredByMe.map((rel) => (
              <Link key={rel.id} href={`/dashboard/family-updates/${rel.id}`}>
                <Card className="gx-hover-lift flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {rel.otherPartyName}{" "}
                      <span className="font-normal text-foreground-muted">({rel.relationship})</span>
                    </p>
                    <div className="mt-1 flex gap-1.5">
                      {rel.permissions.view_emergency_status && <Badge variant="teal">Status</Badge>}
                      {rel.permissions.view_guardian_card && <Badge variant="teal">Card</Badge>}
                      {rel.permissions.view_medical_profile && <Badge variant="teal">Medical</Badge>}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PermissionCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3.5 py-2.5 transition-colors hover:border-teal">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border-strong accent-teal-strong dark:accent-teal"
      />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}