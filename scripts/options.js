(() => {
  const $ = (id) => document.getElementById(id);

  const fields = {
    enabled: $("enabled"),
    debug: $("debug"),
    csdn: $("site-csdn"),
    juejin: $("site-juejin"),
    jianshu: $("site-jianshu"),
    zhihu: $("site-zhihu"),
  };

  const statusNode = $("status");
  const resetButton = $("reset");
  let clearStatusTimer = null;

  function showStatus(message, isError) {
    statusNode.textContent = message;
    statusNode.style.color = isError ? "#b91c1c" : "#0f766e";

    if (clearStatusTimer) {
      window.clearTimeout(clearStatusTimer);
    }

    clearStatusTimer = window.setTimeout(() => {
      statusNode.textContent = "";
    }, 2200);
  }

  function settingsFromForm() {
    return {
      enabled: fields.enabled.checked,
      debug: fields.debug.checked,
      sites: {
        csdn: fields.csdn.checked,
        juejin: fields.juejin.checked,
        jianshu: fields.jianshu.checked,
        zhihu: fields.zhihu.checked,
      },
    };
  }

  function fillForm(settings) {
    const normalized = forceJumpSettings.withDefaults(settings);
    fields.enabled.checked = normalized.enabled;
    fields.debug.checked = normalized.debug;
    fields.csdn.checked = normalized.sites.csdn;
    fields.juejin.checked = normalized.sites.juejin;
    fields.jianshu.checked = normalized.sites.jianshu;
    fields.zhihu.checked = normalized.sites.zhihu;
  }

  async function saveFromForm() {
    try {
      await forceJumpSettings.saveSettings(settingsFromForm());
      showStatus("设置已保存");
    } catch {
      showStatus("保存失败，请重试", true);
    }
  }

  async function resetDefaults() {
    try {
      const defaults = forceJumpSettings.withDefaults(forceJumpSettings.DEFAULT_SETTINGS);
      await forceJumpSettings.saveSettings(defaults);
      fillForm(defaults);
      showStatus("已恢复默认设置");
    } catch {
      showStatus("重置失败，请重试", true);
    }
  }

  async function initialize() {
    const settings = await forceJumpSettings.loadSettings();
    fillForm(settings);

    Object.values(fields).forEach((checkbox) => {
      checkbox.addEventListener("change", saveFromForm);
    });

    resetButton.addEventListener("click", resetDefaults);
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();
