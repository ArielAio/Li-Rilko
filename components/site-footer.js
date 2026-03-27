"use client";

import { useMemo } from "react";
import { useCatalog } from "@/components/providers/catalog-provider";
import TransitionLink from "@/components/transition-link";

export default function SiteFooter() {
  const { categories, contactChannels } = useCatalog();
  const footerCategories = useMemo(() => categories.slice(0, 4), [categories]);
  const footerChannels = useMemo(
    () => contactChannels.filter((channel) => channel.value).slice(0, 3),
    [contactChannels],
  );

  return (
    <footer className="vg-footer">
      <div className="shell-container">
        <div className="vg-footer-brand">
          <span className="brand-mark">Li Rilko</span>
          <p>
            Catalogo organizado para apresentar melhor os produtos, facilitar comparacao e conduzir o fechamento com
            atendimento humano no WhatsApp.
          </p>
          <TransitionLink href="/contato" className="footer-contact-link">
            Falar com a loja
          </TransitionLink>
        </div>

        <div className="vg-footer-grid">
          <div className="vg-footer-col">
            <strong>Links rapidos</strong>
            <TransitionLink href="/">Inicio</TransitionLink>
            <TransitionLink href="/catalogo">Catalogo</TransitionLink>
            <TransitionLink href="/carrinho">Carrinho</TransitionLink>
            <TransitionLink href="/contato">Contato</TransitionLink>
          </div>

          <div className="vg-footer-col">
            <strong>Categorias</strong>
            {footerCategories.map((category) => (
              <TransitionLink key={category.name} href={`/catalogo?categoria=${encodeURIComponent(category.name)}`}>
                {category.name}
              </TransitionLink>
            ))}
          </div>

          <div className="vg-footer-col">
            <strong>Canais da loja</strong>
            {footerChannels.map((channel) =>
              channel.href && channel.href !== "#" ? (
                <a key={channel.id || channel.title} href={channel.href} target="_blank" rel="noopener noreferrer">
                  {channel.title}: {channel.value}
                </a>
              ) : (
                <span key={channel.id || channel.title} className="footer-channel-text">
                  {channel.title}: {channel.value}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
