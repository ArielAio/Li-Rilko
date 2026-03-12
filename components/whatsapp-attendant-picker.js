"use client";

import { useEffect, useMemo, useState } from "react";
import { IconWhatsApp } from "@/components/icons";

function shuffleAttendants(attendants) {
  const next = [...attendants];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }

  return next;
}

function formatPhoneLabel(phone) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.length === 13 && digits.startsWith("55")) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }

  if (digits.length === 12 && digits.startsWith("55")) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }

  if (digits.length > 2) {
    return `+${digits}`;
  }

  return digits;
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
    if (!isOpen) {
      return;
    }
    setDisplayAttendants(shuffleAttendants(normalizedAttendants));
  }, [isOpen, normalizedAttendants]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.classList.add("modal-open");
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || normalizedAttendants.length === 0) {
    return null;
  }

  return (
    <div className="whatsapp-picker-backdrop" role="presentation" onClick={onClose}>
      <section
        className="whatsapp-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Escolher atendente do WhatsApp"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="whatsapp-picker-header">
          <h2>Escolha a atendente</h2>
          <button type="button" className="whatsapp-picker-close" onClick={onClose} aria-label="Fechar seleção">
            ×
          </button>
        </header>

        <p className="whatsapp-picker-intro">
          Todas atendem com o mesmo padrão. Escolha com quem você prefere falar agora.
        </p>

        <div className="whatsapp-picker-grid">
          {displayAttendants.map((attendant) => (
            <button
              key={attendant.id || `${attendant.name}-${attendant.phone}`}
              type="button"
              className="whatsapp-picker-card"
              onClick={() => onSelect(attendant)}
            >
              <span className="whatsapp-picker-card-label">Atendente</span>
              <strong>{attendant.name}</strong>
              <small>{formatPhoneLabel(attendant.phone)}</small>
              <span className="whatsapp-picker-card-action">
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
