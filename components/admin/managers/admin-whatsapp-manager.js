"use client";

import { useEffect, useRef, useState } from "react";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useToast } from "@/components/providers/toast-provider";

function createAttendantId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `attendant-${crypto.randomUUID()}`;
  }
  return `attendant-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function stripBrazilCountryCode(value) {
  const digits = digitsOnly(value);

  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits.slice(2);
  }

  return digits;
}

function parseBrazilPhone(value) {
  const localDigits = stripBrazilCountryCode(value).slice(0, 11);
  const hasInput = localDigits.length > 0;
  const isValid = localDigits.length === 10 || localDigits.length === 11;

  return {
    hasInput,
    isValid,
    localDigits,
    normalized: isValid ? `55${localDigits}` : "",
  };
}

function maskBrazilPhoneInput(value) {
  const { localDigits } = parseBrazilPhone(value);

  if (!localDigits) {
    return "";
  }

  if (localDigits.length <= 2) {
    return `(${localDigits}`;
  }

  const ddd = localDigits.slice(0, 2);
  const number = localDigits.slice(2);

  if (number.length <= 4) {
    return `(${ddd}) ${number}`;
  }

  if (localDigits.length === 10) {
    return `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
  }

  return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5, 9)}`;
}

function createSettingsDraft(siteSettings) {
  return {
    whatsappIntro: siteSettings?.whatsappIntro || "",
    whatsappFloatingMessage: siteSettings?.whatsappFloatingMessage || "",
    whatsappAttendants: Array.isArray(siteSettings?.whatsappAttendants)
      ? siteSettings.whatsappAttendants.map((attendant, index) => ({
          id: attendant.id || `attendant-${index + 1}`,
          name: attendant.name || "",
          phone: maskBrazilPhoneInput(attendant.phone || ""),
        }))
      : [],
  };
}

function formatPhoneLabel(phone) {
  const normalized = parseBrazilPhone(phone).normalized;

  if (!normalized) {
    return "Não informado";
  }

  if (normalized.length === 13) {
    return `+55 (${normalized.slice(2, 4)}) ${normalized.slice(4, 9)}-${normalized.slice(9)}`;
  }

  if (normalized.length === 12) {
    return `+55 (${normalized.slice(2, 4)}) ${normalized.slice(4, 8)}-${normalized.slice(8)}`;
  }

  return `+${normalized}`;
}

export default function AdminWhatsAppManager() {
  const { siteSettings, saveSiteSettings } = useCatalog();
  const { showToast } = useToast();
  const [settingsDraft, setSettingsDraft] = useState(() => createSettingsDraft(siteSettings));
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const shouldRevealEditorRef = useRef(false);
  const editorFormRef = useRef(null);

  useEffect(() => {
    setSettingsDraft(createSettingsDraft(siteSettings));
  }, [siteSettings]);

  useEffect(() => {
    if (!isEditMode || !shouldRevealEditorRef.current) {
      return undefined;
    }

    shouldRevealEditorRef.current = false;

    const frame = window.requestAnimationFrame(() => {
      editorFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      const firstField = editorFormRef.current?.querySelector("input, textarea, select");
      if (firstField && typeof firstField.focus === "function") {
        firstField.focus();
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isEditMode]);

  function openEditor() {
    shouldRevealEditorRef.current = true;
    setSettingsDraft(createSettingsDraft(siteSettings));
    setIsEditMode(true);
  }

  function handleAddAttendant() {
    setSettingsDraft((prev) => ({
      ...prev,
      whatsappAttendants: [...prev.whatsappAttendants, { id: createAttendantId(), name: "", phone: "" }],
    }));
  }

  function handleUpdateAttendant(index, field, value) {
    setSettingsDraft((prev) => ({
      ...prev,
      whatsappAttendants: prev.whatsappAttendants.map((attendant, attendantIndex) =>
        attendantIndex === index ? { ...attendant, [field]: value } : attendant,
      ),
    }));
  }

  function handleRemoveAttendant(index) {
    setSettingsDraft((prev) => ({
      ...prev,
      whatsappAttendants: prev.whatsappAttendants.filter((_, attendantIndex) => attendantIndex !== index),
    }));
  }

  async function handleSaveSettings(event) {
    event.preventDefault();

    const normalizedAttendants = settingsDraft.whatsappAttendants.map((attendant) => {
      const parsedPhone = parseBrazilPhone(attendant.phone);
      return {
        id: attendant.id || createAttendantId(),
        name: String(attendant.name || "").trim(),
        phone: parsedPhone.normalized,
        hasInput: parsedPhone.hasInput,
        isValidPhone: parsedPhone.isValid,
      };
    });

    const hasInvalidAttendant = normalizedAttendants.some((attendant) => !attendant.name || !attendant.hasInput);
    if (hasInvalidAttendant) {
      showToast({
        type: "warning",
        title: "Dados incompletos",
        message: "Preencha nome e telefone de cada atendente ou remova o registro vazio.",
      });
      return;
    }

    const hasInvalidPhone = normalizedAttendants.some((attendant) => !attendant.isValidPhone);
    if (hasInvalidPhone) {
      showToast({
        type: "warning",
        title: "Telefone incompleto",
        message: "Use DDD + número (10 ou 11 dígitos). Ex.: (17) 99999-9999.",
      });
      return;
    }

    const sanitizedAttendants = normalizedAttendants.map(({ id, name, phone }) => ({
      id,
      name,
      phone,
    }));

    const hasDuplicatedPhone = new Set(sanitizedAttendants.map((attendant) => attendant.phone)).size !== sanitizedAttendants.length;
    if (hasDuplicatedPhone) {
      showToast({
        type: "warning",
        title: "Telefone duplicado",
        message: "Cada atendente precisa ter um número de WhatsApp único.",
      });
      return;
    }

    setIsSubmitting(true);
    let result = null;
    try {
      result = await saveSiteSettings({
        whatsappIntro: settingsDraft.whatsappIntro,
        whatsappFloatingMessage: settingsDraft.whatsappFloatingMessage,
        whatsappAttendants: sanitizedAttendants,
      });
    } finally {
      setIsSubmitting(false);
    }

    if (!result.ok) {
      showToast({
        type: "warning",
        title: "Erro ao salvar",
        message: result.error || "Não foi possível salvar as configurações.",
      });
      return;
    }

    setIsEditMode(false);
    showToast({
      type: "success",
      title: "Configurações salvas",
      message: "Mensagens e atendentes foram atualizados.",
    });
  }

  return (
    <div className="admin-manager">
      <div className="admin-manager-toolbar">
        <div>
          <h3>Configurações do WhatsApp</h3>
          <p>Defina as mensagens padrão e as atendentes disponíveis para escolha do cliente.</p>
        </div>
        <div className="admin-manager-toolbar-actions">
          {!isEditMode ? (
            <button type="button" className="btn btn-primary" onClick={openEditor}>
              Editar WhatsApp
            </button>
          ) : (
            <button type="button" className="btn btn-surface" onClick={() => setIsEditMode(false)}>
              Fechar editor
            </button>
          )}
        </div>
      </div>

      {isEditMode ? (
        <form className="admin-form" onSubmit={handleSaveSettings} ref={editorFormRef}>
          <label className="admin-field">
            <span>Mensagem de finalização do carrinho</span>
            <textarea
              rows={4}
              value={settingsDraft.whatsappIntro || ""}
              onChange={(event) => setSettingsDraft((prev) => ({ ...prev, whatsappIntro: event.target.value }))}
            />
          </label>

          <label className="admin-field">
            <span>Mensagem do botão flutuante</span>
            <textarea
              rows={3}
              value={settingsDraft.whatsappFloatingMessage || ""}
              onChange={(event) => setSettingsDraft((prev) => ({ ...prev, whatsappFloatingMessage: event.target.value }))}
            />
          </label>

          <div className="admin-manager-panel">
            <div className="admin-manager-title-row">
              <h4>Atendentes do WhatsApp</h4>
              <button type="button" className="btn btn-surface" onClick={handleAddAttendant}>
                Adicionar atendente
              </button>
            </div>
            <p className="admin-manager-note">
              No site público, a ordem exibida é embaralhada a cada abertura para não favorecer nenhuma atendente.
            </p>

            {settingsDraft.whatsappAttendants.length === 0 ? (
              <p className="admin-manager-note">Nenhuma atendente cadastrada. O cliente só consegue iniciar conversa após uma atendente ser cadastrada.</p>
            ) : (
              <div className="admin-compact-list">
                {settingsDraft.whatsappAttendants.map((attendant, index) => (
                  <div key={attendant.id || `${index}-${attendant.name}`} className="admin-channel-block">
                    <label className="admin-field">
                      <span>Nome da atendente</span>
                      <input
                        type="text"
                        value={attendant.name}
                        onChange={(event) => handleUpdateAttendant(index, "name", event.target.value)}
                        placeholder="Ex.: Marina"
                      />
                    </label>
                    <label className="admin-field">
                      <span>WhatsApp (DDD + número)</span>
                      <input
                        type="text"
                        value={attendant.phone}
                        onChange={(event) => handleUpdateAttendant(index, "phone", maskBrazilPhoneInput(event.target.value))}
                        placeholder="(17) 99999-9999"
                        inputMode="numeric"
                      />
                    </label>
                    <button type="button" className="btn btn-surface" onClick={() => handleRemoveAttendant(index)}>
                      Remover atendente
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar configurações"}
          </button>
        </form>
      ) : (
        <div className="admin-compact-list">
          <article className="admin-compact-item">
            <strong>Mensagem de carrinho</strong>
            <p>{siteSettings.whatsappIntro}</p>
          </article>
          <article className="admin-compact-item">
            <strong>Mensagem do botão flutuante</strong>
            <p>{siteSettings.whatsappFloatingMessage}</p>
          </article>
          <article className="admin-compact-item">
            <strong>Atendentes cadastradas</strong>
            {Array.isArray(siteSettings.whatsappAttendants) && siteSettings.whatsappAttendants.length > 0 ? (
              <ul className="admin-inline-list">
                {siteSettings.whatsappAttendants.map((attendant) => (
                  <li key={attendant.id || `${attendant.name}-${attendant.phone}`}>
                    <span>{attendant.name}</span>
                    <small>{formatPhoneLabel(attendant.phone)}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhuma atendente cadastrada. Cadastre ao menos uma para liberar contato via WhatsApp.</p>
            )}
          </article>
        </div>
      )}
    </div>
  );
}
