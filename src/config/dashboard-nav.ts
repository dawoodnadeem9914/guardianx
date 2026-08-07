import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Siren,
  History,
  Users,
  ShieldPlus,
  GraduationCap,
  Settings,
} from "lucide-react";

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Milestones not yet built are shown but disabled, never a dead fake link. */
  enabled: boolean;
}

export const dashboardNav: DashboardNavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, enabled: true },
  { label: "Report Emergency", href: "/dashboard/emergency", icon: Siren, enabled: false },
  { label: "Incident History", href: "/dashboard/history", icon: History, enabled: false },
  { label: "Emergency Contacts", href: "/dashboard/contacts", icon: Users, enabled: true },
  { label: "Medical Profile", href: "/dashboard/medical-profile", icon: ShieldPlus, enabled: true },
  { label: "Simulation Mode", href: "/dashboard/simulation", icon: GraduationCap, enabled: false },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, enabled: false },
];