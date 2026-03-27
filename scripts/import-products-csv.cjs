#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = process.cwd();
const DEFAULT_INPUT = "data/products-import.csv";
const DEFAULT_OUTPUT = "data/catalog-seed.json";

function log(message) {
  process.stdout.write(`${message}\n`);
}

function fail(message) {
  process.stderr.write(`[import-products-csv] ${message}\n`);
  process.exit(1);
}

function slugify(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

function parseArgs(argv) {
  const args = {
    input: DEFAULT_INPUT,
    output: DEFAULT_OUTPUT,
    mode: "replace",
    images: "blank",
    missingPrice: "skip",
    publish: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--help" || token === "-h") {
      args.help = true;
      continue;
    }

    if (token === "--input" || token === "-i") {
      args.input = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (token === "--output" || token === "-o") {
      args.output = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (token === "--mode" || token === "-m") {
      args.mode = argv[index + 1] || "replace";
      index += 1;
      continue;
    }

    if (token === "--images") {
      args.images = argv[index + 1] || "blank";
      index += 1;
      continue;
    }

    if (token === "--missing-price") {
      args.missingPrice = argv[index + 1] || "skip";
      index += 1;
      continue;
    }

    if (token === "--publish") {
      args.publish = true;
    }
  }

  return args;
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
      badge: String(row.badge ?? "Destaque").trim() || "Destaque",
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

function parseCsv(content, imagesMode, missingPriceMode) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    fail("CSV precisa conter cabeçalho + pelo menos 1 linha de produto.");
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
        fail(`${result.detail} (linha ${lineIndex + 1})`);
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

function readJson(relativePath) {
  const filePath = path.resolve(ROOT_DIR, relativePath);
  if (!fs.existsSync(filePath)) {
    fail(`Arquivo não encontrado: ${relativePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(relativePath, value) {
  const filePath = path.resolve(ROOT_DIR, relativePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function ensureCatalogCategories(catalogSeed, products) {
  const normalizedCategories = Array.isArray(catalogSeed.categories) ? catalogSeed.categories : [];
  const categoryMap = new Map();

  normalizedCategories.forEach((category) => {
    const categoryName = String(category?.name ?? "").trim();
    if (!categoryName) {
      return;
    }

    const key = categoryName.toLowerCase();
    const subs = Array.isArray(category?.subs)
      ? category.subs.map((sub) => String(sub ?? "").trim()).filter(Boolean)
      : [];

    categoryMap.set(key, {
      name: categoryName,
      subs,
    });
  });

  products.forEach((product) => {
    const categoryName = String(product.category ?? "").trim() || "Outros";
    const subName = String(product.sub ?? "").trim() || "Itens variados";
    const key = categoryName.toLowerCase();
    const current = categoryMap.get(key);

    if (!current) {
      categoryMap.set(key, { name: categoryName, subs: [subName] });
      return;
    }

    const hasSub = current.subs.some((sub) => sub.toLowerCase() === subName.toLowerCase());
    if (!hasSub) {
      current.subs.push(subName);
    }
  });

  catalogSeed.categories = Array.from(categoryMap.values());
}

function publishCatalogSeed(outputPath) {
  if (path.resolve(ROOT_DIR, outputPath) !== path.resolve(ROOT_DIR, DEFAULT_OUTPUT)) {
    fail("A publicação automática só funciona quando o output é data/catalog-seed.json.");
  }

  const result = spawnSync(process.execPath, [path.join(ROOT_DIR, "scripts/supabase-seed.cjs")], {
    cwd: ROOT_DIR,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    fail("Falha ao publicar os produtos no Supabase.");
  }
}

function printHelp() {
  log("Uso:");
  log("  node scripts/import-products-csv.cjs --input data/products-import.csv");
  log("");
  log("Opções:");
  log("  --input, -i   Caminho do CSV de entrada");
  log("  --output, -o  Caminho do catalog-seed.json (default: data/catalog-seed.json)");
  log("  --mode, -m    replace (default) | append");
  log("  --images      blank (default) | random");
  log("  --missing-price  skip (default) | error");
  log("  --publish     Após gerar o catalog-seed.json, publica no Supabase");
  log("");
  log("Colunas aceitas no CSV (principais):");
  log("  id, name, category, sub, priceCash, priceInstallment, oldPrice, badge,");
  log("  shortDescription, highlights, images, isVisible, isAvailable");
  log("");
  log("Dica:");
  log("  highlights e images podem usar separador | (pipe)");
  log("  colunas PRODUTO, VENDA, CATEGORIA e SUBCATEGORIA já são aceitas");
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (!["replace", "append"].includes(args.mode)) {
    fail("Modo inválido. Use --mode replace ou --mode append.");
  }

  if (!["blank", "random"].includes(args.images)) {
    fail("Modo de imagem inválido. Use --images blank ou --images random.");
  }

  if (!["skip", "error"].includes(args.missingPrice)) {
    fail("Modo de preço ausente inválido. Use --missing-price skip ou --missing-price error.");
  }

  const inputPath = path.resolve(ROOT_DIR, args.input || DEFAULT_INPUT);
  if (!fs.existsSync(inputPath)) {
    fail(`CSV não encontrado: ${args.input}`);
  }

  const csvContent = fs.readFileSync(inputPath, "utf8");
  const { products, skippedMissingName, skippedMissingPrice, discardedProductIds, delimiter } = parseCsv(
    csvContent,
    args.images,
    args.missingPrice,
  );
  if (products.length === 0) {
    fail("Nenhum produto válido encontrado no CSV.");
  }

  const catalogSeed = readJson(args.output || DEFAULT_OUTPUT);
  if (!Array.isArray(catalogSeed.products)) {
    catalogSeed.products = [];
  }

  ensureCatalogCategories(catalogSeed, products);

  if (args.mode === "append") {
    const productById = new Map(catalogSeed.products.map((product) => [String(product.id), product]));
    discardedProductIds.forEach((productId) => {
      productById.delete(String(productId));
    });
    products.forEach((product) => {
      productById.set(String(product.id), product);
    });
    catalogSeed.products = Array.from(productById.values());
  } else {
    catalogSeed.products = products;
  }

  writeJson(args.output || DEFAULT_OUTPUT, catalogSeed);

  if (args.publish) {
    publishCatalogSeed(args.output || DEFAULT_OUTPUT);
  }

  log("Importação concluída com sucesso.");
  log(`Separador detectado: ${JSON.stringify(delimiter)}`);
  log(`Produtos importados: ${products.length}`);
  log(`Linhas ignoradas (sem nome): ${skippedMissingName}`);
  log(`Linhas ignoradas (sem preço válido): ${skippedMissingPrice}`);
  log(`Imagens sem URL no CSV: ${args.images === "random" ? "preenchidas com placeholder" : "mantidas em branco"}`);
  log(`Arquivo atualizado: ${args.output || DEFAULT_OUTPUT}`);
  if (args.publish) {
    log("Publicação no Supabase concluída.");
  }
}

main();
