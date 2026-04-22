"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      // Avoid stale service worker caches breaking local dev chunk loading.
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          void registration.unregister();
        });
      });

      if ("caches" in window) {
        void caches.keys().then((keys) => {
          keys
            .filter((key) => key.startsWith("beyond-hangeul-"))
            .forEach((key) => {
              void caches.delete(key);
            });
        });
      }

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
