import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function LearningGroupDetailTable({
  headers,
  children,
  rightAlignedLastColumn = false,
}: {
  headers: string[];
  children: ReactNode;
  rightAlignedLastColumn?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-white/10">
      <Table className="min-w-[620px] text-[13px]">
        <TableHeader className="bg-slate-50 text-slate-600 dark:bg-white/[0.03] dark:text-slate-300">
          <TableRow>
            {headers.map((header, index) => (
              <TableHead
                key={header}
                className={`px-4 py-3 ${rightAlignedLastColumn && index === headers.length - 1 ? "text-right" : ""}`}
              >
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-100 text-[13px] dark:divide-white/10">
          {children}
        </TableBody>
      </Table>
    </div>
  );
}
