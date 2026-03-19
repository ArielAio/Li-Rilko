import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useParams: () => ({}),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  redirect: vi.fn(),
}));

function createMemoryStorage() {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
    removeItem(key) {
      store.delete(String(key));
    },
    clear() {
      store.clear();
    },
    key(index) {
      return Array.from(store.keys())[index] || null;
    },
    get length() {
      return store.size;
    },
  };
}

beforeAll(() => {
  if (!window.localStorage || typeof window.localStorage.setItem !== "function") {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      writable: true,
      value: createMemoryStorage(),
    });
  }

  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  }

  if (!window.scrollTo) {
    window.scrollTo = vi.fn();
  }
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  delete window.__LI_RILKO_TEST_PUBLIC_CATALOG__;
  delete window.__LI_RILKO_TEST_ATTENDANTS__;
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
