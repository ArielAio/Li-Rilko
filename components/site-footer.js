import TransitionLink from "@/components/transition-link";

export default function SiteFooter() {
  return (
    <footer className="vg-footer">
      <div className="shell-container">
        <div className="vg-footer-brand">
          <span className="brand-mark">
            Li Rilko
          </span>
          <p>Sua referência para curadoria de produtos exclusivos, atendendo aos padrões mais exigentes.</p>
          <div className="vg-social-links">
            <a 
              href="https://www.instagram.com/lirilkoimportscentro/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "inherit", fontWeight: 500 }}
            >
              <span className="circle-icon" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.5" y2="6.5"></line>
                </svg>
              </span>
              @lirilkoimportscentro
            </a>
          </div>
        </div>
          
        <div className="vg-footer-grid">
          <div className="vg-footer-col">
            <strong>Links Úteis</strong>
            <TransitionLink href="/catalogo">Catálogo</TransitionLink>
            <TransitionLink href="/carrinho">Carrinho</TransitionLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
