// src/lib/stores/themeStore.ts
import { writable, get } from "svelte/store";
import { browser } from "$app/environment";

type Theme = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "theme";

// Helper to determine the resolved theme (light or dark)
function getResolvedTheme(currentTheme: Theme): "light" | "dark" {
  if (!browser) return "light";
  if (currentTheme === "system") {
    // Check system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return currentTheme;
}

// Function to apply the resolved theme to the document element (<html>)
function applyResolvedTheme(resolvedTheme: "light" | "dark") {
  if (!browser) return;
  if (resolvedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

// 1. Initialize theme from localStorage or default to 'system'
let initialTheme: Theme = "system";
if (browser) {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (storedTheme && ["light", "dark", "system"].includes(storedTheme)) {
    initialTheme = storedTheme;
  }
}

// 2. Writable store for the user's theme preference
export const theme = writable<Theme>(initialTheme);

// 3. Readable store for the currently active theme (light or dark)
let initialResolvedTheme = getResolvedTheme(initialTheme);
export const resolvedTheme = writable<"light" | "dark">(initialResolvedTheme);

// 4. Subscription to update DOM, localStorage, and resolvedTheme
theme.subscribe((currentTheme) => {
  if (!browser) return;

  // Update localStorage
  localStorage.setItem(THEME_STORAGE_KEY, currentTheme);

  // Calculate and apply the resolved theme
  const newResolvedTheme = getResolvedTheme(currentTheme);
  applyResolvedTheme(newResolvedTheme);
  resolvedTheme.set(newResolvedTheme);
});

// 5. System preference listener (only runs in browser)
if (browser) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  // Listener function to react to OS theme changes when user preference is 'system'
  const systemThemeChangeListener = () => {
    if (get(theme) === "system") {
      const newResolvedTheme = getResolvedTheme("system");
      applyResolvedTheme(newResolvedTheme);
      resolvedTheme.set(newResolvedTheme);
    }
  };

  mediaQuery.addEventListener("change", systemThemeChangeListener);

  // Initial application of the theme on load
  applyResolvedTheme(initialResolvedTheme);
}

// 6. Public toggle function for components
export function toggleTheme() {
  theme.update((currentTheme) => {
    // Toggle between 'light' and 'dark', overriding 'system' if it was active
    if (getResolvedTheme(currentTheme) === "dark") {
      return "light";
    }
    return "dark";
  });
}
