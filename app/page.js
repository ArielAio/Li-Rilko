"use client";

import ProductCard from "@/components/product-card";
import { useCatalog } from "@/components/providers/catalog-provider";
import TransitionLink from "@/components/transition-link";

const buyingSteps = [
  "1. Escolha a categoria",
  "2. Adicione os itens no carrinho",
  "3. Finalize o pedido no WhatsApp",
];

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
  return (
    <>
      <section className="section hero-section">
        <div className="shell-container hero-grid">
          <article className="hero-main reveal">
            <p className="kicker-light">Fernandópolis - SP | Li Rilko Imports</p>
            <h1>Importados, eletrônicos e acessórios com pedido rápido pelo WhatsApp.</h1>
            <p>
              Explore o catálogo, compare preços à vista e a prazo, monte seu carrinho e conclua direto no atendimento
              da loja.
            </p>
            <div className="hero-actions">
              <TransitionLink className="btn btn-primary" href="/catalogo">
                Ver catálogo
              </TransitionLink>
              <TransitionLink className="hero-inline-link" href="/contato">
                Atendimento no WhatsApp
              </TransitionLink>
            </div>
          </article>

          <aside className="hero-side reveal delay-1">
            <h2>Compra rápida, sem checkout complicado</h2>
            <ul>
              {buyingSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
            <TransitionLink className="btn btn-surface" href="/carrinho">
              Revisar carrinho
            </TransitionLink>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="shell-container">
          <div className="section-head reveal">
            <p className="kicker">Categorias</p>
            <h2>Entre pela categoria certa e encontre mais rápido o que precisa.</h2>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <article key={category.name} className="category-card reveal">
                <TransitionLink
                  className="category-card-overlay"
                  href={buildCatalogLink(category.name)}
                  aria-label={`Ver categoria ${category.name}`}
                />
                <div className="category-card-content">
                  <h3>
                    <TransitionLink className="category-title-link" href={buildCatalogLink(category.name)}>
                      {category.name}
                    </TransitionLink>
                  </h3>

                  <ul className="category-sub-links">
                    {category.subs.slice(0, 4).map((sub) => (
                      <li key={sub}>
                        <TransitionLink className="category-sub-link" href={buildCatalogLink(category.name, sub)}>
                          {sub}
                        </TransitionLink>
                      </li>
                    ))}
                  </ul>

                  <span className="category-card-link-label">Explorar categoria</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell-container">
          <div className="section-head reveal">
            <p className="kicker">Mais procurados</p>
            <h2>Produtos com maior saída para acelerar sua decisão de compra.</h2>
          </div>
          <div className="product-grid">
            {publicProducts.slice(0, 8).map((product, index) => (
              <div key={product.id} className="reveal">
                <ProductCard product={product} highlight={index < 4} />
              </div>
            ))}
          </div>
          <div className="section-cta-row">
            <TransitionLink className="btn btn-primary" href="/catalogo">
              Ver catálogo completo
            </TransitionLink>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell-container bottom-cta reveal">
          <div>
            <p className="kicker">Pronto para finalizar?</p>
            <h2>Abra o WhatsApp e conclua seu pedido com atendimento direto da loja.</h2>
          </div>
          <div className="bottom-cta-actions">
            <TransitionLink className="btn btn-whatsapp" href="/contato">
              Finalizar no WhatsApp
            </TransitionLink>
            <TransitionLink className="bottom-cta-link" href="/catalogo">
              Ver produtos
            </TransitionLink>
          </div>
        </div>
      </section>
    </>
  );
}
