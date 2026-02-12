"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePageTransition } from "@/components/providers/page-transition-provider";

function isModifiedEvent(event) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function normalizeHref(href) {
  if (typeof href !== "string") {
    return null;
  }

  if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
    return null;
  }

  if (/^https?:\/\//i.test(href)) {
    try {
      const url = new URL(href);
      if (typeof window !== "undefined" && url.origin === window.location.origin) {
        return `${url.pathname}${url.search}${url.hash}`;
      }
      return null;
    } catch {
      return null;
    }
  }

  if (href.startsWith("/")) {
    return href;
  }

  if (href.startsWith("?") && typeof window !== "undefined") {
    return `${window.location.pathname}${href}`;
  }

  return null;
}

export default function TransitionLink({ href, onClick, replace = false, scroll = true, target, ...props }) {
  const router = useRouter();
  const { startNavigation } = usePageTransition();

  function handleClick(event) {
    if (typeof onClick === "function") {
      onClick(event);
    }

    if (event.defaultPrevented) {
      return;
    }

    if (event.button !== 0 || isModifiedEvent(event)) {
      return;
    }

    if (target && target !== "_self") {
      return;
    }

    const hrefValue = normalizeHref(href);
    if (!hrefValue) {
      return;
    }

    const handledByTransition = startNavigation({
      href: hrefValue,
      replace,
      scroll,
    });

    if (handledByTransition) {
      event.preventDefault();
    }
  }

  function handleMouseEnter() {
    const hrefValue = normalizeHref(href);
    if (hrefValue) {
      router.prefetch(hrefValue);
    }
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      replace={replace}
      scroll={scroll}
      target={target}
      {...props}
    />
  );
}
