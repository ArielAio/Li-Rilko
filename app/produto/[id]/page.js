"use client";

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

  const gallery = (product.images && product.images.length > 0 ? product.images : [product.image]).filter(Boolean);

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
              {gallery[0] ? (
                <img
                  src={gallery[0]}
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
                <div key={`${product.id}-${index}`} className="thumb-card">
                  <img src={imageUrl} alt={`${product.name} - imagem ${index + 1}`} loading="lazy" decoding="async" />
                </div>
              ))}
            </div>
          </article>

          <article className="detail-content-card reveal delay-1">
            <p className="product-badge">{product.isAvailable === false ? "Indisponível no momento" : product.badge}</p>
            <h2 style={{ viewTransitionName: `product-title-${product.id}` }}>{product.name}</h2>
            <p className="detail-category">
              {product.category} • {product.sub}
            </p>
            <p className="detail-description">{product.shortDescription}</p>

            <div className="price-block">
              {Number(product.oldPrice) > Number(product.price) ? (
                <small>Preço anterior: {formatCurrency(product.oldPrice)}</small>
              ) : (
                <small>Preço atualizado</small>
              )}
              <strong>{formatCurrency(product.price)}</strong>
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
