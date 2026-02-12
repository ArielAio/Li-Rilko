"use client";

import { useState } from "react";
import { IconChat } from "@/components/icons";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { siteSettings } from "@/lib/catalog-data";
import { buildFloatingWhatsAppLink } from "@/lib/store-utils";

export default function WhatsAppFloatWidget() {
  const [isCardVisible, setIsCardVisible] = useState(true);
  const { count } = useCart();
  const { showToast } = useToast();

  const link = buildFloatingWhatsAppLink();

  function handleClick() {
    showToast({
      type: "success",
      title: "Atendimento rápido",
      message: "Abrindo WhatsApp com mensagem pronta.",
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
          <a className="whatsapp-widget-link" href={link} target="_blank" rel="noreferrer" onClick={handleClick}>
            Falar no WhatsApp
          </a>
        </article>
      )}

      <a
        className="whatsapp-widget-fab"
        href={link}
        target="_blank"
        rel="noreferrer"
        aria-label="Abrir WhatsApp"
        onClick={handleClick}
      >
        <IconChat className="icon" />
      </a>
    </div>
  );
}
