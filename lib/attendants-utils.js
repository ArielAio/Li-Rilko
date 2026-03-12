import { toCanonicalBrazilWhatsAppPhone } from "@/lib/admin-input-formatters";

export const MIN_ATTENDANTS = 1;
export const MAX_ATTENDANTS = 20;

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 60;
const MIN_PHONE_DIGITS = 12;
const MAX_PHONE_DIGITS = 13;

function normalizeName(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function normalizePhone(value) {
  return toCanonicalBrazilWhatsAppPhone(value);
}

function isValidName(name) {
  return name.length >= MIN_NAME_LENGTH && name.length <= MAX_NAME_LENGTH;
}

function isValidPhone(phone) {
  return /^55\d{10,11}$/.test(phone);
}

function toNormalizedAttendant(rawItem) {
  return {
    name: normalizeName(rawItem?.name),
    phone: normalizePhone(rawItem?.phone),
  };
}

export function sanitizeAttendants(rawAttendants, options = {}) {
  const { fallback = [], requireOne = false } = options;

  if (!Array.isArray(rawAttendants)) {
    return requireOne ? fallback : [];
  }

  const normalized = rawAttendants
    .map(toNormalizedAttendant)
    .filter((attendant) => isValidName(attendant.name) && isValidPhone(attendant.phone))
    .slice(0, MAX_ATTENDANTS);

  if (requireOne && normalized.length === 0) {
    return fallback;
  }

  return normalized;
}

export function validateAttendantsInput(rawAttendants) {
  if (!Array.isArray(rawAttendants)) {
    return { ok: false, error: "A lista de atendentes precisa ser um array." };
  }

  if (rawAttendants.length < MIN_ATTENDANTS) {
    return { ok: false, error: "Cadastre pelo menos 1 atendente." };
  }

  if (rawAttendants.length > MAX_ATTENDANTS) {
    return { ok: false, error: `Limite de ${MAX_ATTENDANTS} atendentes por vez.` };
  }

  const normalized = rawAttendants.map(toNormalizedAttendant);

  for (let index = 0; index < normalized.length; index += 1) {
    const attendant = normalized[index];
    const position = index + 1;

    if (!isValidName(attendant.name)) {
      return {
        ok: false,
        error: `O nome do atendente ${position} deve ter entre ${MIN_NAME_LENGTH} e ${MAX_NAME_LENGTH} caracteres.`,
      };
    }

    if (!isValidPhone(attendant.phone)) {
      return {
        ok: false,
        error: `O número do atendente ${position} deve ser brasileiro válido com DDD (10 ou 11 dígitos).`,
      };
    }
  }

  return {
    ok: true,
    attendants: normalized,
  };
}
