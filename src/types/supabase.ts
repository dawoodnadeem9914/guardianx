/**
 * Minimal, hand-authored Supabase Database type.
 *
 * Once the Supabase CLI is linked to a real project, this file can be
 * regenerated with:
 *   npx supabase gen types typescript --project-id <ref> > src/types/supabase.ts
 *
 * Additional tables from the GuardianX V3.0 spec are added in later
 * milestones as their features are built, not before — this keeps the
 * type file honest about what actually exists in the database right now.
 */
import type { SosStatus } from "@/lib/sos/send-sos";
import type { GuardianReportData } from "@/lib/report/guardian-report";
import type { Role } from "@/lib/auth/roles";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Gender = "male" | "female" | "other" | "prefer_not_to_say";
export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "unknown";
export type InputType = "image" | "text";
export type Severity = "low" | "medium" | "high" | "critical";

/** A Guardian Report's status is a superset of SosStatus — a report can
 *  exist before any SOS was ever sent ("not_applicable") or reflect a
 *  cancelled attempt, neither of which the live SOS simulation itself
 *  produces (see lib/sos/send-sos.ts). */
export type EmergencyReportStatus = SosStatus | "not_applicable" | "cancelled";

export interface SosContactSnapshot {
  name: string;
  relationship: string | null;
  phone: string;
}

