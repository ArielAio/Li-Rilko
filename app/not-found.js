import TransitionLink from "@/components/transition-link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="shell-container not-found-card">
        <p className="kicker">Página não encontrada</p>
        <h1>Não encontramos o conteúdo que você procurou.</h1>
        <p>Volte para o catálogo para continuar a navegação.</p>
        <TransitionLink className="btn btn-primary" href="/catalogo">
          Ir para catálogo
        </TransitionLink>
      </div>
    </section>
  );
}
