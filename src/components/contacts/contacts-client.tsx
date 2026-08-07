"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Phone, Mail, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { EmergencyContact } from "@/types/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface ContactsClientProps {
  userId: string;
  initialContacts: EmergencyContact[];
}

interface FormState {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  priority: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-() ]{6,20}$/;

function emptyForm(nextPriority: number): FormState {
  return { name: "", relationship: "", phone: "", email: "", priority: String(nextPriority) };
}

function contactToForm(contact: EmergencyContact): FormState {
  return {
    name: contact.name,
    relationship: contact.relationship ?? "",
    phone: contact.phone,
    email: contact.email ?? "",
    priority: String(contact.priority),
  };
}

export function ContactsClient({ userId, initialContacts }: ContactsClientProps) {
  const router = useRouter();
  const [contacts, setContacts] = React.useState(
    [...initialContacts].sort((a, b) => a.priority - b.priority)
  );
  const [addingNew, setAddingNew] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  function startAdd() {
    setEditingId(null);
    setAddingNew(true);
  }

  function startEdit(id: string) {
    setAddingNew(false);
    setEditingId(id);
  }

  function cancelForm() {
    setAddingNew(false);
    setEditingId(null);
  }

  async function handleSave(form: FormState, existing: EmergencyContact | null) {
    const errors: string[] = [];
    if (form.name.trim().length < 2) errors.push("Name must be at least 2 characters.");
    if (!PHONE_RE.test(form.phone.trim())) errors.push("Enter a valid phone number.");
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) {
      errors.push("Enter a valid email address, or leave it blank.");
    }
    const priorityNum = Number(form.priority);
    if (!Number.isInteger(priorityNum) || priorityNum < 1) {
      errors.push("Priority must be a number of 1 or higher.");
    }

    if (errors.length > 0) {
      errors.forEach((msg) => toast.error(msg));
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const payload = {
      user_id: userId,
      name: form.name.trim(),
      relationship: form.relationship.trim() || null,
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      priority: priorityNum,
    };

    const { data, error } = existing
      ? await supabase
          .from("emergency_contacts")
          .update(payload)
          .eq("id", existing.id)
          .select()
          .single()
      : await supabase.from("emergency_contacts").insert(payload).select().single();

    setSaving(false);

    if (error) {
      toast.error(error.message || "Couldn't save this contact. Please try again.");
      return;
    }

    setContacts((prev) => {
      const next = existing ? prev.map((c) => (c.id === data.id ? data : c)) : [...prev, data];
      return next.sort((a, b) => a.priority - b.priority);
    });
    toast.success(existing ? "Contact updated." : "Contact added.");
    cancelForm();
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
    setDeletingId(null);
    setConfirmDeleteId(null);

    if (error) {
      toast.error(error.message || "Couldn't delete this contact. Please try again.");
      return;
    }

    setContacts((prev) => prev.filter((c) => c.id !== id));
    toast.success("Contact removed.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-foreground-muted">
          {contacts.length === 0
            ? "No emergency contacts yet."
            : `${contacts.length} contact${contacts.length === 1 ? "" : "s"} saved.`}
        </p>
        {!addingNew && !editingId && (
          <Button size="sm" onClick={startAdd}>
            <Plus size={15} />
            Add contact
          </Button>
        )}
      </div>

      {addingNew && (
        <ContactForm
          initial={emptyForm(contacts.length > 0 ? Math.max(...contacts.map((c) => c.priority)) + 1 : 1)}
          saving={saving}
          onCancel={cancelForm}
          onSave={(form) => handleSave(form, null)}
          title="Add emergency contact"
        />
      )}

      {contacts.length === 0 && !addingNew && (
        <Card className="flex flex-col items-center gap-3 border-dashed p-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal/10 text-teal-strong dark:text-teal">
            <Users size={20} />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">No contacts saved yet</p>
            <p className="mt-1 text-sm text-foreground-muted">
              Add the people GuardianX should notify during an SOS.
            </p>
          </div>
          <Button size="sm" onClick={startAdd} className="mt-1">
            <Plus size={15} />
            Add your first contact
          </Button>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {contacts.map((contact) =>
          editingId === contact.id ? (
            <ContactForm
              key={contact.id}
              initial={contactToForm(contact)}
              saving={saving}
              onCancel={cancelForm}
              onSave={(form) => handleSave(form, contact)}
              title="Edit contact"
            />
          ) : (
            <Card key={contact.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal/10 text-sm font-semibold text-teal-strong dark:text-teal">
                    {contact.name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{contact.name}</p>
                      {contact.relationship && (
                        <Badge variant="neutral">{contact.relationship}</Badge>
                      )}
                      <Badge variant="teal">Priority {contact.priority}</Badge>
                    </div>
                    <div className="mt-1.5 flex flex-col gap-1 text-sm text-foreground-muted sm:flex-row sm:gap-4">
                      <span className="flex items-center gap-1.5">
                        <Phone size={13} />
                        {contact.phone}
                      </span>
                      {contact.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail size={13} />
                          {contact.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {confirmDeleteId === contact.id ? (
                    <>
                      <span className="text-xs text-foreground-muted">Delete this contact?</span>
                      <Button
                        size="sm"
                        variant="emergency"
                        onClick={() => handleDelete(contact.id)}
                        disabled={deletingId === contact.id}
                      >
                        {deletingId === contact.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          "Confirm"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={deletingId === contact.id}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(contact.id)}
                        aria-label={`Edit ${contact.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground-muted transition-colors hover:border-teal hover:text-teal-strong dark:hover:text-teal"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(contact.id)}
                        aria-label={`Delete ${contact.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground-muted transition-colors hover:border-critical hover:text-critical"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          )
        )}
      </div>
    </div>
  );
}

function ContactForm({
  initial,
  saving,
  onCancel,
  onSave,
  title,
}: {
  initial: FormState;
  saving: boolean;
  onCancel: () => void;
  onSave: (form: FormState) => void;
  title: string;
}) {
  const [form, setForm] = React.useState<FormState>(initial);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <Card className="border-teal/25 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close form"
          className="flex h-7 w-7 items-center justify-center rounded-full text-foreground-subtle transition-colors hover:bg-background-alt hover:text-foreground"
        >
          <X size={14} />
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
        className="mt-4 flex flex-col gap-4"
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="contact_name">Name</Label>
            <Input
              id="contact_name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Nadia Rahman"
              required
            />
          </div>
          <div>
            <Label htmlFor="contact_relationship">Relationship</Label>
            <Input
              id="contact_relationship"
              value={form.relationship}
              onChange={(e) => update("relationship", e.target.value)}
              placeholder="Mother, spouse, friend…"
            />
          </div>
          <div>
            <Label htmlFor="contact_phone">Phone number</Label>
            <Input
              id="contact_phone"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+60 12-345 6789"
              required
            />
          </div>
          <div>
            <Label htmlFor="contact_email">Email (optional)</Label>
            <Input
              id="contact_email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="nadia@example.com"
            />
          </div>
          <div>
            <Label htmlFor="contact_priority">Priority</Label>
            <Input
              id="contact_priority"
              type="number"
              min="1"
              step="1"
              value={form.priority}
              onChange={(e) => update("priority", e.target.value)}
            />
            <p className="mt-1.5 text-xs text-foreground-subtle">
              1 is notified first during an SOS.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" size="sm" disabled={saving}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Saving…" : "Save contact"}
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}