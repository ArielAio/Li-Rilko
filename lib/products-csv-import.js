import { slugify } from "@/lib/catalog-normalizer";

function parseNumber(value) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return { hasValue: false, value: null, raw };
  }

  let normalized = raw.replace(/\s+/g, "").replace(/[^0-9,.-]/g, "");
  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");

  if (lastComma >= 0 || lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandSeparator = decimalSeparator === "," ? "." : ",";

    normalized = normalized.replace(new RegExp(`\\${thousandSeparator}`, "g"), "");

    const decimalIndex = normalized.lastIndexOf(decimalSeparator);
    const integerPart = normalized.slice(0, decimalIndex).replace(new RegExp(`\\${decimalSeparator}`, "g"), "");
    const decimalPart = normalized.slice(decimalIndex + 1).replace(new RegExp(`\\${decimalSeparator}`, "g"), "");
    normalized = `${integerPart}.${decimalPart}`;
  } else {
    normalized = normalized.replace(/[.,]/g, "");
  }

  const number = Number(normalized);
  if (!Number.isFinite(number)) {
    return { hasValue: false, value: null, raw };
  }

  return {
    hasValue: true,
    value: Number(number.toFixed(2)),
    raw,
  };
}

function toBoolean(value, fallback = true) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }

  if (["1", "true", "sim", "yes", "y", "ativo"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "nao", "não", "no", "n", "inativo"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function parseCsvLine(line, delimiter) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const nextChar = line[index + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === delimiter) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function detectDelimiter(headerLine) {
  const candidates = [";", ",", "\t"];
  let best = ";";
  let bestCount = -1;

  candidates.forEach((candidate) => {
    const count = headerLine.split(candidate).length;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  });

  return best;
}

function normalizeHeader(header) {
  const key = slugify(header).replace(/-/g, "_");

  const aliases = {
    sku: "id",
    codigo: "id",
    codigo_produto: "id",
    nome: "name",
    produto: "name",
    categoria: "category",
    subcategoria: "sub",
    sub_categoria: "sub",
    sub: "sub",
    preco: "priceCash",
    venda: "priceCash",
    valor: "priceCash",
    preco_cash: "priceCash",
    preco_a_vista: "priceCash",
    preco_vista: "priceCash",
    preco_installment: "priceInstallment",
    preco_prazo: "priceInstallment",
    preco_parcelado: "priceInstallment",
    preco_antigo: "oldPrice",
    old_price: "oldPrice",
    destaque: "badge",
    badge: "badge",
    descricao: "shortDescription",
    descricao_curta: "shortDescription",
    short_description: "shortDescription",
    highlights: "highlights",
    diferenciais: "highlights",
    imagens: "images",
    image_urls: "images",
    is_visible: "isVisible",
    visivel: "isVisible",
    is_available: "isAvailable",
    disponivel: "isAvailable",
  };

  return aliases[key] || key;
}

function splitList(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return [];
  }

  const delimiter = normalized.includes("|") ? "|" : ",";
  return normalized
    .split(delimiter)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildRandomImage(seed) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed || "li-rilko-produto")}/1200/1200`;
}

function resolvePrice(rawValue, fallbackRawValue) {
  const primary = parseNumber(rawValue);
  if (primary.hasValue) {
    return primary;
  }

  return parseNumber(fallbackRawValue);
}

function buildProduct(row, index, imagesMode, missingPriceMode) {
  const name = String(row.name ?? "").trim();
  if (!name) {
    return { product: null, reason: "missing-name" };
  }

  const category = String(row.category ?? "Outros").trim() || "Outros";
  const sub = String(row.sub ?? "Itens variados").trim() || "Itens variados";
  const id = String(row.id ?? "").trim() || slugify(name) || `produto-${index + 1}`;

  const priceCashInfo = resolvePrice(row.priceCash ?? row.price, row.priceInstallment ?? row.price);
  const priceInstallmentInfo = resolvePrice(row.priceInstallment ?? row.priceCash ?? row.price, row.priceCash ?? row.price);
  const oldPriceInfo = resolvePrice(row.oldPrice, row.priceInstallment ?? row.priceCash ?? row.price);

  const priceCash = priceCashInfo.hasValue ? priceCashInfo.value : 0;
  const priceInstallment = priceInstallmentInfo.hasValue ? priceInstallmentInfo.value : priceCash;
  const oldPrice = oldPriceInfo.hasValue ? oldPriceInfo.value : priceInstallment;

  if (priceCash <= 0 || priceInstallment <= 0) {
    if (missingPriceMode === "error") {
      return {
        product: null,
        reason: "invalid-price",
        detail: `Preço ausente ou inválido para "${name}"`,
        staleId: id,
      };
    }

    return {
      product: null,
      reason: "missing-price",
      detail: `Linha ignorada por preço ausente ou inválido: "${name}"`,
      staleId: id,
    };
  }

  const highlights = splitList(row.highlights);
  const images = splitList(row.images);
  const resolvedImages =
    images.length > 0
      ? images
      : imagesMode === "random"
        ? [buildRandomImage(id || name || `produto-${index + 1}`)]
        : [];

  return {
    product: {
      id,
      name,
      category,
      sub,
      priceCash,
      priceInstallment,
      oldPrice,
      badge: String(row.badge ?? "").trim(),
      shortDescription:
        String(row.shortDescription ?? "").trim() || "Produto disponível na vitrine da loja.",
      highlights: highlights.length > 0 ? highlights : ["Atendimento via WhatsApp"],
      images: resolvedImages,
      isVisible: toBoolean(row.isVisible, true),
      isAvailable: toBoolean(row.isAvailable, true),
    },
    reason: "ok",
  };
}

export function parseProductsCsvImport(
  content,
  {
    imagesMode = "blank",
    missingPriceMode = "skip",
  } = {},
) {
  const lines = String(content ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV precisa conter cabeçalho + pelo menos 1 linha de produto.");
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter).map(normalizeHeader);
  const products = [];
  let skippedMissingName = 0;
  let skippedMissingPrice = 0;
  const discardedProductIds = new Set();

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const values = parseCsvLine(lines[lineIndex], delimiter);
    const row = {};

    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex] ?? "";
    });

    const result = buildProduct(row, lineIndex - 1, imagesMode, missingPriceMode);
    if (!result.product) {
      if (result.reason === "invalid-price") {
        throw new Error(`${result.detail} (linha ${lineIndex + 1})`);
      }

      if (result.reason === "missing-name") {
        skippedMissingName += 1;
      }

      if (result.reason === "missing-price") {
        skippedMissingPrice += 1;
        if (result.staleId) {
          discardedProductIds.add(String(result.staleId));
        }
      }

      continue;
    }

    products.push(result.product);
  }

  return {
    products,
    skippedMissingName,
    skippedMissingPrice,
    discardedProductIds: Array.from(discardedProductIds),
    delimiter,
  };
}
