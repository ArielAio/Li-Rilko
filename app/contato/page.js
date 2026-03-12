"use client";

import { useState } from "react";
import { IconWhatsApp } from "@/components/icons";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import WhatsAppAttendantPicker from "@/components/whatsapp-attendant-picker";
import { buildWhatsAppLink, openWhatsAppLink } from "@/lib/store-utils";

export default function ContactPage() {
  const { contactChannels, siteSettings } = useCatalog();
  const { items } = useCart();
  const { showToast } = useToast();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";

  const attendants = (Array.isArray(siteSettings.whatsappAttendants) ? siteSettings.whatsappAttendants : []).filter((attendant) => {
    const name = String(attendant?.name || "").trim();
    const phone = String(attendant?.phone || "").replace(/\D/g, "");
    return name && phone;
  });

  function handleOpenPicker() {
    if (attendants.length === 0) {
      showToast({
        type: "warning",
        title: "Sem atendentes disponíveis",
        message: "No momento não há atendentes configuradas. Tente novamente mais tarde.",
      });
      return;
    }

    setIsPickerOpen(true);
  }

  function handleSelectAttendant(attendant) {
    const selectedLink = buildWhatsAppLink(items, siteSettings, {
      preferredPhone: attendant.phone,
      attendantId: attendant.id,
      attendantName: attendant.name,
      sourcePage: "Contato",
      siteUrl,
    });

    if (!selectedLink) {
      showToast({
        type: "warning",
        title: "WhatsApp não configurado",
        message: "A atendente selecionada não possui telefone válido.",
      });
      return;
    }

    setIsPickerOpen(false);
    showToast({
      type: "success",
      title: `Atendimento com ${attendant.name}`,
      message: "Abrindo WhatsApp para iniciar a conversa.",
    });
    openWhatsAppLink(selectedLink);
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
            <p className="checkout-help">Você escolhe a atendente antes de abrir a conversa.</p>
            <button type="button" className="btn btn-whatsapp" onClick={handleOpenPicker}>
              <IconWhatsApp className="icon" />
              Escolher atendente no WhatsApp
            </button>
          </article>

          <aside className="contact-side-card reveal delay-1">
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
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleSelectAttendant}
      />
    </>
  );
}
