"use client";

import { useMemo, useState } from "react";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useToast } from "@/components/providers/toast-provider";
import { formatCurrency } from "@/lib/store-utils";

export default function AdminProductsManager() {
  const {
    products,
    openEditModal,
    removeProduct,
    toggleProductVisibility,
    toggleProductAvailability,
  } = useCatalog();
  const { showToast } = useToast();

  const [productSearch, setProductSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.sub.toLowerCase().includes(query)
      );
    });
  }, [productSearch, products]);

  async function handleToggleVisibility(product) {
    if (isProcessing) return;
    setIsProcessing(true);
    const result = await toggleProductVisibility(product.id, product.isVisible !== false);
    setIsProcessing(false);

    if (!result.ok) {
      showToast({ type: "warning", title: "Erro", message: result.error });
    }
  }

  async function handleToggleAvailability(product) {
    if (isProcessing) return;
    setIsProcessing(true);
    const result = await toggleProductAvailability(product.id, product.isAvailable !== false);
    setIsProcessing(false);

    if (!result.ok) {
      showToast({ type: "warning", title: "Erro", message: result.error });
    }
  }

  async function handleRemoveProduct(product) {
    if (isProcessing) return;
    if (!window.confirm(`Tem certeza que deseja apagar permanentemente o produto "${product.name}"?`)) {
      return;
    }

    setIsProcessing(true);
    const result = await removeProduct(product.id);
    setIsProcessing(false);

    if (!result.ok) {
      showToast({ type: "warning", title: "Falha na exclusão", message: result.error });
      return;
    }

    showToast({ type: "success", title: "Excluído", message: "Produto removido com sucesso." });
  }

  return (
    <div className="admin-manager">
      <div className="admin-manager-toolbar">
        <div>
          <h3>Catálogo em tempo real</h3>
          <p>Selecione um produto para editar ou clique em Novo Produto para cadastrar.</p>
        </div>
        <div className="admin-manager-toolbar-actions">
          <button type="button" className="btn btn-primary" onClick={() => openEditModal("new")}>
            Novo Produto
          </button>
        </div>
      </div>

      <section className="admin-manager-panel">
        <div className="admin-manager-title-row">
          <h4>Produtos cadastrados</h4>
          <input
            type="text"
            placeholder="Buscar por nome, categoria ou subcategoria"
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
          />
        </div>

        <div className="admin-product-list">
          {filteredProducts.length === 0 ? (
            <article className="admin-product-item">
              <div>
                <strong>Nenhum produto encontrado</strong>
                <p>Ajuste a busca ou cadastre um novo item.</p>
              </div>
            </article>
          ) : (
            filteredProducts.map((product) => (
              <article key={product.id} className="admin-product-item">
                <div>
                  <strong>{product.name}</strong>
                  <p>
                    {product.category} • {product.sub}
                  </p>
                  <small>
                    À vista {formatCurrency(product.priceCash ?? product.price)} • A prazo{" "}
                    {formatCurrency(product.priceInstallment ?? product.price)} • {product.isVisible !== false ? "Visível" : "Oculto"} •{" "}
                    {product.isAvailable !== false ? "Disponível" : "Esgotado"}
                  </small>
                </div>
                <div className="admin-product-actions">
                  <button type="button" className="btn btn-surface" onClick={() => openEditModal(product.id)}>
                    Editar / Detalhes
                  </button>
                  <button type="button" className="btn btn-surface" onClick={() => handleToggleVisibility(product)} disabled={isProcessing}>
                    {product.isVisible !== false ? "Ocultar" : "Mostrar na Vitrine"}
                  </button>
                  <button type="button" className="btn btn-surface" onClick={() => handleToggleAvailability(product)} disabled={isProcessing}>
                    {product.isAvailable !== false ? "Marcar Esgotado" : "Disponibilizar Estoque"}
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => handleRemoveProduct(product)} disabled={isProcessing}>
                    Excluir
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
