"use client";

import Link from "next/link";
import { IconArrowRight, IconCartPlus } from "@/components/icons";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { formatCurrency } from "@/lib/store-utils";

export default function ProductCard({ product, highlight = false }) {
  const { addItem } = useCart();
  const { showToast } = useToast();

  function handleAddToCart() {
    addItem(product.id, 1);
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
        <p className="product-badge">{product.badge}</p>
        <h3>{product.name}</h3>
        <p className="product-short-description">{product.shortDescription}</p>
        <p className="old-price">{formatCurrency(product.oldPrice)}</p>
        <p className="product-price">{formatCurrency(product.price)}</p>

        <div className="product-actions">
          <Link className="link-detail" href={`/produto/${product.id}`}>
            Ver detalhes
            <IconArrowRight className="icon" />
          </Link>
          <button type="button" className="product-button" onClick={handleAddToCart}>
            <IconCartPlus className="icon" />
            Adicionar
          </button>
        </div>
      </div>
    </article>
  );
}
