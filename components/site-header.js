"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconCart, IconChevronDown, IconClose, IconMenu } from "@/components/icons";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useCart } from "@/components/providers/cart-provider";
import TransitionLink from "@/components/transition-link";
import { formatCurrency } from "@/lib/store-utils";

const navItems = [
  { href: "/", label: "Início" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/carrinho", label: "Carrinho" },
  { href: "/contato", label: "Contato" },
];

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function SiteHeader() {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const { categories } = useCatalog();
  const { count, total } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const previousCountRef = useRef(count);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 14);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (count > previousCountRef.current) {
      setIsPulsing(true);
      const timeout = window.setTimeout(() => setIsPulsing(false), 340);
      previousCountRef.current = count;
      return () => clearTimeout(timeout);
    }

    previousCountRef.current = count;
    return undefined;
  }, [count]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("menu-open", isMenuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen]);

  const cartLabel = useMemo(() => {
    if (count <= 0) {
      return "Carrinho vazio";
    }
    return `${count} item(ns) no carrinho`;
  }, [count]);

  function toggleCategory(categoryName) {
    setExpandedCategory((prev) => (prev === categoryName ? null : categoryName));
  }

  function buildCatalogLink(categoryName, subName) {
    const query = new URLSearchParams();
    query.set("categoria", categoryName);
    if (subName) {
      query.set("sub", subName);
    }
    return `/catalogo?${query.toString()}`;
  }

  return (
    <>
      <header className={`site-header ${isScrolled ? "is-scrolled" : ""}`}>
        <div className="shell-container header-inner">
          <TransitionLink href="/" className="brand" aria-label="Li Rilko Imports">
            <span className="brand-symbol">LR</span>
            <span className="brand-text">
              <strong>LI RILKO</strong>
              <small>IMPORTS</small>
            </span>
          </TransitionLink>

          <nav className="header-nav" aria-label="Navegação principal">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <TransitionLink key={item.href} href={item.href} className={isActive ? "is-active" : ""}>
                  {item.label}
                </TransitionLink>
              );
            })}
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="menu-trigger"
              aria-label="Abrir menu"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu-drawer"
              onClick={() => setIsMenuOpen(true)}
            >
              <IconMenu className="icon" />
            </button>

            {!isAdminRoute && (
              <TransitionLink href="/carrinho" className={`header-cart ${isPulsing ? "pulse" : ""}`} aria-label={cartLabel}>
                <IconCart className="icon" />
                <span className="header-cart-text">
                  <small>{count} item(ns)</small>
                  <strong>{formatCurrency(total)}</strong>
                </span>
              </TransitionLink>
            )}
          </div>
        </div>
      </header>

      <button
        type="button"
        className={`mobile-menu-backdrop ${isMenuOpen ? "is-open" : ""}`}
        aria-label="Fechar menu"
        onClick={() => setIsMenuOpen(false)}
      />

      <aside
        id="mobile-menu-drawer"
        className={`mobile-menu-drawer ${isMenuOpen ? "is-open" : ""}`}
        aria-hidden={!isMenuOpen}
      >
        <div className="mobile-menu-header">
          <strong>Menu</strong>
          <button type="button" className="mobile-menu-close" aria-label="Fechar menu" onClick={() => setIsMenuOpen(false)}>
            <IconClose className="icon" />
          </button>
        </div>

        <nav className="mobile-menu-links" aria-label="Navegação mobile">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <TransitionLink
                key={item.href}
                href={item.href}
                className={isActive ? "is-active" : ""}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </TransitionLink>
            );
          })}
        </nav>

        <div className="mobile-menu-categories">
          <p>Categorias</p>
          {categories.map((category) => {
            const isExpanded = expandedCategory === category.name;
            const triggerId = `menu-category-${slugify(category.name)}`;

            return (
              <article key={category.name} className={`mobile-category ${isExpanded ? "is-open" : ""}`}>
                <button
                  type="button"
                  className="mobile-category-trigger"
                  aria-expanded={isExpanded}
                  aria-controls={triggerId}
                  onClick={() => toggleCategory(category.name)}
                >
                  <span>{category.name}</span>
                  <IconChevronDown className="icon" />
                </button>
                <div id={triggerId} className="mobile-submenu">
                  <TransitionLink href={buildCatalogLink(category.name)} onClick={() => setIsMenuOpen(false)}>
                    Ver todos
                  </TransitionLink>
                  {category.subs.map((sub) => (
                    <TransitionLink key={sub} href={buildCatalogLink(category.name, sub)} onClick={() => setIsMenuOpen(false)}>
                      {sub}
                    </TransitionLink>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </aside>
    </>
  );
}
