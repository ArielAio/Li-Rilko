"use client";

import { useState } from "react";
import { IconCartPlus, IconWhatsApp } from "@/components/icons";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import TransitionLink from "@/components/transition-link";
import { formatCurrency } from "@/lib/store-utils";
import { openWhatsAppLink, resolveWhatsAppAttendantAction } from "@/lib/whatsapp-attendant-flow";

export default function ProductDetailActions({ product }) {
  const [qty, setQty] = useState(1);
  const { attendants, openWhatsAppPicker } = useCatalog();
  const { addItem, getItemQty } = useCart();
  const { showToast } = useToast();
  const isAvailable = product.isAvailable !== false;
  const qtyInCart = getItemQty(product.id);
  const priceCash = Number(product.priceCash ?? product.price ?? 0);

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
        message: `${product.name} esta esgotado no momento.`,
      });
      return;
    }

    showToast({
      type: "success",
      title: "Adicionado",
      message: `${qty}x ${product.name} no carrinho.`,
    });
  }

  function handleWhatsAppPurchase() {
    const label = qty > 1 ? `${qty} unidades de ${product.name}` : product.name;
    const message = `Ola! Tenho interesse em ${label} (${formatCurrency(priceCash)} a vista). Pode me ajudar com a compra?`;
    const action = resolveWhatsAppAttendantAction(attendants, message);

    if (action.mode === "blocked") {
      showToast({
        type: "warning",
        title: "Atendimento indisponivel",
        message: "Nenhum atendente de WhatsApp esta configurado neste momento.",
      });
      return;
    }

    if (action.mode === "picker") {
      openWhatsAppPicker(message);
      return;
    }

    openWhatsAppLink(action.link);
    showToast({
      type: "success",
      title: "Abrindo WhatsApp",
      message: `Voce sera atendido por ${action.attendant.name}.`,
    });
  }

  return (
    <div className="vg-detail-actions">
      {qtyInCart > 0 && <p className="vg-in-cart-msg">Voce tem {qtyInCart} na sacola.</p>}

      <div className="vg-action-row">
        <div className="vg-qty-selector">
          <button type="button" onClick={decreaseQty} disabled={!isAvailable}>
            -
          </button>
          <strong>{qty}</strong>
          <button type="button" onClick={increaseQty} disabled={!isAvailable}>
            +
          </button>
        </div>

        <button type="button" className="btn btn-primary vg-add-btn" onClick={handleAdd} disabled={!isAvailable}>
          <IconCartPlus className="icon" />
          {isAvailable ? "Adicionar ao carrinho" : "Esgotado"}
        </button>
      </div>

      <div className="vg-secondary-actions">
        <button type="button" className="vg-btn-secondary vg-btn-whatsapp-secondary" onClick={handleWhatsAppPurchase}>
          <IconWhatsApp className="icon" />
          Comprar por WhatsApp
        </button>

        <TransitionLink className="vg-btn-secondary" href="/carrinho">
          Ir para o carrinho
        </TransitionLink>
      </div>
    </div>
  );
}
