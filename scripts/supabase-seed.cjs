#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { createClient } = require("@supabase/supabase-js");

const ROOT_DIR = process.cwd();
const DEFAULT_BUCKET = "product-images";
const SITE_SETTINGS_ROW_ID = 1;

function log(message) {
  process.stdout.write(`${message}\n`);
}

function normalizeEnvValue(value) {
  return String(value ?? "").trim();
}

function loadEnvFile(fileName) {
  const filePath = path.join(ROOT_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key]) {
      return;
    }

    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value.replace(/\\n/g, "\n");
  });
}

function stableUuid(namespace, value) {
  const hash = crypto
    .createHash("sha1")
    .update(`${namespace}:${String(value ?? "")}`)
    .digest("hex")
    .slice(0, 32)
    .split("");

  hash[12] = "5";
  hash[16] = ["8", "9", "a", "b"][parseInt(hash[16], 16) % 4];

  return `${hash.slice(0, 8).join("")}-${hash.slice(8, 12).join("")}-${hash
    .slice(12, 16)
    .join("")}-${hash.slice(16, 20).join("")}-${hash.slice(20, 32).join("")}`;
}

function slugify(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureRequiredEnv(key) {
  const value = normalizeEnvValue(process.env[key]);
  if (!value) {
    throw new Error(`Variável obrigatória ausente: ${key}`);
  }

  return value;
}

function readJsonFile(relativePath) {
  const filePath = path.join(ROOT_DIR, relativePath);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function ensureSuccess(response, errorMessage) {
  if (!response || !response.error) {
    return response?.data;
  }

  throw new Error(`${errorMessage}: ${response.error.message}`);
}

function resolveExtension(contentType, imageUrl) {
  const normalizedType = normalizeEnvValue(contentType).toLowerCase();

  if (normalizedType.includes("png")) {
    return "png";
  }

  if (normalizedType.includes("webp")) {
    return "webp";
  }

  if (normalizedType.includes("jpeg") || normalizedType.includes("jpg")) {
    return "jpg";
  }

  try {
    const pathname = new URL(imageUrl).pathname;
    const extension = pathname.split(".").pop();
    if (extension && /^[a-z0-9]+$/i.test(extension)) {
      return extension.toLowerCase();
    }
  } catch {}

  return "jpg";
}

async function clearProductFolder(supabase, bucket, productId) {
  const folder = `products/${productId}`;
  const objects = await ensureSuccess(
    await supabase.storage.from(bucket).list(folder, { limit: 100 }),
    `Falha ao listar objetos do produto ${productId}`,
  );

  if (!Array.isArray(objects) || objects.length === 0) {
    return;
  }

  await ensureSuccess(
    await supabase.storage.from(bucket).remove(
      objects.map((object) => `${folder}/${object.name}`),
    ),
    `Falha ao limpar imagens antigas do produto ${productId}`,
  );
}

async function uploadRemoteImage(supabase, bucket, productId, imageUrl, index) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Falha ao baixar imagem ${imageUrl}: HTTP ${response.status}`);
  }

  const contentType = normalizeEnvValue(response.headers.get("content-type")) || "image/jpeg";
  const extension = resolveExtension(contentType, imageUrl);
  const storagePath = `products/${productId}/seed-${index + 1}.${extension}`;
  const buffer = Buffer.from(await response.arrayBuffer());

  await ensureSuccess(
    await supabase.storage.from(bucket).upload(storagePath, buffer, {
      contentType,
      upsert: true,
    }),
    `Falha ao enviar imagem ${imageUrl}`,
  );

  return storagePath;
}

async function main() {
  loadEnvFile(".env");
  loadEnvFile(".env.local");

  const supabaseUrl = ensureRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = ensureRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const bucket = normalizeEnvValue(process.env.SUPABASE_STORAGE_BUCKET_PRODUCTS) || DEFAULT_BUCKET;
  const catalogSeed = readJsonFile("data/catalog-seed.json");
  const attendantsSeed = readJsonFile("data/attendants.json");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const categories = (catalogSeed.categories || []).map((category, categoryIndex) => ({
    id: stableUuid("category", category.name),
    name: category.name,
    sort_order: categoryIndex,
    is_active: true,
  }));

  await ensureSuccess(
    await supabase.from("categories").upsert(categories, { onConflict: "id" }),
    "Falha ao salvar categorias",
  );

  const categoryIdByName = new Map(categories.map((category) => [category.name, category.id]));
  const subcategories = categories.flatMap((category) => {
    const sourceCategory = (catalogSeed.categories || []).find((item) => item.name === category.name);
    return (sourceCategory?.subs || []).map((subName, subIndex) => ({
      id: stableUuid("subcategory", `${category.name}::${subName}`),
      category_id: category.id,
      name: subName,
      sort_order: subIndex,
      is_active: true,
    }));
  });

  await ensureSuccess(
    await supabase.from("subcategories").upsert(subcategories, { onConflict: "id" }),
    "Falha ao salvar subcategorias",
  );

  const subcategoryIdByKey = new Map(
    subcategories.map((sub) => [`${sub.category_id}::${sub.name}`, sub.id]),
  );

  const products = (catalogSeed.products || []).map((product, productIndex) => {
    const categoryId = categoryIdByName.get(product.category);
    const subcategoryId = subcategoryIdByKey.get(`${categoryId}::${product.sub}`);

    if (!categoryId || !subcategoryId) {
      throw new Error(`Categoria inválida para o produto ${product.name}`);
    }

    const productId = stableUuid("product", product.id || product.name);
    const slug = slugify(product.id || product.name) || `produto-${productIndex + 1}`;

    return {
      id: productId,
      slug,
      name: product.name,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      price_cash: Number(product.priceCash ?? product.priceInstallment ?? product.price ?? 0),
      price_installment: Number(product.priceInstallment ?? product.price ?? 0),
      old_price: Number(product.oldPrice ?? product.priceInstallment ?? product.price ?? 0),
      badge: product.badge || "Destaque",
      short_description:
        product.shortDescription || "Produto disponível na vitrine da loja.",
      highlights:
        Array.isArray(product.highlights) && product.highlights.length > 0
          ? product.highlights
          : ["Atendimento via WhatsApp"],
      is_visible: product.isVisible !== false,
      is_available: product.isAvailable !== false,
      sort_order: productIndex,
      source_images: Array.isArray(product.images) ? product.images : [],
    };
  });

  await ensureSuccess(
    await supabase.from("products").upsert(
      products.map(({ source_images: _sourceImages, ...row }) => row),
      { onConflict: "id" },
    ),
    "Falha ao salvar produtos",
  );

  const productIds = products.map((product) => product.id);
  if (productIds.length > 0) {
    await ensureSuccess(
      await supabase.from("product_images").delete().in("product_id", productIds),
      "Falha ao limpar imagens antigas do catálogo",
    );
  }

  const productImages = [];

  for (const product of products) {
    await clearProductFolder(supabase, bucket, product.id);

    for (const [index, imageUrl] of product.source_images.entries()) {
      const storagePath = await uploadRemoteImage(
        supabase,
        bucket,
        product.id,
        imageUrl,
        index,
      );

      productImages.push({
        id: stableUuid("product-image", `${product.id}:${index}`),
        product_id: product.id,
        storage_path: storagePath,
        sort_order: index,
      });
    }
  }

  if (productImages.length > 0) {
    await ensureSuccess(
      await supabase.from("product_images").upsert(productImages, { onConflict: "id" }),
      "Falha ao salvar imagens dos produtos",
    );
  }

  const attendants = Array.isArray(attendantsSeed?.attendants)
    ? attendantsSeed.attendants.map((attendant, index) => ({
        id: stableUuid("attendant", attendant.phone || attendant.name || index),
        name: attendant.name,
        phone: attendant.phone,
        sort_order: index,
        is_active: true,
      }))
    : [];

  if (attendants.length > 0) {
    await ensureSuccess(
      await supabase.from("attendants").upsert(attendants, { onConflict: "id" }),
      "Falha ao salvar atendentes",
    );
  }

  const contactChannels = Array.isArray(catalogSeed.contactChannels)
    ? catalogSeed.contactChannels.map((channel, index) => ({
        id: stableUuid("contact-channel", channel.id || channel.title || index),
        title: channel.title,
        value: channel.value,
        href: channel.href || "#",
        sort_order: index,
        is_active: true,
      }))
    : [];

  if (contactChannels.length > 0) {
    await ensureSuccess(
      await supabase.from("contact_channels").upsert(contactChannels, { onConflict: "id" }),
      "Falha ao salvar canais de contato",
    );
  }

  await ensureSuccess(
    await supabase.from("site_settings").upsert({
      id: SITE_SETTINGS_ROW_ID,
      whatsapp_intro:
        catalogSeed.siteSettings?.whatsappIntro ||
        "Olá! Separei esses produtos e gostaria de finalizar a compra. Pode me ajudar?",
      whatsapp_floating_message:
        catalogSeed.siteSettings?.whatsappFloatingMessage ||
        "Olá, estou navegando em sua loja e gostaria de mais informações.",
    }),
    "Falha ao salvar configurações do site",
  );

  log("Seed concluído com sucesso.");
  log(`Categorias: ${categories.length}`);
  log(`Subcategorias: ${subcategories.length}`);
  log(`Produtos: ${products.length}`);
  log(`Imagens de produtos: ${productImages.length}`);
  log(`Atendentes: ${attendants.length}`);
  log(`Canais de contato: ${contactChannels.length}`);
  log(`Bucket utilizado: ${bucket}`);
}

main().catch((error) => {
  process.stderr.write(`\n[seed] ${error.message}\n`);
  process.exitCode = 1;
});
