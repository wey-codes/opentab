(function () {
  var STORAGE_KEY = "opentab-state-v1";

  var DEFAULT_LINKS = [
    {
      id: id(),
      label: "OpenAI",
      url: "https://chatgpt.com/",
      icon: "https://openai.com/favicon.ico",
      accent: "#10a37f"
    },
    {
      id: id(),
      label: "Claude",
      url: "https://claude.ai/",
      icon: "https://www.google.com/s2/favicons?sz=128&domain_url=https%3A%2F%2Fclaude.ai%2F",
      accent: "#d97757"
    },
    {
      id: id(),
      label: "YouTube",
      url: "https://www.youtube.com/",
      icon: "https://www.youtube.com/favicon.ico",
      accent: "#ff0033"
    },
    {
      id: id(),
      label: "Gmail",
      url: "https://mail.google.com/",
      icon: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico",
      accent: "#ea4335"
    },
    {
      id: id(),
      label: "Calendar",
      url: "https://calendar.google.com/",
      icon: "https://www.google.com/s2/favicons?sz=128&domain_url=https%3A%2F%2Fcalendar.google.com%2F",
      accent: "#4285f4"
    },
    {
      id: id(),
      label: "Drive",
      url: "https://drive.google.com/",
      icon: "https://www.google.com/s2/favicons?sz=128&domain_url=https%3A%2F%2Fdrive.google.com%2F",
      accent: "#34a853"
    },
    {
      id: id(),
      label: "Perplexity",
      url: "https://www.perplexity.ai/",
      icon: "https://www.google.com/s2/favicons?sz=128&domain_url=https%3A%2F%2Fwww.perplexity.ai%2F",
      accent: "#20b8b8"
    },
    {
      id: id(),
      label: "Notion",
      url: "https://www.notion.so/",
      icon: "https://www.notion.so/images/favicon.ico",
      accent: "#1f2937"
    }
  ];

  var state = loadState();

  var els = {
    shell: document.querySelector(".shell"),
    linkGrid: document.getElementById("linkGrid"),
    recentStrip: document.getElementById("recentStrip"),
    recentLabel: document.getElementById("recentLabel"),
    recentList: document.getElementById("recentList"),
    quickAddLink: document.getElementById("quickAddLink"),
    settingsButton: document.getElementById("settingsButton"),
    dialog: document.getElementById("settingsDialog"),
    form: document.getElementById("settingsForm"),
    closeSettings: document.getElementById("closeSettings"),
    linkEditor: document.getElementById("linkEditor"),
    addLinkRow: document.getElementById("addLinkRow"),
    restoreDefaults: document.getElementById("restoreDefaults"),
    clearRecent: document.getElementById("clearRecent"),
    importConfig: document.getElementById("importConfig"),
    exportConfig: document.getElementById("exportConfig"),
    importFile: document.getElementById("importFile")
  };

  init();

  function init() {
    wireEvents();
    renderLinks();
    renderRecent();
    applyGridShape();
  }

  function wireEvents() {
    els.settingsButton.addEventListener("click", openSettings);
    els.quickAddLink.addEventListener("click", function () {
      openSettings();
      window.setTimeout(function () {
        addLinkEditorRow({ id: id(), label: "", url: "" }, true);
      }, 50);
    });
    els.closeSettings.addEventListener("click", closeSettings);
    els.addLinkRow.addEventListener("click", function () {
      addLinkEditorRow({ id: id(), label: "", url: "" }, true);
    });
    els.restoreDefaults.addEventListener("click", function () {
      state.links = clone(DEFAULT_LINKS);
      saveState();
      fillSettings();
      renderLinks();
      renderRecent();
    });
    els.clearRecent.addEventListener("click", function () {
      state.recent = [];
      saveState();
      renderRecent();
    });
    els.exportConfig.addEventListener("click", exportConfig);
    els.importConfig.addEventListener("click", function () {
      els.importFile.click();
    });
    els.importFile.addEventListener("change", importConfig);
    els.form.addEventListener("submit", function (event) {
      event.preventDefault();
      applySettingsFromEditor();
      closeSettings();
    });
    window.addEventListener("resize", applyGridShape);
  }

  function renderLinks() {
    els.linkGrid.innerHTML = "";
    state.links = state.links.map(normalizeLink).filter(function (link) {
      return link.label && link.url;
    });
    applyGridShape();

    state.links.forEach(function (link) {
      var tile = document.createElement("a");
      tile.className = "link-tile";
      tile.href = safeUrl(link.url);
      tile.rel = "noopener noreferrer";
      tile.style.setProperty("--accent", link.accent);
      tile.style.setProperty("--shade", hexToRgba(link.accent, 0.24));
      tile.addEventListener("click", function () {
        recordRecent(link);
      });

      var mark = document.createElement("span");
      mark.className = "link-mark";

      var image = document.createElement("img");
      image.alt = "";
      image.src = link.icon || faviconUrl(link.url);
      image.addEventListener("error", function () {
        image.remove();
      });

      var fallback = document.createElement("span");
      fallback.textContent = initials(link.label);
      mark.append(image, fallback);

      var copy = document.createElement("span");
      copy.className = "link-copy";

      var name = document.createElement("span");
      name.className = "link-name";
      name.textContent = link.label;

      var domain = document.createElement("span");
      domain.className = "link-domain";
      domain.textContent = domainLabel(link.url);

      copy.append(name, domain);
      tile.append(mark, copy);
      els.linkGrid.appendChild(tile);
    });
  }

  function renderRecent() {
    if (isChromeHistoryAvailable()) {
      renderChromeHistory();
      return;
    }

    renderLocalRecent();
  }

  function renderLocalRecent() {
    els.recentLabel.textContent = "Recent";
    els.recentStrip.setAttribute("aria-label", "Recently opened");
    els.clearRecent.hidden = false;

    var recent = (state.recent || []).map(normalizeLink).filter(function (link) {
      return link.label && link.url;
    }).slice(0, 6);

    state.recent = recent;
    renderRecentLinks(recent);
  }

  function renderChromeHistory() {
    els.recentLabel.textContent = "History";
    els.recentStrip.setAttribute("aria-label", "Chrome history");
    els.clearRecent.hidden = true;

    queryChromeHistory(function (items) {
      var seen = {};
      var historyLinks = items
        .filter(function (item) {
          var url = item && safeUrl(item.url);
          if (!url || !usableHistoryUrl(url) || seen[url]) return false;
          seen[url] = true;
          return true;
        })
        .map(function (item, index) {
          return normalizeLink({
            id: "history-" + index,
            label: item.title || domainLabel(item.url) || "History",
            url: item.url,
            icon: faviconUrl(item.url)
          }, index);
        })
        .slice(0, 6);

      renderRecentLinks(historyLinks);
    });
  }

  function renderRecentLinks(links) {
    els.recentList.innerHTML = "";
    els.recentStrip.hidden = links.length === 0;
    els.shell.classList.toggle("has-recent", links.length > 0);
    if (!links.length) return;

    links.forEach(function (link) {
      var item = document.createElement("a");
      item.className = "recent-chip";
      item.href = safeUrl(link.url);
      item.rel = "noopener noreferrer";
      item.title = link.label + " - " + domainLabel(link.url);
      item.addEventListener("click", function () {
        recordRecent(link);
      });

      var image = document.createElement("img");
      image.alt = "";
      image.src = link.icon || faviconUrl(link.url);
      image.addEventListener("error", function () {
        image.remove();
      });

      var fallback = document.createElement("span");
      fallback.className = "recent-initials";
      fallback.textContent = initials(link.label);

      var label = document.createElement("span");
      label.className = "recent-name";
      label.textContent = link.label;

      item.append(image, fallback, label);
      els.recentList.appendChild(item);
    });
  }

  function recordRecent(link) {
    if (isChromeHistoryAvailable()) return;

    var entry = normalizeLink(link);
    state.recent = [entry].concat((state.recent || []).filter(function (item) {
      return safeUrl(item.url) !== entry.url;
    })).slice(0, 6);
    saveState();
    renderRecent();
  }

  function isChromeHistoryAvailable() {
    return Boolean(window.chrome && chrome.history && typeof chrome.history.search === "function");
  }

  function queryChromeHistory(callback) {
    try {
      chrome.history.search({
        text: "",
        startTime: 0,
        maxResults: 25
      }, function (items) {
        if (chrome.runtime && chrome.runtime.lastError) {
          renderLocalRecent();
          return;
        }
        callback(items || []);
      });
    } catch (error) {
      renderLocalRecent();
    }
  }

  function usableHistoryUrl(value) {
    return /^https?:\/\//i.test(String(value || ""));
  }

  function applyGridShape() {
    var count = Math.max(1, state.links.length);
    var mobile = window.innerWidth <= 850;
    var columns;

    if (mobile) {
      columns = count === 1 ? 1 : 2;
    } else if (count <= 4) {
      columns = count;
    } else if (count <= 6) {
      columns = 3;
    } else {
      columns = 4;
    }

    var rows = Math.ceil(count / columns);
    els.linkGrid.style.setProperty("--columns", String(columns));
    els.linkGrid.style.setProperty("--rows", String(rows));
  }

  function openSettings() {
    fillSettings();
    if (typeof els.dialog.showModal === "function") {
      els.dialog.showModal();
    } else {
      els.dialog.setAttribute("open", "open");
    }
  }

  function closeSettings() {
    if (typeof els.dialog.close === "function") {
      els.dialog.close();
    } else {
      els.dialog.removeAttribute("open");
    }
  }

  function fillSettings() {
    els.linkEditor.innerHTML = "";
    state.links.forEach(function (link) {
      addLinkEditorRow(link, false);
    });
  }

  function addLinkEditorRow(link, focus) {
    var row = document.createElement("div");
    row.className = "editor-row";
    row.dataset.id = link.id || id();

    var labelWrap = document.createElement("label");
    labelWrap.innerHTML = "<span>Name</span>";
    var labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.maxLength = 28;
    labelInput.value = link.label || "";
    labelInput.placeholder = "OpenAI";
    labelInput.dataset.field = "label";
    labelWrap.appendChild(labelInput);

    var urlWrap = document.createElement("label");
    urlWrap.innerHTML = "<span>URL</span>";
    var urlInput = document.createElement("input");
    urlInput.type = "url";
    urlInput.value = link.url || "";
    urlInput.placeholder = "https://example.com";
    urlInput.dataset.field = "url";
    urlWrap.appendChild(urlInput);

    var remove = document.createElement("button");
    remove.type = "button";
    remove.className = "icon-button small";
    remove.title = "Remove link";
    remove.setAttribute("aria-label", "Remove link");
    remove.textContent = "x";
    remove.addEventListener("click", function () {
      row.remove();
    });

    row.append(labelWrap, urlWrap, remove);
    els.linkEditor.appendChild(row);
    if (focus) labelInput.focus();
  }

  function applySettingsFromEditor() {
    state.links = Array.from(els.linkEditor.querySelectorAll(".editor-row"))
      .map(function (row, index) {
        return normalizeLink({
          id: row.dataset.id || id(),
          label: row.querySelector('[data-field="label"]').value.trim(),
          url: row.querySelector('[data-field="url"]').value.trim()
        }, index);
      })
      .filter(function (link) {
        return link.label && link.url;
      });

    saveState();
    renderLinks();
    renderRecent();
  }

  function exportConfig() {
    var blob = new Blob([JSON.stringify({ links: state.links, recent: state.recent || [] }, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "opentab-links.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function importConfig() {
    var file = els.importFile.files && els.importFile.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.addEventListener("load", function () {
      try {
        var imported = JSON.parse(String(reader.result || "{}"));
        state.links = Array.isArray(imported.links) ? imported.links.map(normalizeLink) : clone(DEFAULT_LINKS);
        state.recent = Array.isArray(imported.recent) ? imported.recent.map(normalizeLink).slice(0, 6) : [];
        saveState();
        fillSettings();
        renderLinks();
        renderRecent();
      } catch (error) {
        window.alert("OpenTab could not read that links file.");
      } finally {
        els.importFile.value = "";
      }
    });
    reader.readAsText(file);
  }

  function loadState() {
    try {
      var stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return { links: clone(DEFAULT_LINKS), recent: [] };
      var parsed = JSON.parse(stored);
      return {
        links: Array.isArray(parsed.links) ? parsed.links.map(normalizeLink) : clone(DEFAULT_LINKS),
        recent: Array.isArray(parsed.recent) ? parsed.recent.map(normalizeLink).slice(0, 6) : []
      };
    } catch (error) {
      return { links: clone(DEFAULT_LINKS), recent: [] };
    }
  }

  function saveState() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function normalizeLink(link, index) {
    var safe = safeUrl(link.url || "");
    var match = researchedDefault(link, safe);
    var accent = link.accent || (match && match.accent) || defaultAccent(link.label || safe, index || 0);
    return {
      id: link.id || id(),
      label: String(link.label || domainLabel(safe) || "Link").trim(),
      url: safe,
      icon: (match && match.icon) || link.icon || faviconUrl(safe),
      accent: accent
    };
  }

  function researchedDefault(link, safeUrlValue) {
    var label = String(link.label || "").toLowerCase();
    var host = domainLabel(safeUrlValue);
    return DEFAULT_LINKS.find(function (item) {
      return item.label.toLowerCase() === label || domainLabel(item.url) === host;
    });
  }

  function safeUrl(value) {
    if (!value) return "";
    var trimmed = String(value).trim();
    if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) return trimmed;
    return "https://" + trimmed.replace(/^\/+/, "");
  }

  function faviconUrl(value) {
    return "https://www.google.com/s2/favicons?sz=128&domain_url=" + encodeURIComponent(safeUrl(value));
  }

  function domainLabel(value) {
    try {
      var url = new URL(safeUrl(value));
      return url.hostname.replace(/^www\./, "");
    } catch (error) {
      return "";
    }
  }

  function initials(value) {
    return String(value || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(function (part) {
        return part.charAt(0).toUpperCase();
      })
      .join("") || "?";
  }

  function defaultAccent(value, index) {
    var palette = ["#56d6c5", "#ff7d66", "#ffc857", "#9bd66b", "#7aa9ff", "#a78bfa"];
    var total = 0;
    for (var i = 0; i < String(value).length; i += 1) {
      total += String(value).charCodeAt(i);
    }
    return palette[(total + index) % palette.length];
  }

  function hexToRgba(hex, alpha) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return "rgba(86, 214, 197, " + alpha + ")";
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function id() {
    return "id-" + Math.random().toString(36).slice(2, 10);
  }
})();
