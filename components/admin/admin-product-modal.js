"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useToast } from "@/components/providers/toast-provider";
import { formatCurrencyInput, formatCurrencyInputForEdit, parseCurrencyInputToNumber } from "@/lib/admin-input-formatters";


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
    ...product,
    priceCash: formatCurrencyInput(product.priceCash ?? product.price ?? 0),
    priceInstallment: formatCurrencyInput(product.priceInstallment ?? product.price ?? 0),
    highlightsText: Array.isArray(product.highlights) ? product.highlights.join("\n") : "",
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

export default function AdminProductModal() {
  const {
    editingProductId,
    closeEditModal,
    productMap,
    adminCategories,
    addProduct,
    updateProduct,
    uploadProductImage,
    deleteProductImage,
  } = useCatalog();
  const { showToast } = useToast();

  const [productForm, setProductForm] = useState(() => createEmptyProductForm(adminCategories));
  const [productImages, setProductImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const isOpen = editingProductId !== null;
  const isNew = editingProductId === "new";

  useEffect(() => {
    if (!isOpen) return;

    if (isNew) {
      setProductForm(createEmptyProductForm(adminCategories));
      setProductImages([]);
    } else {
      const product = productMap.get(editingProductId);
      if (product) {
        setProductForm(productToForm(product));
        setProductImages(Array.isArray(product.imageItems) ? product.imageItems.map(normalizeImageItem) : []);
      }
    }
    
    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") closeEditModal();
    }
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isNew, editingProductId, productMap, adminCategories, closeEditModal]);

  const selectedCategory = useMemo(
    () => adminCategories.find((category) => category.id === productForm.categoryId) || null,
    [adminCategories, productForm.categoryId]
  );
  const availableSubcategories = useMemo(() => selectedCategory?.subs || [], [selectedCategory]);

  function handleProductField(field, value) {
    setProductForm((prev) => ({ ...prev, [field]: value }));
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
    setProductForm((prev) => ({ ...prev, [field]: value }));
  }

  function handlePriceFieldFocus(field) {
    setProductForm((prev) => ({ ...prev, [field]: formatCurrencyInputForEdit(prev[field]) }));
  }

  function handlePriceFieldBlur(field) {
    setProductForm((prev) => {
      const rawValue = String(prev[field] ?? "").trim();
      const nextValue = rawValue ? formatCurrencyInput(rawValue) : "";

      const otherField = field === "priceCash" ? "priceInstallment" : "priceCash";
      const otherValue = String(prev[otherField] ?? "").trim();

      const nextForm = { ...prev, [field]: nextValue };

      // Se preencheu um e o outro tá vazio, espelha pra facilitar
      if (nextValue && !otherValue) {
        nextForm[otherField] = nextValue;
      }

      return nextForm;
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
    if (!payload.name || !payload.categoryId || !payload.subcategoryId) return "Nome, categoria e subcategoria são obrigatórios.";
    if (payload.priceCash <= 0 || payload.priceInstallment <= 0) return "Preços à vista e a prazo devem ser maiores que zero.";
    if (!Array.isArray(payload.imageItems) || payload.imageItems.length === 0) return "Adicione ao menos uma imagem na galeria.";
    return "";
  }

  async function handleUploadFiles(fileList) {
    const files = Array.from(fileList || []).filter(Boolean);
    if (files.length === 0) return;
    setIsUploadingImages(true);

    const uploadedItems = [];
    for (const file of files) {
      const result = await uploadProductImage(productForm.id, file);
      if (result.ok && result.image) {
        uploadedItems.push(normalizeImageItem(result.image, uploadedItems.length));
      } else {
        showToast({ type: "warning", title: "Falha no upload", message: result.error || "Não foi possível enviar a imagem." });
      }
    }

    setProductImages((prev) => [...prev, ...uploadedItems].slice(0, 6).map(normalizeImageItem));
    setIsUploadingImages(false);
  }

  async function handleRemoveImage(image, index) {
    const result = await deleteProductImage(productForm.id, image.id);
    if (!result.ok) {
      showToast({ type: "warning", title: "Erro na exclusão", message: result.error || "Não foi possível excluir a imagem." });
      return;
    }
    setProductImages((prev) => prev.filter((_, i) => i !== index).map(normalizeImageItem));
  }

  async function handleSaveProduct(event) {
    event.preventDefault();
    const payload = buildProductPayload();
    const error = validatePayload(payload);
    if (error) {
      showToast({ type: "warning", title: "Dados incompletos", message: error });
      return;
    }

    setIsSubmitting(true);
    try {
      if (!isNew) {
        const result = await updateProduct(editingProductId, payload);
        if (result.ok) {
          showToast({ type: "success", title: "Produto Salvo", message: "As informações foram atualizadas no catálogo." });
          closeEditModal();
        } else {
          showToast({ type: "warning", title: "Erro ao salvar", message: result.error });
        }
      } else {
        const result = await addProduct(payload);
        if (result.ok) {
          showToast({ type: "success", title: "Produto Criado", message: "Novo produto adicionado à loja." });
          closeEditModal();
        } else {
          showToast({ type: "warning", title: "Erro ao criar", message: result.error });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="vg-modal-backdrop" onClick={closeEditModal} />
      <div className="vg-admin-slideover" role="dialog" aria-modal="true" aria-label={isNew ? "Novo Produto" : "Editar Produto"}>
        <div className="vg-slideover-header">
          <div>
            <h2>{isNew ? "Novo Produto" : "Editar Produto"}</h2>
            <span className="vg-slideover-id">PRODUCT ID: #{productForm.id.split("-").pop().substring(0,6).toUpperCase()}</span>
          </div>
          <button className="vg-slideover-close" onClick={closeEditModal} aria-label="Fechar">
            ×
          </button>
        </div>
        
        <form className="vg-slideover-body" onSubmit={handleSaveProduct}>
          <div className="vg-slideover-field">
            <label>NOME DO PRODUTO</label>
            <input 
              type="text" 
              value={productForm.name} 
              onChange={(e) => handleProductField("name", e.target.value)} 
              required 
            />
          </div>

          <div className="vg-slideover-row">
            <div className="vg-slideover-field">
              <label>CATEGORIA</label>
              <select value={productForm.categoryId} onChange={(e) => handleCategoryChange(e.target.value)} required>
                {adminCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="vg-slideover-field">
              <label>SUBCATEGORIA</label>
              <select value={productForm.subcategoryId} onChange={(e) => handleProductField("subcategoryId", e.target.value)} required>
                {availableSubcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="vg-slideover-row">
            <div className="vg-slideover-field">
              <label>PREÇO À VISTA (R$)</label>
              <input 
                type="text" 
                inputMode="decimal"
                value={productForm.priceCash}
                onChange={(e) => handlePriceFieldChange("priceCash", e.target.value)}
                onFocus={() => handlePriceFieldFocus("priceCash")}
                onBlur={() => handlePriceFieldBlur("priceCash")}
                required 
              />
            </div>
            <div className="vg-slideover-field">
              <label>PREÇO A PRAZO (R$)</label>
              <input 
                type="text" 
                inputMode="decimal"
                value={productForm.priceInstallment}
                onChange={(e) => handlePriceFieldChange("priceInstallment", e.target.value)}
                onFocus={() => handlePriceFieldFocus("priceInstallment")}
                onBlur={() => handlePriceFieldBlur("priceInstallment")}
                required 
              />
            </div>
          </div>

          <div className="vg-slideover-field">
            <label>BADGE / ETIQUETA (EX: MAIS VENDIDO)</label>
            <input 
              type="text" 
              value={productForm.badge} 
              onChange={(e) => handleProductField("badge", e.target.value)} 
              placeholder="Ex: Novo, Oferta, Destaque..."
            />
          </div>

          <div className="vg-slideover-field">
            <label>DESTAQUES DO PRODUTO (UM POR LINHA)</label>
            <textarea 
              rows={3} 
              value={productForm.highlightsText} 
              onChange={(e) => handleProductField("highlightsText", e.target.value)} 
              placeholder="Ex: Couro Legítimo&#10;Acabamento Premium&#10;Garantia de 1 ano"
            />
          </div>

          <div className="vg-slideover-field">
            <label>DESCRIÇÃO COMPLETA</label>
            <textarea 
              rows={4} 
              value={productForm.shortDescription} 
              onChange={(e) => handleProductField("shortDescription", e.target.value)} 
            />
          </div>

          <div className="vg-slideover-field">
            <label>GALERIA DE PRODUTO</label>
            <div className="vg-gallery-grid">
              {productImages.map((img, i) => (
                <div key={img.id} className="vg-gallery-item">
                  <img src={img.publicUrl} alt={`Thumb ${i}`} />
                  <button type="button" className="vg-gallery-remove" onClick={() => handleRemoveImage(img, i)}>×</button>
                </div>
              ))}
              {productImages.length < 6 && (
                <label className="vg-gallery-upload">
                  {isUploadingImages ? "..." : (
                    <>
                      <span>+</span>
                      <small>UPLOAD</small>
                    </>
                  )}
                  <input type="file" multiple accept="image/*" hidden onChange={(e) => handleUploadFiles(e.target.files)} />
                </label>
              )}
            </div>
          </div>

          <div className="vg-slideover-toggle">
            <label>Publicar Produto</label>
            <label className="vg-switch">
              <input 
                type="checkbox" 
                checked={productForm.isVisible} 
                onChange={(e) => handleProductField("isVisible", e.target.checked)} 
              />
              <span className="vg-slider"></span>
            </label>
          </div>
          <div className="vg-slideover-toggle">
            <label>Disponível em Estoque</label>
            <label className="vg-switch">
              <input 
                type="checkbox" 
                checked={productForm.isAvailable} 
                onChange={(e) => handleProductField("isAvailable", e.target.checked)} 
              />
              <span className="vg-slider"></span>
            </label>
          </div>

          <div className="vg-slideover-footer">
            <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting || isUploadingImages}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </button>
            <button type="button" className="vg-discard-btn" onClick={closeEditModal}>
              DESCARTAR
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
