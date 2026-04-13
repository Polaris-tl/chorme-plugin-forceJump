(() => {
  if (typeof forceJumpSettings === "undefined") {
    return;
  }

  const REDIRECT_PARAM_BY_HOST = {
    "link.jianshu.com": "t",
    "links.jianshu.com": "to",
    "link.juejin.cn": "target",
    "link.zhihu.com": "target",
    "link.csdn.net": "target",
  };

  const FALLBACK_PARAMS = ["target", "to", "t"];
  let totalUpdated = 0;
  let currentSettings = forceJumpSettings.DEFAULT_SETTINGS;
  let observer = null;
  let removeSettingsListener = () => {};
  let listenersBound = false;

  function logDebug(message) {
    if (!currentSettings.debug) {
      return;
    }
    console.debug(`[forceJump] ${message}`);
  }

  function decodeMaybeEncoded(value) {
    let decoded = value;

    for (let i = 0; i < 2; i += 1) {
      try {
        const next = decodeURIComponent(decoded);
        if (next === decoded) {
          break;
        }
        decoded = next;
      } catch {
        break;
      }
    }

    return decoded;
  }

  function normalizeDirectUrl(rawValue) {
    if (!rawValue) {
      return null;
    }

    const candidate = decodeMaybeEncoded(rawValue.trim());

    try {
      const parsed = new URL(candidate, location.href);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return null;
      }
      return parsed.href;
    } catch {
      return null;
    }
  }

  function extractRedirectTarget(anchorHref) {
    let parsedHref;
    try {
      parsedHref = new URL(anchorHref, location.href);
    } catch {
      return null;
    }

    const mappedParam = REDIRECT_PARAM_BY_HOST[parsedHref.hostname];
    const rawTarget = mappedParam
      ? parsedHref.searchParams.get(mappedParam)
      : FALLBACK_PARAMS.map((param) => parsedHref.searchParams.get(param)).find(Boolean);

    return normalizeDirectUrl(rawTarget);
  }

  function rewriteAnchor(anchor) {
    if (!(anchor instanceof HTMLAnchorElement) || !anchor.href) {
      return false;
    }

    const directUrl = extractRedirectTarget(anchor.href);
    if (!directUrl || directUrl === anchor.href) {
      return false;
    }

    if (!anchor.dataset.forcejumpOriginalHref) {
      anchor.dataset.forcejumpOriginalHref = anchor.getAttribute("href") || anchor.href;
    }
    anchor.href = directUrl;
    anchor.dataset.forcejumpRewritten = "1";
    return true;
  }

  function rewriteInNode(node) {
    if (!(node instanceof Element)) {
      return 0;
    }

    let updated = 0;
    if (node.matches("a[href]") && rewriteAnchor(node)) {
      updated += 1;
    }

    node.querySelectorAll("a[href]").forEach((anchor) => {
      if (rewriteAnchor(anchor)) {
        updated += 1;
      }
    });

    return updated;
  }

  function report(count) {
    if (count <= 0) {
      return;
    }

    totalUpdated += count;
    logDebug(`Updated ${count} redirect link(s), total: ${totalUpdated}`);
  }

  function restoreRewrittenAnchors() {
    const rewrittenAnchors = document.querySelectorAll("a[data-forcejump-rewritten='1']");
    rewrittenAnchors.forEach((anchor) => {
      const originalHref = anchor.dataset.forcejumpOriginalHref;
      if (originalHref) {
        anchor.setAttribute("href", originalHref);
      }
      delete anchor.dataset.forcejumpRewritten;
      delete anchor.dataset.forcejumpOriginalHref;
    });
  }

  function startObserver() {
    if (observer) {
      return;
    }

    observer = new MutationObserver((mutations) => {
      let changed = 0;

      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            changed += rewriteInNode(node);
          });
          return;
        }

        if (mutation.type === "attributes" && mutation.target instanceof HTMLAnchorElement) {
          if (rewriteAnchor(mutation.target)) {
            changed += 1;
          }
        }
      });

      report(changed);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href"],
    });
  }

  function stopObserver() {
    if (!observer) {
      return;
    }
    observer.disconnect();
    observer = null;
  }

  function neutralizeRedirectHandlers(event) {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const anchor = target.closest("a[href]");
    if (!anchor || anchor.dataset.forcejumpRewritten !== "1") {
      return;
    }

    // Keep browser default navigation, block site-level jump handlers.
    event.stopImmediatePropagation();
  }

  function enableForPage() {
    report(rewriteInNode(document.documentElement));
    startObserver();
    if (!listenersBound) {
      document.addEventListener("click", neutralizeRedirectHandlers, true);
      document.addEventListener("auxclick", neutralizeRedirectHandlers, true);
      listenersBound = true;
    }
  }

  function disableForPage() {
    stopObserver();
    if (listenersBound) {
      document.removeEventListener("click", neutralizeRedirectHandlers, true);
      document.removeEventListener("auxclick", neutralizeRedirectHandlers, true);
      listenersBound = false;
    }
    restoreRewrittenAnchors();
  }

  function applySettings(settings) {
    currentSettings = forceJumpSettings.withDefaults(settings);
    const siteKey = forceJumpSettings.getSiteKeyByHost(location.hostname);
    const shouldEnable =
      currentSettings.enabled && forceJumpSettings.isSiteEnabled(currentSettings, siteKey);

    if (shouldEnable) {
      enableForPage();
      logDebug(`Enabled on site: ${siteKey || location.hostname}`);
      return;
    }

    disableForPage();
    logDebug(`Disabled on site: ${siteKey || location.hostname}`);
  }

  forceJumpSettings.loadSettings().then((settings) => {
    applySettings(settings);
    removeSettingsListener = forceJumpSettings.onSettingsChanged(applySettings);
  });

  window.addEventListener("unload", () => {
    removeSettingsListener();
    stopObserver();
  });
})();
