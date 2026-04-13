"use client";

import { useEffect } from "react";

export default function PreferenceSync() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const applyPreferences = () => {
      const storedTheme = window.localStorage.getItem("bh-theme-mode");
      const storedFont = window.localStorage.getItem("bh-font-size");

      const normalizedTheme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : "dark";
      document.documentElement.setAttribute("data-profile-theme", normalizedTheme);

      const parsedFont = Number(storedFont);
      if (!Number.isNaN(parsedFont) && parsedFont >= 90 && parsedFont <= 120) {
        document.documentElement.style.fontSize = `${parsedFont}%`;
      }
    };

    applyPreferences();
    window.addEventListener("storage", applyPreferences);

    return () => {
      window.removeEventListener("storage", applyPreferences);
    };
  }, []);

  return null;
}
