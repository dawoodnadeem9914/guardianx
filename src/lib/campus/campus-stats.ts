import { getFirstAidProtocol, type EmergencyType } from "@/lib/ai/first-aid-protocols";
import type { EmergencyDetection, SosRequest, Severity } from "@/types/supabase";

/**
 * Pure aggregation functions for the Campus Dashboard. Given already-
 * fetched detection/SOS rows, these compute the statistics the page
 * displays — no Supabase calls here, matching the pattern of every
 * other `src/lib/` service in this project.
 *
 * Per the Milestone 5 plan: there's no multi-tenant campus/admin role
 * in this project yet, so these stats are computed from the signed-in
 * user's own real incident history — an honest "campus of one" rather
 * than fabricated numbers, until real multi-user aggregation exists.
 */

export interface SeverityDistribution {
  severity: Severity;
  count: number;
}

export interface CategoryDistribution {
  emergencyType: string;
  label: string;
  count: number;
}

export interface MonthlyCount {
  monthKey: string;
  monthLabel: string;
  count: number;
}

export interface CampusStats {
  totalIncidents: number;
  activeEmergencies: number;
  completedEmergencies: number;
  severityDistribution: SeverityDistribution[];
  categoryDistribution: CategoryDistribution[];
  monthlyReports: MonthlyCount[];
}

const SEVERITY_ORDER: Severity[] = ["low", "medium", "high", "critical"];

export function computeSeverityDistribution(
  detections: EmergencyDetection[]
): SeverityDistribution[] {
  const counts = new Map<Severity, number>(SEVERITY_ORDER.map((s) => [s, 0]));
  detections.forEach((d) => counts.set(d.severity, (counts.get(d.severity) ?? 0) + 1));
  return SEVERITY_ORDER.map((severity) => ({ severity, count: counts.get(severity) ?? 0 }));
}

export function computeCategoryDistribution(
  detections: EmergencyDetection[]
): CategoryDistribution[] {
  const counts = new Map<string, number>();
  detections.forEach((d) => counts.set(d.emergency_type, (counts.get(d.emergency_type) ?? 0) + 1));

  return Array.from(counts.entries())
    .map(([emergencyType, count]) => ({
      emergencyType,
      label: getFirstAidProtocol(emergencyType as EmergencyType).label,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/** Builds the trailing N months (default 6), oldest first, filling zero counts for empty months. */
export function computeMonthlyReports(
  detections: EmergencyDetection[],
  monthsBack = 6
): MonthlyCount[] {
  const now = new Date();
  const months: MonthlyCount[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      monthLabel: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      count: 0,
    });
  }

  const indexByKey = new Map(months.map((m, i) => [m.monthKey, i]));

  detections.forEach((d) => {
    const date = new Date(d.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const idx = indexByKey.get(key);
    if (idx != null) months[idx].count += 1;
  });

  return months;
}

/** "Active" means the SOS pipeline has started but hasn't reached completed or cancelled. */
function isActiveSosStatus(status: SosRequest["status"]): boolean {
  return status !== "completed" && status !== "cancelled";
}

export function computeCampusStats(
  detections: EmergencyDetection[],
  sosRequests: SosRequest[]
): CampusStats {
  return {
    totalIncidents: detections.length,
    activeEmergencies: sosRequests.filter((s) => isActiveSosStatus(s.status)).length,
    completedEmergencies: sosRequests.filter((s) => s.status === "completed").length,
    severityDistribution: computeSeverityDistribution(detections),
    categoryDistribution: computeCategoryDistribution(detections),
    monthlyReports: computeMonthlyReports(detections),
  };
}