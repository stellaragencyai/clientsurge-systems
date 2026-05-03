// @ts-nocheck
const PORTAL_TEST_FIXTURE_KEY = "clientsurge_portal_test_fixture";

function isBrowser() {
  return typeof window !== "undefined";
}

function isLocalDevHost() {
  if (!isBrowser()) {
    return false;
  }

  const hostname = window.location.hostname;
  return import.meta.env.DEV && (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local")
  );
}

export function readPortalTestFixture() {
  if (!isBrowser() || !isLocalDevHost()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(PORTAL_TEST_FIXTURE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isPortalTestModeEnabled() {
  return Boolean(readPortalTestFixture());
}

export function clearPortalTestFixture() {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(PORTAL_TEST_FIXTURE_KEY);
  } catch {
    // Ignore storage cleanup issues in embedded/local previews.
  }
}

export { PORTAL_TEST_FIXTURE_KEY };
