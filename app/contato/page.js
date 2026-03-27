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

function formatPhoneLabel(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";

  if (digits.length === 13) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }

  if (digits.length === 12) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }

  return phone;
}

export default function ContactPage() {
  const { attendants, contactChannels, siteSettings } = useCatalog();
  const { items } = useCart();
  const { showToast } = useToast();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const attendantFlow = resolveAttendantFlow(attendants);
  const message =
    items.length > 0
      ? buildWhatsAppMessage(items, siteSettings)
      : "Olá! Vim pelo site da Li Rilko e gostaria de atendimento para tirar dúvidas e finalizar uma compra.";

  function handleStartContact(event) {
    event.preventDefault();

    const action = resolveWhatsAppAttendantAction(attendants, message);

    if (action.mode === "blocked") {
      showToast({
        type: "warning",
        title: "Atendimento indisponível",
        message: "Nenhum atendente com número válido está configurado no momento.",
      });
      return;
    }

    if (action.mode === "picker") {
      setPendingMessage(message);
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
          <h1>Fale com a loja</h1>
          <p>Tire dúvidas, confirme disponibilidade e finalize seu pedido no WhatsApp.</p>
        </div>
      </section>

      <section className="section">
        <div className="shell-container contact-layout">
          <article className="contact-main-card reveal">
            <h2>Atendimento no WhatsApp</h2>
            <p>Se você já montou seu carrinho, o resumo do pedido segue automaticamente na mensagem.</p>

            <a className="btn btn-whatsapp contact-primary-button" href="#" onClick={handleStartContact}>
              <IconWhatsApp className="icon" />
              {attendantFlow.mode === "blocked" ? "WhatsApp indisponível" : "Iniciar conversa no WhatsApp"}
            </a>

            <div className="contact-benefit-list">
              <span>Atendimento humano</span>
              <span>Confirmação de disponibilidade</span>
              <span>Fechamento pelo WhatsApp</span>
            </div>
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
                          {formatPhoneLabel(attendant.phone)}
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
                  <span>Peça para a loja configurar ao menos um número de atendimento.</span>
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
