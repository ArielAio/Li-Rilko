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
  
  return (
    <>
      <section className="vg-hero-section">
        <div className="shell-container vg-hero-inner reveal">
          <div className="vg-hero-text">
            <span className="vg-kicker">NOVA COLEÇÃO {new Date().getFullYear()}</span>
            <h1 className="vg-title">
              Li Rilko
            </h1>
            <p className="vg-desc">
              Seu destino para uma curadoria e estética impecáveis. 
              Encontre eletrônicos e importados selecionados com atendimento personalizado.
            </p>
            <div className="vg-hero-actions">
              <TransitionLink className="btn btn-primary" href="/catalogo">
                Ver Catálogo &gt;
              </TransitionLink>
              <TransitionLink className="btn btn-surface" href="/contato">
                Falar com Especialista
              </TransitionLink>
            </div>
          </div>
          
          <div className="vg-hero-image-wrap">
            <div className="vg-hero-image">
              <img src="/logo-li-rilko-imports.png" alt="Inverno 24 Lookbook" style={{ objectFit: 'contain', width: '100%', height: '100%', padding: '2rem' }} />
            </div>
          </div>
        </div>
      </section>

      <section className="vg-section vg-categories-section">
        <div className="shell-container">
          <div className="vg-section-head reveal">
            <h2>Categorias</h2>
            <p>Encontre exatamente o que você procura no nosso catálogo.</p>
          </div>
          
          <div className="vg-category-list">
            {categories.map((category) => {
              const capLetter = category.name.charAt(0).toUpperCase();
              return (
                <article key={category.name} className="vg-category-card reveal">
                  <div className="vg-category-header">
                    <span className="vg-category-icon">{capLetter}</span>
                    <TransitionLink className="vg-category-title" href={buildCatalogLink(category.name)}>
                      {category.name}
                    </TransitionLink>
                    <span className="vg-category-arrow">›</span>
                  </div>
                  <ul className="vg-category-subs">
                    {category.subs.slice(0, 3).map((sub) => (
                      <li key={sub}>
                        <TransitionLink href={buildCatalogLink(category.name, sub)}>
                          • {sub}
                        </TransitionLink>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="vg-section vg-destaques-section">
        <div className="shell-container">
          <div className="vg-section-head center reveal">
            <h2>DESTAQUES</h2>
            <div className="vg-divider"></div>
            <p>Os produtos mais desejados da loja, selecionados para agradar o seu estilo e curadoria.</p>
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
              Ver Catálogo Completo
            </TransitionLink>
          </div>
        </div>
      </section>

      <section className="vg-section">
        <div className="shell-container reveal">
          <div className="vg-banner-shopper">
            <h3>Gostou de algo?<br/>Fale agora com um Especialista.</h3>
            <p>
              Tire suas dúvidas, consulte tamanhos e tenha a experiência de um 
              atendimento exclusivo da Li Rilko direto no seu WhatsApp.
            </p>
            <TransitionLink className="btn btn-whatsapp" href="/contato">
              Comprar via WhatsApp
            </TransitionLink>
            <p className="vg-banner-subtext">Tempo médio de resposta: 2 min</p>
          </div>
        </div>
      </section>
    </>
  );
}
