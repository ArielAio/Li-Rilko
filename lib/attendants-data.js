import attendantsSource from "@/data/attendants.json";
import { sanitizeAttendants } from "@/lib/attendants-utils";

export const defaultAttendants = sanitizeAttendants(attendantsSource?.attendants);

export function getPrimaryAttendant(attendants = defaultAttendants) {
  if (!Array.isArray(attendants) || attendants.length === 0) {
    return null;
  }

  return attendants[0] || null;
}
