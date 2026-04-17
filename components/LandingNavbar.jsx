"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const SECTION_IDS = ["home", "about", "reviews", "contact"];

export default function LandingNavbar() {
  const [activeSection, setActiveSection] = useState("home");
  const [headerOffset, setHeaderOffset] = useState(82);

  const sectionLinks = useMemo(
    () => [
      { id: "home", label: "Home" },
      { id: "about", label: "About" },
      { id: "reviews", label: "Reviews" },
      { id: "contact", label: "Connect" },
    ],
    []
  );
  const [loadingSignIn, setLoadingSignIn] = useState(false);
  const router = useRouter();

  const handleSignInClick = async (event) => {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      router.push("/auth/login");
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
    const isAdmin = profile?.role === "admin";

    if (isAdmin) {
      router.push("/auth/login");
      return;
    }

    setLoadingSignIn(true);
    await new Promise((resolve) => setTimeout(resolve, 40));
    router.push("/dashboard");
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
            disabled={loadingSignIn}
            className="relative rounded-md bg-[#f6b21f] px-6 py-3 text-sm font-bold tracking-wide text-[#07223a] transition hover:bg-[#ffc43d] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loadingSignIn && <span className="absolute inset-0 bg-[#ffed99]/70 origin-left animate-progress" />}
            <span className="relative z-10 inline-flex items-center justify-center">
              {loadingSignIn ? (
                <>
                  <span className="invisible">SIGN IN</span>
                  <span className="absolute inset-x-0 flex items-center justify-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#07223a] animate-bounce delay-0" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#07223a] animate-bounce delay-150" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#07223a] animate-bounce delay-300" />
                  </span>
                </>
              ) : (
                "SIGN IN"
              )}
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
