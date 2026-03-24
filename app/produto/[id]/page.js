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
          <h1>Product Not Found</h1>
          <p>This item is currently unavailable.</p>
          <TransitionLink href="/catalogo" className="btn btn-primary">Return to Collection</TransitionLink>
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
            <span className="vg-gallery-badge">Produto Exclusivo</span>
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
                <img src={imageUrl} alt={`Thumbnail ${idx + 1}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="vg-product-info-col reveal delay-1">
          <div className="vg-product-breadcrumbs">
            <TransitionLink href="/">Home</TransitionLink>
            <span>/</span>
            <TransitionLink href="/catalogo">{product.category}</TransitionLink>
            <span>/</span>
            <strong>{product.name}</strong>
          </div>

          <p className="vg-badge neutral mb-1">{product.isAvailable === false ? "ESGOTADO" : product.badge}</p>
          <h1 className="vg-product-h1" style={{ viewTransitionName: `product-title-${product.id}` }}>
            {product.name}
          </h1>

          <div className="vg-product-prices">
            <span className="vg-price-main">{formatCurrency(priceCash)} <small>à vista</small></span>
            {priceInstallment > 0 && priceInstallment !== priceCash && (
              <span className="vg-price-alt">ou {formatCurrency(priceInstallment)} a prazo</span>
            )}
          </div>

          <div className="vg-product-tabs">
            <button 
              className={activeTab === "description" ? "active" : ""} 
              onClick={() => setActiveTab("description")}
            >Descrição</button>
            <button 
              className={activeTab === "specs" ? "active" : ""} 
              onClick={() => setActiveTab("specs")}
            >Especificações</button>
            <button 
              className={activeTab === "shipping" ? "active" : ""} 
              onClick={() => setActiveTab("shipping")}
            >Envio</button>
          </div>

          <div className="vg-product-tab-content">
            {activeTab === "description" && (
              <>
                <p>{product.shortDescription}</p>
                <ul className="vg-product-features">
                  {product.highlights?.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </>
            )}
            {activeTab === "specs" && (
              <p className="text-muted">Materiais de alta qualidade adaptados para {product.sub}. Curadoria por Li Rilko no Brasil.</p>
            )}
            {activeTab === "shipping" && (
              <p className="text-muted">Enviamos para todo o Brasil via Sedex. Frete grátis em pedidos acima de R$ 999. Fale com seu Especialista para opções de entrega expressa na nossa região.</p>
            )}
          </div>

          <ProductDetailActions product={product} />
        </div>
      </div>
    </section>
  );
}
