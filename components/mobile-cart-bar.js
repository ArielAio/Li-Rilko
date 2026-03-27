"use client";

import { usePathname } from "next/navigation";
import { IconCart } from "@/components/icons";
import { useCart } from "@/components/providers/cart-provider";
import TransitionLink from "@/components/transition-link";
import { formatCurrency } from "@/lib/store-utils";

export default function MobileCartBar() {
  const pathname = usePathname();
  const { count, totalCash } = useCart();

  if (
    count === 0 ||
    pathname === "/carrinho" ||
    pathname?.startsWith("/produto/") ||
    pathname?.startsWith("/contato") ||
    pathname?.startsWith("/admin")
  ) {
    return null;
  }

  return (
    <TransitionLink href="/carrinho" className="mobile-cart-bar" aria-label={`Abrir carrinho com ${count} itens`}>
      <IconCart className="icon" />
      <span>{count} item{count > 1 ? "s" : ""} no pedido • {formatCurrency(totalCash)}</span>
      <strong>Revisar</strong>
    </TransitionLink>
  );
}
