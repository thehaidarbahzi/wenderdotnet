"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Ganti tema terang/gelap"
      title="Ganti tema"
      className="relative grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary"
    >
      {}
      <Sun className="col-start-1 row-start-1 h-4 w-4 scale-100 rotate-0 transition-transform duration-200 dark:scale-0 dark:-rotate-90" />
      <Moon className="col-start-1 row-start-1 h-4 w-4 scale-0 rotate-90 transition-transform duration-200 dark:scale-100 dark:rotate-0" />
    </button>
  );
}
