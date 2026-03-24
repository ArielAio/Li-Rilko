"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { adminLogoutAction } from "@/app/admin/actions";
import AdminModal from "@/components/admin/admin-modal";
import AdminCategoriesManager from "@/components/admin/managers/admin-categories-manager";
import AdminProductsManager from "@/components/admin/managers/admin-products-manager";
import AdminServiceManager from "@/components/admin/managers/admin-service-manager";
import { useCatalog } from "@/components/providers/catalog-provider";

const PANELS = {
  products: "products",
  categories: "categories",
  service: "service",
};

function getPanelTitle(panel) {
  switch (panel) {
    case PANELS.products:
      return "Gerenciar produtos";
    case PANELS.categories:
      return "Gerenciar categorias";
    case PANELS.service:
      return "Gerenciar atendimento";
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
      <div className="vg-admin-wrapper">
        <header className="vg-admin-topbar">
          <div className="vg-admin-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Li Rilko / <strong>Portal Seguro</strong></span>
          </div>
          <div className="vg-admin-top-actions">
            <Link href="/" className="vg-outline-btn">Ver Loja Pública</Link>
            <form action={adminLogoutAction}>
              <button type="submit" className="vg-logout-btn">Sair do Painel</button>
            </form>
          </div>
        </header>

        <main className="vg-admin-main">
          <div className="vg-admin-hero">
            <h1>Sistema Operacional</h1>
            <p>Selecione um módulo abaixo para gerenciar o conteúdo da vitrine.</p>
          </div>

          <div className="vg-dashboard-summary">
            <div className="vg-stat-card">
              <span className="vg-stat-label">CATÁLOGO ONLINE</span>
              <strong className="vg-stat-value">{summary.visibleProducts}</strong>
            </div>
            <div className="vg-stat-card">
              <span className="vg-stat-label">ESTOQUE ESGOTADO</span>
              <strong className="vg-stat-value">{summary.unavailableProducts}</strong>
            </div>
            <div className="vg-stat-card">
              <span className="vg-stat-label">RASCUNHOS / OCULTOS</span>
              <strong className="vg-stat-value">{summary.hiddenProducts}</strong>
            </div>
            <div className="vg-stat-card">
              <span className="vg-stat-label">DEPARTAMENTOS ATIVOS</span>
              <strong className="vg-stat-value">{categories.length}</strong>
            </div>
          </div>

          <h2 className="vg-section-label">MÓDULOS DISPONÍVEIS</h2>
          
          <div className="vg-modules-grid">
            <button className="vg-module-card" onClick={() => setActivePanel(PANELS.products)}>
              <div className="vg-module-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <div className="vg-module-content">
                <h3>Gestão de Produtos</h3>
                <p>Criar, precificar e gerenciar a disponibilidade do inventário.</p>
              </div>
            </button>

            <button className="vg-module-card" onClick={() => setActivePanel(PANELS.categories)}>
              <div className="vg-module-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              </div>
              <div className="vg-module-content">
                <h3>Departamentos</h3>
                <p>Configurar a estrutura de navegação e filtros da loja.</p>
              </div>
            </button>

            <button className="vg-module-card" onClick={() => setActivePanel(PANELS.service)}>
              <div className="vg-module-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <div className="vg-module-content">
                <h3>Atendimento Especializado</h3>
                <p>Conectar números do WhatsApp e equipe de Personal Shoppers.</p>
              </div>
            </button>
          </div>
        </main>
      </div>

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
        isOpen={activePanel === PANELS.service}
        title={getPanelTitle(activePanel)}
        size="xl"
        onClose={() => setActivePanel("")}
      >
        <AdminServiceManager />
      </AdminModal>
    </>
  );
}
