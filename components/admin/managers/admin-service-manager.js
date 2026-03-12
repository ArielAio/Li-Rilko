"use client";

import { useEffect, useState } from "react";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useToast } from "@/components/providers/toast-provider";
import { formatBrazilPhoneInput, toCanonicalBrazilWhatsAppPhone } from "@/lib/admin-input-formatters";

function createEmptyAttendant() {
  return {
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

function getErrorMessageFromPayload(payload, fallbackMessage) {
  if (payload && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }

  return fallbackMessage;
}

function toDisplayAttendantDraft(attendant) {
  return {
    name: attendant?.name || "",
    phone: formatBrazilPhoneInput(attendant?.phone || ""),
  };
}

function toCanonicalAttendantDraft(attendant) {
  return {
    name: attendant?.name || "",
    phone: toCanonicalBrazilWhatsAppPhone(attendant?.phone || ""),
  };
}

export default function AdminServiceManager() {
  const { contactChannels, saveContactChannels, siteSettings, saveSiteSettings } = useCatalog();
  const { showToast } = useToast();

  const [channelDrafts, setChannelDrafts] = useState([]);
  const [settingsDraft, setSettingsDraft] = useState(() => createSettingsDraft(siteSettings));
  const [attendantsDraft, setAttendantsDraft] = useState([createEmptyAttendant()]);
  const [isLoadingAttendants, setIsLoadingAttendants] = useState(false);
  const [isSavingAttendants, setIsSavingAttendants] = useState(false);
  const [lastCommitSha, setLastCommitSha] = useState("");
  const [lastPullRequestUrl, setLastPullRequestUrl] = useState("");

  useEffect(() => {
    setChannelDrafts(contactChannels.map(createChannelDraft));
  }, [contactChannels]);

  useEffect(() => {
    setSettingsDraft(createSettingsDraft(siteSettings));
  }, [siteSettings]);

  useEffect(() => {
    let isMounted = true;

    async function loadAttendants() {
      setIsLoadingAttendants(true);

      try {
        const response = await fetch("/api/admin/attendants", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(getErrorMessageFromPayload(payload, "Não foi possível carregar atendentes."));
        }

        if (!isMounted) {
          return;
        }

        const list = Array.isArray(payload?.attendants)
          ? payload.attendants.map(toDisplayAttendantDraft)
          : [];

        setAttendantsDraft(list.length > 0 ? list : [createEmptyAttendant()]);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setAttendantsDraft((current) => (current.length > 0 ? current : [createEmptyAttendant()]));
        showToast({
          type: "warning",
          title: "Falha ao carregar atendentes",
          message: error instanceof Error ? error.message : "Tente novamente em instantes.",
        });
      } finally {
        if (isMounted) {
          setIsLoadingAttendants(false);
        }
      }
    }

    void loadAttendants();

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  function handleSaveChannels(event) {
    event.preventDefault();
    saveContactChannels(channelDrafts);
    showToast({
      type: "success",
      title: "Canais atualizados",
      message: "Dados da página de contato foram salvos.",
    });
  }

  function handleSaveMessages(event) {
    event.preventDefault();

    saveSiteSettings({
      whatsappIntro: settingsDraft.whatsappIntro,
      whatsappFloatingMessage: settingsDraft.whatsappFloatingMessage,
    });

    showToast({
      type: "success",
      title: "Mensagens atualizadas",
      message: "Textos padrão do WhatsApp foram salvos.",
    });
  }

  async function handleRefreshAttendants() {
    setIsLoadingAttendants(true);

    try {
      const response = await fetch("/api/admin/attendants", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getErrorMessageFromPayload(payload, "Não foi possível atualizar a lista agora."));
      }

      const list = Array.isArray(payload?.attendants)
        ? payload.attendants.map(toDisplayAttendantDraft)
        : [];

      setAttendantsDraft(list.length > 0 ? list : [createEmptyAttendant()]);
      showToast({
        type: "success",
        title: "Lista atualizada",
        message: "Atendentes carregados a partir do JSON do repositório.",
      });
    } catch (error) {
      showToast({
        type: "warning",
        title: "Falha ao atualizar",
        message: error instanceof Error ? error.message : "Tente novamente em instantes.",
      });
    } finally {
      setIsLoadingAttendants(false);
    }
  }

  async function handleSaveAttendants(event) {
    event.preventDefault();

    if (isSavingAttendants) {
      return;
    }

    setIsSavingAttendants(true);

    try {
      const response = await fetch("/api/admin/attendants", {
        method: "PUT",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attendants: attendantsDraft.map(toCanonicalAttendantDraft),
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getErrorMessageFromPayload(payload, "Não foi possível salvar atendentes no GitHub."));
      }

      const list = Array.isArray(payload?.attendants)
        ? payload.attendants.map(toDisplayAttendantDraft)
        : [];

      setAttendantsDraft(list.length > 0 ? list : [createEmptyAttendant()]);
      setLastCommitSha(payload?.commitSha || "");
      setLastPullRequestUrl(payload?.pullRequestUrl || "");

      const pullRequestLabel = payload?.pullRequestNumber
        ? `PR #${payload.pullRequestNumber}`
        : "pull request de atendentes";
      const changeStatusMessage = payload?.unchanged
        ? "Sem mudanças novas no branch de trabalho."
        : `${pullRequestLabel} atualizado para aguardar checks.`;
      const autoMergeMessage =
        typeof payload?.autoMergeStatusMessage === "string" && payload.autoMergeStatusMessage.trim()
          ? payload.autoMergeStatusMessage
          : "Acompanhe o quality-gate antes do merge.";

      showToast({
        type: "success",
        title: "Atendentes salvos",
        message: `${changeStatusMessage} ${autoMergeMessage}`,
      });
    } catch (error) {
      showToast({
        type: "warning",
        title: "Falha ao salvar atendentes",
        message: error instanceof Error ? error.message : "Verifique as variáveis do GitHub e tente novamente.",
      });
    } finally {
      setIsSavingAttendants(false);
    }
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
          <p>Gerencie atendentes via JSON no repositório e ajuste mensagens/canais exibidos no site.</p>
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
            <div key={`attendant-${index}`} className="admin-channel-block">
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
            <button type="button" className="btn btn-surface" onClick={() => setAttendantsDraft((prev) => [...prev, createEmptyAttendant()])}>
              Adicionar atendente
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSavingAttendants}>
              {isSavingAttendants ? "Salvando no GitHub..." : "Salvar atendentes"}
            </button>
          </div>

          {lastCommitSha ? <small>Último commit: {lastCommitSha.slice(0, 7)}</small> : null}
          {lastPullRequestUrl ? (
            <small>
              Pull request:{" "}
              <a href={lastPullRequestUrl} target="_blank" rel="noreferrer">
                abrir PR
              </a>
            </small>
          ) : null}
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
