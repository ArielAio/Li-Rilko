"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { formatCurrency } from "@/lib/store-utils";

const EMPTY_PRODUCT_FORM = {
  name: "",
  category: "",
  sub: "",
  price: "",
  oldPrice: "",
  badge: "",
  shortDescription: "",
  highlightsText: "",
  image: "",
  imagesText: "",
  isVisible: true,
  isAvailable: true,
};

function toTextList(value) {
  return String(value ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNumber(value) {
  const normalized = String(value ?? "").replace(",", ".").trim();
  if (!normalized) {
    return 0;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function productToForm(product) {
  return {
    name: product.name || "",
    category: product.category || "",
    sub: product.sub || "",
    price: String(product.price ?? ""),
    oldPrice: String(product.oldPrice ?? ""),
    badge: product.badge || "",
    shortDescription: product.shortDescription || "",
    highlightsText: Array.isArray(product.highlights) ? product.highlights.join("\n") : "",
    image: product.image || "",
    imagesText: Array.isArray(product.images) ? product.images.join("\n") : "",
    isVisible: product.isVisible !== false,
    isAvailable: product.isAvailable !== false,
  };
}

export default function AdminProductsManager() {
  const {
    categories,
    products,
    addProduct,
    updateProduct,
    removeProduct,
    toggleProductVisibility,
    toggleProductAvailability,
    resetCatalog,
  } = useCatalog();
  const { clearCart } = useCart();
  const { showToast } = useToast();

  const [productSearch, setProductSearch] = useState("");
  const [editingProductId, setEditingProductId] = useState("");
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const shouldRevealEditorRef = useRef(false);
  const editorPanelRef = useRef(null);
  const editorNameInputRef = useRef(null);

  useEffect(() => {
    if (editingProductId) {
      return;
    }
    if (!productForm.category && categories[0]?.name) {
      setProductForm((prev) => ({
        ...prev,
        category: categories[0].name,
        sub: categories[0].subs?.[0] || "",
      }));
    }
  }, [categories, editingProductId, productForm.category]);

  useEffect(() => {
    if (!isEditorOpen || !shouldRevealEditorRef.current) {
      return undefined;
    }

    shouldRevealEditorRef.current = false;

    const frame = window.requestAnimationFrame(() => {
      editorPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

      window.setTimeout(() => {
        const input = editorNameInputRef.current;
        if (!input || typeof input.focus !== "function") {
          return;
        }

        try {
          input.focus({ preventScroll: true });
        } catch {
          input.focus();
        }
      }, 140);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isEditorOpen, editingProductId]);

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

  function startCreateProduct() {
    shouldRevealEditorRef.current = true;
    setEditingProductId("");
    setProductForm({
      ...EMPTY_PRODUCT_FORM,
      category: categories[0]?.name || "",
      sub: categories[0]?.subs?.[0] || "",
    });
    setIsEditorOpen(true);
  }

  function startEditProduct(product) {
    shouldRevealEditorRef.current = true;
    setEditingProductId(product.id);
    setProductForm(productToForm(product));
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setEditingProductId("");
  }

  function handleProductField(field, value) {
    setProductForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function buildProductPayload() {
    return {
      name: productForm.name,
      category: productForm.category,
      sub: productForm.sub,
      price: toNumber(productForm.price),
      oldPrice: toNumber(productForm.oldPrice),
      badge: productForm.badge,
      shortDescription: productForm.shortDescription,
      highlights: toTextList(productForm.highlightsText),
      image: productForm.image,
      images: toTextList(productForm.imagesText),
      isVisible: productForm.isVisible,
      isAvailable: productForm.isAvailable,
    };
  }

  function handleSaveProduct(event) {
    event.preventDefault();
    const payload = buildProductPayload();

    if (editingProductId) {
      const result = updateProduct(editingProductId, payload);
      if (!result.ok) {
        showToast({
          type: "warning",
          title: "Erro ao salvar",
          message: result.error || "Não foi possível atualizar o produto.",
        });
        return;
      }

      showToast({
        type: "success",
        title: "Produto atualizado",
        message: "As informações do produto foram salvas.",
      });
      return;
    }

    const result = addProduct(payload);
    if (!result.ok) {
      showToast({
        type: "warning",
        title: "Erro ao criar produto",
        message: result.error || "Não foi possível criar o produto.",
      });
      return;
    }

    showToast({
      type: "success",
      title: "Produto criado",
      message: "Novo produto adicionado ao catálogo.",
    });
    setEditingProductId(result.id || "");
  }

  function handleRemoveProduct(product) {
    const confirmed = window.confirm(`Remover "${product.name}" do catálogo?`);
    if (!confirmed) {
      return;
    }

    const removed = removeProduct(product.id);
    if (!removed) {
      showToast({
        type: "warning",
        title: "Erro ao remover",
        message: "Não foi possível remover o produto.",
      });
      return;
    }

    if (editingProductId === product.id) {
      closeEditor();
    }

    showToast({
      type: "warning",
      title: "Produto removido",
      message: `${product.name} foi removido do catálogo.`,
    });
  }

  function handleResetCatalog() {
    const confirmed = window.confirm("Restaurar todo o catálogo para o padrão inicial?");
    if (!confirmed) {
      return;
    }

    resetCatalog();
    clearCart();
    closeEditor();
    showToast({
      type: "warning",
      title: "Catálogo restaurado",
      message: "Dados voltaram para o padrão inicial.",
    });
  }

  return (
    <div className="admin-manager">
      <div className="admin-manager-toolbar">
        <div>
          <h3>Produtos do catálogo</h3>
          <p>Crie, edite, oculte ou marque produtos como indisponíveis.</p>
        </div>
        <div className="admin-manager-toolbar-actions">
          <button type="button" className="btn btn-surface" onClick={startCreateProduct}>
            Novo produto
          </button>
          <button type="button" className="btn btn-surface" onClick={handleResetCatalog}>
            Restaurar padrão
          </button>
        </div>
      </div>

      <div className={`admin-manager-split ${isEditorOpen ? "" : "single-column"}`}>
        <section className="admin-manager-panel">
          <div className="admin-list-header">
            <h4>Lista de produtos</h4>
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
                      {formatCurrency(product.price)} • {product.isVisible ? "Visível" : "Oculto"} •{" "}
                      {product.isAvailable ? "Disponível" : "Indisponível"}
                    </small>
                  </div>
                  <div className="admin-product-actions">
                    <button type="button" className="btn btn-surface" onClick={() => startEditProduct(product)}>
                      Editar
                    </button>
                    <button type="button" className="btn btn-surface" onClick={() => toggleProductVisibility(product.id)}>
                      {product.isVisible ? "Ocultar" : "Mostrar"}
                    </button>
                    <button type="button" className="btn btn-surface" onClick={() => toggleProductAvailability(product.id)}>
                      {product.isAvailable ? "Indisponível" : "Disponível"}
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => handleRemoveProduct(product)}>
                      Excluir
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {isEditorOpen ? (
          <section className="admin-manager-panel" ref={editorPanelRef}>
            <div className="admin-manager-title-row">
              <h4>{editingProductId ? "Editar produto" : "Novo produto"}</h4>
              <div className="admin-manager-footer-actions">
                {editingProductId ? (
                  <button type="button" className="btn btn-surface" onClick={startCreateProduct}>
                    Novo produto
                  </button>
                ) : null}
                <button type="button" className="btn btn-surface" onClick={closeEditor}>
                  Fechar editor
                </button>
              </div>
            </div>

            <form className="admin-form admin-product-form" onSubmit={handleSaveProduct}>
              <div className="admin-field-grid">
                <label className="admin-field">
                  <span>Nome do produto</span>
                  <input
                    ref={editorNameInputRef}
                    type="text"
                    value={productForm.name}
                    onChange={(event) => handleProductField("name", event.target.value)}
                    required
                  />
                </label>

                <label className="admin-field">
                  <span>Categoria</span>
                  <input
                    type="text"
                    value={productForm.category}
                    onChange={(event) => handleProductField("category", event.target.value)}
                    required
                  />
                </label>

                <label className="admin-field">
                  <span>Subcategoria</span>
                  <input
                    type="text"
                    value={productForm.sub}
                    onChange={(event) => handleProductField("sub", event.target.value)}
                    required
                  />
                </label>

                <label className="admin-field">
                  <span>Preço atual</span>
                  <input
                    type="text"
                    value={productForm.price}
                    onChange={(event) => handleProductField("price", event.target.value)}
                    placeholder="0,00"
                    required
                  />
                </label>

                <label className="admin-field">
                  <span>Preço anterior</span>
                  <input
                    type="text"
                    value={productForm.oldPrice}
                    onChange={(event) => handleProductField("oldPrice", event.target.value)}
                    placeholder="0,00"
                  />
                </label>

                <label className="admin-field">
                  <span>Selo (badge)</span>
                  <input type="text" value={productForm.badge} onChange={(event) => handleProductField("badge", event.target.value)} />
                </label>
              </div>

              <label className="admin-field">
                <span>Descrição curta</span>
                <textarea
                  rows={2}
                  value={productForm.shortDescription}
                  onChange={(event) => handleProductField("shortDescription", event.target.value)}
                />
              </label>

              <label className="admin-field">
                <span>Imagem principal (URL)</span>
                <input type="url" value={productForm.image} onChange={(event) => handleProductField("image", event.target.value)} />
              </label>

              <label className="admin-field">
                <span>Galeria de imagens (uma URL por linha)</span>
                <textarea
                  rows={3}
                  value={productForm.imagesText}
                  onChange={(event) => handleProductField("imagesText", event.target.value)}
                  placeholder="https://.../img-1.jpg&#10;https://.../img-2.jpg"
                />
              </label>

              <label className="admin-field">
                <span>Destaques do produto (uma linha por item)</span>
                <textarea
                  rows={3}
                  value={productForm.highlightsText}
                  onChange={(event) => handleProductField("highlightsText", event.target.value)}
                />
              </label>

              <div className="admin-inline-options">
                <label>
                  <input
                    type="checkbox"
                    checked={productForm.isVisible}
                    onChange={(event) => handleProductField("isVisible", event.target.checked)}
                  />
                  Exibir na vitrine
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={productForm.isAvailable}
                    onChange={(event) => handleProductField("isAvailable", event.target.checked)}
                  />
                  Produto disponível
                </label>
              </div>

              <button type="submit" className="btn btn-primary">
                {editingProductId ? "Salvar alterações" : "Criar produto"}
              </button>
            </form>
          </section>
        ) : (
          <section className="admin-manager-panel">
            <div className="admin-manager-placeholder">
              <h4>Editor fechado</h4>
              <p>Selecione um produto na lista para editar ou clique em "Novo produto".</p>
              <button type="button" className="btn btn-surface" onClick={startCreateProduct}>
                Criar novo produto
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
