"use client";

import { Moon, Sun } from "lucide-react";
import { useColorMode } from "@/components/providers/ColorModeProvider";
import { cn } from "@/lib/utils";

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
          : "rounded-full bg-surface p-2.5 text-muted shadow-card transition hover:text-heading",
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
