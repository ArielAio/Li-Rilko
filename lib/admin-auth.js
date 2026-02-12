import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "li_rilko_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

const FALLBACK_ADMIN_USERNAME = "admin";
const FALLBACK_ADMIN_PASSWORD = "admin123";
const FALLBACK_SESSION_SECRET = "li-rilko-admin-session-secret-change-me";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || FALLBACK_ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD || FALLBACK_ADMIN_PASSWORD,
  };
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || FALLBACK_SESSION_SECRET;
}

function safeStringCompare(input, expected) {
  const left = Buffer.from(String(input ?? ""));
  const right = Buffer.from(String(expected ?? ""));

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function signPayload(payload) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

export function validateAdminLogin(username, password) {
  if (isProduction() && isUsingFallbackAdminCredentials()) {
    return false;
  }

  const credentials = getCredentials();
  return safeStringCompare(username, credentials.username) && safeStringCompare(password, credentials.password);
}

export function createAdminSessionToken(username) {
  const expiresAt = Date.now() + ADMIN_SESSION_MAX_AGE * 1000;
  const payload = `${username}|${expiresAt}`;
  const signature = signPayload(payload);
  return `${payload}|${signature}`;
}

export function isAdminSessionValid(rawToken) {
  if (isProduction() && isUsingFallbackSessionSecret()) {
    return false;
  }

  if (!rawToken) {
    return false;
  }

  const parts = String(rawToken).split("|");
  if (parts.length !== 3) {
    return false;
  }

  const [username, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);

  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  const credentials = getCredentials();
  if (!safeStringCompare(username, credentials.username)) {
    return false;
  }

  const expectedSignature = signPayload(`${username}|${expiresAtRaw}`);
  return safeStringCompare(signature, expectedSignature);
}

export function isUsingFallbackAdminCredentials() {
  return !process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD;
}

export function isUsingFallbackSessionSecret() {
  return !process.env.ADMIN_SESSION_SECRET;
}
