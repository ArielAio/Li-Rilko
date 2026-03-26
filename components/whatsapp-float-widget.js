"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { IconWhatsApp } from "@/components/icons";
import WhatsAppAttendantPicker from "@/components/whatsapp-attendant-picker";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { buildAttendantWhatsAppLink } from "@/lib/store-utils";
import { openWhatsAppLink } from "@/lib/whatsapp-attendant-flow";

export default function WhatsAppFloatWidget() {
  const [isCardVisible, setIsCardVisible] = useState(true);
  const { 
    attendants, 
    siteSettings,
    isWhatsAppPickerOpen,
    whatsappPendingMessage,
    openWhatsAppPicker,
    closeWhatsAppPicker
  } = useCatalog();
  const pathname = usePathname();
  const { count } = useCart();
  const { showToast } = useToast();

  if (pathname?.startsWith("/carrinho")) {
    return null;
  }

  function handleSelectAttendant(attendant) {
    const link = buildAttendantWhatsAppLink(whatsappPendingMessage, attendant);

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
      title: "Atendimento rápido",
      message: `Abrindo WhatsApp com mensagem pronta para ${attendant.name}.`,
    });
    closeWhatsAppPicker();
  }

  return (
    <>
      <div className={`vg-whatsapp-widget ${count > 0 ? "with-cart" : ""}`}>
        {isCardVisible && (
          <div className="vg-widget-tooltip">
            <button
              type="button"
              className="vg-widget-close"
              onClick={() => setIsCardVisible(false)}
              aria-label="Fechar popup do WhatsApp"
            >
              ×
            </button>
            <div className="vg-widget-content" onClick={() => openWhatsAppPicker(siteSettings.whatsappFloatingMessage)} role="button" tabIndex={0}>
              <strong>Precisa de ajuda?</strong>
              <p>{siteSettings.whatsappFloatingMessage}</p>
            </div>
          </div>
        )}

        <button className="vg-widget-fab" onClick={() => openWhatsAppPicker(siteSettings.whatsappFloatingMessage)} aria-label="Abrir WhatsApp">
          <IconWhatsApp className="icon" />
        </button>
      </div>

      <WhatsAppAttendantPicker
        isOpen={isWhatsAppPickerOpen}
        attendants={attendants}
        onClose={closeWhatsAppPicker}
        onSelect={handleSelectAttendant}
      />
    </>
  );
}
