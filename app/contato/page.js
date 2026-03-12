"use client";

import { IconWhatsApp } from "@/components/icons";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { defaultAttendants, getPrimaryAttendant } from "@/lib/attendants-data";
import { buildAttendantWhatsAppLink, buildWhatsAppLink, buildWhatsAppMessage } from "@/lib/store-utils";

export default function ContactPage() {
  const { contactChannels, siteSettings } = useCatalog();
  const { items } = useCart();
  const { showToast } = useToast();
  const attendants = defaultAttendants;
  const primaryAttendant = getPrimaryAttendant(attendants);
  const message = buildWhatsAppMessage(items, siteSettings);

  const whatsappLink = buildWhatsAppLink(items, siteSettings, primaryAttendant?.phone);

  function handleStartContact(event) {
    if (!whatsappLink) {
      event.preventDefault();
      showToast({
        type: "warning",
        title: "Atendimento indisponível",
        message: "Nenhum atendente com número válido está configurado no momento.",
      });
      return;
    }

    showToast({
      type: "success",
      title: "Abrindo atendimento",
      message: primaryAttendant
        ? `Você será direcionado para o WhatsApp de ${primaryAttendant.name}.`
        : "Você será direcionado para o WhatsApp da loja.",
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
            <a
              className="btn btn-whatsapp"
              href={whatsappLink || "#"}
              target={whatsappLink ? "_blank" : undefined}
              rel={whatsappLink ? "noreferrer" : undefined}
              onClick={handleStartContact}
            >
              <IconWhatsApp className="icon" />
              {primaryAttendant ? `Iniciar conversa com ${primaryAttendant.name}` : "WhatsApp indisponível"}
            </a>
          </article>

          <aside className="contact-side-card reveal delay-1">
            <h3>Atendentes no WhatsApp</h3>
            <ul>
              {attendants.length > 0 ? (
                attendants.map((attendant, index) => {
                  const link = buildAttendantWhatsAppLink(message, attendant);

                  return (
                    <li key={`${attendant.phone}-${index}`}>
                      <strong>{index === 0 ? `${attendant.name} (principal)` : attendant.name}</strong>
                      {link ? (
                        <a href={link} target="_blank" rel="noreferrer">
                          {attendant.phone}
                        </a>
                      ) : (
                        <span>Número inválido</span>
                      )}
                    </li>
                  );
                })
              ) : (
                <li>
                  <strong>Sem atendentes cadastrados</strong>
                  <span>Peça para o admin configurar ao menos 1 atendente no painel.</span>
                </li>
              )}
            </ul>

            <h3>Outros canais</h3>
            <ul>
              {contactChannels.map((channel) => (
                <li key={channel.id || channel.title}>
                  <strong>{channel.title}</strong>
                  {channel.href && channel.href !== "#" ? (
                    <a href={channel.href} target="_blank" rel="noreferrer">
                      {channel.value}
                    </a>
                  ) : (
                    <span>{channel.value}</span>
                  )}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </>
  );
}
