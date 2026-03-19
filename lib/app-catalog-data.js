import { defaultAttendants } from "@/lib/attendants-data";
import { createDefaultCatalog } from "@/lib/catalog-data";

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createDefaultAppCatalog() {
  const catalog = createDefaultCatalog();

  return {
    ...catalog,
    attendants: deepClone(defaultAttendants),
  };
}
