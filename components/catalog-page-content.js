"use client";

import { useEffect, useMemo, useState } from "react";
import { IconSearch } from "@/components/icons";
import ProductCard from "@/components/product-card";
import { useCatalog } from "@/components/providers/catalog-provider";
import TransitionLink from "@/components/transition-link";

const SORT_OPTIONS = [
  { value: "relevancia", label: "Relevância" },
  { value: "menor-preco-vista", label: "Menor preço" },
  { value: "maior-preco-vista", label: "Maior preço" },
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
    if (selectedCategory === "Todos") return null;
    return categories.find((category) => category.name === selectedCategory) || null;
  }, [categories, selectedCategory]);

  const availableSubs = useMemo(() => selectedCategoryData?.subs || [], [selectedCategoryData]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    let products = publicProducts.filter((product) => {
      if (selectedCategory !== "Todos" && product.category !== selectedCategory) return false;
      if (selectedSub && product.sub !== selectedSub) return false;
      if (!query) return true;

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

  const hasActiveFilters = selectedCategory !== "Todos" || Boolean(selectedSub) || sortBy !== "relevancia" || Boolean(searchTerm.trim());

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
      <section className="vg-catalog-header">
        <div className="shell-container">
          <h1 className="vg-catalog-title">
            Catálogo<br/><span className="accent">Li Rilko</span>
          </h1>
          <p className="vg-catalog-desc">
            Essenciais com curadoria para a vanguarda moderna. Estética de precisão alinhada à qualidade impecável.
          </p>
        </div>
      </section>

      <section className="vg-catalog-filters">
        <div className="shell-container">
          <div className="vg-search-bar">
            <IconSearch className="icon" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="vg-sort-bar">
            <span>ORDENAR POR</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="vg-pill-scroll">
            <button
              type="button"
              className={`vg-pill ${selectedCategory === "Todos" ? "active" : ""}`}
              onClick={() => handleCategorySelect("Todos")}
            >
              All Items
            </button>
            {categories.map((category) => (
              <button
                type="button"
                key={category.name}
                className={`vg-pill ${selectedCategory === category.name ? "active" : ""}`}
                onClick={() => handleCategorySelect(category.name)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <div className="vg-active-filters">
              {selectedCategory !== "Todos" && (
                <button className="vg-filter-tag" onClick={() => { setSelectedCategory("Todos"); setSelectedSub(""); }}>
                  CATEGORIA: {selectedCategory.toUpperCase()} ×
                </button>
              )}
              {selectedSub && (
                <button className="vg-filter-tag" onClick={() => setSelectedSub("")}>
                  SUB: {selectedSub.toUpperCase()} ×
                </button>
              )}
              {searchTerm.trim() && (
                <button className="vg-filter-tag" onClick={() => setSearchTerm("")}>
                  BUSCA: {searchTerm.trim().toUpperCase()} ×
                </button>
              )}
              <button className="vg-filter-clear" onClick={clearFilters}>Limpar tudo</button>
            </div>
          )}
        </div>
      </section>

      <section className="vg-catalog-results">
        <div className="shell-container">
          {filteredProducts.length === 0 ? (
            <div className="vg-empty-state">
              <p>Nenhum produto encontrado para os filtros atuais.</p>
              <button className="btn btn-primary" onClick={clearFilters}>Limpar Filtros</button>
            </div>
          ) : (
            <div className="vg-stacked-grid">
              {filteredProducts.map((product) => (
                <div key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
