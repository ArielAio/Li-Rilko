"use client";

import { useEffect, useState } from "react";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useToast } from "@/components/providers/toast-provider";
import { formatBrazilPhoneInput, toCanonicalBrazilWhatsAppPhone } from "@/lib/admin-input-formatters";

function createEmptyAttendant() {
  return {
    id: "",
    name: "",
    phone: "",
  };
}

function createChannelDraft(channel, index) {
  return {
    id: channel.id || `channel-${index + 1}`,
    title: channel.title || "",
    value: channel.value || "",
    href: channel.href || "#",
  };
}

function createSettingsDraft(settings) {
  return {
    whatsappIntro: settings?.whatsappIntro || "",
    whatsappFloatingMessage: settings?.whatsappFloatingMessage || "",
  };
}

function toDisplayAttendantDraft(attendant) {
  return {
    id: attendant?.id || "",
    name: attendant?.name || "",
    phone: formatBrazilPhoneInput(attendant?.phone || ""),
  };
}

function toCanonicalAttendantDraft(attendant) {
  return {
    id: attendant?.id || "",
    name: attendant?.name || "",
    phone: toCanonicalBrazilWhatsAppPhone(attendant?.phone || ""),
  };
}

export default function AdminServiceManager() {
  const {
    attendants,
    contactChannels,
    refreshAdminCatalog,
    saveAttendants,
    saveContactChannels,
    siteSettings,
    saveSiteSettings,
  } = useCatalog();
  const { showToast } = useToast();

  const [channelDrafts, setChannelDrafts] = useState([]);
  const [settingsDraft, setSettingsDraft] = useState(() => createSettingsDraft(siteSettings));
  const [attendantsDraft, setAttendantsDraft] = useState([createEmptyAttendant()]);
  const [isLoadingAttendants, setIsLoadingAttendants] = useState(false);
  const [isSavingAttendants, setIsSavingAttendants] = useState(false);

  useEffect(() => {
    setChannelDrafts(contactChannels.map(createChannelDraft));
  }, [contactChannels]);

  useEffect(() => {
    setSettingsDraft(createSettingsDraft(siteSettings));
  }, [siteSettings]);

  useEffect(() => {
    const nextDrafts = attendants.map(toDisplayAttendantDraft);
    setAttendantsDraft(nextDrafts.length > 0 ? nextDrafts : [createEmptyAttendant()]);
  }, [attendants]);

  function handleSaveChannels(event) {
    event.preventDefault();

    void (async () => {
      const result = await saveContactChannels(channelDrafts);
      if (!result.ok) {
        showToast({
          type: "warning",
          title: "Erro ao salvar canais",
          message: result.error || "Não foi possível salvar os canais agora.",
        });
        return;
      }

      showToast({
        type: "success",
        title: "Canais atualizados",
        message: "Dados da página de contato foram salvos.",
      });
    })();
  }

  function handleSaveMessages(event) {
    event.preventDefault();

    void (async () => {
      const result = await saveSiteSettings({
        whatsappIntro: settingsDraft.whatsappIntro,
        whatsappFloatingMessage: settingsDraft.whatsappFloatingMessage,
      });

      if (!result.ok) {
        showToast({
          type: "warning",
          title: "Erro ao salvar mensagens",
          message: result.error || "Não foi possível salvar as mensagens agora.",
        });
        return;
      }

      showToast({
        type: "success",
        title: "Mensagens atualizadas",
        message: "Textos padrão do WhatsApp foram salvos.",
      });
    })();
  }

  async function handleRefreshAttendants() {
    setIsLoadingAttendants(true);
    const result = await refreshAdminCatalog();
    setIsLoadingAttendants(false);

    if (!result.ok) {
      showToast({
        type: "warning",
        title: "Falha ao atualizar",
        message: result.error || "Não foi possível atualizar a lista agora. Tente novamente em instantes.",
      });
      return;
    }

    showToast({
      type: "success",
      title: "Lista atualizada",
      message: "A lista de atendentes foi atualizada com sucesso.",
    });
  }

  async function handleSaveAttendants(event) {
    event.preventDefault();

    if (isSavingAttendants) {
      return;
    }

    setIsSavingAttendants(true);
    const result = await saveAttendants(attendantsDraft.map(toCanonicalAttendantDraft));
    setIsSavingAttendants(false);

    if (!result.ok) {
      showToast({
        type: "warning",
        title: "Falha ao salvar atendentes",
        message: result.error || "Não foi possível salvar os atendentes agora.",
      });
      return;
    }

    showToast({
      type: "success",
      title: "Atendentes salvos",
      message: "Os atendentes foram atualizados com sucesso.",
    });
  }

  function updateAttendantField(index, field, value) {
    setAttendantsDraft((prev) =>
      prev.map((attendant, rowIndex) =>
        rowIndex === index
          ? {
              ...attendant,
              [field]: field === "phone" ? formatBrazilPhoneInput(value) : value,
            }
          : attendant,
      ),
    );
  }

  function moveAttendant(index, offset) {
    setAttendantsDraft((prev) => {
      const targetIndex = index + offset;
      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }

      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  function removeAttendant(index) {
    setAttendantsDraft((prev) => {
      if (prev.length <= 1) {
        return prev;
      }

      return prev.filter((_, rowIndex) => rowIndex !== index);
    });
  }

  return (
    <div className="admin-manager">
      <div className="admin-manager-toolbar">
        <div>
          <h3>Atendimento</h3>
          <p>Gerencie atendentes e ajuste mensagens/canais exibidos no site.</p>
        </div>
        <div className="admin-manager-toolbar-actions">
          <button type="button" className="btn btn-surface" onClick={handleRefreshAttendants} disabled={isLoadingAttendants}>
            {isLoadingAttendants ? "Atualizando..." : "Atualizar atendentes"}
          </button>
        </div>
      </div>

      <section className="admin-manager-panel">
        <div className="admin-manager-title-row">
          <h4>Atendentes no WhatsApp</h4>
          <small>Com 2 ou mais atendentes, o cliente escolhe a atendente antes de abrir o WhatsApp.</small>
        </div>

        <form className="admin-form" onSubmit={handleSaveAttendants}>
          {attendantsDraft.map((attendant, index) => (
            <div key={attendant.id || `attendant-${index}`} className="admin-channel-block">
              <label className="admin-field">
                <span>Nome do atendente</span>
                <input
                  type="text"
                  value={attendant.name}
                  placeholder="Maria"
                  onChange={(event) => updateAttendantField(index, "name", event.target.value)}
                />
              </label>

              <label className="admin-field">
                <span>Número com DDD</span>
                <input
                  type="text"
                  inputMode="tel"
                  value={attendant.phone}
                  placeholder="(17) 99999-9999"
                  onChange={(event) => updateAttendantField(index, "phone", event.target.value)}
                />
              </label>

              <div className="admin-product-actions">
                <button type="button" className="btn btn-surface" onClick={() => moveAttendant(index, -1)} disabled={index === 0}>
                  Subir
                </button>
                <button
                  type="button"
                  className="btn btn-surface"
                  onClick={() => moveAttendant(index, 1)}
                  disabled={index === attendantsDraft.length - 1}
                >
                  Descer
                </button>
                <button
                  type="button"
                  className="btn btn-surface"
                  onClick={() => removeAttendant(index)}
                  disabled={attendantsDraft.length <= 1}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}

          <div className="admin-manager-footer-actions">
            <button
              type="button"
              className="btn btn-surface"
              onClick={() => setAttendantsDraft((prev) => [...prev, createEmptyAttendant()])}
            >
              Adicionar atendente
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSavingAttendants}>
              {isSavingAttendants ? "Salvando..." : "Salvar atendentes"}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-manager-panel">
        <div className="admin-manager-title-row">
          <h4>Outros canais de contato</h4>
        </div>

        <form className="admin-form" onSubmit={handleSaveChannels}>
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
      </section>

      <section className="admin-manager-panel">
        <div className="admin-manager-title-row">
          <h4>Mensagens padrão do WhatsApp</h4>
        </div>

        <form className="admin-form" onSubmit={handleSaveMessages}>
          <label className="admin-field">
            <span>Mensagem de finalização do carrinho</span>
            <textarea
              rows={4}
              value={settingsDraft.whatsappIntro}
              onChange={(event) => setSettingsDraft((prev) => ({ ...prev, whatsappIntro: event.target.value }))}
            />
          </label>

          <label className="admin-field">
            <span>Mensagem do botão flutuante</span>
            <textarea
              rows={3}
              value={settingsDraft.whatsappFloatingMessage}
              onChange={(event) => setSettingsDraft((prev) => ({ ...prev, whatsappFloatingMessage: event.target.value }))}
            />
          </label>

          <button type="submit" className="btn btn-primary">
            Salvar mensagens
          </button>
        </form>
      </section>
    </div>
  );
}
