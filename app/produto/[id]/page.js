"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ProductDetailActions from "@/components/product-detail-actions";
import { useCatalog } from "@/components/providers/catalog-provider";
import TransitionLink from "@/components/transition-link";
import { formatCurrency } from "@/lib/store-utils";

export default function ProductPage() {
  const params = useParams();
  const { publicProductMap, isAdmin, openEditModal } = useCatalog();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const product = publicProductMap.get(id);
  const gallery = useMemo(
    () => (product?.images && product.images.length > 0 ? product.images : [product?.image]).filter(Boolean),
    [product],
  );
  const [selectedImage, setSelectedImage] = useState("");
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    if (!product) return;
    setSelectedImage(gallery[0] || "");
  }, [gallery, product]);

  if (!product) {
    return (
      <section className="vg-product-page-empty">
        <div className="shell-container text-center">
          <h1>Produto nao encontrado</h1>
          <p>Esse item nao esta disponivel na vitrine atual.</p>
          <TransitionLink href="/catalogo" className="btn btn-primary">
            Voltar ao catalogo
          </TransitionLink>
        </div>
      </section>
    );
  }

  const priceCash = Number(product.priceCash ?? product.price ?? 0);
  const priceInstallment = Number(product.priceInstallment ?? product.price ?? 0);

  return (
    <section className="vg-product-inner-page">
      <div className="shell-container vg-product-grid">
        <div className="vg-product-gallery-col reveal">
          <div className="vg-product-main-img" style={{ position: "relative" }}>
            <span className="vg-gallery-badge">{product.isAvailable === false ? "Produto indisponivel" : product.badge}</span>
            {isAdmin && (
              <button
                type="button"
                className="vg-inline-edit-btn"
                aria-label="Editar Produto"
                onClick={() => openEditModal(product.id)}
                style={{ top: "1rem", right: "1rem" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
            )}
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                loading="eager"
                style={{ viewTransitionName: `product-media-${product.id}` }}
              />
            ) : (
              <div className="placeholder-img">{product.sub}</div>
            )}
          </div>
          <div className="vg-gallery-thumbs">
            {gallery.map((imageUrl, idx) => (
              <button
                key={`${product.id}-${idx}`}
                className={`vg-thumb ${selectedImage === imageUrl ? "active" : ""}`}
                onClick={() => setSelectedImage(imageUrl)}
              >
                <img src={imageUrl} alt={`Miniatura ${idx + 1}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="vg-product-info-col reveal delay-1">
          <div className="vg-product-breadcrumbs">
            <TransitionLink href="/">Home</TransitionLink>
            <span>/</span>
            <TransitionLink href={`/catalogo?categoria=${encodeURIComponent(product.category)}`}>{product.category}</TransitionLink>
            <span>/</span>
            <strong>{product.name}</strong>
          </div>

          <div className="product-meta-strip">
            <span className={`product-availability ${product.isAvailable === false ? "is-unavailable" : ""}`}>
              {product.isAvailable === false ? "Esgotado no momento" : "Disponivel para atendimento"}
            </span>
            <span>{product.category}</span>
            <span>{product.sub}</span>
          </div>

          <h1 className="vg-product-h1" style={{ viewTransitionName: `product-title-${product.id}` }}>
            {product.name}
          </h1>

          <div className="vg-product-prices">
            <span className="vg-price-main">
              {formatCurrency(priceCash)} <small>a vista</small>
            </span>
            {priceInstallment > 0 && priceInstallment !== priceCash && (
              <span className="vg-price-alt">ou {formatCurrency(priceInstallment)} a prazo</span>
            )}
          </div>

          <p className="product-summary-text">
            {product.shortDescription} Atendimento por WhatsApp para confirmar disponibilidade, prazo e fechamento do pedido.
          </p>

          <div className="vg-product-tabs">
            <button className={activeTab === "description" ? "active" : ""} onClick={() => setActiveTab("description")}>
              Descricao
            </button>
            <button className={activeTab === "shipping" ? "active" : ""} onClick={() => setActiveTab("shipping")}>
              Compra e entrega
            </button>
            <button className={activeTab === "specs" ? "active" : ""} onClick={() => setActiveTab("specs")}>
              Diferenciais
            </button>
          </div>

          <div className="vg-product-tab-content">
            {activeTab === "description" && (
              <>
                <p>{product.shortDescription}</p>
                <p className="text-muted">
                  Produto exibido em uma vitrine mais objetiva, pensada para consulta rapida e decisao comercial sem atrito.
                </p>
              </>
            )}
            {activeTab === "shipping" && (
              <>
                <p className="text-muted">
                  Finalize pelo WhatsApp com atendimento humano. A equipe confirma disponibilidade, combina retirada ou envio e orienta o fechamento.
                </p>
                <ul className="vg-product-features">
                  <li>Confirmacao de disponibilidade antes do fechamento</li>
                  <li>Suporte para duvidas e combinacoes pelo WhatsApp</li>
                  <li>Atendimento rapido para reserva e finalizacao</li>
                </ul>
              </>
            )}
            {activeTab === "specs" && (
              <>
                <p className="text-muted">Os principais pontos de valor deste item na vitrine atual:</p>
                <ul className="vg-product-features">
                  {product.highlights?.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </>
            )}
          </div>

          <ProductDetailActions product={product} />
        </div>
      </div>
    </section>
  );
}
