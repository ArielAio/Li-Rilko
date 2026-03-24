"use client";

import { useEffect, useMemo, useState } from "react";
import { IconWhatsApp } from "@/components/icons";

function formatPhoneLabel(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  let normalizedDigits = digits;
  if (!normalizedDigits) return "";

  if (normalizedDigits.startsWith("55") && (normalizedDigits.length === 12 || normalizedDigits.length === 13)) {
    // Already correct
  } else if (normalizedDigits.length === 10 || normalizedDigits.length === 11) {
    normalizedDigits = `55${normalizedDigits}`;
  } else {
    return `+${normalizedDigits}`;
  }

  if (normalizedDigits.length === 13) {
    return `+55 (${normalizedDigits.slice(2, 4)}) ${normalizedDigits.slice(4, 9)}-${normalizedDigits.slice(9)}`;
  }
  if (normalizedDigits.length === 12) {
    return `+55 (${normalizedDigits.slice(2, 4)}) ${normalizedDigits.slice(4, 8)}-${normalizedDigits.slice(8)}`;
  }
  return `+${normalizedDigits}`;
}

export default function WhatsAppAttendantPicker({ isOpen = false, attendants = [], onClose, onSelect }) {
  const normalizedAttendants = useMemo(
    () =>
      (Array.isArray(attendants) ? attendants : []).filter((attendant) => {
        const name = String(attendant?.name || "").trim();
        const phone = String(attendant?.phone || "").replace(/\D/g, "");
        return name && phone;
      }),
    [attendants],
  );
  const [displayAttendants, setDisplayAttendants] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    // Just display them instead of shuffling so order is consistent 
    setDisplayAttendants([...normalizedAttendants]);
  }, [isOpen, normalizedAttendants]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || normalizedAttendants.length === 0) return null;

  return (
    <div className="vg-picker-backdrop" role="presentation" onClick={onClose}>
      <section
        className="vg-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Escolher atendente do WhatsApp"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="vg-picker-header">
          <h2>Escolha a atendente</h2>
          <button type="button" className="vg-picker-close" onClick={onClose} aria-label="Fechar seleção">
            ×
          </button>
        </header>

        <p className="vg-picker-intro">
          Todas atendem com o mesmo padrão. Escolha com quem você prefere falar agora.
        </p>

        <div className="vg-picker-grid">
          {displayAttendants.map((attendant) => (
            <button
              key={attendant.id || `${attendant.name}-${attendant.phone}`}
              type="button"
              className="vg-picker-card"
              onClick={() => onSelect(attendant)}
            >
              <div className="vg-picker-info">
                <span className="vg-picker-label">Atendente</span>
                <strong>{attendant.name}</strong>
                <small>{formatPhoneLabel(attendant.phone)}</small>
              </div>
              <span className="vg-picker-action">
                <IconWhatsApp className="icon" />
                Iniciar conversa
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
