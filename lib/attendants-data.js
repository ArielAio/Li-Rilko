import attendantsSource from "@/data/attendants.json";
import { sanitizeAttendants } from "@/lib/attendants-utils";

export const defaultAttendants = sanitizeAttendants(attendantsSource?.attendants);

export function getValidAttendants(attendants = defaultAttendants) {
  return sanitizeAttendants(attendants);
}

export function resolveAttendantFlow(attendants = defaultAttendants) {
  const validAttendants = getValidAttendants(attendants);

  if (validAttendants.length === 0) {
    return {
      mode: "blocked",
      attendants: [],
      attendant: null,
    };
  }

  if (validAttendants.length === 1) {
    return {
      mode: "direct",
      attendants: validAttendants,
      attendant: validAttendants[0],
    };
  }

  return {
    mode: "picker",
    attendants: validAttendants,
    attendant: null,
  };
}
