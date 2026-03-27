"use client";

import ProductCard from "@/components/product-card";
import { useCatalog } from "@/components/providers/catalog-provider";
import TransitionLink from "@/components/transition-link";

function buildCatalogLink(categoryName, subName) {
  const query = new URLSearchParams();
  query.set("categoria", categoryName);
  if (subName) {
    query.set("sub", subName);
  }
  return `/catalogo?${query.toString()}`;
}

export default function HomePage() {
  const { categories, publicProducts } = useCatalog();

  const categoryCards = categories.map((category) => ({
    ...category,
    count: publicProducts.filter((product) => product.category === category.name).length,
  }));

  return (
    <>
      <section className="home-hero-section">
        <div className="shell-container home-hero-grid reveal">
          <div className="home-hero-copy">
            <span className="home-kicker">Catálogo Li Rilko</span>
            <h1>
              Novidades <span className="home-store-name">Li Rilko</span> para renovar seu estilo.
            </h1>
            <p>Escolhas selecionadas da loja para você comprar com praticidade e atendimento próximo.</p>

            <div className="home-hero-actions">
              <TransitionLink className="btn btn-primary" href="/catalogo">
                Ver catálogo
              </TransitionLink>
              <TransitionLink className="btn btn-surface" href="/contato">
                Falar com a loja
              </TransitionLink>
            </div>

          </div>

          <div className="home-hero-panel" aria-hidden="true">
            <img
              className="home-hero-logo"
              src="/logo-li-rilko-imports.png"
              alt="Logo Li Rilko Imports"
            />
          </div>
        </div>
      </section>

      <section className="vg-section vg-categories-section">
        <div className="shell-container">
          <div className="home-section-head reveal">
            <span className="home-kicker">Categorias</span>
            <h2>Acesse o catálogo pelo caminho mais rápido.</h2>
          </div>

          <div className="home-category-grid">
            {categoryCards.map((category) => {
              return (
                <article key={category.name} className="home-category-card reveal">
                  <div className="home-category-top">
                    <span className="home-category-count">{category.count} itens</span>
                  </div>
                  <TransitionLink className="home-category-title" href={buildCatalogLink(category.name)}>
                    {category.name}
                  </TransitionLink>
                  <p className="home-category-description">Subcategorias</p>
                  <ul className="home-category-subs">
                    {category.subs.slice(0, 3).map((sub) => (
                      <li key={sub}>
                        <TransitionLink href={buildCatalogLink(category.name, sub)}>{sub}</TransitionLink>
                      </li>
                    ))}
                  </ul>
                  <TransitionLink className="home-category-link" href={buildCatalogLink(category.name)}>
                    Ver categoria
                  </TransitionLink>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="vg-section vg-destaques-section">
        <div className="shell-container">
          <div className="home-section-head center reveal">
            <span className="home-kicker">Destaques</span>
            <h2>Produtos em destaque</h2>
          </div>

          <div className="product-grid">
            {publicProducts.slice(0, 4).map((product, index) => (
              <div key={product.id} className="reveal">
                <ProductCard product={product} highlight={index === 0} />
              </div>
            ))}
          </div>

          <div className="vg-center-action">
            <TransitionLink className="btn btn-surface" href="/catalogo">
              Ver catálogo completo
            </TransitionLink>
          </div>
        </div>
      </section>
    </>
  );
}
