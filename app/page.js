import Link from "next/link";
import ProductCard from "@/components/product-card";
import { categories, homeHighlights, products } from "@/lib/catalog-data";

const flowSteps = [
  {
    title: "1. Escolha os produtos",
    text: "Navegue pelas categorias, veja os detalhes e adicione ao carrinho.",
  },
  {
    title: "2. Revise seu carrinho",
    text: "Ajuste quantidades, confira os valores e veja o total do pedido.",
  },
  {
    title: "3. Finalize no WhatsApp",
    text: "Envie o resumo do carrinho e continue o atendimento com nossa equipe.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="section hero-section">
        <div className="shell-container hero-grid">
          <article className="hero-main reveal">
            <p className="kicker-light">Ofertas da Li Rilko Imports</p>
            <h1>Eletrônicos, acessórios e importados com atendimento rápido no WhatsApp.</h1>
            <p>
              Escolha seus produtos, monte seu carrinho e finalize seu pedido direto com a nossa equipe de atendimento.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/catalogo">
                Comprar agora
              </Link>
              <Link className="btn btn-dark" href="/contato">
                Falar no WhatsApp
              </Link>
            </div>

            <div className="hero-metrics">
              <div>
                <strong>Envio para todo Brasil</strong>
                <span>Entrega segura com acompanhamento do pedido.</span>
              </div>
              <div>
                <strong>Atendimento humanizado</strong>
                <span>Suporte rápido para tirar dúvidas e finalizar sua compra.</span>
              </div>
              <div>
                <strong>Produtos selecionados</strong>
                <span>Qualidade, procedência e preço justo para você.</span>
              </div>
            </div>
          </article>

          <aside className="hero-side reveal delay-1">
            <h2>Mais procurados hoje</h2>
            <ul>
              <li>iPhones e smartphones premium</li>
              <li>Apple Watch, iPad e linha Apple</li>
              <li>Capinhas, películas e acessórios</li>
              <li>Perfumes, maquiagem e importados</li>
              <li>Itens para mobilidade e utilidades</li>
            </ul>
            <Link className="btn btn-surface" href="/catalogo">
              Ver todos os produtos
            </Link>
          </aside>
        </div>
      </section>

      <section className="section trust-section">
        <div className="shell-container trust-grid">
          <p>Envio para todo Brasil</p>
          <p>Atendimento rápido no WhatsApp</p>
          <p>Qualidade e procedência</p>
        </div>
      </section>

      <section className="section">
        <div className="shell-container">
          <div className="section-head reveal">
            <p className="kicker">Destaques da loja</p>
            <h2>Confira os produtos mais procurados do momento.</h2>
          </div>
          <div className="product-grid">
            {products.slice(0, 8).map((product, index) => (
              <div key={product.id} className={`reveal delay-${(index % 4) + 1}`}>
                <ProductCard product={product} highlight={index < 4} />
              </div>
            ))}
          </div>
          <div className="section-cta-row">
            <Link className="btn btn-primary" href="/catalogo">
              Ver catálogo completo
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell-container">
          <div className="section-head reveal">
            <p className="kicker">Categorias</p>
            <h2>Encontre rápido o que você procura.</h2>
          </div>
          <div className="category-grid">
            {categories.map((category, index) => (
              <article key={category.name} className={`category-card reveal delay-${(index % 3) + 1}`}>
                <h3>{category.name}</h3>
                <ul>
                  {category.subs.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell-container">
          <div className="section-head reveal">
            <p className="kicker">Como comprar</p>
            <h2>Seu pedido em poucos passos.</h2>
          </div>
          <div className="flow-grid">
            {flowSteps.map((step, index) => (
              <article key={step.title} className={`flow-card reveal delay-${(index % 3) + 1}`}>
                <span className="step-badge">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell-container highlight-grid">
          {homeHighlights.map((item, index) => (
            <article key={item.title} className={`highlight-card reveal delay-${(index % 3) + 1}`}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="shell-container bottom-cta reveal">
          <div>
            <p className="kicker">Precisa de ajuda?</p>
            <h2>Nossa equipe te ajuda a escolher o produto ideal.</h2>
          </div>
          <div className="bottom-cta-actions">
            <Link className="btn btn-primary" href="/contato">
              Falar no WhatsApp
            </Link>
            <Link className="btn btn-dark" href="/catalogo">
              Ver catálogo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
