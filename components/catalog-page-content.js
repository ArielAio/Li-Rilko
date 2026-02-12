"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconSearch } from "@/components/icons";
import ProductCard from "@/components/product-card";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useToast } from "@/components/providers/toast-provider";
import { productMatches } from "@/lib/store-utils";

export default function CatalogPageContent({ initialCategory = "Todos", initialSub = "" }) {
  const { categories, publicProducts } = useCatalog();
  const [searchTerm, setSearchTerm] = useState(initialSub);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const { showToast } = useToast();
  const noResultNotifiedRef = useRef(false);

  useEffect(() => {
    const categoryExists = categories.some((category) => category.name === initialCategory);
    setSelectedCategory(categoryExists ? initialCategory : "Todos");
    setSearchTerm(initialSub);
  }, [categories, initialCategory, initialSub]);

  const filteredProducts = useMemo(() => {
    return publicProducts.filter((product) => productMatches(product, searchTerm, selectedCategory));
  }, [publicProducts, searchTerm, selectedCategory]);

  useEffect(() => {
    const hasFilters = selectedCategory !== "Todos" || searchTerm.trim().length > 0;

    if (hasFilters && filteredProducts.length === 0 && !noResultNotifiedRef.current) {
      showToast({
        type: "warning",
        title: "Sem resultado",
        message: "Nenhum produto encontrado. Ajuste os filtros ou limpe a busca.",
      });
      noResultNotifiedRef.current = true;
    }

    if (filteredProducts.length > 0) {
      noResultNotifiedRef.current = false;
    }
  }, [filteredProducts.length, searchTerm, selectedCategory, showToast]);

  function clearFilters() {
    setSearchTerm("");
    setSelectedCategory("Todos");
    showToast({
      type: "info",
      title: "Filtros limpos",
      message: "A vitrine voltou para todos os produtos.",
    });
  }

  return (
    <>
      <section className="section page-hero-small">
        <div className="shell-container">
          <p className="kicker">Catálogo</p>
          <h1>Encontre o produto ideal para você.</h1>
          <p>Use a busca e os filtros para encontrar mais rápido o que procura.</p>
        </div>
      </section>

      <section className="section">
        <div className="shell-container">
          <div className="catalog-toolbar">
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
            <Link className="btn btn-whatsapp" href="/carrinho">
              Ir para o carrinho
            </Link>
          </div>

          <div className="chip-row">
            <button
              type="button"
              className={`chip ${selectedCategory === "Todos" ? "active" : ""}`}
              onClick={() => setSelectedCategory("Todos")}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                type="button"
                key={category.name}
                className={`chip ${selectedCategory === category.name ? "active" : ""}`}
                onClick={() => setSelectedCategory(category.name)}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="catalog-headline-row">
            <h2>{filteredProducts.length} produto(s) encontrado(s)</h2>
            <button type="button" className="text-button" onClick={clearFilters}>
              Limpar filtros
            </button>
          </div>

          {filteredProducts.length === 0 ? (
            <article className="empty-block">
              <strong>Nenhum produto para os filtros atuais.</strong>
              <p>Tente outro termo de busca ou volte para a vitrine completa.</p>
              <button type="button" className="btn btn-primary" onClick={clearFilters}>
                Mostrar todos os produtos
              </button>
            </article>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product, index) => (
                <div key={product.id} className={`reveal delay-${(index % 4) + 1}`}>
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
