"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const SECTION_IDS = ["home", "about", "reviews", "contact"];

export default function LandingNavbar() {
  const [activeSection, setActiveSection] = useState("home");
  const [headerOffset, setHeaderOffset] = useState(82);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const isMountedRef = useRef(true);

  const sectionLinks = useMemo(
    () => [
      { id: "home", label: "Home" },
      { id: "about", label: "About" },
      { id: "reviews", label: "Reviews" },
      { id: "contact", label: "Connect" },
    ],
    []
  );
  const router = useRouter();

  const handleSignInClick = async (event) => {
    event.preventDefault();
    setIsSigningIn(true);
    try {
      await router.push("/auth/login");
    } finally {
      if (isMountedRef.current) {
        setIsSigningIn(false);
      }
    }
  };

  useEffect(() => {
    const getOffset = () => {
      const header = document.querySelector("header[data-landing-navbar='true']");
      if (!header) return 0;

      const computed = window.getComputedStyle(header);
      const isFixedOrSticky = computed.position === "fixed" || computed.position === "sticky";
      return isFixedOrSticky ? Math.ceil(header.getBoundingClientRect().height) : 0;
    };

    const refreshOffset = () => {
      const nextOffset = getOffset();
      setHeaderOffset(nextOffset || 82);
      document.documentElement.style.setProperty("--landing-nav-offset", `${nextOffset || 82}px`);
    };

    const updateActiveOnScroll = () => {
      const offset = getOffset() || 82;
      let current = "home";

      SECTION_IDS.forEach((id) => {
        const section = document.getElementById(id);
        if (!section) return;

        const top = section.getBoundingClientRect().top + window.scrollY - offset - 12;
        if (window.scrollY >= top) {
          current = id;
        }
      });

      setActiveSection(current);
    };

    refreshOffset();
    updateActiveOnScroll();

    window.addEventListener("resize", refreshOffset);
    window.addEventListener("scroll", updateActiveOnScroll, { passive: true });

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("resize", refreshOffset);
      window.removeEventListener("scroll", updateActiveOnScroll);
    };
  }, []);

  const onSectionClick = (event, id) => {
    event.preventDefault();
    const section = document.getElementById(id);
    if (!section) return;

    const header = document.querySelector("header[data-landing-navbar='true']");
    const computed = header ? window.getComputedStyle(header) : null;
    const hasFixedLikeNavbar = computed && (computed.position === "fixed" || computed.position === "sticky");
    const offset = hasFixedLikeNavbar ? Math.ceil(header.getBoundingClientRect().height) : 0;

    const top = section.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
    setActiveSection(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <header
      data-landing-navbar="true"
      className="fixed inset-x-0 top-0 z-40 border-b border-white/20 bg-[#031425]/90 backdrop-blur"
    >
      <nav className="mx-auto flex w-full items-center px-4 py-4 sm:px-6 lg:px-3 [font-family:var(--font-nav)]">
        <a href="#home" onClick={(e) => onSectionClick(e, "home")} className="text-2xl font-bold tracking-tight [font-family:var(--font-body)]">
          <span className="text-white">Beyond </span>
          <span className="text-amber-400">Hangeul</span>
        </a>

        <div className="ml-auto flex items-center gap-2 text-sm">
          <div className="mr-3 hidden items-center gap-6 text-white/80 md:flex">
            {sectionLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => onSectionClick(e, link.id)}
                className={`border-b-2 pb-1 font-medium transition ${
                  activeSection === link.id
                    ? "border-[#FFBF00] text-white"
                    : "border-transparent text-white/80 hover:text-white"
                }`}
                style={{ scrollMarginTop: `${headerOffset + 8}px` }}
              >
                {link.label}
              </a>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSignInClick}
            disabled={isSigningIn}
            className="relative inline-flex overflow-hidden rounded-md bg-[#f6b21f] px-6 py-3 text-sm font-bold tracking-wide text-[#07223a] transition hover:bg-[#ffc43d] disabled:cursor-wait disabled:opacity-80"
          >
            {isSigningIn && (
              <span className="pointer-events-none absolute inset-0 bg-[#ffed99]/70 origin-left animate-progress" />
            )}
            <span className="relative z-10">
              {isSigningIn ? "Signing in..." : "SIGN IN"}
            </span>
          </button>
          <Link
            href="/auth/register"
            className="rounded-md border border-white/30 bg-[#0a2237] px-6 py-3 text-sm font-bold tracking-wide text-white transition hover:bg-[#11324f]"
          >
            SIGN UP
          </Link>
        </div>
      </nav>
    </header>
  );
}
