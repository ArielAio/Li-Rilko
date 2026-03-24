"use client";

import { useState } from "react";
import { IconCartPlus } from "@/components/icons";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import TransitionLink from "@/components/transition-link";

export default function ProductDetailActions({ product }) {
  const [qty, setQty] = useState(1);
  const { addItem, getItemQty } = useCart();
  const { showToast } = useToast();
  const isAvailable = product.isAvailable !== false;
  const qtyInCart = getItemQty(product.id);

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
        title: "Produto esgotado",
        message: `${product.name} está esgotado no momento.`,
      });
    } else {
      showToast({
        type: "success",
        title: "Adicionado",
        message: `${qty}x ${product.name} no carrinho.`,
      });
    }
  }

  return (
    <div className="vg-detail-actions">
      {qtyInCart > 0 && <p className="vg-in-cart-msg">Você tem {qtyInCart} na sacola.</p>}

      <div className="vg-action-row">
        <div className="vg-qty-selector">
          <button type="button" onClick={decreaseQty} disabled={!isAvailable}>−</button>
          <strong>{qty}</strong>
          <button type="button" onClick={increaseQty} disabled={!isAvailable}>+</button>
        </div>

        <button 
          type="button" 
          className="btn btn-primary vg-add-btn" 
          onClick={handleAdd} 
          disabled={!isAvailable}
        >
          <IconCartPlus className="icon" />
          {isAvailable ? "Adicionar ao Carrinho" : "Esgotado"}
        </button>
      </div>

      <TransitionLink className="vg-btn-secondary" href="/carrinho">
        Ir para o carrinho
      </TransitionLink>
    </div>
  );
}
