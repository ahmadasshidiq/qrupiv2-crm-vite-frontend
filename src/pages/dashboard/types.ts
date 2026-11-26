import type { AppIcon } from "@/lib/icons";

export type NavigationItem = {
  label: string;
  href: string;
  icon: AppIcon;
  badge?: string;
  roles?: string[];
  children?: NavigationItem[];
};

export type DashboardMetric = {
  label: string;
  value: string;
  change: string;
  tone: "blue" | "violet" | "orange" | "emerald";
  icon: AppIcon;
};

export type SearchSuggestion = {
  label: string;
  description: string;
  category: string;
  href: string;
  keywords: string[];
  icon: AppIcon;
  tone: "blue" | "violet" | "orange" | "emerald";
};
