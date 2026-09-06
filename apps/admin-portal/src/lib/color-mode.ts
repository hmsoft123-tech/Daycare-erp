/** Color mode for admin ERP — light | dark only (fits existing UI). */

export const COLOR_MODE_STORAGE_KEY = "kp-color-mode";

export type ColorMode = "light" | "dark";

export function isColorMode(value: unknown): value is ColorMode {
  return value === "light" || value === "dark";
}

export function readStoredColorMode(): ColorMode {
  if (typeof window === "undefined") return "light";
  try {
    const raw = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    return isColorMode(raw) ? raw : "light";
  } catch {
    return "light";
  }
}

export function applyColorModeClass(mode: ColorMode) {
  const root = document.documentElement;
  if (mode === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  root.style.colorScheme = mode;
}

/** Inline script — run before paint to avoid wrong-theme flash */
export const COLOR_MODE_BOOT_SCRIPT = `(function(){try{var k=${JSON.stringify(COLOR_MODE_STORAGE_KEY)};var t=localStorage.getItem(k);if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}else{document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light";}}catch(e){}})();`;
