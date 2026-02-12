"use client";

import { IconChat } from "@/components/icons";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { contactChannels } from "@/lib/catalog-data";
import { buildWhatsAppLink } from "@/lib/store-utils";

export default function ContactPage() {
  const { items } = useCart();
  const { showToast } = useToast();

  const whatsappLink = buildWhatsAppLink(items);

  function handleStartContact() {
    showToast({
      type: "success",
      title: "Abrindo atendimento",
      message: "Você será direcionado para o WhatsApp da loja.",
    });
  }

  return (
    <>
      <section className="section page-hero-small">
        <div className="shell-container">
          <p className="kicker">Contato</p>
          <h1>Atendimento direto para tirar dúvidas e finalizar pedidos.</h1>
          <p>Fale com nossa equipe e receba suporte rápido para escolher o melhor produto.</p>
        </div>
      </section>

      <section className="section">
        <div className="shell-container contact-layout">
          <article className="contact-main-card reveal">
            <h2>Fale agora com a Li Rilko</h2>
            <p>
              O WhatsApp é nosso principal canal de atendimento. Se você já montou seu carrinho, o resumo do pedido já
              segue automaticamente na mensagem.
            </p>
            <a className="btn btn-whatsapp" href={whatsappLink} target="_blank" rel="noreferrer" onClick={handleStartContact}>
              <IconChat className="icon" />
              Iniciar conversa no WhatsApp
            </a>
          </article>

          <aside className="contact-side-card reveal delay-1">
            <h3>Outros canais</h3>
            <ul>
              {contactChannels.map((channel) => (
                <li key={channel.title}>
                  <strong>{channel.title}</strong>
                  <span>{channel.value}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </>
  );
}
