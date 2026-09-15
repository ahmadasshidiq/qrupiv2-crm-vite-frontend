export function truncateDescription(value: unknown, wordLimit = 10) {
  const words = String(value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "-";

  return words.length > wordLimit
    ? `${words.slice(0, wordLimit).join(" ")}...`
    : words.join(" ");
}
