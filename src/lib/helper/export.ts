export type ExportDateRange = { from: string; to: string };

export function exportDateFilters(
  field: string,
  range?: ExportDateRange,
) {
  return range
    ? [
        { key: field, operator: ">=", value: range.from },
        { key: field, operator: "<=", value: range.to },
      ]
    : [];
}
