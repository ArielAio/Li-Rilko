"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCart } from "@/components/icons";
import { useCart } from "@/components/providers/cart-provider";
import { formatCurrency } from "@/lib/store-utils";

export default function MobileCartBar() {
  const pathname = usePathname();
  const { count, total } = useCart();

  if (count === 0 || pathname === "/carrinho") {
    return null;
  }

  return (
    <Link href="/carrinho" className="mobile-cart-bar" aria-label={`Abrir carrinho com ${count} itens`}>
      <IconCart className="icon" />
      <span>
        {count} item(ns) • {formatCurrency(total)}
      </span>
      <strong>Ver carrinho</strong>
    </Link>
  );
}
