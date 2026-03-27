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
  const { categories, publicProducts, homeHighlights } = useCatalog();

  const categoryCards = categories.map((category) => ({
    ...category,
    count: publicProducts.filter((product) => product.category === category.name).length,
  }));

  return (
    <>
      <section className="home-hero-section">
        <div className="shell-container home-hero-grid reveal">
          <div className="home-hero-copy">
            <span className="home-kicker">Catalogo organizado para vender melhor</span>
            <h1>Produtos por categoria, carrinho objetivo e fechamento direto no WhatsApp.</h1>
            <p>
              A Li Rilko apresenta a vitrine com mais clareza, menos ruido visual e uma jornada simples para o cliente
              descobrir, comparar e pedir atendimento.
            </p>

            <div className="home-hero-actions">
              <TransitionLink className="btn btn-primary" href="/catalogo">
                Ver catalogo
              </TransitionLink>
              <TransitionLink className="btn btn-surface" href="/contato">
                Falar com a loja
              </TransitionLink>
            </div>

            <div className="home-proof-list">
              <span>Atendimento humano</span>
              <span>Pedido organizado no carrinho</span>
              <span>Finalizacao por WhatsApp</span>
            </div>
          </div>

          <div className="home-hero-panel">
            <div className="home-brand-card">
              <img src="/logo-li-rilko-imports.png" alt="Logo Li Rilko Imports" />
            </div>

            <div className="home-metrics-grid">
              <div className="home-metric-card">
                <strong>{publicProducts.length}</strong>
                <span>produtos ativos</span>
              </div>
              <div className="home-metric-card">
                <strong>{categories.length}</strong>
                <span>categorias organizadas</span>
              </div>
              <div className="home-metric-card">
                <strong>WhatsApp</strong>
                <span>canal de fechamento</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-highlight-section">
        <div className="shell-container">
          <div className="home-section-head reveal">
            <span className="home-kicker">Por que a experiencia melhorou</span>
            <h2>Uma vitrine mais clara para o cliente e mais operavel para a loja.</h2>
          </div>

          <div className="home-highlight-grid">
            {homeHighlights.map((item) => (
              <article key={item.title} className="home-highlight-card reveal">
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="vg-section vg-categories-section">
        <div className="shell-container">
          <div className="home-section-head reveal">
            <span className="home-kicker">Navegacao por categoria</span>
            <h2>Entre pelo caminho certo e chegue mais rapido ao produto.</h2>
          </div>

          <div className="home-category-grid">
            {categoryCards.map((category) => {
              const capLetter = category.name.charAt(0).toUpperCase();
              return (
                <article key={category.name} className="home-category-card reveal">
                  <div className="home-category-top">
                    <span className="home-category-icon">{capLetter}</span>
                    <span className="home-category-count">{category.count} itens</span>
                  </div>
                  <TransitionLink className="home-category-title" href={buildCatalogLink(category.name)}>
                    {category.name}
                  </TransitionLink>
                  <p className="home-category-description">Subcategorias mais acessadas:</p>
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
            <span className="home-kicker">Vitrine principal</span>
            <h2>Produtos em evidencia para acelerar a decisao de compra.</h2>
            <p>Uma amostra da vitrine atual com acesso direto ao detalhe do item e ao carrinho.</p>
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
              Ver catalogo completo
            </TransitionLink>
          </div>
        </div>
      </section>

      <section className="home-process-section">
        <div className="shell-container reveal">
          <div className="home-process-card">
            <div>
              <span className="home-kicker">Como funciona</span>
              <h3>Escolha no site, revise no carrinho e feche com a loja no WhatsApp.</h3>
            </div>

            <div className="home-process-steps">
              <span>1. Navegue por categoria</span>
              <span>2. Adicione os itens ao pedido</span>
              <span>3. Finalize com atendimento humano</span>
            </div>

            <TransitionLink className="btn btn-whatsapp" href="/contato">
              Iniciar atendimento
            </TransitionLink>
          </div>
        </div>
      </section>
    </>
  );
}
