"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationLoadingOverlay() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const flag = window.sessionStorage.getItem("landing-signin-loading");
    if (!flag) return;

    setVisible(true);
    window.sessionStorage.removeItem("landing-signin-loading");
  }, []);

  useEffect(() => {
    if (!visible) return;

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [visible, pathname]);

  if (!visible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-9999 h-1 overflow-hidden bg-transparent">
      <span className="block h-full w-full origin-left bg-[#ffed99] animate-progress" />
    </div>
  );
}