/** What a linked family member is permitted to view, per relationship. */
export interface FamilyPermissions {
  view_emergency_status: boolean;
  view_guardian_card: boolean;
  view_medical_profile: boolean;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      medical_profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          date_of_birth: string | null;
          gender: Gender | null;
          blood_type: BloodType | null;
          height_cm: number | null;
          weight_kg: number | null;
          allergies: string | null;
          medications: string | null;
          conditions: string | null;
          notes: string | null;
          organ_donor: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          date_of_birth?: string | null;
          gender?: Gender | null;
          blood_type?: BloodType | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          allergies?: string | null;
          medications?: string | null;
          conditions?: string | null;
          notes?: string | null;
          organ_donor?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          date_of_birth?: string | null;
          gender?: Gender | null;
          blood_type?: BloodType | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          allergies?: string | null;
          medications?: string | null;
          conditions?: string | null;
          notes?: string | null;
          organ_donor?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      emergency_contacts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          relationship: string | null;
          phone: string;
          email: string | null;
          priority: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          relationship?: string | null;
          phone: string;
          email?: string | null;
          priority?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          relationship?: string | null;
          phone?: string;
          email?: string | null;
          priority?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      emergency_detections: {
        Row: {
          id: string;
          user_id: string;
          input_type: InputType;
          input_summary: string;
          emergency_type: string;
          severity: Severity;
          confidence: number;
          evidence: string[];
          reason: string | null;
          verification_responses: Record<string, boolean> | null;
          verified_confidence: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          input_type: InputType;
          input_summary: string;
          emergency_type: string;
          severity: Severity;
          confidence: number;
          evidence?: string[];
          reason?: string | null;
          verification_responses?: Record<string, boolean> | null;
          verified_confidence?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          input_type?: InputType;
          input_summary?: string;
          emergency_type?: string;
          severity?: Severity;
          confidence?: number;
          evidence?: string[];
          reason?: string | null;
          verification_responses?: Record<string, boolean> | null;
          verified_confidence?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      sos_requests: {
        Row: {
          id: string;
          user_id: string;
          detection_id: string | null;
          contact_id: string | null;
          emergency_type: string;
          severity: Severity;
          confidence: number;
          status: SosStatus | "cancelled";
          guardian_contact_snapshot: SosContactSnapshot | null;
          eta_minutes: number | null;
          assigned_hospital: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          detection_id?: string | null;
          contact_id?: string | null;
          emergency_type: string;
          severity: Severity;
          confidence: number;
          status?: SosStatus | "cancelled";
          guardian_contact_snapshot?: SosContactSnapshot | null;
          eta_minutes?: number | null;
          assigned_hospital?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          detection_id?: string | null;
          contact_id?: string | null;
          emergency_type?: string;
          severity?: Severity;
          confidence?: number;
          status?: SosStatus | "cancelled";
          guardian_contact_snapshot?: SosContactSnapshot | null;
          eta_minutes?: number | null;
          assigned_hospital?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      emergency_reports: {
        Row: {
          id: string;
          user_id: string;
          detection_id: string | null;
          sos_request_id: string | null;
          status: EmergencyReportStatus;
          report_data: GuardianReportData;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          detection_id?: string | null;
          sos_request_id?: string | null;
          status: EmergencyReportStatus;
          report_data: GuardianReportData;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          detection_id?: string | null;
          sos_request_id?: string | null;
          status?: EmergencyReportStatus;
          report_data?: GuardianReportData;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_feedback: {
        Row: {
          id: string;
          user_id: string;
          detection_id: string | null;
          report_id: string | null;
          is_helpful: boolean;
          feedback_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          detection_id?: string | null;
          report_id?: string | null;
          is_helpful: boolean;
          feedback_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          detection_id?: string | null;
          report_id?: string | null;
          is_helpful?: boolean;
          feedback_text?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      roles: {
        Row: {
          user_id: string;
          role: Role;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          role?: Role;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          role?: Role;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      family_invitations: {
        Row: {
          id: string;
          inviter_user_id: string;
          invitee_email: string | null;
          relationship: string;
          token: string;
          status: "pending" | "accepted" | "expired" | "revoked";
          permissions: FamilyPermissions;
          expires_at: string;
          created_at: string;
          accepted_at: string | null;
          accepted_by_user_id: string | null;
        };
        Insert: {
          id?: string;
          inviter_user_id: string;
          invitee_email?: string | null;
          relationship: string;
          token: string;
          status?: "pending" | "accepted" | "expired" | "revoked";
          permissions?: FamilyPermissions;
          expires_at: string;
          created_at?: string;
          accepted_at?: string | null;
          accepted_by_user_id?: string | null;
        };
        Update: {
          id?: string;
          inviter_user_id?: string;
          invitee_email?: string | null;
          relationship?: string;
          token?: string;
          status?: "pending" | "accepted" | "expired" | "revoked";
          permissions?: FamilyPermissions;
          expires_at?: string;
          created_at?: string;
          accepted_at?: string | null;
          accepted_by_user_id?: string | null;
        };
        Relationships: [];
      };
      family_relationships: {
        Row: {
          id: string;
          primary_user_id: string;
          family_user_id: string;
          relationship: string;
          permissions: FamilyPermissions;
          status: "active" | "revoked";
          invitation_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          primary_user_id: string;
          family_user_id: string;
          relationship: string;
          permissions?: FamilyPermissions;
          status?: "active" | "revoked";
          invitation_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          primary_user_id?: string;
          family_user_id?: string;
          relationship?: string;
          permissions?: FamilyPermissions;
          status?: "active" | "revoked";
          invitation_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          metadata: Record<string, Json> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          metadata?: Record<string, Json> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          metadata?: Record<string, Json> | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      accept_family_invitation: {
        Args: { p_token: string };
        Returns: Database["public"]["Tables"]["family_relationships"]["Row"];
      };
      get_invitation_preview: {
        Args: { p_token: string };
        Returns: {
          relationship: string;
          status: string;
          expires_at: string;
          inviter_full_name: string | null;
        }[];
      };
      current_user_role: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type MedicalProfile = Database["public"]["Tables"]["medical_profiles"]["Row"];
export type MedicalProfileInsert = Database["public"]["Tables"]["medical_profiles"]["Insert"];
export type EmergencyContact = Database["public"]["Tables"]["emergency_contacts"]["Row"];
export type EmergencyContactInsert = Database["public"]["Tables"]["emergency_contacts"]["Insert"];
export type EmergencyDetection = Database["public"]["Tables"]["emergency_detections"]["Row"];
export type EmergencyDetectionInsert = Database["public"]["Tables"]["emergency_detections"]["Insert"];
export type SosRequest = Database["public"]["Tables"]["sos_requests"]["Row"];
export type SosRequestInsert = Database["public"]["Tables"]["sos_requests"]["Insert"];
export type EmergencyReport = Database["public"]["Tables"]["emergency_reports"]["Row"];
export type EmergencyReportInsert = Database["public"]["Tables"]["emergency_reports"]["Insert"];
export type AiFeedback = Database["public"]["Tables"]["ai_feedback"]["Row"];
export type AiFeedbackInsert = Database["public"]["Tables"]["ai_feedback"]["Insert"];
export type UserRoleRow = Database["public"]["Tables"]["roles"]["Row"];
export type FamilyInvitation = Database["public"]["Tables"]["family_invitations"]["Row"];
export type FamilyInvitationInsert = Database["public"]["Tables"]["family_invitations"]["Insert"];
export type FamilyRelationship = Database["public"]["Tables"]["family_relationships"]["Row"];
export type FamilyRelationshipInsert =
  Database["public"]["Tables"]["family_relationships"]["Insert"];
export type ActivityLog = Database["public"]["Tables"]["activity_logs"]["Row"];
export type ActivityLogInsert = Database["public"]["Tables"]["activity_logs"]["Insert"];