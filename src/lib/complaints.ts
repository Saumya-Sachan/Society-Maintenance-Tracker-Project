import type { LucideIcon } from "lucide-react";
import {
  Wrench, Zap, Sparkles, ShieldCheck, Car, ArrowUpDown,
  Droplets, Trees, Building2, HelpCircle,
} from "lucide-react";

export type ComplaintCategory =
  | "plumbing" | "electrical" | "cleaning" | "security" | "parking"
  | "lift" | "water_supply" | "gardening" | "common_area" | "other";

export type ComplaintStatus = "open" | "in_progress" | "resolved";
export type ComplaintPriority = "low" | "medium" | "high";

export const CATEGORY_META: Record<ComplaintCategory, { label: string; icon: LucideIcon }> = {
  plumbing:    { label: "Plumbing",              icon: Wrench },
  electrical:  { label: "Electrical",            icon: Zap },
  cleaning:    { label: "Cleaning",              icon: Sparkles },
  security:    { label: "Security",              icon: ShieldCheck },
  parking:     { label: "Parking",               icon: Car },
  lift:        { label: "Lift",                  icon: ArrowUpDown },
  water_supply:{ label: "Water Supply",          icon: Droplets },
  gardening:   { label: "Gardening",             icon: Trees },
  common_area: { label: "Common Area",           icon: Building2 },
  other:       { label: "Other",                 icon: HelpCircle },
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_META).map(([value, m]) => ({
  value: value as ComplaintCategory,
  label: m.label,
}));

export const STATUS_META: Record<ComplaintStatus, { label: string; className: string }> = {
  open:        { label: "Open",        className: "bg-highlight/15 text-highlight-foreground ring-1 ring-highlight/30" },
  in_progress: { label: "In Progress", className: "bg-secondary/15 text-secondary ring-1 ring-secondary/30" },
  resolved:    { label: "Resolved",    className: "bg-success/15 text-success ring-1 ring-success/30" },
};

export const PRIORITY_META: Record<ComplaintPriority, { label: string; className: string; dot: string }> = {
  low:    { label: "Low",    className: "bg-muted text-muted-foreground ring-1 ring-border",            dot: "bg-muted-foreground" },
  medium: { label: "Medium", className: "bg-secondary/10 text-secondary ring-1 ring-secondary/25",     dot: "bg-secondary" },
  high:   { label: "High",   className: "bg-destructive/10 text-destructive ring-1 ring-destructive/25", dot: "bg-destructive" },
};

export function isOverdue(status: ComplaintStatus, createdAt: string, thresholdDays: number): boolean {
  if (status === "resolved") return false;
  const created = new Date(createdAt).getTime();
  const ageDays = (Date.now() - created) / 86_400_000;
  return ageDays > thresholdDays;
}
