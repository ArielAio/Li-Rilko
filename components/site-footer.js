import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell-container footer-inner">
        <p>LI RILKO IMPORTS</p>
        <div>
          <Link href="/catalogo">Catálogo</Link>
          <span>•</span>
          <Link href="/carrinho">Carrinho</Link>
          <span>•</span>
          <Link href="/contato">Contato</Link>
        </div>
      </div>
    </footer>
  );
}
