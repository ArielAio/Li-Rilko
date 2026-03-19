import "server-only";
import { createClient } from "@supabase/supabase-js";

export const SUPABASE_PRODUCTS_BUCKET_FALLBACK = "product-images";

function normalizeEnv(value) {
  const normalized = String(value ?? "").trim();
  return normalized || "";
}

export function getSupabaseUrl() {
  return normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabasePublishableKey() {
  return normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function getSupabaseServiceRoleKey() {
  return normalizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseProductsBucket() {
  return normalizeEnv(process.env.SUPABASE_STORAGE_BUCKET_PRODUCTS) || SUPABASE_PRODUCTS_BUCKET_FALLBACK;
}

export function isSupabasePublicConfigured() {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}

export function isSupabaseServiceConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}

function createBaseSupabaseClient(key) {
  return createClient(getSupabaseUrl(), key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createSupabasePublicClient() {
  if (!isSupabasePublicConfigured()) {
    throw new Error("Supabase público não configurado.");
  }

  return createBaseSupabaseClient(getSupabasePublishableKey());
}

export function createSupabaseServiceClient() {
  if (!isSupabaseServiceConfigured()) {
    throw new Error("Supabase service role não configurado.");
  }

  return createBaseSupabaseClient(getSupabaseServiceRoleKey());
}
