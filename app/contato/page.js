"use client";

import { useState } from "react";
import { IconWhatsApp } from "@/components/icons";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import WhatsAppAttendantPicker from "@/components/whatsapp-attendant-picker";
import { buildWhatsAppLink } from "@/lib/store-utils";

export default function ContactPage() {
  const { contactChannels, siteSettings } = useCatalog();
  const { items } = useCart();
  const { showToast } = useToast();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const attendants = Array.isArray(siteSettings.whatsappAttendants) ? siteSettings.whatsappAttendants : [];
  const hasAttendants = attendants.length > 0;
  const whatsappLink = buildWhatsAppLink(items, siteSettings);

  function openWhatsApp(url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleStartContact() {
    showToast({
      type: "success",
      title: "Abrindo atendimento",
      message: "Você será direcionado para o WhatsApp da loja.",
    });
  }

  function handleOpenPicker() {
    setIsPickerOpen(true);
  }

  function handleSelectAttendant(attendant) {
    const selectedLink = buildWhatsAppLink(items, siteSettings, attendant.phone);
    setIsPickerOpen(false);
    showToast({
      type: "success",
      title: `Atendimento com ${attendant.name}`,
      message: "Abrindo WhatsApp para iniciar a conversa.",
    });
    openWhatsApp(selectedLink);
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
            {hasAttendants ? (
              <>
                <p className="checkout-help">Você escolhe a atendente antes de abrir a conversa.</p>
                <button type="button" className="btn btn-whatsapp" onClick={handleOpenPicker}>
                  <IconWhatsApp className="icon" />
                  Escolher atendente no WhatsApp
                </button>
              </>
            ) : (
              <a className="btn btn-whatsapp" href={whatsappLink} target="_blank" rel="noreferrer" onClick={handleStartContact}>
                <IconWhatsApp className="icon" />
                Iniciar conversa no WhatsApp
              </a>
            )}
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
