import "server-only";
import { randomUUID } from "node:crypto";
import { createDefaultAppCatalog } from "@/lib/app-catalog-data";
import {
  normalizeMoney,
  normalizeText,
  sanitizeContactChannels,
  sanitizeSiteSettings,
  slugify,
} from "@/lib/catalog-normalizer";
import { validateAttendantsInput } from "@/lib/attendants-utils";
import {
  createSupabasePublicClient,
  createSupabaseServiceClient,
  getSupabaseProductsBucket,
  getSupabaseUrl,
  isSupabasePublicConfigured,
  isSupabaseServiceConfigured,
} from "@/lib/supabase-server";

const SITE_SETTINGS_ROW_ID = 1;
const MAX_PRODUCT_IMAGES = 6;
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PRODUCT_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export class CatalogRepositoryConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "CatalogRepositoryConfigError";
  }
}

export class CatalogRepositoryValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "CatalogRepositoryValidationError";
  }
}

function createCategoryDraftId(prefix, value, index) {
  return `${prefix}-${slugify(value) || index + 1}`;
}

function encodeStoragePath(storagePath) {
  return String(storagePath ?? "")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function buildDefaultImage(seed) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed || "li-rilko-produto")}/1200/1200`;
}

function buildStoragePublicUrl(storagePath) {
  const normalized = normalizeText(storagePath);
  if (!normalized) {
    return "";
  }

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) {
    return normalized;
  }

  return `${supabaseUrl}/storage/v1/object/public/${getSupabaseProductsBucket()}/${encodeStoragePath(normalized)}`;
}

function buildLookupKey(...values) {
  return values
    .map((value) => slugify(value))
    .filter(Boolean)
    .join("::");
}

export function createStagedImageId(storagePath) {
  return `staged_${Buffer.from(String(storagePath ?? ""), "utf8").toString("base64url")}`;
}

function isStagedImageId(imageId) {
  return String(imageId ?? "").startsWith("staged_");
}

function decodeStagedImageId(imageId) {
  if (!isStagedImageId(imageId)) {
    return "";
  }

  return Buffer.from(String(imageId).slice(7), "base64url").toString("utf8");
}

function ensureSupabaseServiceClient() {
  if (!isSupabaseServiceConfigured()) {
    throw new CatalogRepositoryConfigError(
      "Supabase não configurado para escrita. Defina NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY e SUPABASE_STORAGE_BUCKET_PRODUCTS.",
    );
  }

  return createSupabaseServiceClient();
}

function getCatalogReadClient() {
  if (isSupabasePublicConfigured()) {
    return createSupabasePublicClient();
  }

  if (isSupabaseServiceConfigured()) {
    return createSupabaseServiceClient();
  }

  return null;
}

function createFallbackAdminCategories(categories) {
  return categories.map((category, categoryIndex) => {
    const categoryId = createCategoryDraftId("fallback-category", category.name, categoryIndex);

    return {
      id: categoryId,
      name: category.name,
      sortOrder: categoryIndex,
      isActive: true,
      subs: category.subs.map((sub, subIndex) => ({
        id: createCategoryDraftId(`${categoryId}-sub`, sub, subIndex),
        categoryId,
        name: sub,
        sortOrder: subIndex,
        isActive: true,
      })),
    };
  });
}

function buildPublicCategoriesFromAdminCategories(adminCategories) {
  return adminCategories.map((category) => ({
    name: category.name,
    subs: category.subs.map((sub) => sub.name),
  }));
}

function buildFallbackAdminBootstrap() {
  const fallback = createDefaultAppCatalog();
  const adminCategories = createFallbackAdminCategories(fallback.categories);
  const subcategoryIdByName = new Map();
  const categoryIdByName = new Map();

  adminCategories.forEach((category) => {
    categoryIdByName.set(category.name, category.id);
    category.subs.forEach((sub) => {
      subcategoryIdByName.set(`${category.name}::${sub.name}`, sub.id);
    });
  });

  return {
    categories: fallback.categories,
    adminCategories,
    products: fallback.products.map((product) => ({
      ...product,
      categoryId: categoryIdByName.get(product.category) || "",
      subcategoryId: subcategoryIdByName.get(`${product.category}::${product.sub}`) || "",
      imageItems: product.images.map((imageUrl, index) => ({
        id: createStagedImageId(imageUrl),
        storagePath: imageUrl,
        publicUrl: imageUrl,
        sortOrder: index,
      })),
    })),
    attendants: fallback.attendants.map((attendant, index) => ({
      ...attendant,
      sortOrder: index,
      isActive: true,
    })),
    contactChannels: fallback.contactChannels.map((channel, index) => ({
      ...channel,
      sortOrder: index,
      isActive: true,
    })),
    siteSettings: fallback.siteSettings,
    homeHighlights: fallback.homeHighlights,
  };
}

function normalizeImageItems(rawItems) {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems
    .map((item, index) => ({
      id: normalizeText(item?.id),
      storagePath: normalizeText(item?.storagePath),
      sortOrder: index,
    }))
    .filter((item) => item.storagePath)
    .slice(0, MAX_PRODUCT_IMAGES);
}

function normalizeProductPayload(rawPayload) {
  const name = normalizeText(rawPayload?.name);
  const categoryId = normalizeText(rawPayload?.categoryId);
  const subcategoryId = normalizeText(rawPayload?.subcategoryId);
  const badge = normalizeText(rawPayload?.badge, "Destaque");
  const shortDescription = normalizeText(
    rawPayload?.shortDescription,
    "Produto disponível na vitrine da loja.",
  );
  const imageItems = normalizeImageItems(rawPayload?.imageItems);
  const highlights = Array.isArray(rawPayload?.highlights)
    ? rawPayload.highlights.map((item) => normalizeText(item)).filter(Boolean).slice(0, 6)
    : [];

  const priceCash = normalizeMoney(rawPayload?.priceCash, 0);
  const priceInstallment = normalizeMoney(rawPayload?.priceInstallment, 0);
  const oldPrice = normalizeMoney(rawPayload?.oldPrice, priceInstallment);

  if (!name || !categoryId || !subcategoryId) {
    throw new CatalogRepositoryValidationError("Nome, categoria e subcategoria são obrigatórios.");
  }

  if (priceCash <= 0 || priceInstallment <= 0) {
    throw new CatalogRepositoryValidationError("Preços à vista e a prazo devem ser maiores que zero.");
  }

  return {
    id: normalizeText(rawPayload?.id),
    name,
    categoryId,
    subcategoryId,
    priceCash,
    priceInstallment,
    oldPrice,
    badge,
    shortDescription,
    highlights: highlights.length > 0 ? highlights : ["Atendimento via WhatsApp"],
    isVisible: rawPayload?.isVisible !== false,
    isAvailable: rawPayload?.isAvailable !== false,
    imageItems,
  };
}

function normalizeAdminCategoriesPayload(rawCategories) {
  if (!Array.isArray(rawCategories)) {
    throw new CatalogRepositoryValidationError("Formato de categorias inválido.");
  }

  const normalized = rawCategories
    .map((category, categoryIndex) => {
      const name = normalizeText(category?.name);
      const subsRaw = Array.isArray(category?.subs) ? category.subs : [];
      const subs = subsRaw
        .map((sub, subIndex) => ({
          id: normalizeText(sub?.id),
          name: normalizeText(sub?.name),
          sortOrder: subIndex,
        }))
        .filter((sub) => sub.name);

      if (!name) {
        return null;
      }

      if (subs.length === 0) {
        throw new CatalogRepositoryValidationError("Cada categoria precisa ter ao menos uma subcategoria.");
      }

      return {
        id: normalizeText(category?.id),
        name,
        sortOrder: categoryIndex,
        subs,
      };
    })
    .filter(Boolean);

  if (normalized.length === 0) {
    throw new CatalogRepositoryValidationError("Cadastre pelo menos uma categoria antes de salvar.");
  }

  return normalized;
}

function normalizeAttendantsPayload(rawAttendants) {
  if (!Array.isArray(rawAttendants)) {
    throw new CatalogRepositoryValidationError("A lista de atendentes precisa ser um array.");
  }

  const validation = validateAttendantsInput(
    rawAttendants.map((attendant) => ({
      name: attendant?.name,
      phone: attendant?.phone,
    })),
  );

  if (!validation.ok) {
    throw new CatalogRepositoryValidationError(validation.error);
  }

  return validation.attendants.map((attendant, index) => ({
    id: normalizeText(rawAttendants[index]?.id),
    name: attendant.name,
    phone: attendant.phone,
    sortOrder: index,
    isActive: true,
  }));
}

function normalizeContactChannelsPayload(rawChannels) {
  if (!Array.isArray(rawChannels)) {
    throw new CatalogRepositoryValidationError("Formato de canais inválido.");
  }

  return sanitizeContactChannels(rawChannels).map((channel, index) => ({
    id: normalizeText(channel?.id),
    title: channel.title,
    value: channel.value,
    href: channel.href,
    sortOrder: index,
    isActive: true,
  }));
}

function normalizeSiteSettingsPayload(rawSettings) {
  if (!rawSettings || typeof rawSettings !== "object") {
    throw new CatalogRepositoryValidationError("Formato de configurações inválido.");
  }

  return sanitizeSiteSettings({
    whatsappIntro: rawSettings.whatsappIntro,
    whatsappFloatingMessage: rawSettings.whatsappFloatingMessage,
  });
}

function ensureQueryResult(response, errorMessage) {
  if (response.error) {
    throw new Error(`${errorMessage}: ${response.error.message}`);
  }

  return response.data;
}

async function fetchAdminRowsWithClient(client, { publicOnly = false } = {}) {
  const categoriesQuery = client
    .from("categories")
    .select("id, name, sort_order, is_active")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const subcategoriesQuery = client
    .from("subcategories")
    .select("id, category_id, name, sort_order, is_active")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const productsQuery = client
    .from("products")
    .select(
      "id, slug, name, category_id, subcategory_id, price_cash, price_installment, old_price, badge, short_description, highlights, is_visible, is_available, sort_order",
    )
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const productImagesQuery = client
    .from("product_images")
    .select("id, product_id, storage_path, sort_order")
    .order("sort_order", { ascending: true });

  const attendantsQuery = client
    .from("attendants")
    .select("id, name, phone, sort_order, is_active")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const contactChannelsQuery = client
    .from("contact_channels")
    .select("id, title, value, href, sort_order, is_active")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (publicOnly) {
    categoriesQuery.eq("is_active", true);
    subcategoriesQuery.eq("is_active", true);
    productsQuery.eq("is_visible", true);
    attendantsQuery.eq("is_active", true);
    contactChannelsQuery.eq("is_active", true);
  }

  const [categories, subcategories, products, productImages, attendants, contactChannels, siteSettings] = await Promise.all([
    categoriesQuery,
    subcategoriesQuery,
    productsQuery,
    productImagesQuery,
    attendantsQuery,
    contactChannelsQuery,
    client.from("site_settings").select("id, whatsapp_intro, whatsapp_floating_message").eq("id", SITE_SETTINGS_ROW_ID).maybeSingle(),
  ]);

  return {
    categories: ensureQueryResult(categories, "Falha ao carregar categorias"),
    subcategories: ensureQueryResult(subcategories, "Falha ao carregar subcategorias"),
    products: ensureQueryResult(products, "Falha ao carregar produtos"),
    productImages: ensureQueryResult(productImages, "Falha ao carregar imagens"),
    attendants: ensureQueryResult(attendants, "Falha ao carregar atendentes"),
    contactChannels: ensureQueryResult(contactChannels, "Falha ao carregar canais"),
    siteSettings: siteSettings.error ? null : siteSettings.data,
  };
}

function buildCatalogSnapshotFromRows(rows, { publicOnly = false } = {}) {
  const fallback = createDefaultAppCatalog();
  const activeCategoryIds = new Set();
  const adminCategories = rows.categories
    .filter((category) => !publicOnly || category.is_active !== false)
    .map((category) => {
      activeCategoryIds.add(category.id);

      const subs = rows.subcategories
        .filter((sub) => sub.category_id === category.id)
        .filter((sub) => !publicOnly || sub.is_active !== false)
        .map((sub) => ({
          id: sub.id,
          categoryId: category.id,
          name: sub.name,
          sortOrder: Number(sub.sort_order ?? 0),
          isActive: sub.is_active !== false,
        }));

      return {
        id: category.id,
        name: category.name,
        sortOrder: Number(category.sort_order ?? 0),
        isActive: category.is_active !== false,
        subs,
      };
    });

  const categories = buildPublicCategoriesFromAdminCategories(adminCategories);
  const categoryNameById = new Map(adminCategories.map((category) => [category.id, category.name]));
  const subcategoryNameById = new Map(
    adminCategories.flatMap((category) => category.subs.map((sub) => [sub.id, sub.name])),
  );

  const productImagesByProductId = new Map();

  rows.productImages.forEach((image) => {
    const current = productImagesByProductId.get(image.product_id) || [];
    current.push(image);
    productImagesByProductId.set(image.product_id, current);
  });

  const products = rows.products
    .filter((product) => !publicOnly || product.is_visible !== false)
    .map((product) => {
      const imageItems = (productImagesByProductId.get(product.id) || [])
        .sort((left, right) => Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0))
        .map((image, index) => ({
          id: image.id,
          storagePath: image.storage_path,
          publicUrl: buildStoragePublicUrl(image.storage_path),
          sortOrder: index,
        }));

      const imageUrls = imageItems.map((image) => image.publicUrl).filter(Boolean);
      const fallbackImage = buildDefaultImage(product.slug || product.name || product.id);
      const images = imageUrls.length > 0 ? imageUrls : [fallbackImage];
      const priceInstallment = normalizeMoney(product.price_installment, 0);
      const priceCash = normalizeMoney(product.price_cash, priceInstallment);
      const category = categoryNameById.get(product.category_id) || "Outros";
      const sub = subcategoryNameById.get(product.subcategory_id) || "Geral";

      return {
        id: product.id,
        slug: product.slug,
        name: normalizeText(product.name),
        categoryId: product.category_id,
        subcategoryId: product.subcategory_id,
        category,
        sub,
        price: priceInstallment,
        priceInstallment,
        priceCash,
        oldPrice: normalizeMoney(product.old_price, priceInstallment),
        badge: normalizeText(product.badge, "Destaque"),
        shortDescription: normalizeText(product.short_description, "Produto disponível na vitrine da loja."),
        highlights: Array.isArray(product.highlights) && product.highlights.length > 0 ? product.highlights : ["Atendimento via WhatsApp"],
        image: images[0],
        images,
        imageItems,
        isVisible: product.is_visible !== false,
        isAvailable: product.is_available !== false,
      };
    });

  return {
    categories: categories.length > 0 ? categories : fallback.categories,
    adminCategories: adminCategories.length > 0 ? adminCategories : createFallbackAdminCategories(fallback.categories),
    products: products.length > 0 ? products : fallback.products,
    attendants:
      rows.attendants.length > 0
        ? rows.attendants
            .filter((attendant) => !publicOnly || attendant.is_active !== false)
            .map((attendant) => ({
              id: attendant.id,
              name: attendant.name,
              phone: attendant.phone,
              sortOrder: Number(attendant.sort_order ?? 0),
              isActive: attendant.is_active !== false,
            }))
        : fallback.attendants,
    contactChannels:
      rows.contactChannels.length > 0
        ? rows.contactChannels
            .filter((channel) => !publicOnly || channel.is_active !== false)
            .map((channel) => ({
              id: channel.id,
              title: channel.title,
              value: channel.value,
              href: channel.href,
              sortOrder: Number(channel.sort_order ?? 0),
              isActive: channel.is_active !== false,
            }))
        : fallback.contactChannels,
    siteSettings: sanitizeSiteSettings({
      whatsappIntro: rows.siteSettings?.whatsapp_intro,
      whatsappFloatingMessage: rows.siteSettings?.whatsapp_floating_message,
    }),
    homeHighlights: fallback.homeHighlights,
  };
}

async function fetchCatalogSnapshot({ publicOnly = false } = {}) {
  const client = getCatalogReadClient();

  if (!client) {
    return buildFallbackAdminBootstrap();
  }

  try {
    const rows = await fetchAdminRowsWithClient(client, { publicOnly });
    return buildCatalogSnapshotFromRows(rows, { publicOnly });
  } catch {
    return buildFallbackAdminBootstrap();
  }
}

export async function getPublicCatalogSnapshot() {
  const snapshot = await fetchCatalogSnapshot({ publicOnly: true });

  return {
    categories: snapshot.categories,
    adminCategories: snapshot.adminCategories,
    products: snapshot.products.filter((product) => product.isVisible !== false),
    attendants: snapshot.attendants.filter((attendant) => attendant.isActive !== false),
    contactChannels: snapshot.contactChannels.filter((channel) => channel.isActive !== false),
    siteSettings: snapshot.siteSettings,
    homeHighlights: snapshot.homeHighlights,
  };
}

export async function getAdminBootstrapSnapshot() {
  return fetchCatalogSnapshot({ publicOnly: false });
}

async function buildUniqueProductSlug(client, name, productId) {
  const baseSlug = slugify(name) || `produto-${String(productId).slice(0, 8)}`;
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const response = await client.from("products").select("id").eq("slug", slug).maybeSingle();

    if (response.error) {
      throw new Error(`Falha ao validar slug do produto: ${response.error.message}`);
    }

    if (!response.data || response.data.id === productId) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

function createProductNameLookup(products) {
  const lookup = new Map();

  products.forEach((product) => {
    const key = buildLookupKey(product?.name);
    if (!key) {
      return;
    }

    const current = lookup.get(key) || [];
    current.push(product);
    lookup.set(key, current);
  });

  return lookup;
}

function createImportCategoryState(rows) {
  const categoriesByKey = new Map();
  const subcategoriesByKey = new Map();
  const nextSubSortOrderByCategoryId = new Map();

  rows.categories.forEach((category) => {
    categoriesByKey.set(buildLookupKey(category.name), category);
    const currentMaxSort = nextSubSortOrderByCategoryId.get(category.id) ?? -1;
    nextSubSortOrderByCategoryId.set(category.id, currentMaxSort);
  });

  rows.subcategories.forEach((sub) => {
    subcategoriesByKey.set(`${sub.category_id}::${buildLookupKey(sub.name)}`, sub);
    const currentMaxSort = nextSubSortOrderByCategoryId.get(sub.category_id) ?? -1;
    nextSubSortOrderByCategoryId.set(sub.category_id, Math.max(currentMaxSort, Number(sub.sort_order ?? -1)));
  });

  const nextCategorySortOrder =
    rows.categories.reduce((maxSortOrder, category) => Math.max(maxSortOrder, Number(category.sort_order ?? -1)), -1) + 1;

  return {
    categoriesByKey,
    subcategoriesByKey,
    nextCategorySortOrder,
    nextSubSortOrderByCategoryId,
  };
}

async function activateCategoryIfNeeded(client, category) {
  if (category.is_active !== false) {
    return category;
  }

  const response = await client.from("categories").update({ is_active: true }).eq("id", category.id);
  ensureQueryResult(response, "Falha ao reativar categoria");
  return { ...category, is_active: true };
}

async function activateSubcategoryIfNeeded(client, subcategory) {
  if (subcategory.is_active !== false) {
    return subcategory;
  }

  const response = await client.from("subcategories").update({ is_active: true }).eq("id", subcategory.id);
  ensureQueryResult(response, "Falha ao reativar subcategoria");
  return { ...subcategory, is_active: true };
}

async function ensureImportedCategoryAndSubcategory(client, state, importedProduct) {
  const categoryName = normalizeText(importedProduct?.category, "Outros");
  const categoryKey = buildLookupKey(categoryName);
  let category = state.categoriesByKey.get(categoryKey) || null;

  if (!category) {
    category = {
      id: randomUUID(),
      name: categoryName,
      sort_order: state.nextCategorySortOrder,
      is_active: true,
    };

    const response = await client.from("categories").insert(category);
    ensureQueryResult(response, "Falha ao criar categoria na importacao CSV");
    state.categoriesByKey.set(categoryKey, category);
    state.nextSubSortOrderByCategoryId.set(category.id, -1);
    state.nextCategorySortOrder += 1;
  } else {
    category = await activateCategoryIfNeeded(client, category);
    state.categoriesByKey.set(categoryKey, category);
  }

  const subName = normalizeText(importedProduct?.sub, "Itens variados");
  const subKey = `${category.id}::${buildLookupKey(subName)}`;
  let subcategory = state.subcategoriesByKey.get(subKey) || null;

  if (!subcategory) {
    const nextSubSortOrder = (state.nextSubSortOrderByCategoryId.get(category.id) ?? -1) + 1;
    subcategory = {
      id: randomUUID(),
      category_id: category.id,
      name: subName,
      sort_order: nextSubSortOrder,
      is_active: true,
    };

    const response = await client.from("subcategories").insert(subcategory);
    ensureQueryResult(response, "Falha ao criar subcategoria na importacao CSV");
    state.subcategoriesByKey.set(subKey, subcategory);
    state.nextSubSortOrderByCategoryId.set(category.id, nextSubSortOrder);
  } else {
    subcategory = await activateSubcategoryIfNeeded(client, subcategory);
    state.subcategoriesByKey.set(subKey, subcategory);
  }

  return {
    categoryId: category.id,
    subcategoryId: subcategory.id,
  };
}

function resolveImportedProductMatch(importedProduct, productsBySlug, productsByName) {
  const importSlug = slugify(importedProduct?.id || importedProduct?.name);
  if (!importSlug) {
    return {
      importSlug: "",
      existingProduct: null,
    };
  }

  const exactSlugMatch = productsBySlug.get(importSlug) || null;
  if (exactSlugMatch) {
    return {
      importSlug,
      existingProduct: exactSlugMatch,
    };
  }

  const nameMatches = productsByName.get(buildLookupKey(importedProduct?.name)) || [];
  if (nameMatches.length === 1) {
    return {
      importSlug,
      existingProduct: nameMatches[0],
    };
  }

  return {
    importSlug,
    existingProduct: null,
  };
}

async function ensureProductCategoryExists(client, categoryId, subcategoryId) {
  const [categoryResponse, subcategoryResponse] = await Promise.all([
    client.from("categories").select("id").eq("id", categoryId).maybeSingle(),
    client.from("subcategories").select("id, category_id").eq("id", subcategoryId).maybeSingle(),
  ]);

  if (categoryResponse.error) {
    throw new Error(`Falha ao validar categoria: ${categoryResponse.error.message}`);
  }

  if (subcategoryResponse.error) {
    throw new Error(`Falha ao validar subcategoria: ${subcategoryResponse.error.message}`);
  }

  if (!categoryResponse.data) {
    throw new CatalogRepositoryValidationError("Categoria selecionada não existe.");
  }

  if (!subcategoryResponse.data || subcategoryResponse.data.category_id !== categoryId) {
    throw new CatalogRepositoryValidationError("Subcategoria selecionada não pertence à categoria escolhida.");
  }
}

async function getNextProductSortOrder(client) {
  const response = await client
    .from("products")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (response.error) {
    throw new Error(`Falha ao calcular ordenação do produto: ${response.error.message}`);
  }

  return Number(response.data?.sort_order ?? -1) + 1;
}

async function syncProductImages(client, productId, imageItems) {
  const existingRowsResponse = await client.from("product_images").select("id, storage_path").eq("product_id", productId);
  const existingRows = ensureQueryResult(existingRowsResponse, "Falha ao carregar imagens do produto");
  const existingById = new Map(existingRows.map((row) => [row.id, row]));
  const keptIds = new Set();
  const upserts = [];

  imageItems.forEach((item, index) => {
    if (item.id && existingById.has(item.id)) {
      keptIds.add(item.id);
      upserts.push({
        id: item.id,
        product_id: productId,
        storage_path: item.storagePath,
        sort_order: index,
      });
      return;
    }

    upserts.push({
      id: randomUUID(),
      product_id: productId,
      storage_path: item.storagePath,
      sort_order: index,
    });
  });

  const removedRows = existingRows.filter((row) => !keptIds.has(row.id));

  if (removedRows.length > 0) {
    await client.storage.from(getSupabaseProductsBucket()).remove(removedRows.map((row) => row.storage_path));
    const deleteResponse = await client.from("product_images").delete().in(
      "id",
      removedRows.map((row) => row.id),
    );
    ensureQueryResult(deleteResponse, "Falha ao remover imagens antigas");
  }

  const deleteAllResponse = await client.from("product_images").delete().eq("product_id", productId);
  ensureQueryResult(deleteAllResponse, "Falha ao sincronizar imagens do produto");

  if (upserts.length > 0) {
    const insertResponse = await client.from("product_images").insert(upserts);
    ensureQueryResult(insertResponse, "Falha ao salvar imagens do produto");
  }
}

export async function createProductInCatalog(rawPayload) {
  const client = ensureSupabaseServiceClient();
  const payload = normalizeProductPayload(rawPayload);
  const productId = payload.id || randomUUID();

  await ensureProductCategoryExists(client, payload.categoryId, payload.subcategoryId);

  const slug = await buildUniqueProductSlug(client, payload.name, productId);
  const sortOrder = await getNextProductSortOrder(client);
  const insertResponse = await client.from("products").insert({
    id: productId,
    slug,
    name: payload.name,
    category_id: payload.categoryId,
    subcategory_id: payload.subcategoryId,
    price_cash: payload.priceCash,
    price_installment: payload.priceInstallment,
    old_price: payload.oldPrice,
    badge: payload.badge,
    short_description: payload.shortDescription,
    highlights: payload.highlights,
    is_visible: payload.isVisible,
    is_available: payload.isAvailable,
    sort_order: sortOrder,
  });

  ensureQueryResult(insertResponse, "Falha ao criar produto");
  await syncProductImages(client, productId, payload.imageItems);

  return {
    productId,
    catalog: await getAdminBootstrapSnapshot(),
  };
}

export async function importProductsCsvInCatalog(productsImport) {
  const client = ensureSupabaseServiceClient();
  const importedProducts = Array.isArray(productsImport?.products) ? productsImport.products : [];

  if (importedProducts.length === 0) {
    throw new CatalogRepositoryValidationError("Nenhum produto valido foi encontrado no CSV.");
  }

  const rows = await fetchAdminRowsWithClient(client);
  const categoryState = createImportCategoryState(rows);
  const productsBySlug = new Map(rows.products.map((product) => [slugify(product.slug), product]));
  const productsByName = createProductNameLookup(rows.products);
  let nextSortOrder =
    rows.products.reduce((maxSortOrder, product) => Math.max(maxSortOrder, Number(product.sort_order ?? -1)), -1) + 1;
  let createdCount = 0;
  let updatedCount = 0;

  for (const importedProduct of importedProducts) {
    const categoryLink = await ensureImportedCategoryAndSubcategory(client, categoryState, importedProduct);
    const normalizedPayload = normalizeProductPayload({
      name: importedProduct.name,
      categoryId: categoryLink.categoryId,
      subcategoryId: categoryLink.subcategoryId,
      priceCash: importedProduct.priceCash,
      priceInstallment: importedProduct.priceInstallment,
      oldPrice: importedProduct.oldPrice,
      badge: importedProduct.badge,
      shortDescription: importedProduct.shortDescription,
      highlights: importedProduct.highlights,
      isVisible: importedProduct.isVisible,
      isAvailable: importedProduct.isAvailable,
      imageItems: [],
    });
    const match = resolveImportedProductMatch(importedProduct, productsBySlug, productsByName);

    if (match.existingProduct) {
      const updateResponse = await client
        .from("products")
        .update({
          name: normalizedPayload.name,
          category_id: normalizedPayload.categoryId,
          subcategory_id: normalizedPayload.subcategoryId,
          price_cash: normalizedPayload.priceCash,
          price_installment: normalizedPayload.priceInstallment,
          old_price: normalizedPayload.oldPrice,
          badge: normalizedPayload.badge,
          short_description: normalizedPayload.shortDescription,
          highlights: normalizedPayload.highlights,
          is_visible: normalizedPayload.isVisible,
          is_available: normalizedPayload.isAvailable,
        })
        .eq("id", match.existingProduct.id);

      ensureQueryResult(updateResponse, "Falha ao atualizar produto na importacao CSV");

      const updatedProduct = {
        ...match.existingProduct,
        name: normalizedPayload.name,
        category_id: normalizedPayload.categoryId,
        subcategory_id: normalizedPayload.subcategoryId,
        price_cash: normalizedPayload.priceCash,
        price_installment: normalizedPayload.priceInstallment,
        old_price: normalizedPayload.oldPrice,
        badge: normalizedPayload.badge,
        short_description: normalizedPayload.shortDescription,
        highlights: normalizedPayload.highlights,
        is_visible: normalizedPayload.isVisible,
        is_available: normalizedPayload.isAvailable,
      };

      productsBySlug.set(slugify(updatedProduct.slug), updatedProduct);
      productsByName.set(buildLookupKey(updatedProduct.name), [updatedProduct]);
      updatedCount += 1;
      continue;
    }

    const productId = randomUUID();
    const slug = await buildUniqueProductSlug(client, match.importSlug || importedProduct.name, productId);
    const insertResponse = await client.from("products").insert({
      id: productId,
      slug,
      name: normalizedPayload.name,
      category_id: normalizedPayload.categoryId,
      subcategory_id: normalizedPayload.subcategoryId,
      price_cash: normalizedPayload.priceCash,
      price_installment: normalizedPayload.priceInstallment,
      old_price: normalizedPayload.oldPrice,
      badge: normalizedPayload.badge,
      short_description: normalizedPayload.shortDescription,
      highlights: normalizedPayload.highlights,
      is_visible: normalizedPayload.isVisible,
      is_available: normalizedPayload.isAvailable,
      sort_order: nextSortOrder,
    });

    ensureQueryResult(insertResponse, "Falha ao criar produto na importacao CSV");

    const createdProduct = {
      id: productId,
      slug,
      name: normalizedPayload.name,
      category_id: normalizedPayload.categoryId,
      subcategory_id: normalizedPayload.subcategoryId,
      price_cash: normalizedPayload.priceCash,
      price_installment: normalizedPayload.priceInstallment,
      old_price: normalizedPayload.oldPrice,
      badge: normalizedPayload.badge,
      short_description: normalizedPayload.shortDescription,
      highlights: normalizedPayload.highlights,
      is_visible: normalizedPayload.isVisible,
      is_available: normalizedPayload.isAvailable,
      sort_order: nextSortOrder,
    };

    productsBySlug.set(slugify(slug), createdProduct);
    productsByName.set(buildLookupKey(createdProduct.name), [createdProduct]);
    nextSortOrder += 1;
    createdCount += 1;
  }

  return {
    catalog: await getAdminBootstrapSnapshot(),
    summary: {
      importedCount: importedProducts.length,
      createdCount,
      updatedCount,
      skippedMissingName: Number(productsImport?.skippedMissingName ?? 0),
      skippedMissingPrice: Number(productsImport?.skippedMissingPrice ?? 0),
    },
  };
}

export async function updateProductInCatalog(productId, rawPayload) {
  const client = ensureSupabaseServiceClient();
  const payload = normalizeProductPayload(rawPayload);
  const productResponse = await client.from("products").select("id").eq("id", productId).maybeSingle();

  if (productResponse.error) {
    throw new Error(`Falha ao localizar produto: ${productResponse.error.message}`);
  }

  if (!productResponse.data) {
    throw new CatalogRepositoryValidationError("Produto não encontrado.");
  }

  await ensureProductCategoryExists(client, payload.categoryId, payload.subcategoryId);

  const slug = await buildUniqueProductSlug(client, payload.name, productId);
  const updateResponse = await client
    .from("products")
    .update({
      slug,
      name: payload.name,
      category_id: payload.categoryId,
      subcategory_id: payload.subcategoryId,
      price_cash: payload.priceCash,
      price_installment: payload.priceInstallment,
      old_price: payload.oldPrice,
      badge: payload.badge,
      short_description: payload.shortDescription,
      highlights: payload.highlights,
      is_visible: payload.isVisible,
      is_available: payload.isAvailable,
    })
    .eq("id", productId);

  ensureQueryResult(updateResponse, "Falha ao atualizar produto");
  await syncProductImages(client, productId, payload.imageItems);

  return {
    catalog: await getAdminBootstrapSnapshot(),
  };
}

export async function deleteProductFromCatalog(productId) {
  const client = ensureSupabaseServiceClient();
  const imageRowsResponse = await client.from("product_images").select("id, storage_path").eq("product_id", productId);
  const imageRows = ensureQueryResult(imageRowsResponse, "Falha ao carregar imagens para exclusão");
  const deleteProductResponse = await client.from("products").delete().eq("id", productId);
  ensureQueryResult(deleteProductResponse, "Falha ao excluir produto");

  if (imageRows.length > 0) {
    await client.storage.from(getSupabaseProductsBucket()).remove(imageRows.map((row) => row.storage_path));
  }

  return {
    catalog: await getAdminBootstrapSnapshot(),
  };
}

export async function deleteProductsFromCatalog(productIds) {
  const client = ensureSupabaseServiceClient();
  const normalizedIds = Array.isArray(productIds)
    ? Array.from(new Set(productIds.map((productId) => normalizeText(productId)).filter(Boolean)))
    : [];

  if (normalizedIds.length === 0) {
    throw new CatalogRepositoryValidationError("Selecione pelo menos um produto para excluir.");
  }

  const imageRowsResponse = await client.from("product_images").select("id, storage_path").in("product_id", normalizedIds);
  const imageRows = ensureQueryResult(imageRowsResponse, "Falha ao carregar imagens para exclusao em lote");
  const deleteProductsResponse = await client.from("products").delete().in("id", normalizedIds);
  ensureQueryResult(deleteProductsResponse, "Falha ao excluir produtos em lote");

  if (imageRows.length > 0) {
    await client.storage.from(getSupabaseProductsBucket()).remove(imageRows.map((row) => row.storage_path));
  }

  return {
    catalog: await getAdminBootstrapSnapshot(),
    removedCount: normalizedIds.length,
  };
}

export async function saveCategoriesInCatalog(rawCategories) {
  const client = ensureSupabaseServiceClient();
  const nextCategories = normalizeAdminCategoriesPayload(rawCategories);
  const rows = await fetchAdminRowsWithClient(client);
  const existingProducts = rows.products;
  const currentCategoryById = new Map(rows.categories.map((category) => [category.id, category]));
  const currentSubcategoryById = new Map(rows.subcategories.map((sub) => [sub.id, sub]));
  const nextCategoryIds = new Set(nextCategories.map((category) => category.id).filter(Boolean));
  const nextSubcategoryIds = new Set(
    nextCategories.flatMap((category) => category.subs.map((sub) => sub.id).filter(Boolean)),
  );

  const invalidProduct = existingProducts.find((product) => {
    if (!currentCategoryById.has(product.category_id) || !currentSubcategoryById.has(product.subcategory_id)) {
      return false;
    }

    const categoryWillBeRemoved = !nextCategoryIds.has(product.category_id);
    const subcategoryWillBeRemoved = !nextSubcategoryIds.has(product.subcategory_id);
    return categoryWillBeRemoved || subcategoryWillBeRemoved;
  });

  if (invalidProduct) {
    throw new CatalogRepositoryValidationError(
      `A categoria ou subcategoria do produto "${invalidProduct.name}" seria removida. Atualize os produtos vinculados antes de salvar as categorias.`,
    );
  }

  const categoriesUpsert = nextCategories.map((category) => ({
    id: category.id || randomUUID(),
    name: category.name,
    sort_order: category.sortOrder,
    is_active: true,
  }));
  const categoryIdByInputId = new Map();

  categoriesUpsert.forEach((category, index) => {
    const inputId = nextCategories[index].id;
    if (inputId) {
      categoryIdByInputId.set(inputId, category.id);
    }
  });

  const categoriesUpsertResponse = await client.from("categories").upsert(categoriesUpsert);
  ensureQueryResult(categoriesUpsertResponse, "Falha ao salvar categorias");

  const categoryIdByName = new Map(categoriesUpsert.map((category) => [category.name, category.id]));
  const subcategoriesUpsert = nextCategories.flatMap((category) =>
    category.subs.map((sub) => ({
      id: sub.id || randomUUID(),
      category_id: category.id ? categoryIdByInputId.get(category.id) || category.id : categoryIdByName.get(category.name),
      name: sub.name,
      sort_order: sub.sortOrder,
      is_active: true,
    })),
  );

  const subcategoriesUpsertResponse = await client.from("subcategories").upsert(subcategoriesUpsert);
  ensureQueryResult(subcategoriesUpsertResponse, "Falha ao salvar subcategorias");

  const removedSubcategoryIds = rows.subcategories
    .map((sub) => sub.id)
    .filter((subId) => !subcategoriesUpsert.some((sub) => sub.id === subId));

  if (removedSubcategoryIds.length > 0) {
    const deleteSubsResponse = await client.from("subcategories").delete().in("id", removedSubcategoryIds);
    ensureQueryResult(deleteSubsResponse, "Falha ao remover subcategorias antigas");
  }

  const removedCategoryIds = rows.categories
    .map((category) => category.id)
    .filter((categoryId) => !categoriesUpsert.some((category) => category.id === categoryId));

  if (removedCategoryIds.length > 0) {
    const deleteCategoriesResponse = await client.from("categories").delete().in("id", removedCategoryIds);
    ensureQueryResult(deleteCategoriesResponse, "Falha ao remover categorias antigas");
  }

  return {
    catalog: await getAdminBootstrapSnapshot(),
  };
}

export async function saveAttendantsInCatalog(rawAttendants) {
  const client = ensureSupabaseServiceClient();
  const attendants = normalizeAttendantsPayload(rawAttendants);
  const currentResponse = await client.from("attendants").select("id");
  const currentRows = ensureQueryResult(currentResponse, "Falha ao carregar atendentes atuais");

  const nextRows = attendants.map((attendant) => ({
    id: attendant.id || randomUUID(),
    name: attendant.name,
    phone: attendant.phone,
    sort_order: attendant.sortOrder,
    is_active: true,
  }));

  const upsertResponse = await client.from("attendants").upsert(nextRows);
  ensureQueryResult(upsertResponse, "Falha ao salvar atendentes");

  const removedIds = currentRows.map((row) => row.id).filter((id) => !nextRows.some((item) => item.id === id));
  if (removedIds.length > 0) {
    const deleteResponse = await client.from("attendants").delete().in("id", removedIds);
    ensureQueryResult(deleteResponse, "Falha ao remover atendentes antigos");
  }

  return {
    catalog: await getAdminBootstrapSnapshot(),
  };
}

export async function saveContactChannelsInCatalog(rawChannels) {
  const client = ensureSupabaseServiceClient();
  const channels = normalizeContactChannelsPayload(rawChannels);
  const currentResponse = await client.from("contact_channels").select("id");
  const currentRows = ensureQueryResult(currentResponse, "Falha ao carregar canais atuais");

  const nextRows = channels.map((channel) => ({
    id: channel.id || randomUUID(),
    title: channel.title,
    value: channel.value,
    href: channel.href,
    sort_order: channel.sortOrder,
    is_active: true,
  }));

  const upsertResponse = await client.from("contact_channels").upsert(nextRows);
  ensureQueryResult(upsertResponse, "Falha ao salvar canais");

  const removedIds = currentRows.map((row) => row.id).filter((id) => !nextRows.some((item) => item.id === id));
  if (removedIds.length > 0) {
    const deleteResponse = await client.from("contact_channels").delete().in("id", removedIds);
    ensureQueryResult(deleteResponse, "Falha ao remover canais antigos");
  }

  return {
    catalog: await getAdminBootstrapSnapshot(),
  };
}

export async function saveSiteSettingsInCatalog(rawSettings) {
  const client = ensureSupabaseServiceClient();
  const settings = normalizeSiteSettingsPayload(rawSettings);
  const upsertResponse = await client.from("site_settings").upsert({
    id: SITE_SETTINGS_ROW_ID,
    whatsapp_intro: settings.whatsappIntro,
    whatsapp_floating_message: settings.whatsappFloatingMessage,
  });

  ensureQueryResult(upsertResponse, "Falha ao salvar configurações do site");

  return {
    catalog: await getAdminBootstrapSnapshot(),
  };
}

function sanitizeFilename(fileName) {
  return String(fileName ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/^-+|-+$/g, "") || "imagem";
}

export function validateProductImageFile(file) {
  if (!file) {
    throw new CatalogRepositoryValidationError("Nenhuma imagem foi enviada.");
  }

  if (!ALLOWED_PRODUCT_IMAGE_TYPES.has(file.type)) {
    throw new CatalogRepositoryValidationError("Formato de imagem inválido. Use JPG, PNG ou WEBP.");
  }

  if (Number(file.size ?? 0) > MAX_UPLOAD_SIZE_BYTES) {
    throw new CatalogRepositoryValidationError("A imagem ultrapassa o limite de 5 MB.");
  }
}

export async function uploadProductImageAsset(productId, file) {
  const client = ensureSupabaseServiceClient();
  validateProductImageFile(file);

  const fileExtension = sanitizeFilename(file.name).split(".").pop() || "jpg";
  const storagePath = `products/${productId}/${randomUUID()}.${fileExtension}`;
  const uploadResponse = await client.storage
    .from(getSupabaseProductsBucket())
    .upload(storagePath, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });

  if (uploadResponse.error) {
    throw new Error(`Falha ao enviar imagem do produto: ${uploadResponse.error.message}`);
  }

  return {
    id: createStagedImageId(storagePath),
    storagePath,
    publicUrl: buildStoragePublicUrl(storagePath),
  };
}

export async function deleteProductImageAsset(productId, imageId) {
  const client = ensureSupabaseServiceClient();

  if (isStagedImageId(imageId)) {
    const storagePath = decodeStagedImageId(imageId);
    if (storagePath) {
      await client.storage.from(getSupabaseProductsBucket()).remove([storagePath]);
    }
    return { ok: true };
  }

  const imageResponse = await client.from("product_images").select("id, product_id, storage_path").eq("id", imageId).maybeSingle();

  if (imageResponse.error) {
    throw new Error(`Falha ao localizar imagem do produto: ${imageResponse.error.message}`);
  }

  if (!imageResponse.data || imageResponse.data.product_id !== productId) {
    throw new CatalogRepositoryValidationError("Imagem do produto não encontrada.");
  }

  await client.storage.from(getSupabaseProductsBucket()).remove([imageResponse.data.storage_path]);
  const deleteResponse = await client.from("product_images").delete().eq("id", imageId);
  ensureQueryResult(deleteResponse, "Falha ao excluir imagem do produto");

  return { ok: true };
}

export {
  ALLOWED_PRODUCT_IMAGE_TYPES,
  MAX_PRODUCT_IMAGES,
  MAX_UPLOAD_SIZE_BYTES,
};
