"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@kinder-pilot/ui";
import { useColorMode } from "@/components/providers/ColorModeProvider";

type ThemeToggleProps = {
  className?: string;
  /** Icon-only for header; with label for settings */
  showLabel?: boolean;
};

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { mode, toggle } = useColorMode();
  const isDark = mode === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      suppressHydrationWarning
      className={cn(
        showLabel
          ? "inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-heading hover:bg-bg"
          : "rounded-full p-2 text-muted transition hover:bg-bg hover:text-heading",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      {showLabel && <span>{isDark ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}
