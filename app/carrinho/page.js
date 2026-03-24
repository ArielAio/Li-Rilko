"use client";

import { useState } from "react";
import { IconTrash, IconWhatsApp } from "@/components/icons";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import TransitionLink from "@/components/transition-link";
import WhatsAppAttendantPicker from "@/components/whatsapp-attendant-picker";
import { resolveAttendantFlow } from "@/lib/attendants-data";
import { buildAttendantWhatsAppLink, buildWhatsAppMessage, formatCurrency } from "@/lib/store-utils";
import { openWhatsAppLink, resolveWhatsAppAttendantAction } from "@/lib/whatsapp-attendant-flow";

export default function CartPage() {
  const { attendants, siteSettings } = useCatalog();
  const { items, total, count, addItem, decreaseItem, removeItem, clearCart } = useCart();
  const { showToast } = useToast();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const attendantFlow = resolveAttendantFlow(attendants);

  const message = buildWhatsAppMessage(items, siteSettings);

  function handleDecrease(item) {
    if (item.qty <= 1) {
      removeItem(item.id);
      showToast({ type: "warning", title: "Item removido", message: `${item.name} saiu do carrinho.` });
      return;
    }
    decreaseItem(item.id, 1);
  }

  function handleIncrease(item) {
    const added = addItem(item.id, 1);
    if (!added) {
      showToast({ type: "warning", title: "Produto indisponível", message: `${item.name} esgotado.` });
    }
  }

  function handleRemove(item) {
    removeItem(item.id);
    showToast({ type: "warning", title: "Item removido", message: `${item.name} saiu.` });
  }

  function handleCheckoutClick(event) {
    event.preventDefault();
    if (items.length === 0) return;

    const checkoutMessage = buildWhatsAppMessage(items, siteSettings);
    const action = resolveWhatsAppAttendantAction(attendants, checkoutMessage);

    if (action.mode === "blocked") {
      showToast({ type: "warning", title: "Indisponível", message: "Nenhum atendente configurado." });
      return;
    }

    if (action.mode === "picker") {
      setPendingMessage(checkoutMessage);
      setIsPickerOpen(true);
      return;
    }

    openWhatsAppLink(action.link);
  }

  function handleClosePicker() {
    setIsPickerOpen(false);
    setPendingMessage("");
  }

  function handleSelectAttendant(attendant) {
    const link = buildAttendantWhatsAppLink(pendingMessage, attendant);
    if (!link) return;
    openWhatsAppLink(link);
    handleClosePicker();
  }

  return (
    <>
      <section className="vg-cart-page">
        <div className="shell-container">
          <header className="vg-cart-header">
            <h1 className="vg-cart-title">Revise seu Pedido</h1>
            {count > 0 && <button className="vg-filter-clear" onClick={clearCart}>Limpar tudo</button>}
          </header>

          <div className="vg-cart-grid">
            <div className="vg-cart-items-col">
              {items.length === 0 ? (
                <div className="vg-empty-state">
                  <p>Seu carrinho está vazio.</p>
                  <TransitionLink className="btn btn-primary" href="/catalogo">Explorar Catálogo</TransitionLink>
                </div>
              ) : (
                <ul className="vg-cart-list">
                  {items.map((item) => (
                    <li key={item.id} className="vg-cart-item">
                      <TransitionLink href={`/produto/${item.id}`} className="vg-cart-item-img">
                        <img src={item.image} alt={item.name} />
                      </TransitionLink>
                      
                      <div className="vg-cart-item-info">
                        <div className="vg-cart-item-top">
                          <TransitionLink href={`/produto/${item.id}`} className="vg-cart-item-title">
                            {item.name}
                          </TransitionLink>
                          <button className="vg-cart-item-remove" onClick={() => handleRemove(item)}>
                            <IconTrash className="icon" />
                          </button>
                        </div>
                        
                        <div className="vg-cart-item-bottom">
                          <div className="vg-cart-item-qty">
                            <span>Qtd:</span>
                            <div className="vg-qty-pill">
                              <button aria-label="Diminuir quantidade" onClick={() => handleDecrease(item)}>−</button>
                              <strong>{item.qty}</strong>
                              <button aria-label="Aumentar quantidade" onClick={() => handleIncrease(item)}>+</button>
                            </div>
                          </div>
                          
                          <strong className="vg-cart-item-price">{formatCurrency(item.subtotal)}</strong>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="vg-cart-summary-col">
              <h2 className="vg-summary-title">Prévia da Mensagem do Pedido</h2>
              <div className="vg-mock-console">
                <div className="vg-mock-header">
                  <span></span><span></span><span></span>
                </div>
                <pre className="vg-mock-text">{message || "Seu carrinho está vazio."}</pre>
              </div>
              <p className="vg-summary-hint">
                A mensagem acima será enviada diretamente para o seu Especialista via WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {count > 0 && (
        <div className="vg-cart-sticky-bottom">
          <div className="shell-container vg-cart-sticky-inner">
            <div className="vg-cart-subtotal">
              <span>Subtotal</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
            <button className="btn btn-primary vg-checkout-btn" onClick={handleCheckoutClick}>
              Finalizar Compra <IconWhatsApp className="icon" />
            </button>
          </div>
        </div>
      )}

      <WhatsAppAttendantPicker
        isOpen={isPickerOpen}
        attendants={attendants}
        onClose={handleClosePicker}
        onSelect={handleSelectAttendant}
      />
    </>
  );
}
