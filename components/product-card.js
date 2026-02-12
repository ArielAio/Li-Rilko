"use client";

import Link from "next/link";
import { IconArrowRight, IconCartPlus } from "@/components/icons";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { formatCurrency } from "@/lib/store-utils";

export default function ProductCard({ product, highlight = false }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const isAvailable = product.isAvailable !== false;
  const shouldShowOldPrice = Number(product.oldPrice) > Number(product.price);

  function handleAddToCart() {
    const added = addItem(product.id, 1);
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
      title: "Produto adicionado",
      message: `${product.name} foi para o carrinho.`,
    });
  }

  return (
    <article className={`product-card ${highlight ? "is-highlight" : ""}`}>
      <div className="product-media">
        <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
        <span>{product.sub}</span>
      </div>
      <div className="product-body">
        <p className="product-badge">{isAvailable ? product.badge : "Indisponível no momento"}</p>
        <h3>{product.name}</h3>
        <p className="product-short-description">{product.shortDescription}</p>
        {shouldShowOldPrice ? <p className="old-price">{formatCurrency(product.oldPrice)}</p> : null}
        <p className="product-price">{formatCurrency(product.price)}</p>

        <div className="product-actions">
          <Link className="link-detail" href={`/produto/${product.id}`}>
            Ver detalhes
            <IconArrowRight className="icon" />
          </Link>
          <button type="button" className="product-button" onClick={handleAddToCart} disabled={!isAvailable}>
            <IconCartPlus className="icon" />
            {isAvailable ? "Adicionar" : "Indisponível"}
          </button>
        </div>
      </div>
    </article>
  );
}
