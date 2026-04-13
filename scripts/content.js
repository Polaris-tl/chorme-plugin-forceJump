(() => {
  const REDIRECT_PARAM_BY_HOST = {
    "link.jianshu.com": "t",
    "links.jianshu.com": "to",
    "link.juejin.cn": "target",
    "link.zhihu.com": "target",
    "link.csdn.net": "target",
  };

  const FALLBACK_PARAMS = ["target", "to", "t"];
  let totalUpdated = 0;

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
    console.debug(`[forceJump] Updated ${count} redirect link(s), total: ${totalUpdated}`);
  }

  report(rewriteInNode(document.documentElement));

  const observer = new MutationObserver((mutations) => {
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

  document.addEventListener("click", neutralizeRedirectHandlers, true);
  document.addEventListener("auxclick", neutralizeRedirectHandlers, true);
})();
