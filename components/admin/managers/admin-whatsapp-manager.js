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

function createSettingsDraft(siteSettings) {
  return {
    whatsappPhone: siteSettings?.whatsappPhone || "",
    whatsappIntro: siteSettings?.whatsappIntro || "",
    whatsappFloatingMessage: siteSettings?.whatsappFloatingMessage || "",
    whatsappAttendants: Array.isArray(siteSettings?.whatsappAttendants)
      ? siteSettings.whatsappAttendants.map((attendant, index) => ({
          id: attendant.id || `attendant-${index + 1}`,
          name: attendant.name || "",
          phone: attendant.phone || "",
        }))
      : [],
  };
}

function formatPhoneLabel(phone) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (!digits) {
    return "Não informado";
  }

  if (digits.length === 13 && digits.startsWith("55")) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }

  if (digits.length === 12 && digits.startsWith("55")) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }

  return `+${digits}`;
}

export default function AdminWhatsAppManager() {
  const { siteSettings, saveSiteSettings } = useCatalog();
  const { showToast } = useToast();
  const [settingsDraft, setSettingsDraft] = useState(() => createSettingsDraft(siteSettings));
  const [isEditMode, setIsEditMode] = useState(false);
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

  function handleSaveSettings(event) {
    event.preventDefault();

    const normalizedAttendants = settingsDraft.whatsappAttendants.map((attendant) => ({
      id: attendant.id || createAttendantId(),
      name: String(attendant.name || "").trim(),
      phone: String(attendant.phone || "").replace(/\D/g, ""),
    }));

    const hasInvalidAttendant = normalizedAttendants.some((attendant) => !attendant.name || !attendant.phone);
    if (hasInvalidAttendant) {
      showToast({
        type: "warning",
        title: "Dados incompletos",
        message: "Preencha nome e telefone de cada atendente ou remova o registro vazio.",
      });
      return;
    }

    const hasDuplicatedPhone = new Set(normalizedAttendants.map((attendant) => attendant.phone)).size !== normalizedAttendants.length;
    if (hasDuplicatedPhone) {
      showToast({
        type: "warning",
        title: "Telefone duplicado",
        message: "Cada atendente precisa ter um número de WhatsApp único.",
      });
      return;
    }

    saveSiteSettings({
      ...settingsDraft,
      whatsappAttendants: normalizedAttendants,
    });

    setIsEditMode(false);
    showToast({
      type: "success",
      title: "Configurações salvas",
      message: "Mensagens, número principal e atendentes foram atualizados.",
    });
  }

  return (
    <div className="admin-manager">
      <div className="admin-manager-toolbar">
        <div>
          <h3>Configurações do WhatsApp</h3>
          <p>Defina o número principal, as mensagens padrão e as atendentes disponíveis para escolha do cliente.</p>
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
            <span>Número (com DDI e DDD)</span>
            <input
              type="text"
              value={settingsDraft.whatsappPhone || ""}
              onChange={(event) => setSettingsDraft((prev) => ({ ...prev, whatsappPhone: event.target.value }))}
              placeholder="5517999999999"
            />
          </label>

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
              <p className="admin-manager-note">Nenhuma atendente cadastrada. Nesse caso, o site usa o número principal.</p>
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
                      <span>WhatsApp (com DDI e DDD)</span>
                      <input
                        type="text"
                        value={attendant.phone}
                        onChange={(event) => handleUpdateAttendant(index, "phone", event.target.value)}
                        placeholder="5517999999999"
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

          <button type="submit" className="btn btn-primary">
            Salvar configurações
          </button>
        </form>
      ) : (
        <div className="admin-compact-list">
          <article className="admin-compact-item">
            <strong>Número atual</strong>
            <p>{siteSettings.whatsappPhone || "Não configurado"}</p>
          </article>
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
              <p>Nenhuma atendente cadastrada. O site usa o número principal para todos os contatos.</p>
            )}
          </article>
        </div>
      )}
    </div>
  );
}
