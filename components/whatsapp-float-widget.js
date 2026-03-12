"use client";

import { useState } from "react";
import { IconWhatsApp } from "@/components/icons";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { defaultAttendants, getPrimaryAttendant } from "@/lib/attendants-data";
import { buildFloatingWhatsAppLink } from "@/lib/store-utils";

export default function WhatsAppFloatWidget() {
  const [isCardVisible, setIsCardVisible] = useState(true);
  const { siteSettings } = useCatalog();
  const { count } = useCart();
  const { showToast } = useToast();
  const primaryAttendant = getPrimaryAttendant(defaultAttendants);

  const link = buildFloatingWhatsAppLink(siteSettings, primaryAttendant?.phone);

  function handleClick(event) {
    if (!link) {
      event.preventDefault();
      showToast({
        type: "warning",
        title: "Atendimento indisponível",
        message: "Nenhum atendente com número válido foi configurado no admin.",
      });
      return;
    }

    showToast({
      type: "success",
      title: "Atendimento rápido",
      message: primaryAttendant
        ? `Abrindo WhatsApp com mensagem pronta para ${primaryAttendant.name}.`
        : "Abrindo WhatsApp com mensagem pronta.",
    });
  }

  return (
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
          <a
            className="whatsapp-widget-link"
            href={link || "#"}
            target={link ? "_blank" : undefined}
            rel={link ? "noreferrer" : undefined}
            onClick={handleClick}
          >
            {primaryAttendant ? `Falar com ${primaryAttendant.name}` : "WhatsApp indisponível"}
          </a>
        </article>
      )}

      <a
        className="whatsapp-widget-fab"
        href={link || "#"}
        target={link ? "_blank" : undefined}
        rel={link ? "noreferrer" : undefined}
        aria-label="Abrir WhatsApp"
        onClick={handleClick}
      >
        <IconWhatsApp className="icon" />
      </a>
    </div>
  );
}
