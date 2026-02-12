"use client";

import { IconTrash, IconWhatsApp } from "@/components/icons";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import TransitionLink from "@/components/transition-link";
import { buildWhatsAppLink, buildWhatsAppMessage, formatCurrency } from "@/lib/store-utils";

export default function CartPage() {
  const { siteSettings } = useCatalog();
  const { items, total, count, addItem, decreaseItem, removeItem, clearCart } = useCart();
  const { showToast } = useToast();

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
        title: "Produto indisponível",
        message: `${item.name} não está disponível para aumentar quantidade agora.`,
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

  function handleCheckoutClick(event) {
    if (items.length === 0) {
      event.preventDefault();
      showToast({
        type: "warning",
        title: "Carrinho vazio",
        message: "Adicione produtos antes de finalizar no WhatsApp.",
      });
      return;
    }

    showToast({
      type: "success",
      title: "Abrindo WhatsApp",
      message: "Resumo pronto com itens e total para finalizar com a loja.",
    });
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
                        {item.category} • {formatCurrency(item.price)} cada
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

                      <strong className="item-subtotal">{formatCurrency(item.subtotal)}</strong>

                      <button type="button" className="icon-button" onClick={() => handleRemove(item)} aria-label={`Remover ${item.name}`}>
                        <IconTrash className="icon" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="cart-total-row">
              <span>Total</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
          </article>

          <article className="checkout-card reveal delay-1">
            <h2>Mensagem pronta para WhatsApp</h2>
            <p className="checkout-help">Seu pedido já vai com os itens e o total para agilizar o atendimento.</p>
            <div className="message-box">{message}</div>

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
          </article>
        </div>
      </section>
    </>
  );
}
