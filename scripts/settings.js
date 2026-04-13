(function attachForceJumpSettings(globalScope) {
  const STORAGE_KEY = "settings";
  const SITE_KEYS = Object.freeze(["csdn", "juejin", "jianshu", "zhihu"]);

  const DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    debug: false,
    sites: Object.freeze({
      csdn: true,
      juejin: true,
      jianshu: true,
      zhihu: true,
    }),
  });

  function getStorageArea() {
    if (typeof chrome === "undefined" || !chrome.storage) {
      return null;
    }
    return chrome.storage.sync || chrome.storage.local || null;
  }

  function matchesHost(hostname, rootDomain) {
    return hostname === rootDomain || hostname.endsWith(`.${rootDomain}`);
  }

  function getSiteKeyByHost(hostname) {
    if (matchesHost(hostname, "csdn.net")) {
      return "csdn";
    }
    if (matchesHost(hostname, "juejin.cn")) {
      return "juejin";
    }
    if (matchesHost(hostname, "jianshu.com")) {
      return "jianshu";
    }
    if (matchesHost(hostname, "zhihu.com")) {
      return "zhihu";
    }
    return null;
  }

  function normalizeSettings(candidate) {
    const source = candidate && typeof candidate === "object" ? candidate : {};
    const sourceSites = source.sites && typeof source.sites === "object" ? source.sites : {};
    const sites = {};

    SITE_KEYS.forEach((siteKey) => {
      sites[siteKey] = sourceSites[siteKey] !== false;
    });

    return {
      enabled: source.enabled !== false,
      debug: source.debug === true,
      sites,
    };
  }

  function withDefaults(settings) {
    return normalizeSettings({
      ...DEFAULT_SETTINGS,
      ...(settings || {}),
      sites: {
        ...DEFAULT_SETTINGS.sites,
        ...(settings && settings.sites ? settings.sites : {}),
      },
    });
  }

  function loadSettings() {
    const storageArea = getStorageArea();
    if (!storageArea) {
      return Promise.resolve(withDefaults());
    }

    return new Promise((resolve) => {
      storageArea.get(STORAGE_KEY, (stored) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          resolve(withDefaults());
          return;
        }

        resolve(withDefaults(stored ? stored[STORAGE_KEY] : null));
      });
    });
  }

  function saveSettings(nextSettings) {
    const storageArea = getStorageArea();
    const normalized = withDefaults(nextSettings);
    if (!storageArea) {
      return Promise.resolve(normalized);
    }

    return new Promise((resolve) => {
      storageArea.set({ [STORAGE_KEY]: normalized }, () => {
        resolve(normalized);
      });
    });
  }

  function onSettingsChanged(listener) {
    if (
      typeof chrome === "undefined" ||
      !chrome.storage ||
      !chrome.storage.onChanged ||
      typeof listener !== "function"
    ) {
      return () => {};
    }

    const handler = (changes, areaName) => {
      if (areaName !== "sync" && areaName !== "local") {
        return;
      }

      if (!changes[STORAGE_KEY]) {
        return;
      }

      listener(withDefaults(changes[STORAGE_KEY].newValue));
    };

    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }

  function isSiteEnabled(settings, siteKey) {
    if (!siteKey) {
      return true;
    }

    const normalized = withDefaults(settings);
    return normalized.sites[siteKey] !== false;
  }

  globalScope.forceJumpSettings = Object.freeze({
    DEFAULT_SETTINGS,
    SITE_KEYS,
    getSiteKeyByHost,
    isSiteEnabled,
    loadSettings,
    saveSettings,
    onSettingsChanged,
    withDefaults,
  });
})(globalThis);
