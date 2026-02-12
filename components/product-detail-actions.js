"use client";

import { useState } from "react";
import { IconCartPlus } from "@/components/icons";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import TransitionLink from "@/components/transition-link";
import { formatCurrency } from "@/lib/store-utils";

export default function ProductDetailActions({ product }) {
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const { showToast } = useToast();
  const isAvailable = product.isAvailable !== false;

  function decreaseQty() {
    setQty((prev) => Math.max(1, prev - 1));
  }

  function increaseQty() {
    setQty((prev) => Math.min(99, prev + 1));
  }

  function handleAdd() {
    const added = addItem(product.id, qty);
    if (!added) {
      showToast({
        type: "warning",
        title: "Produto indisponível",
        message: `${product.name} está temporariamente indisponível.`,
      });
      return;
    }

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
        <button type="button" onClick={decreaseQty} aria-label="Diminuir quantidade" disabled={!isAvailable}>
          −
        </button>
        <strong>{qty}</strong>
        <button type="button" onClick={increaseQty} aria-label="Aumentar quantidade" disabled={!isAvailable}>
          +
        </button>
      </div>

      <div className="detail-buttons">
        <button type="button" className="btn btn-primary" onClick={handleAdd} disabled={!isAvailable}>
          <IconCartPlus className="icon" />
          {isAvailable ? "Adicionar ao carrinho" : "Indisponível no momento"}
        </button>
        <TransitionLink className="btn btn-surface" href="/carrinho">
          Ir para o carrinho
        </TransitionLink>
      </div>
    </div>
  );
}
