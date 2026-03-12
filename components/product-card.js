"use client";

import { IconArrowRight, IconCartPlus } from "@/components/icons";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import TransitionLink from "@/components/transition-link";
import { formatCurrency } from "@/lib/store-utils";

export default function ProductCard({ product, highlight = false }) {
  const { addItem, getItemQty } = useCart();
  const { showToast } = useToast();
  const isAvailable = product.isAvailable !== false;
  const qtyInCart = getItemQty(product.id);
  const priceCash = Number(product.priceCash ?? product.price ?? 0);
  const priceInstallment = Number(product.priceInstallment ?? product.price ?? 0);

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

  return (
    <article className={`product-card ${highlight ? "is-highlight" : ""}`}>
      <TransitionLink className="product-media-link" href={`/produto/${product.id}`} aria-label={`Ver ${product.name}`}>
        <div className="product-media">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            style={{ viewTransitionName: `product-media-${product.id}` }}
          />
          <span>{product.sub}</span>
        </div>
      </TransitionLink>
      <div className="product-body">
        <p className="product-badge">{isAvailable ? product.badge : "Esgotado"}</p>
        <TransitionLink className="product-title-link" href={`/produto/${product.id}`}>
          <h3 style={{ viewTransitionName: `product-title-${product.id}` }}>{product.name}</h3>
        </TransitionLink>
        <p className="product-short-description">{product.shortDescription}</p>
        <div className="product-price-lines">
          <p className="product-price">À vista: {formatCurrency(priceCash)}</p>
          <p className="product-price-alt">A prazo: {formatCurrency(priceInstallment)}</p>
        </div>
        {qtyInCart > 0 ? <p className="product-in-cart-hint">No carrinho: {qtyInCart}</p> : null}

        <div className="product-actions">
          <button type="button" className="product-button" onClick={handleAddToCart} disabled={!isAvailable}>
            <IconCartPlus className="icon" />
            {isAvailable ? (qtyInCart > 0 ? "Adicionar mais" : "Adicionar") : "Esgotado"}
          </button>
          <TransitionLink className="product-secondary-link" href={`/produto/${product.id}`}>
            Ver detalhes
            <IconArrowRight className="icon" />
          </TransitionLink>
        </div>
      </div>
    </article>
  );
}
