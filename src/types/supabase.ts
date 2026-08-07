/**
 * Minimal, hand-authored Supabase Database type for Milestone 1.
 *
 * Once the Supabase CLI is linked to a real project, this file can be
 * regenerated with:
 *   npx supabase gen types typescript --project-id <ref> > src/types/supabase.ts
 *
 * Additional tables from the GuardianX V3.0 spec (Section 25.1 —
 * emergency_incidents, ai_analysis_results, sos_requests, etc.) are added
 * in later milestones as their features are built, not before — this
 * keeps the type file honest about what actually exists in the database
 * right now.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
