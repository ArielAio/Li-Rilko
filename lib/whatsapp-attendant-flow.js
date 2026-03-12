import { resolveAttendantFlow } from "./attendants-data";
import { buildAttendantWhatsAppLink } from "./store-utils";

export function resolveWhatsAppAttendantAction(attendants, message) {
  const flow = resolveAttendantFlow(attendants);

  if (flow.mode === "blocked") {
    return {
      mode: "blocked",
      attendants: [],
      attendant: null,
      link: null,
    };
  }

  if (flow.mode === "direct") {
    const link = buildAttendantWhatsAppLink(message, flow.attendant);

    if (!link) {
      return {
        mode: "blocked",
        attendants: [],
        attendant: null,
        link: null,
      };
    }

    return {
      mode: "direct",
      attendants: flow.attendants,
      attendant: flow.attendant,
      link,
    };
  }

  return {
    mode: "picker",
    attendants: flow.attendants,
    attendant: null,
    link: null,
  };
}

export function openWhatsAppLink(link) {
  if (!link || typeof window === "undefined") {
    return false;
  }

  const popup = window.open(link, "_blank", "noopener,noreferrer");

  if (!popup) {
    window.location.assign(link);
  }

  return true;
}
