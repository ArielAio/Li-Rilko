"use client";

import ProductCard from "@/components/product-card";
import { useCatalog } from "@/components/providers/catalog-provider";
import TransitionLink from "@/components/transition-link";

const flowSteps = [
  {
    title: "1. Encontre rápido o que precisa",
    text: "Use categorias e busca para chegar no produto certo sem perder tempo.",
  },
  {
    title: "2. Monte seu carrinho com clareza",
    text: "Adicione vários itens, ajuste quantidades e acompanhe o total do pedido.",
  },
  {
    title: "3. Finalize no WhatsApp",
    text: "Envie o resumo pronto e continue o atendimento com a equipe da loja.",
  },
];

const buyingSteps = [
  "Navegue por categorias e subcategorias",
  "Adicione os itens desejados no carrinho",
  "Ajuste quantidade e confira o total",
  "Finalize com mensagem pronta no WhatsApp",
];

const faqItems = [
  {
    title: "Tem pagamento no site?",
    text: "Não. O fechamento é feito diretamente no WhatsApp com a equipe da loja.",
  },
  {
    title: "Posso alterar quantidade dos itens?",
    text: "Sim. No carrinho você consegue aumentar, reduzir ou remover itens antes de enviar.",
  },
  {
    title: "Como recebo atendimento?",
    text: "Você pode chamar no WhatsApp a qualquer momento pela página de contato ou botão flutuante.",
  },
  {
    title: "O total vai na mensagem?",
    text: "Sim. O resumo enviado para o WhatsApp já inclui itens, quantidades e valor total.",
  },
];

export default function HomePage() {
  const { categories, homeHighlights, publicProducts } = useCatalog();

  return (
    <>
      <section className="section hero-section">
        <div className="shell-container hero-grid">
          <article className="hero-main reveal">
            <p className="kicker-light">Fernandópolis - SP | Li Rilko Imports</p>
            <h1>Importados, eletrônicos e acessórios com pedido rápido pelo WhatsApp.</h1>
            <p>
              Navegue pelo catálogo, compare preços, monte seu carrinho e finalize direto com atendimento humano da
              loja.
            </p>
            <div className="hero-actions">
              <TransitionLink className="btn btn-primary" href="/catalogo">
                Ver catálogo
              </TransitionLink>
              <TransitionLink className="btn btn-dark" href="/contato">
                Falar no WhatsApp
              </TransitionLink>
            </div>

            <div className="hero-metrics">
              <div>
                <strong>Atendimento comercial ágil</strong>
                <span>Converse com a loja em minutos para tirar dúvidas e fechar seu pedido.</span>
              </div>
              <div>
                <strong>Vitrine clara no mobile</strong>
                <span>Produtos organizados por categoria para facilitar comparação na tela do celular.</span>
              </div>
              <div>
                <strong>Sem checkout complicado</strong>
                <span>Você confere tudo no carrinho e envia o pedido completo pelo WhatsApp.</span>
              </div>
            </div>
          </article>

          <aside className="hero-side reveal delay-1">
            <h2>Como comprar na Li Rilko</h2>
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

      <section className="section trust-section">
        <div className="shell-container trust-grid">
          <p>Busca e categorias para achar rápido o produto</p>
          <p>Carrinho multi-itens com ajuste de quantidade</p>
          <p>Resumo completo para finalizar no WhatsApp</p>
        </div>
      </section>

      <section className="section">
        <div className="shell-container">
          <div className="section-head reveal">
            <p className="kicker">Compre por categoria</p>
            <h2>Entre pela categoria certa e chegue mais rápido no produto ideal.</h2>
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
            <p className="kicker">Mais procurados</p>
            <h2>Produtos com maior saída para acelerar sua decisão de compra.</h2>
          </div>
          <div className="product-grid">
            {publicProducts.slice(0, 8).map((product, index) => (
              <div key={product.id} className={`reveal delay-${(index % 4) + 1}`}>
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
        <div className="shell-container">
          <div className="section-head reveal">
            <p className="kicker">Fluxo de compra</p>
            <h2>Uma jornada curta para transformar interesse em pedido.</h2>
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
        <div className="shell-container">
          <div className="section-head reveal">
            <p className="kicker">Confiança na decisão</p>
            <h2>Pontos que reduzem atrito e deixam a compra mais segura.</h2>
          </div>
          <div className="highlight-grid">
            {homeHighlights.map((item, index) => (
              <article key={item.title} className={`highlight-card reveal delay-${(index % 3) + 1}`}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell-container">
          <div className="section-head reveal">
            <p className="kicker">Dúvidas frequentes</p>
            <h2>Respostas rápidas antes de finalizar no WhatsApp.</h2>
          </div>
          <div className="highlight-grid">
            {faqItems.map((item, index) => (
              <article key={item.title} className={`highlight-card reveal delay-${(index % 3) + 1}`}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
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
            <TransitionLink className="btn btn-primary" href="/contato">
              Finalizar no WhatsApp
            </TransitionLink>
            <TransitionLink className="btn btn-surface" href="/catalogo">
              Ver produtos
            </TransitionLink>
          </div>
        </div>
      </section>
    </>
  );
}
