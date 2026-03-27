"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IconSearch } from "@/components/icons";
import ProductCard from "@/components/product-card";
import { useCatalog } from "@/components/providers/catalog-provider";

const SORT_OPTIONS = [
  { value: "relevancia", label: "Destaques" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
  { value: "nome-az", label: "Nome: A-Z" },
  { value: "nome-za", label: "Nome: Z-A" },
];

function normalizeSort(value) {
  const allowed = new Set(SORT_OPTIONS.map((option) => option.value));
  return allowed.has(value) ? value : "relevancia";
}

function buildCatalogUrl(pathname, { category, sub, sort, search }) {
  const params = new URLSearchParams();

  if (category && category !== "Todos") {
    params.set("categoria", category);
  }

  if (sub) {
    params.set("sub", sub);
  }

  if (sort && sort !== "relevancia") {
    params.set("ordem", sort);
  }

  if (search) {
    params.set("busca", search);
  }

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export default function CatalogPageContent({
  initialCategory = "Todos",
  initialSub = "",
  initialSort = "relevancia",
  initialSearch = "",
}) {
  const { categories, publicProducts } = useCatalog();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [urlSearchTerm, setUrlSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSub, setSelectedSub] = useState(initialSub);
  const [sortBy, setSortBy] = useState(normalizeSort(initialSort));
  const deferredSearchTerm = useDeferredValue(searchTerm);

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

  useEffect(() => {
    setSearchTerm(initialSearch);
    setUrlSearchTerm(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setUrlSearchTerm(searchTerm);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  const selectedCategoryData = useMemo(() => {
    if (selectedCategory === "Todos") return null;
    return categories.find((category) => category.name === selectedCategory) || null;
  }, [categories, selectedCategory]);

  const availableSubs = useMemo(() => selectedCategoryData?.subs || [], [selectedCategoryData]);

  const filteredProducts = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();

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

    if (sortBy === "menor-preco") {
      products = [...products].sort((a, b) => Number(a.priceCash ?? a.price ?? 0) - Number(b.priceCash ?? b.price ?? 0));
    }

    if (sortBy === "maior-preco") {
      products = [...products].sort((a, b) => Number(b.priceCash ?? b.price ?? 0) - Number(a.priceCash ?? a.price ?? 0));
    }

    if (sortBy === "nome-az") {
      products = [...products].sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sortBy === "nome-za") {
      products = [...products].sort((a, b) => b.name.localeCompare(a.name));
    }

    return products;
  }, [deferredSearchTerm, publicProducts, selectedCategory, selectedSub, sortBy]);

  const categoryCounts = useMemo(
    () =>
      categories.map((category) => ({
        name: category.name,
        count: publicProducts.filter((product) => product.category === category.name).length,
      })),
    [categories, publicProducts],
  );

  const hasActiveFilters =
    selectedCategory !== "Todos" || Boolean(selectedSub) || sortBy !== "relevancia" || Boolean(searchTerm.trim());

  useEffect(() => {
    const nextUrl = buildCatalogUrl(pathname, {
      category: selectedCategory,
      sub: selectedSub,
      sort: sortBy,
      search: urlSearchTerm.trim(),
    });

    const currentUrl = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

    if (nextUrl === currentUrl) {
      return;
    }

    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  }, [pathname, router, searchParams, selectedCategory, selectedSub, sortBy, urlSearchTerm]);

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
          <div className="catalog-hero-copy">
            <span className="catalog-kicker">Catálogo</span>
            <h1 className="vg-catalog-title">Catálogo Li Rilko</h1>
            <p className="vg-catalog-desc">Busque, filtre e monte seu pedido.</p>
          </div>
        </div>
      </section>

      <section className="vg-catalog-filters">
        <div className="shell-container">
          <div className="vg-search-bar">
            <IconSearch className="icon" />
            <input
              type="text"
              placeholder="Buscar"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="vg-sort-bar">
            <span>Ordenar por</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="vg-pill-scroll">
            <button
              type="button"
              className={`vg-pill ${selectedCategory === "Todos" ? "active" : ""}`}
              onClick={() => handleCategorySelect("Todos")}
            >
              Todos os itens
            </button>
            {categoryCounts.map((category) => (
              <button
                type="button"
                key={category.name}
                className={`vg-pill ${selectedCategory === category.name ? "active" : ""}`}
                onClick={() => handleCategorySelect(category.name)}
              >
                {category.name}
                <span>{category.count}</span>
              </button>
            ))}
          </div>

          {selectedCategory !== "Todos" && availableSubs.length > 0 && (
            <div className="catalog-subfilters">
              <span>Subcategorias</span>
              <div className="catalog-subfilter-list">
                <button
                  type="button"
                  className={`catalog-subfilter ${!selectedSub ? "active" : ""}`}
                  onClick={() => setSelectedSub("")}
                >
                  Todos
                </button>
                {availableSubs.map((sub) => (
                  <button
                    type="button"
                    key={sub}
                    className={`catalog-subfilter ${selectedSub === sub ? "active" : ""}`}
                    onClick={() => setSelectedSub(sub)}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <div className="vg-active-filters">
              {selectedCategory !== "Todos" && (
                <button type="button" className="vg-filter-tag" onClick={() => { setSelectedCategory("Todos"); setSelectedSub(""); }}>
                  Categoria: {selectedCategory} x
                </button>
              )}
              {selectedSub && (
                <button type="button" className="vg-filter-tag" onClick={() => setSelectedSub("")}>
                  Subcategoria: {selectedSub} x
                </button>
              )}
              {searchTerm.trim() && (
                <button type="button" className="vg-filter-tag" onClick={() => setSearchTerm("")}>
                  Busca: {searchTerm.trim()} x
                </button>
              )}
              <button type="button" className="vg-filter-clear" onClick={clearFilters}>
                Limpar tudo
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="vg-catalog-results">
        <div className="shell-container">
          <div className="catalog-results-head">
            <div>
              <strong>{filteredProducts.length} produtos</strong>
              <p>
                {selectedCategory === "Todos"
                  ? "Todos os produtos disponíveis."
                  : `Mostrando itens de ${selectedCategory}${selectedSub ? ` / ${selectedSub}` : ""}.`}
              </p>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="vg-empty-state">
              <p>Nenhum produto encontrado para os filtros atuais.</p>
              <span>Remova os filtros para ver mais opções.</span>
              <button type="button" className="btn btn-primary" onClick={clearFilters}>
                Limpar filtros
              </button>
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
