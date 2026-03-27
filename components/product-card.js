"use client";

import { IconCartPlus, IconWhatsApp } from "@/components/icons";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import TransitionLink from "@/components/transition-link";
import { formatCurrency } from "@/lib/store-utils";
import { useCatalog } from "@/components/providers/catalog-provider";
import { resolveWhatsAppAttendantAction, openWhatsAppLink } from "@/lib/whatsapp-attendant-flow";

export default function ProductCard({ product, highlight = false }) {
  const { addItem, getItemQty } = useCart();
  const { showToast } = useToast();
  const { isAdmin, openEditModal, attendants, openWhatsAppPicker } = useCatalog();
  const isAvailable = product.isAvailable !== false;
  const qtyInCart = getItemQty(product.id);
  const priceCash = Number(product.priceCash ?? product.price ?? 0);
  const imageSrc =
    typeof product.image === "string" && product.image.trim()
      ? product.image.trim()
      : "/li-rilko-icon-page.png";

  function handleAddToCart() {
    const added = addItem(product.id, 1);
    if (!added) {
      showToast({
        type: "warning",
        title: "Produto esgotado",
        message: `${product.name} está esgotado no momento.`,
      });
    }
  }

  function handleWhatsAppClick(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const message = `Olá, tenho interesse no produto ${product.name} (${formatCurrency(priceCash)}).`;
    const action = resolveWhatsAppAttendantAction(attendants, message);

    if (action.mode === "blocked") {
      showToast({ type: "warning", title: "Indisponível", message: "Nenhum atendente online." });
      return;
    }

    if (action.mode === "picker") {
      openWhatsAppPicker(message);
      return;
    }

    openWhatsAppLink(action.link);
    showToast({
      type: "success",
      title: "Redirecionando",
      message: `Carregando chat seguro com ${action.attendant.name}...`,
    });
  }

  return (
    <article className="vg-product-card">
      <div className="vg-product-badge-wrap">
        {highlight && <span className="vg-badge alert">MAIS VENDIDO</span>}
        {!isAvailable && <span className="vg-badge neutral">ESGOTADO</span>}
      </div>

      {isAdmin && (
        <button 
          type="button" 
          className="vg-inline-edit-btn" 
          aria-label="Editar Produto"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openEditModal(product.id);
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </button>
      )}

      <TransitionLink className="vg-product-media" href={`/produto/${product.id}`} aria-label={`Ver ${product.name}`}>
        <img
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          decoding="async"
          style={{ viewTransitionName: `product-media-${product.id}` }}
        />
      </TransitionLink>

      <div className="vg-product-body">
        <div className="vg-product-header">
          <TransitionLink href={`/produto/${product.id}`}>
            <h3 style={{ viewTransitionName: `product-title-${product.id}` }}>{product.name}</h3>
          </TransitionLink>
          <span className="vg-product-price">{formatCurrency(priceCash)}</span>
        </div>

        <p className="vg-product-desc">{product.shortDescription}</p>

        {qtyInCart > 0 && <p className="vg-product-in-cart">{qtyInCart} no carrinho</p>}

        <div className="vg-product-actions">
          <button type="button" className="btn btn-primary btn-full" onClick={handleAddToCart} disabled={!isAvailable}>
            <IconCartPlus className="icon" />
            {isAvailable ? "Adicionar" : "Esgotado"}
          </button>
          <button type="button" onClick={handleWhatsAppClick} className="btn btn-whatsapp btn-square" aria-label="Comprar pelo WhatsApp">
            <IconWhatsApp className="icon" />
          </button>
        </div>
      </div>
    </article>
  );
}
