"use client";

import { usePathname } from "next/navigation";
import { IconHome, IconBook, IconCart, IconUser } from "@/components/icons";
import TransitionLink from "@/components/transition-link";
import { useCart } from "@/components/providers/cart-provider";
import { useCatalog } from "@/components/providers/catalog-provider";

export default function BottomTabBar() {
  const pathname = usePathname();
  const { count } = useCart();
  const { isAdmin } = useCatalog();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) return null;

  return (
    <nav className="bottom-tab-bar" aria-label="Navegação inferior">
      <TransitionLink href="/" className={`tab-item ${pathname === "/" ? "is-active" : ""}`}>
        <IconHome className="tab-icon" />
        <span className="tab-label">INÍCIO</span>
      </TransitionLink>
      
      <TransitionLink href="/catalogo" className={`tab-item ${pathname.startsWith("/catalogo") ? "is-active" : ""}`}>
        <IconBook className="tab-icon" />
        <span className="tab-label">CATÁLOGO</span>
      </TransitionLink>

      <TransitionLink href="/carrinho" className={`tab-item ${pathname === "/carrinho" ? "is-active" : ""}`}>
        <div className="tab-icon-wrapper">
          <IconCart className="tab-icon" />
          {count > 0 && <span className="tab-badge">{count}</span>}
        </div>
        <span className="tab-label">CARRINHO</span>
      </TransitionLink>

      {isAdmin && (
        <TransitionLink href="/admin" className="tab-item">
          <IconUser className="tab-icon" />
          <span className="tab-label">ADMIN</span>
        </TransitionLink>
      )}
    </nav>
  );
}
