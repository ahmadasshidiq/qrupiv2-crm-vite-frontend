import type { LucideIcon } from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  roles?: string[];
  children?: NavigationItem[];
};

export type DashboardMetric = {
  label: string;
  value: string;
  change: string;
  tone: "blue" | "violet" | "orange" | "emerald";
  icon: LucideIcon;
};

export type SearchSuggestion = {
  label: string;
  description: string;
  category: string;
  href: string;
  keywords: string[];
  icon: LucideIcon;
  tone: "blue" | "violet" | "orange" | "emerald";
};
