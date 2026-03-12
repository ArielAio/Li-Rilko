import attendantsSource from "@/data/attendants.json";
import { sanitizeAttendants } from "@/lib/attendants-utils";

export const defaultAttendants = sanitizeAttendants(attendantsSource?.attendants);

function resolveRuntimeAttendantsOverride() {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined") {
    return null;
  }

  const override = window.__LI_RILKO_TEST_ATTENDANTS__;
  return Array.isArray(override) ? override : null;
}

export function getValidAttendants(attendants = defaultAttendants) {
  const source = attendants === defaultAttendants ? resolveRuntimeAttendantsOverride() || attendants : attendants;
  return sanitizeAttendants(source);
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
