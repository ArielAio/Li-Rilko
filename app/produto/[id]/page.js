"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ProductDetailActions from "@/components/product-detail-actions";
import { useCatalog } from "@/components/providers/catalog-provider";
import TransitionLink from "@/components/transition-link";
import { formatCurrency } from "@/lib/store-utils";

export default function ProductPage() {
  const params = useParams();
  const { publicProductMap } = useCatalog();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const product = publicProductMap.get(id);
  const gallery = useMemo(
    () => (product?.images && product.images.length > 0 ? product.images : [product?.image]).filter(Boolean),
    [product],
  );
  const [selectedImage, setSelectedImage] = useState("");

  useEffect(() => {
    if (!product) {
      return;
    }
    setSelectedImage(gallery[0] || "");
  }, [gallery, product]);

  if (!product) {
    return (
      <section className="section">
        <div className="shell-container not-found-card">
          <h1>Produto não encontrado</h1>
          <p>Esse item não está disponível no momento ou foi removido da vitrine.</p>
          <TransitionLink href="/catalogo" className="btn btn-primary">
            Voltar para o catálogo
          </TransitionLink>
        </div>
      </section>
    );
  }

  const priceCash = Number(product.priceCash ?? product.price ?? 0);
  const priceInstallment = Number(product.priceInstallment ?? product.price ?? 0);

  return (
    <>
      <section className="section page-hero-small">
        <div className="shell-container">
          <p className="kicker">Detalhe do produto</p>
          <h1>{product.name}</h1>
          <p>{product.shortDescription}</p>
          <div className="breadcrumb-row">
            <TransitionLink href="/">Início</TransitionLink>
            <span>/</span>
            <TransitionLink href="/catalogo">Catálogo</TransitionLink>
            <span>/</span>
            <strong>{product.name}</strong>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell-container detail-grid">
          <article className="detail-media-card reveal">
            <div className="detail-media-main">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  loading="eager"
                  style={{ viewTransitionName: `product-media-${product.id}` }}
                />
              ) : (
                <span>{product.sub}</span>
              )}
            </div>
            <div className="detail-media-thumbs">
              {gallery.slice(0, 3).map((imageUrl, index) => (
                <button
                  key={`${product.id}-${index}`}
                  type="button"
                  className={`thumb-card ${selectedImage === imageUrl ? "is-active" : ""}`}
                  onClick={() => setSelectedImage(imageUrl)}
                >
                  <img src={imageUrl} alt={`${product.name} - imagem ${index + 1}`} loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          </article>

          <article className="detail-content-card reveal delay-1">
            <p className="product-badge">{product.isAvailable === false ? "Esgotado" : product.badge}</p>
            <h2 style={{ viewTransitionName: `product-title-${product.id}` }}>{product.name}</h2>
            <p className="detail-category">
              {product.category} • {product.sub}
            </p>
            <p className="detail-description">{product.shortDescription}</p>

            <div className="price-block">
              <strong className="price-block-cash">Preço à vista: {formatCurrency(priceCash)}</strong>
              <small className="price-block-installment">Preço a prazo: {formatCurrency(priceInstallment)}</small>
            </div>

            <ul className="detail-highlights">
              {product.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <ProductDetailActions product={product} />
          </article>
        </div>
      </section>
    </>
  );
}
