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

function createEmptyChannel() {
  return {
    id: "",
    title: "",
    value: "",
    href: "#",
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
  const [isSavingChannels, setIsSavingChannels] = useState(false);
  const [isSavingMessages, setIsSavingMessages] = useState(false);

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

  async function handleSaveMessages(event) {
    event.preventDefault();

    if (isSavingMessages) {
      return;
    }

    setIsSavingMessages(true);
    const result = await saveSiteSettings({
      whatsappIntro: settingsDraft.whatsappIntro,
      whatsappFloatingMessage: settingsDraft.whatsappFloatingMessage,
    });
    setIsSavingMessages(false);

    if (!result.ok) {
      showToast({
        type: "warning",
        title: "Erro ao salvar mensagens",
        message: result.error || "Nao foi possivel salvar as mensagens agora.",
      });
      return;
    }

    showToast({
      type: "success",
      title: "Mensagens atualizadas",
      message: "Textos padrao do WhatsApp foram salvos.",
    });
  }

  async function handleRefreshAttendants() {
    setIsLoadingAttendants(true);
    const result = await refreshAdminCatalog();
    setIsLoadingAttendants(false);

    if (!result.ok) {
      showToast({
        type: "warning",
        title: "Falha ao atualizar",
        message: result.error || "Nao foi possivel atualizar a lista agora. Tente novamente em instantes.",
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
        message: result.error || "Nao foi possivel salvar os atendentes agora.",
      });
      return;
    }

    showToast({
      type: "success",
      title: "Atendentes salvos",
      message: "Os atendentes foram atualizados com sucesso.",
    });
  }

  async function handleSaveChannels(event) {
    event.preventDefault();

    if (isSavingChannels) {
      return;
    }

    setIsSavingChannels(true);
    const result = await saveContactChannels(channelDrafts);
    setIsSavingChannels(false);

    if (!result.ok) {
      showToast({
        type: "warning",
        title: "Falha ao salvar canais",
        message: result.error || "Nao foi possivel salvar os canais agora.",
      });
      return;
    }

    showToast({
      type: "success",
      title: "Canais atualizados",
      message: "Os canais exibidos na vitrine foram atualizados.",
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

  function updateChannelField(index, field, value) {
    setChannelDrafts((prev) =>
      prev.map((channel, rowIndex) =>
        rowIndex === index
          ? {
              ...channel,
              [field]: value,
            }
          : channel,
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

  function addChannel() {
    setChannelDrafts((prev) => [...prev, createEmptyChannel()]);
  }

  function removeChannel(index) {
    setChannelDrafts((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  }

  return (
    <div className="admin-manager">
      <div className="admin-manager-toolbar">
        <div>
          <h3>Atendimento</h3>
          <p>Gerencie atendentes, canais exibidos na vitrine e mensagens do WhatsApp.</p>
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
          <small>Com 2 ou mais atendentes, o cliente escolhe com quem deseja falar antes de abrir o WhatsApp.</small>
        </div>

        <form className="admin-form" onSubmit={handleSaveAttendants}>
          {attendantsDraft.map((attendant, index) => (
            <div key={attendant.id || `attendant-${index}`} className="admin-channel-block" style={{ paddingBottom: "1.25rem", borderBottom: "1px solid var(--line)" }}>
              <div className="admin-manager-split">
                <label className="admin-field" style={{ margin: 0 }}>
                  <span>Nome do atendente</span>
                  <input
                    type="text"
                    value={attendant.name}
                    placeholder="Maria"
                    onChange={(event) => updateAttendantField(index, "name", event.target.value)}
                  />
                </label>

                <label className="admin-field" style={{ margin: 0 }}>
                  <span>Numero com DDD</span>
                  <input
                    type="text"
                    inputMode="tel"
                    value={attendant.phone}
                    placeholder="(17) 99999-9999"
                    onChange={(event) => updateAttendantField(index, "phone", event.target.value)}
                  />
                </label>
              </div>

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
            <button type="button" className="btn btn-surface" onClick={() => setAttendantsDraft((prev) => [...prev, createEmptyAttendant()])}>
              Adicionar atendente
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSavingAttendants}>
              {isSavingAttendants ? "Salvando..." : "Salvar atendentes"}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-manager-panel" style={{ marginTop: "2rem" }}>
        <div className="admin-manager-title-row">
          <h4>Canais exibidos na vitrine</h4>
          <small>Esses dados aparecem nas telas publicas e no rodape.</small>
        </div>

        <form className="admin-form" onSubmit={handleSaveChannels}>
          {channelDrafts.map((channel, index) => (
            <div key={channel.id || `channel-${index}`} className="admin-channel-block">
              <div className="admin-manager-split">
                <label className="admin-field" style={{ margin: 0 }}>
                  <span>Titulo</span>
                  <input
                    type="text"
                    value={channel.title}
                    placeholder="Instagram"
                    onChange={(event) => updateChannelField(index, "title", event.target.value)}
                  />
                </label>

                <label className="admin-field" style={{ margin: 0 }}>
                  <span>Valor</span>
                  <input
                    type="text"
                    value={channel.value}
                    placeholder="@lirilkoimportscentro"
                    onChange={(event) => updateChannelField(index, "value", event.target.value)}
                  />
                </label>
              </div>

              <div className="admin-manager-split single-column">
                <label className="admin-field" style={{ margin: 0 }}>
                  <span>Link</span>
                  <input
                    type="text"
                    value={channel.href}
                    placeholder="https://..."
                    onChange={(event) => updateChannelField(index, "href", event.target.value)}
                  />
                </label>
              </div>

              <div className="admin-product-actions">
                <button type="button" className="btn btn-surface" onClick={() => removeChannel(index)}>
                  Remover canal
                </button>
              </div>
            </div>
          ))}

          <div className="admin-manager-footer-actions">
            <button type="button" className="btn btn-surface" onClick={addChannel}>
              Adicionar canal
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSavingChannels}>
              {isSavingChannels ? "Salvando..." : "Salvar canais"}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-manager-panel" style={{ marginTop: "2rem" }}>
        <div className="admin-manager-title-row">
          <h4>Padrao de mensagens no WhatsApp</h4>
        </div>

        <form className="admin-form" onSubmit={handleSaveMessages}>
          <label className="admin-field">
            <span>Mensagem de finalizacao do carrinho</span>
            <textarea
              rows={4}
              value={settingsDraft.whatsappIntro}
              onChange={(event) => setSettingsDraft((prev) => ({ ...prev, whatsappIntro: event.target.value }))}
            />
          </label>

          <label className="admin-field">
            <span>Mensagem do botao flutuante</span>
            <textarea
              rows={3}
              value={settingsDraft.whatsappFloatingMessage}
              onChange={(event) => setSettingsDraft((prev) => ({ ...prev, whatsappFloatingMessage: event.target.value }))}
            />
          </label>

          <button type="submit" className="btn btn-primary" disabled={isSavingMessages}>
            {isSavingMessages ? "Salvando..." : "Salvar mensagens"}
          </button>
        </form>
      </section>
    </div>
  );
}
