import TransitionLink from "@/components/transition-link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell-container footer-inner">
        <p>LI RILKO IMPORTS</p>
        <div>
          <TransitionLink href="/catalogo">Catálogo</TransitionLink>
          <span>•</span>
          <TransitionLink href="/carrinho">Carrinho</TransitionLink>
          <span>•</span>
          <TransitionLink href="/contato">Contato</TransitionLink>
        </div>
      </div>
    </footer>
  );
}
