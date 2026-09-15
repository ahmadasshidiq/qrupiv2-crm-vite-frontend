import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-11 w-full justify-start gap-3 rounded-xl px-2 text-zinc-600 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 dark:text-zinc-300"
      aria-label={isDark ? "Gunakan mode terang" : "Gunakan mode gelap"}
    >
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-lg ${isDark ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"}`}
      >
        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </span>
      <span className="group-data-[collapsible=icon]:hidden">
        {isDark ? "Mode terang" : "Mode gelap"}
      </span>
    </Button>
  );
}
