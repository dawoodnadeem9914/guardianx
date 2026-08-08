import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Siren,
  Radio,
  IdCard,
  FileText,
  History,
  Users,
  ShieldPlus,
  GraduationCap,
  Settings,
  HeartHandshake,
  Stethoscope,
  Building2,
  Mic,
  UserCog,
} from "lucide-react";
import type { Role } from "@/lib/auth/roles";

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Milestones not yet built are shown but disabled, never a dead fake link. */
  enabled: boolean;
  /**
   * Roles allowed to see this item. `undefined` means visible to every
   * role — the default, and the behavior every item had before this
   * milestone. Admins can always see everything regardless of this
   * list (see `hasRole()` in `lib/auth/roles.ts`), so `"admin"` never
   * needs to be listed explicitly here — except on the Admin item
   * itself below, where it's the actual, only intended audience.
   */
  requiredRole?: Role[];
}

export const dashboardNav: DashboardNavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, enabled: true },
  { label: "Report Emergency", href: "/dashboard/emergency", icon: Siren, enabled: true },
  { label: "SOS", href: "/dashboard/sos", icon: Radio, enabled: true },
  { label: "Guardian Card", href: "/dashboard/guardian-card", icon: IdCard, enabled: true },
  { label: "Guardian Report", href: "/dashboard/guardian-report", icon: FileText, enabled: true },
  { label: "Incident History", href: "/dashboard/history", icon: History, enabled: true },
  { label: "Family Updates", href: "/dashboard/family-updates", icon: HeartHandshake, enabled: true },
  {
    label: "Hospital View",
    href: "/dashboard/hospital-view",
    icon: Stethoscope,
    enabled: true,
    requiredRole: ["hospital"],
  },
  {
    label: "Campus Dashboard",
    href: "/dashboard/campus-dashboard",
    icon: Building2,
    enabled: true,
    requiredRole: ["campus_admin"],
  },
  {
    label: "Admin",
    href: "/dashboard/admin",
    icon: UserCog,
    enabled: true,
    requiredRole: ["admin"],
  },
  { label: "Voice Assistant", href: "/dashboard/voice-assistant", icon: Mic, enabled: true },
  { label: "Emergency Contacts", href: "/dashboard/contacts", icon: Users, enabled: true },
  { label: "Medical Profile", href: "/dashboard/medical-profile", icon: ShieldPlus, enabled: true },
  { label: "Simulation Mode", href: "/dashboard/simulation", icon: GraduationCap, enabled: true },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, enabled: false },
];