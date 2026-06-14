const isBrowser = typeof window !== "undefined";
const memoryStorage = new Map();
const PRODUCTION_APP_ID = "69dc4a79656fdba136d413d3";
const PRODUCTION_APP_BASE_URL = "https://clientsurgesystems.com";
const NULL_LIKE_VALUES = new Set(["", "null", "undefined"]);

const toSnakeCase = (str) => str.replace(/([A-Z])/g, "_$1").toLowerCase();

const normalizeParamValue = (value) => {
	if (value === undefined || value === null) {
		return null;
	}

	const normalized = String(value).trim();
	return NULL_LIKE_VALUES.has(normalized.toLowerCase()) ? null : normalized;
};

const canUseBrowserStorage = () => {
	if (!isBrowser) {
		return false;
	}

	try {
		const testKey = "__base44_storage_test__";
		window.localStorage.setItem(testKey, "1");
		window.localStorage.removeItem(testKey);
		return true;
	} catch {
		return false;
	}
};

const readStorage = (key) => {
	if (canUseBrowserStorage()) {
		try {
			return window.localStorage.getItem(key);
		} catch {
			return memoryStorage.get(key) ?? null;
		}
	}

	return memoryStorage.get(key) ?? null;
};

const writeStorage = (key, value) => {
	const normalizedValue = normalizeParamValue(value);
	if (normalizedValue === null) {
		return;
	}

	if (canUseBrowserStorage()) {
		try {
			window.localStorage.setItem(key, normalizedValue);
			return;
		} catch {
			// Fall back to in-memory storage below.
		}
	}

	memoryStorage.set(key, normalizedValue);
};

const removeStorage = (key) => {
	if (canUseBrowserStorage()) {
		try {
			window.localStorage.removeItem(key);
		} catch {
			// Ignore preview/browser storage failures.
		}
	}

	memoryStorage.delete(key);
};

const getLocation = () => {
	if (!isBrowser) {
		return {
			search: "",
			pathname: "/",
			hash: "",
			href: "",
		};
	}

	return window.location;
};

const safeReplaceUrl = (nextUrl) => {
	if (!isBrowser) {
		return;
	}

	try {
		window.history.replaceState({}, document.title, nextUrl);
	} catch {
		// Ignore history restrictions in embedded previews.
	}
};

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (!isBrowser) {
		return defaultValue ?? null;
	}

	const storageKey = `base44_${toSnakeCase(paramName)}`;
	const location = getLocation();
	const urlParams = new URLSearchParams(location.search);
	const searchParam = normalizeParamValue(urlParams.get(paramName));

	if (removeFromUrl && searchParam) {
		urlParams.delete(paramName);
		const newUrl = `${location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""}${location.hash}`;
		safeReplaceUrl(newUrl);
	}

	if (searchParam) {
		writeStorage(storageKey, searchParam);
		return searchParam;
	}

	const storedValue = normalizeParamValue(readStorage(storageKey));
	if (storedValue) {
		return storedValue;
	}

	const normalizedDefaultValue = normalizeParamValue(defaultValue);
	if (normalizedDefaultValue !== null) {
		writeStorage(storageKey, normalizedDefaultValue);
		return normalizedDefaultValue;
	}

	return null;
};

const getAppParams = () => {
	if (getAppParamValue("clear_access_token") === "true") {
		removeStorage("base44_access_token");
		removeStorage("token");
	}

	const location = getLocation();

	return {
		appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID || PRODUCTION_APP_ID }),
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getAppParamValue("from_url", { defaultValue: location.href }),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL || PRODUCTION_APP_BASE_URL }),
	};
};

export const appParams = {
	...getAppParams(),
};
