"use client";

import { useState } from "react";
import { IconWhatsApp } from "@/components/icons";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import WhatsAppAttendantPicker from "@/components/whatsapp-attendant-picker";
import { buildFloatingWhatsAppLink } from "@/lib/store-utils";

export default function WhatsAppFloatWidget() {
  const [isCardVisible, setIsCardVisible] = useState(true);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const { siteSettings } = useCatalog();
  const { count } = useCart();
  const { showToast } = useToast();

  const attendants = Array.isArray(siteSettings.whatsappAttendants) ? siteSettings.whatsappAttendants : [];
  const hasAttendants = attendants.length > 0;
  const link = buildFloatingWhatsAppLink(siteSettings);

  function handleClick() {
    showToast({
      type: "success",
      title: "Atendimento rápido",
      message: "Abrindo WhatsApp com mensagem pronta.",
    });
  }

  function openWhatsApp(url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleOpenPicker() {
    setIsPickerOpen(true);
  }

  function handleSelectAttendant(attendant) {
    const selectedLink = buildFloatingWhatsAppLink(siteSettings, attendant.phone);
    setIsPickerOpen(false);
    showToast({
      type: "success",
      title: `Atendimento com ${attendant.name}`,
      message: "Abrindo conversa no WhatsApp.",
    });
    openWhatsApp(selectedLink);
  }

  return (
    <>
      <div className={`whatsapp-widget ${count > 0 ? "with-cart" : ""}`}>
        {isCardVisible && (
          <article className="whatsapp-widget-card" aria-live="polite">
            <button
              type="button"
              className="whatsapp-widget-close"
              onClick={() => setIsCardVisible(false)}
              aria-label="Fechar popup do WhatsApp"
            >
              ×
            </button>
            <strong>Precisa de ajuda?</strong>
            <p>{siteSettings.whatsappFloatingMessage}</p>
            {hasAttendants ? (
              <button type="button" className="whatsapp-widget-link" onClick={handleOpenPicker}>
                Escolher atendente
              </button>
            ) : (
              <a className="whatsapp-widget-link" href={link} target="_blank" rel="noreferrer" onClick={handleClick}>
                Falar no WhatsApp
              </a>
            )}
          </article>
        )}

        {hasAttendants ? (
          <button type="button" className="whatsapp-widget-fab" aria-label="Escolher atendente" onClick={handleOpenPicker}>
            <IconWhatsApp className="icon" />
          </button>
        ) : (
          <a
            className="whatsapp-widget-fab"
            href={link}
            target="_blank"
            rel="noreferrer"
            aria-label="Abrir WhatsApp"
            onClick={handleClick}
          >
            <IconWhatsApp className="icon" />
          </a>
        )}
      </div>

      <WhatsAppAttendantPicker
        isOpen={isPickerOpen}
        attendants={attendants}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleSelectAttendant}
      />
    </>
  );
}
