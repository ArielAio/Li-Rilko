"use client";

import { useMemo, useState } from "react";
import { adminLogoutAction } from "@/app/admin/actions";
import AdminModal from "@/components/admin/admin-modal";
import AdminCategoriesManager from "@/components/admin/managers/admin-categories-manager";
import AdminContactsManager from "@/components/admin/managers/admin-contacts-manager";
import AdminProductsManager from "@/components/admin/managers/admin-products-manager";
import AdminWhatsAppManager from "@/components/admin/managers/admin-whatsapp-manager";
import { useCatalog } from "@/components/providers/catalog-provider";
import TransitionLink from "@/components/transition-link";

const PANELS = {
  products: "products",
  categories: "categories",
  contacts: "contacts",
  whatsapp: "whatsapp",
};

function getPanelTitle(panel) {
  switch (panel) {
    case PANELS.products:
      return "Gerenciar produtos";
    case PANELS.categories:
      return "Gerenciar categorias";
    case PANELS.contacts:
      return "Gerenciar canais de contato";
    case PANELS.whatsapp:
      return "Gerenciar WhatsApp";
    default:
      return "";
  }
}

export default function AdminDashboard() {
  const { products, categories } = useCatalog();
  const [activePanel, setActivePanel] = useState("");

  const summary = useMemo(() => {
    const visible = products.filter((product) => product.isVisible !== false).length;
    const available = products.filter((product) => product.isAvailable !== false).length;

    return {
      totalProducts: products.length,
      visibleProducts: visible,
      hiddenProducts: Math.max(0, products.length - visible),
      availableProducts: available,
      unavailableProducts: Math.max(0, products.length - available),
    };
  }, [products]);

  return (
    <>
      <section className="section page-hero-small">
        <div className="shell-container">
          <p className="kicker">Admin</p>
          <h1>Painel da Li Rilko Imports</h1>
          <p>Acesse somente o que precisa editar. Cada módulo abre em tela dedicada para manter a operação organizada.</p>
        </div>
      </section>

      <section className="section">
        <div className="shell-container admin-hub-grid">
          <article className="admin-card reveal">
            <h2>Resumo rápido</h2>
            <div className="admin-overview-grid">
              <div>
                <strong>{summary.totalProducts}</strong>
                <span>produtos cadastrados</span>
              </div>
              <div>
                <strong>{summary.visibleProducts}</strong>
                <span>produtos visíveis</span>
              </div>
              <div>
                <strong>{summary.hiddenProducts}</strong>
                <span>produtos ocultos</span>
              </div>
              <div>
                <strong>{summary.availableProducts}</strong>
                <span>produtos disponíveis</span>
              </div>
              <div>
                <strong>{summary.unavailableProducts}</strong>
                <span>produtos indisponíveis</span>
              </div>
              <div>
                <strong>{categories.length}</strong>
                <span>categorias ativas</span>
              </div>
            </div>
          </article>

          <article className="admin-card reveal delay-1">
            <h2>Operação</h2>
            <div className="admin-module-grid">
              <article className="admin-module-card">
                <h3>Produtos</h3>
                <p>Crie, edite, oculte e altere disponibilidade dos itens do catálogo.</p>
                <button type="button" className="btn btn-primary" onClick={() => setActivePanel(PANELS.products)}>
                  Editar produtos
                </button>
              </article>

              <article className="admin-module-card">
                <h3>Categorias</h3>
                <p>Organize categorias e subcategorias exibidas no menu e filtros.</p>
                <button type="button" className="btn btn-primary" onClick={() => setActivePanel(PANELS.categories)}>
                  Editar categorias
                </button>
              </article>

              <article className="admin-module-card">
                <h3>Canais de contato</h3>
                <p>Atualize WhatsApp, Instagram, endereço e links usados no site.</p>
                <button type="button" className="btn btn-primary" onClick={() => setActivePanel(PANELS.contacts)}>
                  Editar contatos
                </button>
              </article>

              <article className="admin-module-card">
                <h3>Mensagens do WhatsApp</h3>
                <p>Defina número oficial e textos padrão do atendimento.</p>
                <button type="button" className="btn btn-primary" onClick={() => setActivePanel(PANELS.whatsapp)}>
                  Editar WhatsApp
                </button>
              </article>
            </div>
            <div className="admin-actions">
              <TransitionLink className="btn btn-surface" href="/catalogo">
                Ver site público
              </TransitionLink>
              <form action={adminLogoutAction} className="admin-logout-form">
                <button type="submit" className="btn btn-primary">
                  Sair do painel
                </button>
              </form>
            </div>
          </article>
        </div>
      </section>

      <AdminModal
        isOpen={activePanel === PANELS.products}
        title={getPanelTitle(activePanel)}
        size="xl"
        onClose={() => setActivePanel("")}
      >
        <AdminProductsManager />
      </AdminModal>

      <AdminModal
        isOpen={activePanel === PANELS.categories}
        title={getPanelTitle(activePanel)}
        size="lg"
        onClose={() => setActivePanel("")}
      >
        <AdminCategoriesManager />
      </AdminModal>

      <AdminModal
        isOpen={activePanel === PANELS.contacts}
        title={getPanelTitle(activePanel)}
        size="lg"
        onClose={() => setActivePanel("")}
      >
        <AdminContactsManager />
      </AdminModal>

      <AdminModal
        isOpen={activePanel === PANELS.whatsapp}
        title={getPanelTitle(activePanel)}
        size="md"
        onClose={() => setActivePanel("")}
      >
        <AdminWhatsAppManager />
      </AdminModal>
    </>
  );
}
