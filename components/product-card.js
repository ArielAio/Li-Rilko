"use client";

import { IconArrowRight, IconCartPlus } from "@/components/icons";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import TransitionLink from "@/components/transition-link";
import { formatCurrency } from "@/lib/store-utils";

export default function ProductCard({ product, highlight = false }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const isAvailable = product.isAvailable !== false;
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
      return;
    }

    showToast({
      type: "success",
      title: "Produto adicionado",
      message: `${product.name} foi para o carrinho.`,
    });
  }

  return (
    <article className={`product-card ${highlight ? "is-highlight" : ""}`}>
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
      <div className="product-body">
        <p className="product-badge">{isAvailable ? product.badge : "Esgotado"}</p>
        <h3 style={{ viewTransitionName: `product-title-${product.id}` }}>{product.name}</h3>
        <p className="product-short-description">{product.shortDescription}</p>
        <div className="product-price-lines">
          <p className="product-price">À vista: {formatCurrency(priceCash)}</p>
          <p className="product-price-alt">A prazo: {formatCurrency(priceInstallment)}</p>
        </div>

        <div className="product-actions">
          <TransitionLink className="link-detail" href={`/produto/${product.id}`}>
            Ver detalhes
            <IconArrowRight className="icon" />
          </TransitionLink>
          <button type="button" className="product-button" onClick={handleAddToCart} disabled={!isAvailable}>
            <IconCartPlus className="icon" />
            {isAvailable ? "Adicionar" : "Esgotado"}
          </button>
        </div>
      </div>
    </article>
  );
}
