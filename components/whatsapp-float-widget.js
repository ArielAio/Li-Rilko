"use client";

import { usePathname } from "next/navigation";
import { IconWhatsApp } from "@/components/icons";
import WhatsAppAttendantPicker from "@/components/whatsapp-attendant-picker";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { buildAttendantWhatsAppLink } from "@/lib/store-utils";
import { openWhatsAppLink, resolveWhatsAppAttendantAction } from "@/lib/whatsapp-attendant-flow";

export default function WhatsAppFloatWidget() {
  const {
    attendants,
    siteSettings,
    isWhatsAppPickerOpen,
    whatsappPendingMessage,
    openWhatsAppPicker,
    closeWhatsAppPicker,
  } = useCatalog();
  const pathname = usePathname();
  const { count } = useCart();
  const { showToast } = useToast();

  const shouldHideTrigger =
    pathname?.startsWith("/carrinho") ||
    pathname?.startsWith("/contato") ||
    pathname?.startsWith("/produto/") ||
    pathname?.startsWith("/admin");

  function handleOpenWhatsApp() {
    const message = siteSettings.whatsappFloatingMessage;
    const action = resolveWhatsAppAttendantAction(attendants, message);

    if (action.mode === "blocked") {
      showToast({
        type: "warning",
        title: "Atendimento indisponível",
        message: "Nenhum canal de WhatsApp está configurado no momento.",
      });
      return;
    }

    if (action.mode === "picker") {
      openWhatsAppPicker(message);
      return;
    }

    openWhatsAppLink(action.link);
    showToast({
      type: "success",
      title: "Atendimento rápido",
      message: `Abrindo WhatsApp com ${action.attendant.name}.`,
    });
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
      message: `Abrindo WhatsApp com ${attendant.name}.`,
    });
    closeWhatsAppPicker();
  }

  return (
    <>
      {!shouldHideTrigger && (
        <div className={`vg-whatsapp-widget ${count > 0 ? "with-cart" : ""}`}>
          <button type="button" className="vg-widget-trigger" onClick={handleOpenWhatsApp} aria-label="Falar com a loja no WhatsApp">
            <IconWhatsApp className="icon" />
            <span>
              <strong>Atendimento no WhatsApp</strong>
              <small>Fale com a loja</small>
            </span>
          </button>
        </div>
      )}

      <WhatsAppAttendantPicker
        isOpen={isWhatsAppPickerOpen}
        attendants={attendants}
        onClose={closeWhatsAppPicker}
        onSelect={handleSelectAttendant}
      />
    </>
  );
}
