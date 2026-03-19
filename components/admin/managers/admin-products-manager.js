"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useToast } from "@/components/providers/toast-provider";
import { formatCurrencyInput, formatCurrencyInputForEdit, parseCurrencyInputToNumber } from "@/lib/admin-input-formatters";
import { formatCurrency } from "@/lib/store-utils";

const EMPTY_PRODUCT_FORM = {
  id: "",
  name: "",
  categoryId: "",
  subcategoryId: "",
  priceCash: "",
  priceInstallment: "",
  badge: "",
  shortDescription: "",
  highlightsText: "",
  isVisible: true,
  isAvailable: true,
};

function toTextList(value) {
  return String(value ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createDraftProductId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `draft-${Date.now()}`;
}

function createEmptyProductForm(adminCategories) {
  const firstCategory = adminCategories[0] || null;
  const firstSub = firstCategory?.subs?.[0] || null;

  return {
    ...EMPTY_PRODUCT_FORM,
    id: createDraftProductId(),
    categoryId: firstCategory?.id || "",
    subcategoryId: firstSub?.id || "",
  };
}

function productToForm(product) {
  return {
    id: product.id || "",
    name: product.name || "",
    categoryId: product.categoryId || "",
    subcategoryId: product.subcategoryId || "",
    priceCash: formatCurrencyInput(product.priceCash ?? product.price ?? 0),
    priceInstallment: formatCurrencyInput(product.priceInstallment ?? product.price ?? 0),
    badge: product.badge || "",
    shortDescription: product.shortDescription || "",
    highlightsText: Array.isArray(product.highlights) ? product.highlights.join("\n") : "",
    isVisible: product.isVisible !== false,
    isAvailable: product.isAvailable !== false,
  };
}

function normalizeImageItem(item, index) {
  return {
    id: item?.id || `image-${index + 1}`,
    storagePath: item?.storagePath || "",
    publicUrl: item?.publicUrl || item?.storagePath || "",
    sortOrder: Number(item?.sortOrder ?? index),
  };
}

export default function AdminProductsManager() {
  const {
    adminCategories,
    products,
    addProduct,
    updateProduct,
    removeProduct,
    toggleProductVisibility,
    toggleProductAvailability,
    uploadProductImage,
    deleteProductImage,
  } = useCatalog();
  const { showToast } = useToast();

  const [productSearch, setProductSearch] = useState("");
  const [editingProductId, setEditingProductId] = useState("");
  const [productForm, setProductForm] = useState(() => createEmptyProductForm(adminCategories));
  const [productImages, setProductImages] = useState([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const shouldRevealEditorRef = useRef(false);
  const editorPanelRef = useRef(null);
  const editorNameInputRef = useRef(null);

  useEffect(() => {
    if (productForm.categoryId) {
      return;
    }

    setProductForm(createEmptyProductForm(adminCategories));
  }, [adminCategories, productForm.categoryId]);

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

  const selectedCategory = useMemo(
    () => adminCategories.find((category) => category.id === productForm.categoryId) || null,
    [adminCategories, productForm.categoryId],
  );

  const availableSubcategories = useMemo(() => selectedCategory?.subs || [], [selectedCategory]);

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
    setProductForm(createEmptyProductForm(adminCategories));
    setProductImages([]);
    setIsEditorOpen(true);
  }

  function startEditProduct(product) {
    shouldRevealEditorRef.current = true;
    setEditingProductId(product.id);
    setProductForm(productToForm(product));
    setProductImages(Array.isArray(product.imageItems) ? product.imageItems.map(normalizeImageItem) : []);
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

  function handleCategoryChange(categoryId) {
    const category = adminCategories.find((item) => item.id === categoryId) || null;
    setProductForm((prev) => ({
      ...prev,
      categoryId,
      subcategoryId: category?.subs?.[0]?.id || "",
    }));
  }

  function handlePriceFieldChange(field, value) {
    setProductForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handlePriceFieldFocus(field) {
    setProductForm((prev) => ({
      ...prev,
      [field]: formatCurrencyInputForEdit(prev[field]),
    }));
  }

  function handlePriceFieldBlur(field) {
    setProductForm((prev) => {
      const rawValue = String(prev[field] ?? "").trim();

      if (!rawValue) {
        return {
          ...prev,
          [field]: "",
        };
      }

      return {
        ...prev,
        [field]: formatCurrencyInput(prev[field]),
      };
    });
  }

  function buildProductPayload() {
    return {
      id: productForm.id,
      name: productForm.name,
      categoryId: productForm.categoryId,
      subcategoryId: productForm.subcategoryId,
      priceCash: parseCurrencyInputToNumber(productForm.priceCash),
      priceInstallment: parseCurrencyInputToNumber(productForm.priceInstallment),
      badge: productForm.badge,
      shortDescription: productForm.shortDescription,
      highlights: toTextList(productForm.highlightsText),
      isVisible: productForm.isVisible,
      isAvailable: productForm.isAvailable,
      imageItems: productImages.map((item) => ({
        id: item.id,
        storagePath: item.storagePath,
      })),
    };
  }

  function validatePayload(payload) {
    if (!payload.name || !payload.categoryId || !payload.subcategoryId) {
      return "Nome, categoria e subcategoria são obrigatórios.";
    }

    if (payload.priceCash <= 0 || payload.priceInstallment <= 0) {
      return "Preços à vista e a prazo devem ser maiores que zero.";
    }

    if (!Array.isArray(payload.imageItems) || payload.imageItems.length === 0) {
      return "Cadastre ao menos uma imagem do produto.";
    }

    return "";
  }

  async function handleUploadFiles(fileList, { prepend = false, replace = false } = {}) {
    const files = Array.from(fileList || []).filter(Boolean);
    if (files.length === 0) {
      return;
    }

    setIsUploadingImages(true);

    const uploadedItems = [];
    for (const file of files) {
      const result = await uploadProductImage(productForm.id, file);
      if (!result.ok) {
        showToast({
          type: "warning",
          title: "Falha no upload",
          message: result.error || "Não foi possível enviar uma das imagens.",
        });
        setIsUploadingImages(false);
        return;
      }

      if (result.image) {
        uploadedItems.push(normalizeImageItem(result.image, uploadedItems.length));
      }
    }

    setProductImages((prev) => {
      if (replace) {
        return uploadedItems;
      }

      const next = prepend ? [...uploadedItems, ...prev] : [...prev, ...uploadedItems];
      return next.slice(0, 6).map(normalizeImageItem);
    });

    setIsUploadingImages(false);

    showToast({
      type: "success",
      title: "Imagens enviadas",
      message: "As imagens do produto foram preparadas para salvar.",
    });
  }

  async function handleRemoveImage(image, index) {
    const result = await deleteProductImage(productForm.id, image.id);
    if (!result.ok) {
      showToast({
        type: "warning",
        title: "Erro ao excluir imagem",
        message: result.error || "Não foi possível excluir a imagem.",
      });
      return;
    }

    setProductImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index).map(normalizeImageItem));
  }

  function moveImageToPrimary(index) {
    setProductImages((prev) => {
      if (index <= 0 || index >= prev.length) {
        return prev;
      }

      const next = [...prev];
      const [selected] = next.splice(index, 1);
      next.unshift(selected);
      return next.map(normalizeImageItem);
    });
  }

  async function handleSaveProduct(event) {
    event.preventDefault();
    const payload = buildProductPayload();
    const validationError = validatePayload(payload);

    if (validationError) {
      showToast({
        type: "warning",
        title: "Dados inválidos",
        message: validationError,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingProductId) {
        const result = await updateProduct(editingProductId, payload);
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

      const result = await addProduct(payload);
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
      setProductForm((prev) => ({ ...prev, id: result.id || prev.id }));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveProduct(product) {
    const confirmed = window.confirm(`Remover "${product.name}" do catálogo?`);
    if (!confirmed) {
      return;
    }

    const result = await removeProduct(product.id);
    if (!result.ok) {
      showToast({
        type: "warning",
        title: "Erro ao remover",
        message: result.error || "Não foi possível remover o produto.",
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

  async function handleToggleVisibility(product) {
    const result = await toggleProductVisibility(product.id);
    if (!result.ok) {
      showToast({
        type: "warning",
        title: "Erro ao atualizar",
        message: result.error || "Não foi possível atualizar a visibilidade.",
      });
      return;
    }

    showToast({
      type: "success",
      title: product.isVisible ? "Produto ocultado" : "Produto exibido",
      message: `${product.name} foi atualizado na vitrine.`,
    });
  }

  async function handleToggleAvailability(product) {
    const result = await toggleProductAvailability(product.id);
    if (!result.ok) {
      showToast({
        type: "warning",
        title: "Erro ao atualizar",
        message: result.error || "Não foi possível atualizar a disponibilidade.",
      });
      return;
    }

    showToast({
      type: "success",
      title: product.isAvailable ? "Produto marcado como esgotado" : "Produto marcado como disponível",
      message: `${product.name} foi atualizado.`,
    });
  }

  return (
    <div className="admin-manager">
      <div className="admin-manager-toolbar">
        <div>
          <h3>Produtos do catálogo</h3>
          <p>Crie, edite, oculte e marque produtos como esgotados.</p>
        </div>
        <div className="admin-manager-toolbar-actions">
          <button type="button" className="btn btn-surface" onClick={startCreateProduct}>
            Novo produto
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
                      À vista {formatCurrency(product.priceCash ?? product.price)} • A prazo{" "}
                      {formatCurrency(product.priceInstallment ?? product.price)} • {product.isVisible ? "Visível" : "Oculto"} •{" "}
                      {product.isAvailable ? "Disponível" : "Esgotado"}
                    </small>
                  </div>
                  <div className="admin-product-actions">
                    <button type="button" className="btn btn-surface" onClick={() => startEditProduct(product)}>
                      Editar
                    </button>
                    <button type="button" className="btn btn-surface" onClick={() => handleToggleVisibility(product)}>
                      {product.isVisible ? "Ocultar" : "Mostrar"}
                    </button>
                    <button type="button" className="btn btn-surface" onClick={() => handleToggleAvailability(product)}>
                      {product.isAvailable ? "Marcar esgotado" : "Marcar disponível"}
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
                  <select value={productForm.categoryId} onChange={(event) => handleCategoryChange(event.target.value)} required>
                    {adminCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-field">
                  <span>Subcategoria</span>
                  <select
                    value={productForm.subcategoryId}
                    onChange={(event) => handleProductField("subcategoryId", event.target.value)}
                    required
                  >
                    {availableSubcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-field">
                  <span>Preço à vista</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={productForm.priceCash}
                    onChange={(event) => handlePriceFieldChange("priceCash", event.target.value)}
                    onFocus={() => handlePriceFieldFocus("priceCash")}
                    onBlur={() => handlePriceFieldBlur("priceCash")}
                    placeholder="R$ 0,00"
                    required
                  />
                </label>

                <label className="admin-field">
                  <span>Preço a prazo</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={productForm.priceInstallment}
                    onChange={(event) => handlePriceFieldChange("priceInstallment", event.target.value)}
                    onFocus={() => handlePriceFieldFocus("priceInstallment")}
                    onBlur={() => handlePriceFieldBlur("priceInstallment")}
                    placeholder="R$ 0,00"
                    required
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

              <div className="admin-field">
                <span>Imagem principal e galeria</span>
                <div className="admin-manager-footer-actions">
                  <label className="btn btn-surface">
                    Imagem principal
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      hidden
                      onChange={(event) => {
                        void handleUploadFiles(event.target.files, { prepend: true });
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <label className="btn btn-surface">
                    Adicionar galeria
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp"
                      hidden
                      onChange={(event) => {
                        void handleUploadFiles(event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {isUploadingImages ? <small>Enviando imagens...</small> : null}
                </div>

                <div className="admin-compact-list">
                  {productImages.length > 0 ? (
                    productImages.map((image, index) => (
                      <article key={image.id || image.storagePath} className="admin-compact-item">
                        <strong>{index === 0 ? "Imagem principal" : `Galeria ${index}`}</strong>
                        <img src={image.publicUrl || image.storagePath} alt={`Imagem ${index + 1} do produto`} width="120" height="120" />
                        <div className="admin-manager-footer-actions">
                          <button type="button" className="btn btn-surface" onClick={() => moveImageToPrimary(index)} disabled={index === 0}>
                            Definir como principal
                          </button>
                          <button type="button" className="btn btn-surface" onClick={() => void handleRemoveImage(image, index)}>
                            Remover imagem
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <article className="admin-compact-item">
                      <strong>Nenhuma imagem enviada</strong>
                      <p>Envie ao menos uma imagem principal antes de salvar o produto.</p>
                    </article>
                  )}
                </div>
              </div>

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
                  Produto disponível (desmarque para esgotado)
                </label>
              </div>

              <button type="submit" className="btn btn-primary" disabled={isSubmitting || isUploadingImages}>
                {isSubmitting ? "Salvando..." : editingProductId ? "Salvar alterações" : "Criar produto"}
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
