"use client";

import { useEffect, useRef, useState } from "react";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useToast } from "@/components/providers/toast-provider";

function toTextList(value) {
  return String(value ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminCategoriesManager() {
  const { categories, saveCategories } = useCatalog();
  const { showToast } = useToast();
  const [categoryDrafts, setCategoryDrafts] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const shouldRevealEditorRef = useRef(false);
  const editorFormRef = useRef(null);

  useEffect(() => {
    setCategoryDrafts(categories.map((category) => ({ name: category.name, subsText: category.subs.join("\n") })));
  }, [categories]);

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
    setCategoryDrafts(categories.map((category) => ({ name: category.name, subsText: category.subs.join("\n") })));
    setIsEditMode(true);
  }

  async function handleSaveCategories(event) {
    event.preventDefault();
    const normalized = categoryDrafts
      .map((category) => ({
        name: String(category.name || "").trim(),
        subs: toTextList(String(category.subsText || "")),
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
    let result = null;
    try {
      result = await saveCategories(normalized);
    } finally {
      setIsSubmitting(false);
    }

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
            <div key={`${category.name}-${index}`} className="admin-category-block">
              <label className="admin-field">
                <span>Categoria</span>
                <input
                  type="text"
                  value={category.name}
                  onChange={(event) =>
                    setCategoryDrafts((prev) =>
                      prev.map((item, rowIndex) => (rowIndex === index ? { ...item, name: event.target.value } : item)),
                    )
                  }
                />
              </label>
              <label className="admin-field">
                <span>Subcategorias (uma por linha)</span>
                <textarea
                  rows={4}
                  value={category.subsText}
                  onChange={(event) =>
                    setCategoryDrafts((prev) =>
                      prev.map((item, rowIndex) => (rowIndex === index ? { ...item, subsText: event.target.value } : item)),
                    )
                  }
                />
              </label>
              <button
                type="button"
                className="btn btn-surface"
                onClick={() => setCategoryDrafts((prev) => prev.filter((_, rowIndex) => rowIndex !== index))}
              >
                Remover categoria
              </button>
            </div>
          ))}

          <div className="admin-manager-footer-actions">
            <button
              type="button"
              className="btn btn-surface"
              onClick={() => setCategoryDrafts((prev) => [...prev, { name: "", subsText: "" }])}
            >
              Adicionar categoria
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar categorias"}
            </button>
          </div>
        </form>
      ) : (
        <div className="admin-compact-list">
          {categories.map((category) => (
            <article key={category.name} className="admin-compact-item">
              <strong>{category.name}</strong>
              <p>{category.subs.join(" • ")}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
