"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = "bh-theme-mode";
const FONT_SIZE_STORAGE_KEY = "bh-font-size";

function normalizeTheme(theme) {
  return theme === "light" || theme === "dark" ? theme : "dark";
}

function normalizeFontSize(size) {
  const parsed = Number(size);
  if (!Number.isNaN(parsed) && parsed >= 90 && parsed <= 120) {
    return parsed;
  }
  return 100;
}

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState("dark");
  const [fontSize, setFontSize] = useState(100);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedTheme = normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
    const storedFont = normalizeFontSize(window.localStorage.getItem(FONT_SIZE_STORAGE_KEY));

    setThemeMode(storedTheme);
    setFontSize(storedFont);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    document.documentElement.setAttribute("data-profile-theme", themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, String(fontSize));
    document.documentElement.style.fontSize = `${fontSize}%`;
  }, [fontSize]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onStorage = () => {
      setThemeMode(normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY)));
      setFontSize(normalizeFontSize(window.localStorage.getItem(FONT_SIZE_STORAGE_KEY)));
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(
    () => ({
      themeMode,
      isLight: themeMode === "light",
      setThemeMode,
      toggleTheme: () => setThemeMode((prev) => (prev === "dark" ? "light" : "dark")),
      fontSize,
      setFontSize,
    }),
    [fontSize, themeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }
  return context;
}
