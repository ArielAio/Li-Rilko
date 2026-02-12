"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import PageTransitionOverlay from "@/components/page-transition-overlay";

const COVER_DURATION_MS = 1020;
const COVER_HOLD_MS = 240;
const EXIT_DURATION_MS = 1100;
const NAVIGATION_TIMEOUT_MS = 5000;

const PageTransitionContext = createContext(null);

function normalizeHref(href) {
  if (typeof href !== "string") return null;

  if (
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:")
  ) {
    return null;
  }

  if (typeof window === "undefined") {
    return href.startsWith("/") || href.startsWith("?") ? href : null;
  }

  try {
    const url = new URL(href, window.location.href);

    if (url.origin !== window.location.origin) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

function buildRouteKeyFromHref(href) {
  if (typeof window === "undefined") {
    return href.split("#")[0].split("?")[0];
  }

  const url = new URL(href, window.location.href);
  return `${url.pathname}${url.search}`;
}

function getCurrentRouteKey() {
  if (typeof window === "undefined") {
    return "/";
  }

  return `${window.location.pathname}${window.location.search}`;
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updatePreference);
      return () => mediaQuery.removeEventListener("change", updatePreference);
    }

    mediaQuery.addListener(updatePreference);
    return () => mediaQuery.removeListener(updatePreference);
  }, []);

  return prefersReducedMotion;
}

export function usePageTransition() {
  const context = useContext(PageTransitionContext);

  if (!context) {
    throw new Error("usePageTransition deve ser usado dentro de PageTransitionProvider.");
  }

  return context;
}

export default function PageTransitionProvider({ children }) {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const coverDuration = prefersReducedMotion ? 0 : COVER_DURATION_MS;
  const coverHoldDuration = prefersReducedMotion ? 0 : COVER_HOLD_MS;
  const exitDuration = prefersReducedMotion ? 0 : EXIT_DURATION_MS;

  const [phase, setPhase] = useState("idle");
  const activeTransitionRef = useRef(null);
  const coverTimerRef = useRef(null);
  const revealTimerRef = useRef(null);
  const exitTimerRef = useRef(null);
  const navigationTimeoutRef = useRef(null);
  const navigationWatchIntervalRef = useRef(null);

  const clearTimer = useCallback((timerRef) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearWatchInterval = useCallback(() => {
    if (navigationWatchIntervalRef.current) {
      clearInterval(navigationWatchIntervalRef.current);
      navigationWatchIntervalRef.current = null;
    }
  }, []);

  const resetTransition = useCallback(() => {
    activeTransitionRef.current = null;
  }, []);

  const clearAllTimers = useCallback(() => {
    clearTimer(coverTimerRef);
    clearTimer(revealTimerRef);
    clearTimer(exitTimerRef);
    clearTimer(navigationTimeoutRef);
    clearWatchInterval();
  }, [clearTimer, clearWatchInterval]);

  useEffect(() => {
    document.body.classList.toggle("is-page-transitioning", phase !== "idle");

    return () => {
      document.body.classList.remove("is-page-transitioning");
    };
  }, [phase]);

  const startNavigation = useCallback(({ href, replace = false, scroll = true }) => {
    const hrefValue = normalizeHref(href);

    if (!hrefValue) {
      return false;
    }

    if (activeTransitionRef.current) {
      return true;
    }

    const targetRouteKey = buildRouteKeyFromHref(hrefValue);
    const currentKey = getCurrentRouteKey();

    if (targetRouteKey === currentKey) {
      if (hrefValue.includes("#")) {
        return false;
      }
      return true;
    }

    activeTransitionRef.current = {
      href: hrefValue,
      replace,
      scroll,
      targetRouteKey,
    };

    setPhase("entering");

    return true;
  }, []);

  useEffect(() => {
    if (phase !== "entering") {
      return undefined;
    }

    clearTimer(coverTimerRef);

    coverTimerRef.current = window.setTimeout(() => {
      const currentTransition = activeTransitionRef.current;

      if (!currentTransition) {
        setPhase("idle");
        return;
      }

      const navigate = () => {
        if (currentTransition.replace) {
          router.replace(currentTransition.href, { scroll: currentTransition.scroll });
        } else {
          router.push(currentTransition.href, { scroll: currentTransition.scroll });
        }
      };

      navigate();

      clearTimer(navigationTimeoutRef);
      clearWatchInterval();

      navigationTimeoutRef.current = window.setTimeout(() => {
        setPhase("exiting");
      }, NAVIGATION_TIMEOUT_MS);

      navigationWatchIntervalRef.current = window.setInterval(() => {
        const activeTransition = activeTransitionRef.current;
        if (!activeTransition) {
          return;
        }

        if (getCurrentRouteKey() !== activeTransition.targetRouteKey) {
          return;
        }

        clearTimer(navigationTimeoutRef);
        clearWatchInterval();
        clearTimer(revealTimerRef);

        revealTimerRef.current = window.setTimeout(() => {
          setPhase("exiting");
        }, coverHoldDuration);
      }, 34);
    }, coverDuration);

    return () => {
      clearTimer(coverTimerRef);
    };
  }, [clearTimer, clearWatchInterval, coverDuration, coverHoldDuration, phase, router]);

  useEffect(() => {
    if (phase !== "exiting") {
      return undefined;
    }

    clearTimer(navigationTimeoutRef);
    clearTimer(revealTimerRef);
    clearWatchInterval();
    clearTimer(exitTimerRef);

    exitTimerRef.current = window.setTimeout(() => {
      setPhase("idle");
      resetTransition();
    }, exitDuration);

    return () => {
      clearTimer(exitTimerRef);
    };
  }, [clearTimer, clearWatchInterval, exitDuration, phase, resetTransition]);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const value = useMemo(
    () => ({
      startNavigation,
      isTransitioning: phase !== "idle",
    }),
    [phase, startNavigation],
  );

  return (
    <PageTransitionContext.Provider value={value}>
      {children}
      <PageTransitionOverlay phase={phase} />
    </PageTransitionContext.Provider>
  );
}
