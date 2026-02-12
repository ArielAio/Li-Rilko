"use client";

import { useEffect, useRef, useState } from "react";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useToast } from "@/components/providers/toast-provider";

export default function AdminWhatsAppManager() {
  const { siteSettings, saveSiteSettings } = useCatalog();
  const { showToast } = useToast();
  const [settingsDraft, setSettingsDraft] = useState(siteSettings);
  const [isEditMode, setIsEditMode] = useState(false);
  const shouldRevealEditorRef = useRef(false);
  const editorFormRef = useRef(null);

  useEffect(() => {
    setSettingsDraft(siteSettings);
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
    setSettingsDraft(siteSettings);
    setIsEditMode(true);
  }

  function handleSaveSettings(event) {
    event.preventDefault();
    saveSiteSettings(settingsDraft);
    setIsEditMode(false);
    showToast({
      type: "success",
      title: "Configurações salvas",
      message: "Mensagens e número do WhatsApp atualizados.",
    });
  }

  return (
    <div className="admin-manager">
      <div className="admin-manager-toolbar">
        <div>
          <h3>Configurações do WhatsApp</h3>
          <p>Defina o número da loja e as mensagens padrão enviadas ao atendimento.</p>
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
        </div>
      )}
    </div>
  );
}
