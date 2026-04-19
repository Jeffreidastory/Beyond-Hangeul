"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const handleRegister = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch (error) {
        console.error("PWA service worker registration failed:", error);
      }
    };

    if (window.document.readyState === "complete") {
      void handleRegister();
    } else {
      window.addEventListener("load", handleRegister);
      return () => window.removeEventListener("load", handleRegister);
    }
  }, []);

  return null;
}
