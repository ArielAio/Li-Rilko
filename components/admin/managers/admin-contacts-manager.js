"use client";

import { useEffect, useRef, useState } from "react";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useToast } from "@/components/providers/toast-provider";

export default function AdminContactsManager() {
  const { contactChannels, saveContactChannels } = useCatalog();
  const { showToast } = useToast();
  const [channelDrafts, setChannelDrafts] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const shouldRevealEditorRef = useRef(false);
  const editorFormRef = useRef(null);

  useEffect(() => {
    setChannelDrafts(
      contactChannels.map((channel, index) => ({
        id: channel.id || `channel-${index + 1}`,
        title: channel.title || "",
        value: channel.value || "",
        href: channel.href || "#",
      })),
    );
  }, [contactChannels]);

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
    setChannelDrafts(
      contactChannels.map((channel, index) => ({
        id: channel.id || `channel-${index + 1}`,
        title: channel.title || "",
        value: channel.value || "",
        href: channel.href || "#",
      })),
    );
    setIsEditMode(true);
  }

  function handleSaveChannels(event) {
    event.preventDefault();
    saveContactChannels(channelDrafts);
    setIsEditMode(false);
    showToast({
      type: "success",
      title: "Canais atualizados",
      message: "Dados da página de contato foram salvos.",
    });
  }

  return (
    <div className="admin-manager">
      <div className="admin-manager-toolbar">
        <div>
          <h3>Canais de contato</h3>
          <p>Atualize os canais exibidos ao cliente na página de contato.</p>
        </div>
        <div className="admin-manager-toolbar-actions">
          {!isEditMode ? (
            <button type="button" className="btn btn-primary" onClick={openEditor}>
              Editar canais
            </button>
          ) : (
            <button type="button" className="btn btn-surface" onClick={() => setIsEditMode(false)}>
              Fechar editor
            </button>
          )}
        </div>
      </div>

      {isEditMode ? (
        <form className="admin-form" onSubmit={handleSaveChannels} ref={editorFormRef}>
          {channelDrafts.map((channel, index) => (
            <div key={`${channel.id}-${index}`} className="admin-channel-block">
              <label className="admin-field">
                <span>Título</span>
                <input
                  type="text"
                  value={channel.title}
                  onChange={(event) =>
                    setChannelDrafts((prev) =>
                      prev.map((item, rowIndex) => (rowIndex === index ? { ...item, title: event.target.value } : item)),
                    )
                  }
                />
              </label>
              <label className="admin-field">
                <span>Texto</span>
                <input
                  type="text"
                  value={channel.value}
                  onChange={(event) =>
                    setChannelDrafts((prev) =>
                      prev.map((item, rowIndex) => (rowIndex === index ? { ...item, value: event.target.value } : item)),
                    )
                  }
                />
              </label>
              <label className="admin-field">
                <span>Link</span>
                <input
                  type="text"
                  value={channel.href}
                  onChange={(event) =>
                    setChannelDrafts((prev) =>
                      prev.map((item, rowIndex) => (rowIndex === index ? { ...item, href: event.target.value } : item)),
                    )
                  }
                />
              </label>
              <button
                type="button"
                className="btn btn-surface"
                onClick={() => setChannelDrafts((prev) => prev.filter((_, rowIndex) => rowIndex !== index))}
              >
                Remover canal
              </button>
            </div>
          ))}

          <div className="admin-manager-footer-actions">
            <button
              type="button"
              className="btn btn-surface"
              onClick={() =>
                setChannelDrafts((prev) => [...prev, { id: `channel-${Date.now()}`, title: "", value: "", href: "#" }])
              }
            >
              Adicionar canal
            </button>
            <button type="submit" className="btn btn-primary">
              Salvar canais
            </button>
          </div>
        </form>
      ) : (
        <div className="admin-compact-list">
          {contactChannels.map((channel) => (
            <article key={channel.id} className="admin-compact-item">
              <strong>{channel.title}</strong>
              <p>{channel.value}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
