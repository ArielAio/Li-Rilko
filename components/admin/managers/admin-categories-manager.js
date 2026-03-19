"use client";

import { useEffect, useRef, useState } from "react";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useToast } from "@/components/providers/toast-provider";

function createCategoryDraft(category = null) {
  return {
    id: category?.id || "",
    name: category?.name || "",
    subs: Array.isArray(category?.subs)
      ? category.subs.map((sub) => ({
          id: sub.id || "",
          name: sub.name || "",
        }))
      : [{ id: "", name: "" }],
  };
}

export default function AdminCategoriesManager() {
  const { adminCategories, saveCategories } = useCatalog();
  const { showToast } = useToast();
  const [categoryDrafts, setCategoryDrafts] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const shouldRevealEditorRef = useRef(false);
  const editorFormRef = useRef(null);

  useEffect(() => {
    setCategoryDrafts(adminCategories.map((category) => createCategoryDraft(category)));
  }, [adminCategories]);

  useEffect(() => {
    if (!isEditMode || !shouldRevealEditorRef.current) {
      return undefined;
    }

    shouldRevealEditorRef.current = false;

    const frame = window.requestAnimationFrame(() => {
      editorFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      const firstField = editorFormRef.current?.querySelector("input, textarea, select");
      if (firstField && typeof firstField.focus === "function") {
        firstField.focus();
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isEditMode]);

  function openEditor() {
    shouldRevealEditorRef.current = true;
    setCategoryDrafts(adminCategories.map((category) => createCategoryDraft(category)));
    setIsEditMode(true);
  }

  function updateCategoryField(index, field, value) {
    setCategoryDrafts((prev) =>
      prev.map((category, rowIndex) => (rowIndex === index ? { ...category, [field]: value } : category)),
    );
  }

  function updateSubField(categoryIndex, subIndex, value) {
    setCategoryDrafts((prev) =>
      prev.map((category, rowIndex) => {
        if (rowIndex !== categoryIndex) {
          return category;
        }

        return {
          ...category,
          subs: category.subs.map((sub, currentIndex) => (currentIndex === subIndex ? { ...sub, name: value } : sub)),
        };
      }),
    );
  }

  function addSubcategory(categoryIndex) {
    setCategoryDrafts((prev) =>
      prev.map((category, rowIndex) =>
        rowIndex === categoryIndex ? { ...category, subs: [...category.subs, { id: "", name: "" }] } : category,
      ),
    );
  }

  function removeSubcategory(categoryIndex, subIndex) {
    setCategoryDrafts((prev) =>
      prev.map((category, rowIndex) => {
        if (rowIndex !== categoryIndex || category.subs.length <= 1) {
          return category;
        }

        return {
          ...category,
          subs: category.subs.filter((_, currentIndex) => currentIndex !== subIndex),
        };
      }),
    );
  }

  async function handleSaveCategories(event) {
    event.preventDefault();
    const normalized = categoryDrafts
      .map((category) => ({
        id: category.id,
        name: String(category.name || "").trim(),
        subs: Array.isArray(category.subs)
          ? category.subs
              .map((sub) => ({
                id: sub.id,
                name: String(sub.name || "").trim(),
              }))
              .filter((sub) => sub.name)
          : [],
      }))
      .filter((category) => category.name);

    if (normalized.length === 0) {
      showToast({
        type: "warning",
        title: "Categorias inválidas",
        message: "Cadastre pelo menos uma categoria antes de salvar.",
      });
      return;
    }

    const hasCategoryWithoutSub = normalized.some((category) => category.subs.length === 0);
    if (hasCategoryWithoutSub) {
      showToast({
        type: "warning",
        title: "Subcategorias pendentes",
        message: "Cada categoria precisa ter ao menos uma subcategoria.",
      });
      return;
    }

    setIsSubmitting(true);
    const result = await saveCategories(normalized);
    setIsSubmitting(false);

    if (!result.ok) {
      showToast({
        type: "warning",
        title: "Erro ao salvar",
        message: result.error || "Não foi possível salvar as categorias.",
      });
      return;
    }

    setIsEditMode(false);
    showToast({
      type: "success",
      title: "Categorias salvas",
      message: "Menu de categorias atualizado no catálogo.",
    });
  }

  return (
    <div className="admin-manager">
      <div className="admin-manager-toolbar">
        <div>
          <h3>Categorias e subcategorias</h3>
          <p>Organize o menu principal e os grupos de produtos da loja.</p>
        </div>
        <div className="admin-manager-toolbar-actions">
          {!isEditMode ? (
            <button type="button" className="btn btn-primary" onClick={openEditor}>
              Editar categorias
            </button>
          ) : (
            <button type="button" className="btn btn-surface" onClick={() => setIsEditMode(false)}>
              Fechar editor
            </button>
          )}
        </div>
      </div>

      {isEditMode ? (
        <form className="admin-form" onSubmit={handleSaveCategories} ref={editorFormRef}>
          {categoryDrafts.map((category, index) => (
            <div key={category.id || `category-${index}`} className="admin-category-block">
              <label className="admin-field">
                <span>Categoria</span>
                <input type="text" value={category.name} onChange={(event) => updateCategoryField(index, "name", event.target.value)} />
              </label>

              <div className="admin-field">
                <span>Subcategorias</span>
                <div className="admin-form">
                  {category.subs.map((sub, subIndex) => (
                    <div key={sub.id || `sub-${subIndex}`} className="admin-manager-footer-actions">
                      <input type="text" value={sub.name} onChange={(event) => updateSubField(index, subIndex, event.target.value)} />
                      <button
                        type="button"
                        className="btn btn-surface"
                        onClick={() => removeSubcategory(index, subIndex)}
                        disabled={category.subs.length <= 1}
                      >
                        Remover subcategoria
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-manager-footer-actions">
                <button type="button" className="btn btn-surface" onClick={() => addSubcategory(index)}>
                  Adicionar subcategoria
                </button>
                <button
                  type="button"
                  className="btn btn-surface"
                  onClick={() => setCategoryDrafts((prev) => prev.filter((_, rowIndex) => rowIndex !== index))}
                >
                  Remover categoria
                </button>
              </div>
            </div>
          ))}

          <div className="admin-manager-footer-actions">
            <button type="button" className="btn btn-surface" onClick={() => setCategoryDrafts((prev) => [...prev, createCategoryDraft()])}>
              Adicionar categoria
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar categorias"}
            </button>
          </div>
        </form>
      ) : (
        <div className="admin-compact-list">
          {adminCategories.map((category) => (
            <article key={category.id || category.name} className="admin-compact-item">
              <strong>{category.name}</strong>
              <p>{category.subs.map((sub) => sub.name).join(" • ")}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
