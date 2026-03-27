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
  
  const [editingIndex, setEditingIndex] = useState(null);
  const [categoryDraft, setCategoryDraft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    if (editingIndex !== null && editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [editingIndex]);

  function startCreateCategory() {
    setCategoryDraft(createCategoryDraft());
    setEditingIndex(adminCategories.length); // new at end
  }

  function startEditCategory(category, index) {
    setCategoryDraft(createCategoryDraft(category));
    setEditingIndex(index);
  }

  function cancelEdit() {
    setCategoryDraft(null);
    setEditingIndex(null);
  }

  function updateDraftField(field, value) {
    setCategoryDraft((prev) => ({ ...prev, [field]: value }));
  }

  function updateSubField(subIndex, value) {
    setCategoryDraft((prev) => ({
      ...prev,
      subs: prev.subs.map((sub, idx) => (idx === subIndex ? { ...sub, name: value } : sub)),
    }));
  }

  function addSubcategory() {
    setCategoryDraft((prev) => ({
      ...prev,
      subs: [...prev.subs, { id: "", name: "" }],
    }));
  }

  function removeSubcategory(subIndex) {
    setCategoryDraft((prev) => {
      if (prev.subs.length <= 1) return prev;
      return {
        ...prev,
        subs: prev.subs.filter((_, idx) => idx !== subIndex),
      };
    });
  }

  async function handleDeleteCategory(index) {
    if (!window.confirm("Apagar esta categoria permanentemente? Produtos vinculados podem ficar sem categoria.")) return;
    
    const newCategories = [...adminCategories];
    newCategories.splice(index, 1);
    
    setIsSubmitting(true);
    const result = await saveCategories(newCategories);
    setIsSubmitting(false);

    if (result.ok) {
      showToast({ type: "success", title: "Categoria removida", message: "Catálogo atualizado." });
    } else {
      showToast({ type: "warning", title: "Erro", message: result.error });
    }
  }

  async function handleSaveDraft(event) {
    event.preventDefault();
    if (!categoryDraft.name.trim()) {
      showToast({ type: "warning", title: "Nome vazio", message: "Dê um nome à categoria." });
      return;
    }
    
    const cleanedSubs = categoryDraft.subs
      .map(s => ({ id: s.id, name: s.name.trim() }))
      .filter(s => s.name);

    if (cleanedSubs.length === 0) {
      showToast({ type: "warning", title: "Sem subcategorias", message: "Adicione pelo menos uma subcategoria válida." });
      return;
    }

    const finalDraft = { ...categoryDraft, name: categoryDraft.name.trim(), subs: cleanedSubs };
    const newCategories = [...adminCategories];
    
    if (editingIndex >= newCategories.length) {
      newCategories.push(finalDraft);
    } else {
      newCategories[editingIndex] = finalDraft;
    }

    setIsSubmitting(true);
    const result = await saveCategories(newCategories);
    setIsSubmitting(false);

    if (result.ok) {
      showToast({ type: "success", title: "Salvo com sucesso", message: "categoria atualizado." });
      cancelEdit();
    } else {
      showToast({ type: "warning", title: "Erro ao salvar", message: result.error });
    }
  }

  return (
    <div className="admin-manager">
      <div className="admin-manager-toolbar">
        <div>
          <h3>categorias da Loja</h3>
          <p>Organize categorias e subcategorias.</p>
        </div>
        <div className="admin-manager-toolbar-actions">
          {editingIndex === null && (
            <button type="button" className="btn btn-primary" onClick={startCreateCategory}>
              Adicionar categoria
            </button>
          )}
        </div>
      </div>

      <div className="admin-compact-list">
        {adminCategories.length === 0 && editingIndex === null && (
          <article className="admin-compact-item">
            <strong>Sem categorias</strong>
            <p>Cadastre categorias para iniciar a curadoria.</p>
          </article>
        )}

        {/* Current list */}
        {editingIndex === null && adminCategories.map((category, index) => (
          <article key={category.id || index} className="admin-compact-item">
            <div>
              <strong>{category.name}</strong>
              <p>{category.subs.map(s => s.name).join(" • ")}</p>
            </div>
            <div className="admin-product-actions">
              <button type="button" className="btn btn-surface" onClick={() => startEditCategory(category, index)}>
                Editar
              </button>
              <button type="button" className="btn btn-primary" onClick={() => handleDeleteCategory(index)}>
                Remover
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Editor Modal/Panel */}
      {editingIndex !== null && (
        <section className="admin-manager-panel" ref={editorRef} style={{ marginTop: "1rem" }}>
          <div className="admin-manager-title-row">
            <h4>{editingIndex >= adminCategories.length ? "Nova categoria" : "Editando categoria"}</h4>
          </div>
          
          <form className="admin-form" onSubmit={handleSaveDraft}>
            <label className="admin-field">
              <span>Nome da categoria Principal</span>
              <input 
                type="text" 
                value={categoryDraft.name} 
                onChange={(e) => updateDraftField("name", e.target.value)} 
                placeholder="Ex Roupas" 
                autoFocus 
              />
            </label>

            <div className="admin-field">
              <span>Subcategorias (Tags de filtro)</span>
              <div className="admin-form">
                {categoryDraft.subs.map((sub, idx) => (
                  <div key={idx} className="admin-manager-footer-actions">
                    <input 
                      type="text" 
                      value={sub.name} 
                      onChange={(e) => updateSubField(idx, e.target.value)} 
                      placeholder="Ex Calças" 
                    />
                    <button
                      type="button"
                      className="btn btn-surface"
                      onClick={() => removeSubcategory(idx)}
                      disabled={categoryDraft.subs.length <= 1}
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-manager-footer-actions">
              <button type="button" className="btn btn-surface" onClick={addSubcategory}>
                + Adicionar Tag de Filtro
              </button>
            </div>

            <div className="admin-manager-footer-actions" style={{ marginTop: "2rem" }}>
              <button type="button" className="btn btn-surface" onClick={cancelEdit}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar categoria"}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
