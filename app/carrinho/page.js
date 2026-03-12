"use client";

import { useState } from "react";
import { IconTrash, IconWhatsApp } from "@/components/icons";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import TransitionLink from "@/components/transition-link";
import WhatsAppAttendantPicker from "@/components/whatsapp-attendant-picker";
import { buildWhatsAppLink, buildWhatsAppMessage, formatCurrency } from "@/lib/store-utils";

export default function CartPage() {
  const { siteSettings } = useCatalog();
  const { items, totalCash, totalInstallment, count, addItem, decreaseItem, removeItem, clearCart } = useCart();
  const { showToast } = useToast();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const attendants = Array.isArray(siteSettings.whatsappAttendants) ? siteSettings.whatsappAttendants : [];
  const hasAttendants = attendants.length > 0;
  const message = buildWhatsAppMessage(items, siteSettings);
  const whatsappLink = buildWhatsAppLink(items, siteSettings);

  function handleDecrease(item) {
    if (item.qty <= 1) {
      removeItem(item.id);
      showToast({
        type: "warning",
        title: "Item removido",
        message: `${item.name} foi removido do carrinho.`,
      });
      return;
    }

    decreaseItem(item.id, 1);
  }

  function handleIncrease(item) {
    const added = addItem(item.id, 1);
    if (!added) {
      showToast({
        type: "warning",
        title: "Produto esgotado",
        message: `${item.name} está esgotado e não pode ser adicionado agora.`,
      });
      return;
    }
  }

  function handleRemove(item) {
    removeItem(item.id);
    showToast({
      type: "warning",
      title: "Item removido",
      message: `${item.name} saiu do carrinho.`,
    });
  }

  function handleClearCart() {
    clearCart();
    showToast({
      type: "warning",
      title: "Carrinho limpo",
      message: "Todos os itens foram removidos.",
    });
  }

  function canCheckout() {
    if (items.length === 0) {
      showToast({
        type: "warning",
        title: "Carrinho vazio",
        message: "Adicione produtos antes de finalizar no WhatsApp.",
      });
      return false;
    }

    return true;
  }

  function openWhatsApp(url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleCheckoutClick(event) {
    if (!canCheckout()) {
      event.preventDefault();
      return;
    }

    showToast({
      type: "success",
      title: "Abrindo WhatsApp",
      message: "Resumo pronto com itens e totais à vista e a prazo.",
    });
  }

  function handleOpenPicker() {
    if (!canCheckout()) {
      return;
    }
    setIsPickerOpen(true);
  }

  function handleSelectAttendant(attendant) {
    const selectedLink = buildWhatsAppLink(items, siteSettings, attendant.phone);
    setIsPickerOpen(false);
    showToast({
      type: "success",
      title: `Atendimento com ${attendant.name}`,
      message: "Abrindo WhatsApp com o resumo do seu pedido.",
    });
    openWhatsApp(selectedLink);
  }

  return (
    <>
      <section className="section page-hero-small">
        <div className="shell-container">
          <p className="kicker">Carrinho</p>
          <h1>Confira seus itens e finalize seu pedido.</h1>
          <p>Ajuste quantidades, veja o total e envie o pedido para atendimento no WhatsApp.</p>
        </div>
      </section>

      <section className="section">
        <div className="shell-container cart-grid">
          <article className="cart-card reveal">
            <div className="cart-card-header">
              <h2>Seu carrinho</h2>
              {count > 0 && (
                <button type="button" className="text-button danger" onClick={handleClearCart}>
                  Limpar carrinho
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="empty-block">
                <strong>Seu carrinho está vazio.</strong>
                <p>Volte para o catálogo e adicione os produtos que te interessam.</p>
                <TransitionLink className="btn btn-primary" href="/catalogo">
                  Ir para catálogo
                </TransitionLink>
              </div>
            ) : (
              <ul className="cart-list">
                {items.map((item) => (
                  <li key={item.id}>
                    <div className="cart-item-content">
                      <strong>{item.name}</strong>
                      <small>
                        {item.category} • À vista {formatCurrency(item.priceCash)} • A prazo {formatCurrency(item.priceInstallment)}
                      </small>
                    </div>

                    <div className="cart-item-actions">
                      <div className="qty-controls" role="group" aria-label={`Quantidade de ${item.name}`}>
                        <button type="button" onClick={() => handleDecrease(item)} aria-label={`Diminuir ${item.name}`}>
                          −
                        </button>
                        <strong>{item.qty}</strong>
                        <button type="button" onClick={() => handleIncrease(item)} aria-label={`Aumentar ${item.name}`}>
                          +
                        </button>
                      </div>

                      <div className="item-subtotal">
                        <strong>À vista {formatCurrency(item.subtotalCash)}</strong>
                        <small>A prazo {formatCurrency(item.subtotalInstallment)}</small>
                      </div>

                      <button type="button" className="icon-button" onClick={() => handleRemove(item)} aria-label={`Remover ${item.name}`}>
                        <IconTrash className="icon" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="cart-total-row is-main">
              <span>Total à vista</span>
              <strong>{formatCurrency(totalCash)}</strong>
            </div>
            <div className="cart-total-row">
              <span>Total a prazo</span>
              <strong>{formatCurrency(totalInstallment)}</strong>
            </div>
          </article>

          <article className="checkout-card reveal delay-1">
            <h2>Mensagem pronta para WhatsApp</h2>
            <p className="checkout-help">Seu pedido já vai com os itens e os totais à vista e a prazo.</p>
            <div className="message-box">{message}</div>

            {hasAttendants ? (
              <button type="button" className="btn btn-whatsapp" onClick={handleOpenPicker}>
                <IconWhatsApp className="icon" />
                Escolher atendente e finalizar
              </button>
            ) : (
              <a
                className="btn btn-whatsapp"
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                onClick={handleCheckoutClick}
              >
                <IconWhatsApp className="icon" />
                Finalizar no WhatsApp
              </a>
            )}
          </article>
        </div>
      </section>

      <WhatsAppAttendantPicker
        isOpen={isPickerOpen}
        attendants={attendants}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleSelectAttendant}
      />
    </>
  );
}
