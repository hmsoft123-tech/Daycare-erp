"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyColorModeClass,
  COLOR_MODE_STORAGE_KEY,
  isColorMode,
  readStoredColorMode,
  type ColorMode,
} from "@/lib/color-mode";

type ColorModeContextValue = {
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
  toggle: () => void;
};

const ColorModeContext = createContext<ColorModeContextValue | null>(null);

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ColorMode>("light");

  useIsoLayoutEffect(() => {
    const initial = readStoredColorMode();
    setModeState(initial);
    applyColorModeClass(initial);
  }, []);

  const setMode = useCallback((next: ColorMode) => {
    setModeState(next);
    applyColorModeClass(next);
    try {
      window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const next: ColorMode = prev === "dark" ? "light" : "dark";
      applyColorModeClass(next);
      try {
        window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== COLOR_MODE_STORAGE_KEY) return;
      if (isColorMode(e.newValue)) {
        setModeState(e.newValue);
        applyColorModeClass(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(() => ({ mode, setMode, toggle }), [mode, setMode, toggle]);

  return <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>;
}

export function useColorMode() {
  const ctx = useContext(ColorModeContext);
  if (!ctx) {
    throw new Error("useColorMode must be used within ColorModeProvider");
  }
  return ctx;
}
