"use client";

import { useState } from "react";
import { IconWhatsApp } from "@/components/icons";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import WhatsAppAttendantPicker from "@/components/whatsapp-attendant-picker";
import { buildFloatingWhatsAppLink, openWhatsAppLink } from "@/lib/store-utils";

export default function WhatsAppFloatWidget() {
  const [isCardVisible, setIsCardVisible] = useState(true);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const { siteSettings } = useCatalog();
  const { count } = useCart();
  const { showToast } = useToast();
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
    const selectedLink = buildFloatingWhatsAppLink(siteSettings, {
      preferredPhone: attendant.phone,
      attendantId: attendant.id,
      attendantName: attendant.name,
      sourcePage: "Widget flutuante",
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
      message: "Abrindo conversa no WhatsApp.",
    });
    openWhatsAppLink(selectedLink);
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
            <button type="button" className="whatsapp-widget-link" onClick={handleOpenPicker}>
              Escolher atendente
            </button>
          </article>
        )}

        <button type="button" className="whatsapp-widget-fab" aria-label="Escolher atendente" onClick={handleOpenPicker}>
          <IconWhatsApp className="icon" />
        </button>
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
