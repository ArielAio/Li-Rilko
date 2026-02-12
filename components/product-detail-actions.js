"use client";

import Link from "next/link";
import { useState } from "react";
import { IconCartPlus } from "@/components/icons";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { formatCurrency } from "@/lib/store-utils";

export default function ProductDetailActions({ product }) {
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const { showToast } = useToast();

  function decreaseQty() {
    setQty((prev) => Math.max(1, prev - 1));
  }

  function increaseQty() {
    setQty((prev) => Math.min(99, prev + 1));
  }

  function handleAdd() {
    addItem(product.id, qty);
    showToast({
      type: "success",
      title: "Item adicionado",
      message: `${product.name} (${qty}x) foi para o carrinho.`,
    });
  }

  return (
    <div className="detail-action-panel">
      <div className="detail-price">
        <small>A partir de</small>
        <strong>{formatCurrency(product.price)}</strong>
      </div>

      <div className="detail-qty" role="group" aria-label="Quantidade">
        <button type="button" onClick={decreaseQty} aria-label="Diminuir quantidade">
          −
        </button>
        <strong>{qty}</strong>
        <button type="button" onClick={increaseQty} aria-label="Aumentar quantidade">
          +
        </button>
      </div>

      <div className="detail-buttons">
        <button type="button" className="btn btn-primary" onClick={handleAdd}>
          <IconCartPlus className="icon" />
          Adicionar ao carrinho
        </button>
        <Link className="btn btn-surface" href="/carrinho">
          Ir para o carrinho
        </Link>
      </div>
    </div>
  );
}
