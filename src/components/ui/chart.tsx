import type { ComponentProps } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

export function ChartContainer({ className, children, ...props }: ComponentProps<typeof ResponsiveContainer>) {
  return <div className={cn("h-full w-full", className)}><ResponsiveContainer {...props}>{children}</ResponsiveContainer></div>;
}

export function ChartTooltip(props: ComponentProps<typeof Tooltip>) {
  return <Tooltip cursor={{ fill: "hsl(var(--muted))", opacity: 0.35 }} {...props} />;
}

export function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((item) => <p key={item.name} className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}: {item.value}</p>)}
    </div>
  );
}

export { Bar, BarChart, CartesianGrid, XAxis, YAxis };
