"use client";

import { useState } from "react";
import { IconWhatsApp } from "@/components/icons";
import WhatsAppAttendantPicker from "@/components/whatsapp-attendant-picker";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { resolveAttendantFlow } from "@/lib/attendants-data";
import { buildAttendantWhatsAppLink, buildWhatsAppMessage } from "@/lib/store-utils";
import { openWhatsAppLink, resolveWhatsAppAttendantAction } from "@/lib/whatsapp-attendant-flow";

export default function ContactPage() {
  const { contactChannels, siteSettings } = useCatalog();
  const { items } = useCart();
  const { showToast } = useToast();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const attendantFlow = resolveAttendantFlow();
  const attendants = attendantFlow.attendants;
  const message = buildWhatsAppMessage(items, siteSettings);

  function handleStartContact(event) {
    event.preventDefault();

    const contactMessage = buildWhatsAppMessage(items, siteSettings);
    const action = resolveWhatsAppAttendantAction(attendants, contactMessage);

    if (action.mode === "blocked") {
      showToast({
        type: "warning",
        title: "Atendimento indisponível",
        message: "Nenhum atendente com número válido está configurado no momento.",
      });
      return;
    }

    if (action.mode === "picker") {
      setPendingMessage(contactMessage);
      setIsPickerOpen(true);
      return;
    }

    openWhatsAppLink(action.link);
    showToast({
      type: "success",
      title: "Abrindo atendimento",
      message: `Você será direcionado para o WhatsApp de ${action.attendant.name}.`,
    });
  }

  function handleClosePicker() {
    setIsPickerOpen(false);
    setPendingMessage("");
  }

  function handleSelectAttendant(attendant) {
    const link = buildAttendantWhatsAppLink(pendingMessage, attendant);

    if (!link) {
      showToast({
        type: "warning",
        title: "Atendimento indisponível",
        message: "O número da atendente selecionada é inválido.",
      });
      return;
    }

    openWhatsAppLink(link);
    showToast({
      type: "success",
      title: "Abrindo atendimento",
      message: `Você será direcionado para o WhatsApp de ${attendant.name}.`,
    });
    handleClosePicker();
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
            <p>Com duas ou mais atendentes disponíveis, você escolhe com quem falar em cada clique.</p>
            <a className="btn btn-whatsapp" href="#" onClick={handleStartContact}>
              <IconWhatsApp className="icon" />
              {attendantFlow.mode === "blocked" ? "WhatsApp indisponível" : "Iniciar conversa no WhatsApp"}
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
                      <strong>{attendant.name}</strong>
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

      <WhatsAppAttendantPicker
        isOpen={isPickerOpen}
        attendants={attendants}
        onClose={handleClosePicker}
        onSelect={handleSelectAttendant}
      />
    </>
  );
}
