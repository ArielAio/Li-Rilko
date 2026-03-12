const CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function normalizeCurrencyRawValue(value) {
  return String(value ?? "").replace(/[^\d,.-]/g, "").trim();
}

export function parseCurrencyInputToNumber(value) {
  const raw = normalizeCurrencyRawValue(value);

  if (!raw) {
    return 0;
  }

  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");
  let decimalSeparator = "";

  if (lastComma > -1 || lastDot > -1) {
    decimalSeparator = lastComma > lastDot ? "," : ".";
  }

  const separatorIndex = decimalSeparator ? raw.lastIndexOf(decimalSeparator) : -1;
  const integerRaw = separatorIndex === -1 ? raw : raw.slice(0, separatorIndex);
  const decimalRaw = separatorIndex === -1 ? "" : raw.slice(separatorIndex + 1);

  const integerDigits = integerRaw.replace(/\D/g, "");
  const decimalDigits = decimalRaw.replace(/\D/g, "").slice(0, 2);

  const normalizedInteger = integerDigits || "0";
  const normalizedDecimal = decimalDigits.padEnd(2, "0");
  const normalized = decimalDigits ? `${normalizedInteger}.${normalizedDecimal}` : normalizedInteger;

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Number(parsed.toFixed(2));
}

export function formatCurrencyInput(value) {
  const parsed = parseCurrencyInputToNumber(value);
  return CURRENCY_FORMATTER.format(parsed);
}

export function formatCurrencyInputForEdit(value) {
  const raw = normalizeCurrencyRawValue(value);
  if (!raw) {
    return "";
  }

  const parsed = parseCurrencyInputToNumber(value);
  return parsed.toFixed(2).replace(".", ",");
}

function normalizeBrazilPhoneForDisplay(value) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits.slice(2);
  }

  if (digits.startsWith("55") && digits.length > 2 && digits.length < 12) {
    return digits.slice(2);
  }

  return digits;
}

export function toCanonicalBrazilWhatsAppPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return "";
}

export function formatBrazilPhoneInput(value) {
  const digits = normalizeBrazilPhoneForDisplay(value).slice(0, 11);

  if (!digits) {
    return "";
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  const ddd = digits.slice(0, 2);
  const number = digits.slice(2);
  const firstBlockSize = digits.length > 10 ? 5 : 4;
  const firstBlock = number.slice(0, firstBlockSize);
  const secondBlock = number.slice(firstBlockSize, firstBlockSize + 4);

  if (!secondBlock) {
    return `(${ddd}) ${firstBlock}`;
  }

  return `(${ddd}) ${firstBlock}-${secondBlock}`;
}
