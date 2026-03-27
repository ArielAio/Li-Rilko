"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useToast } from "@/components/providers/toast-provider";
import { formatCurrency } from "@/lib/store-utils";

export default function AdminProductsManager() {
  const {
    products,
    openEditModal,
    removeProduct,
    removeProducts,
    toggleProductVisibility,
    toggleProductAvailability,
    importProductsCsv,
  } = useCatalog();
  const { showToast } = useToast();

  const [productSearch, setProductSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const fileInputRef = useRef(null);

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

  const filteredProductIds = useMemo(
    () => filteredProducts.map((product) => product.id),
    [filteredProducts],
  );
  const selectedCount = selectedProductIds.length;
  const selectedFilteredCount = filteredProductIds.filter((productId) => selectedProductIds.includes(productId)).length;
  const allFilteredSelected = filteredProducts.length > 0 && selectedFilteredCount === filteredProducts.length;

  useEffect(() => {
    const availableIds = new Set(products.map((product) => product.id));
    setSelectedProductIds((prev) => prev.filter((productId) => availableIds.has(productId)));
  }, [products]);

  async function handleToggleVisibility(product) {
    if (isProcessing || isImportingCsv) return;

    setIsProcessing(true);
    const result = await toggleProductVisibility(product.id, product.isVisible !== false);
    setIsProcessing(false);

    if (!result.ok) {
      showToast({ type: "warning", title: "Erro", message: result.error });
    }
  }

  async function handleToggleAvailability(product) {
    if (isProcessing || isImportingCsv) return;

    setIsProcessing(true);
    const result = await toggleProductAvailability(product.id, product.isAvailable !== false);
    setIsProcessing(false);

    if (!result.ok) {
      showToast({ type: "warning", title: "Erro", message: result.error });
    }
  }

  async function handleRemoveProduct(product) {
    if (isProcessing || isImportingCsv) return;

    if (!window.confirm(`Tem certeza que deseja apagar permanentemente o produto "${product.name}"?`)) {
      return;
    }

    setIsProcessing(true);
    const result = await removeProduct(product.id);
    setIsProcessing(false);

    if (!result.ok) {
      showToast({ type: "warning", title: "Falha na exclusao", message: result.error });
      return;
    }

    showToast({ type: "success", title: "Excluido", message: "Produto removido com sucesso." });
    setSelectedProductIds((prev) => prev.filter((productId) => productId !== product.id));
  }

  function handleOpenCsvPicker() {
    if (isProcessing || isImportingCsv) return;
    fileInputRef.current?.click();
  }

  async function handleCsvSelected(event) {
    const input = event.currentTarget;
    const file = input.files?.[0] || null;
    input.value = "";

    if (!file) {
      return;
    }

    if (!String(file.name || "").toLowerCase().endsWith(".csv")) {
      showToast({ type: "warning", title: "Arquivo invalido", message: "Selecione um arquivo CSV para importar." });
      return;
    }

    setIsImportingCsv(true);
    const result = await importProductsCsv(file);
    setIsImportingCsv(false);

    if (!result.ok) {
      showToast({ type: "warning", title: "Falha na importacao", message: result.error });
      return;
    }

    const summary = result.summary || {};
    const message = `${summary.importedCount || 0} itens processados, ${summary.createdCount || 0} novos, ${
      summary.updatedCount || 0
    } atualizados, ${summary.skippedMissingPrice || 0} ignorados por preco e ${
      summary.skippedMissingName || 0
    } ignorados por nome vazio.`;

    showToast({ type: "success", title: "CSV importado", message, duration: 5200 });
  }

  function handleToggleProductSelection(productId) {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((currentId) => currentId !== productId);
      }

      return [...prev, productId];
    });
  }

  function handleToggleSelectAllFiltered() {
    setSelectedProductIds((prev) => {
      if (allFilteredSelected) {
        return prev.filter((productId) => !filteredProductIds.includes(productId));
      }

      return Array.from(new Set([...prev, ...filteredProductIds]));
    });
  }

  async function handleRemoveSelectedProducts() {
    if (isProcessing || isImportingCsv || selectedCount === 0) return;

    const confirmMessage =
      selectedCount === 1
        ? "Tem certeza que deseja apagar o produto selecionado?"
        : `Tem certeza que deseja apagar ${selectedCount} produtos de uma vez?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsProcessing(true);
    const result = await removeProducts(selectedProductIds);
    setIsProcessing(false);

    if (!result.ok) {
      showToast({ type: "warning", title: "Falha na exclusao", message: result.error });
      return;
    }

    setSelectedProductIds([]);
    showToast({
      type: "success",
      title: "Produtos excluidos",
      message: `${result.removedCount || selectedCount} produtos foram removidos com sucesso.`,
    });
  }

  return (
    <div className="admin-manager">
      <div className="admin-manager-toolbar">
        <div>
          <h3>Catalogo em tempo real</h3>
          <p>Edite produtos manualmente ou importe um CSV para atualizar o catalogo em lote.</p>
        </div>
        <div className="admin-manager-toolbar-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvSelected}
            hidden
          />
          <button type="button" className="btn btn-surface" onClick={handleOpenCsvPicker} disabled={isProcessing || isImportingCsv}>
            {isImportingCsv ? "Importando CSV..." : "Importar CSV"}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => openEditModal("new")} disabled={isProcessing || isImportingCsv}>
            Novo Produto
          </button>
        </div>
      </div>

      <section className="admin-manager-panel">
        <div className="admin-manager-title-row">
          <div className="admin-manager-title-copy">
            <h4>Produtos cadastrados</h4>
            <small>
              {selectedCount > 0
                ? `${selectedCount} selecionado(s) para exclusao em lote.`
                : "Use a busca ou selecione itens para excluir em lote."}
            </small>
          </div>
          <label className="admin-products-search" aria-label="Buscar produtos">
            <span className="admin-products-search-icon" aria-hidden>
              Buscar
            </span>
            <input
              type="text"
              placeholder="Buscar produto, categoria ou subcategoria"
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
            />
          </label>
        </div>

        <div className="admin-products-bulk-bar">
          <div className="admin-products-bulk-meta">
            <label className="admin-products-select-all">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={handleToggleSelectAllFiltered}
                disabled={filteredProducts.length === 0 || isProcessing || isImportingCsv}
              />
              <span>Selecionar visiveis</span>
            </label>
            <span className="admin-products-bulk-summary">
              {selectedCount > 0 ? `${selectedCount} item(ns) marcados` : `${filteredProducts.length} item(ns) na lista`}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-primary admin-products-bulk-delete"
            onClick={handleRemoveSelectedProducts}
            disabled={selectedCount === 0 || isProcessing || isImportingCsv}
          >
            {selectedCount > 0 ? `Excluir selecionados (${selectedCount})` : "Excluir selecionados"}
          </button>
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
                <label className="admin-product-select">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(product.id)}
                    onChange={() => handleToggleProductSelection(product.id)}
                    disabled={isProcessing || isImportingCsv}
                    aria-label={`Selecionar ${product.name}`}
                  />
                </label>
                <div className="admin-product-copy">
                  <strong>{product.name}</strong>
                  <p>
                    {product.category} - {product.sub}
                  </p>
                  <small>
                    A vista {formatCurrency(product.priceCash ?? product.price)} - A prazo{" "}
                    {formatCurrency(product.priceInstallment ?? product.price)} - {product.isVisible !== false ? "Visivel" : "Oculto"} -{" "}
                    {product.isAvailable !== false ? "Disponivel" : "Esgotado"}
                  </small>
                </div>
                <div className="admin-product-actions">
                  <button type="button" className="btn btn-surface" onClick={() => openEditModal(product.id)}>
                    Editar / Detalhes
                  </button>
                  <button
                    type="button"
                    className="btn btn-surface"
                    onClick={() => handleToggleVisibility(product)}
                    disabled={isProcessing || isImportingCsv}
                  >
                    {product.isVisible !== false ? "Ocultar" : "Mostrar na vitrine"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-surface"
                    onClick={() => handleToggleAvailability(product)}
                    disabled={isProcessing || isImportingCsv}
                  >
                    {product.isAvailable !== false ? "Marcar esgotado" : "Disponibilizar estoque"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleRemoveProduct(product)}
                    disabled={isProcessing || isImportingCsv}
                  >
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
