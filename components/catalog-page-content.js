"use client";

import { useEffect, useMemo, useState } from "react";
import { IconSearch } from "@/components/icons";
import ProductCard from "@/components/product-card";
import { useCatalog } from "@/components/providers/catalog-provider";
import TransitionLink from "@/components/transition-link";

const SORT_OPTIONS = [
  { value: "relevancia", label: "Relevância" },
  { value: "menor-preco-vista", label: "Menor preço à vista" },
  { value: "maior-preco-vista", label: "Maior preço à vista" },
];

function normalizeSort(value) {
  const allowed = new Set(SORT_OPTIONS.map((option) => option.value));
  return allowed.has(value) ? value : "relevancia";
}

export default function CatalogPageContent({ initialCategory = "Todos", initialSub = "", initialSort = "relevancia" }) {
  const { categories, publicProducts } = useCatalog();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSub, setSelectedSub] = useState(initialSub);
  const [sortBy, setSortBy] = useState(normalizeSort(initialSort));

  useEffect(() => {
    const categoryExists = categories.some((category) => category.name === initialCategory);
    const normalizedCategory = categoryExists ? initialCategory : "Todos";

    setSelectedCategory(normalizedCategory);

    if (normalizedCategory === "Todos") {
      setSelectedSub("");
      return;
    }

    const category = categories.find((item) => item.name === normalizedCategory);
    const subExists = category?.subs?.includes(initialSub);
    setSelectedSub(subExists ? initialSub : "");
  }, [categories, initialCategory, initialSub]);

  useEffect(() => {
    setSortBy(normalizeSort(initialSort));
  }, [initialSort]);
  const selectedCategoryData = useMemo(() => {
    if (selectedCategory === "Todos") {
      return null;
    }

    return categories.find((category) => category.name === selectedCategory) || null;
  }, [categories, selectedCategory]);

  const availableSubs = useMemo(() => selectedCategoryData?.subs || [], [selectedCategoryData]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    let products = publicProducts.filter((product) => {
      if (selectedCategory !== "Todos" && product.category !== selectedCategory) {
        return false;
      }

      if (selectedSub && product.sub !== selectedSub) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        product.name.toLowerCase().includes(query) ||
        product.sub.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.shortDescription.toLowerCase().includes(query)
      );
    });

    if (sortBy === "menor-preco-vista") {
      products = [...products].sort((a, b) => Number(a.priceCash ?? a.price ?? 0) - Number(b.priceCash ?? b.price ?? 0));
    }

    if (sortBy === "maior-preco-vista") {
      products = [...products].sort((a, b) => Number(b.priceCash ?? b.price ?? 0) - Number(a.priceCash ?? a.price ?? 0));
    }

    return products;
  }, [publicProducts, searchTerm, selectedCategory, selectedSub, sortBy]);

  const transitionStageKey = useMemo(
    () => `${selectedCategory}::${selectedSub}::${sortBy}::${searchTerm.trim().toLowerCase()}`,
    [searchTerm, selectedCategory, selectedSub, sortBy],
  );
  const hasActiveFilters =
    selectedCategory !== "Todos" || Boolean(selectedSub) || sortBy !== "relevancia" || Boolean(searchTerm.trim());

  function clearFilters() {
    setSearchTerm("");
    setSelectedCategory("Todos");
    setSelectedSub("");
    setSortBy("relevancia");
  }

  function handleCategorySelect(categoryName) {
    setSelectedCategory(categoryName);
    setSelectedSub("");
  }

  return (
    <>
      <section className="section page-hero-small">
        <div className="shell-container">
          <p className="kicker">Catálogo</p>
          <h1>Encontre o produto ideal para você.</h1>
          <p>Use categorias, subcategorias, busca e ordenação para chegar mais rápido ao item certo.</p>
        </div>
      </section>

      <section className="section">
        <div className="shell-container">
          <div className="catalog-toolbar catalog-toolbar-sticky">
            <div className="search-wrap">
              <label htmlFor="catalog-search">Buscar produto</label>
              <div className="search-input-wrap">
                <span className="search-icon">
                  <IconSearch className="icon" />
                </span>
                <input
                  id="catalog-search"
                  type="text"
                  placeholder="Digite nome, subcategoria ou categoria"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>

            <label className="catalog-sort-wrap" htmlFor="catalog-sort">
              <span>Ordenar por</span>
              <select id="catalog-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <TransitionLink className="btn btn-surface" href="/carrinho">
              Ir para o carrinho
            </TransitionLink>
          </div>

          <div className="chip-row">
            <button
              type="button"
              className={`chip ${selectedCategory === "Todos" ? "active" : ""}`}
              onClick={() => handleCategorySelect("Todos")}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                type="button"
                key={category.name}
                className={`chip ${selectedCategory === category.name ? "active" : ""}`}
                onClick={() => handleCategorySelect(category.name)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {availableSubs.length > 0 ? (
            <div className="chip-row sub-chip-row">
              <button
                type="button"
                className={`chip ${selectedSub === "" ? "active" : ""}`}
                onClick={() => setSelectedSub("")}
              >
                Todas subcategorias
              </button>
              {availableSubs.map((sub) => (
                <button
                  type="button"
                  key={sub}
                  className={`chip ${selectedSub === sub ? "active" : ""}`}
                  onClick={() => setSelectedSub(sub)}
                >
                  {sub}
                </button>
              ))}
            </div>
          ) : null}

          <div className="active-filters-row" aria-live="polite">
            {selectedCategory !== "Todos" ? (
              <button
                type="button"
                className="active-filter-pill removable"
                onClick={() => {
                  setSelectedCategory("Todos");
                  setSelectedSub("");
                }}
              >
                <span>Categoria: {selectedCategory}</span>
                <span className="pill-close" aria-hidden>
                  ×
                </span>
              </button>
            ) : null}

            {selectedSub ? (
              <button type="button" className="active-filter-pill removable" onClick={() => setSelectedSub("")}>
                <span>Sub: {selectedSub}</span>
                <span className="pill-close" aria-hidden>
                  ×
                </span>
              </button>
            ) : null}

            {sortBy !== "relevancia" ? (
              <button type="button" className="active-filter-pill removable" onClick={() => setSortBy("relevancia")}>
                <span>Ordenação: {SORT_OPTIONS.find((item) => item.value === sortBy)?.label}</span>
                <span className="pill-close" aria-hidden>
                  ×
                </span>
              </button>
            ) : null}

            {searchTerm.trim() ? (
              <button type="button" className="active-filter-pill removable" onClick={() => setSearchTerm("")}>
                <span>Busca: {searchTerm.trim()}</span>
                <span className="pill-close" aria-hidden>
                  ×
                </span>
              </button>
            ) : null}

            {hasActiveFilters ? (
              <button type="button" className="text-button" onClick={clearFilters}>
                Limpar tudo
              </button>
            ) : (
              <span className="active-filter-pill is-neutral">Sem filtros ativos</span>
            )}
          </div>

          <div className="catalog-headline-row">
            <h2>{filteredProducts.length} produto(s) encontrado(s)</h2>
          </div>

          <div key={transitionStageKey} className="catalog-results-stage">
            {filteredProducts.length === 0 ? (
              <article className="empty-block">
                <strong>Nenhum produto para os filtros atuais.</strong>
                <p>Tente remover um filtro ou volte para o catálogo completo.</p>
                <div className="empty-block-suggestions">
                  {categories.slice(0, 3).map((category) => (
                    <button key={category.name} type="button" className="chip" onClick={() => handleCategorySelect(category.name)}>
                      Ver {category.name}
                    </button>
                  ))}
                </div>
                <button type="button" className="btn btn-primary" onClick={clearFilters}>
                  Mostrar todos os produtos
                </button>
              </article>
            ) : (
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="reveal">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
