"use client";

import { useState } from "react";
import { IconWhatsApp } from "@/components/icons";
import WhatsAppAttendantPicker from "@/components/whatsapp-attendant-picker";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { resolveAttendantFlow } from "@/lib/attendants-data";
import { buildAttendantWhatsAppLink } from "@/lib/store-utils";
import { openWhatsAppLink, resolveWhatsAppAttendantAction } from "@/lib/whatsapp-attendant-flow";

export default function WhatsAppFloatWidget() {
  const [isCardVisible, setIsCardVisible] = useState(true);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const { siteSettings } = useCatalog();
  const { count } = useCart();
  const { showToast } = useToast();
  const attendantFlow = resolveAttendantFlow();
  const attendants = attendantFlow.attendants;
  const directAttendant = attendantFlow.mode === "direct" ? attendantFlow.attendant : null;

  function handleClick(event) {
    event.preventDefault();

    const message = siteSettings.whatsappFloatingMessage;
    const action = resolveWhatsAppAttendantAction(attendants, message);

    if (action.mode === "blocked") {
      showToast({
        type: "warning",
        title: "Atendimento indisponível",
        message: "Nenhum atendente com número válido foi configurado no admin.",
      });
      return;
    }

    if (action.mode === "picker") {
      setPendingMessage(message);
      setIsPickerOpen(true);
      showToast({
        type: "info",
        title: "Escolha a atendente",
        message: "Selecione uma atendente para continuar no WhatsApp.",
      });
      return;
    }

    openWhatsAppLink(action.link);
    showToast({
      type: "success",
      title: "Atendimento rápido",
      message: `Abrindo WhatsApp com mensagem pronta para ${action.attendant.name}.`,
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
      title: "Atendimento rápido",
      message: `Abrindo WhatsApp com mensagem pronta para ${attendant.name}.`,
    });
    handleClosePicker();
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
            <a className="whatsapp-widget-link" href="#" onClick={handleClick}>
              {attendantFlow.mode === "blocked"
                ? "WhatsApp indisponível"
                : directAttendant
                  ? `Falar com ${directAttendant.name}`
                  : "Escolher atendente"}
            </a>
          </article>
        )}

        <a className="whatsapp-widget-fab" href="#" aria-label="Abrir WhatsApp" onClick={handleClick}>
          <IconWhatsApp className="icon" />
        </a>
      </div>

      <WhatsAppAttendantPicker
        isOpen={isPickerOpen}
        attendants={attendants}
        onClose={handleClosePicker}
        onSelect={handleSelectAttendant}
      />
    </>
  );
}
