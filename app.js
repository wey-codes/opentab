(function () {
  var STORAGE_KEY = "opentab-state-v1";
  var STATE_VERSION = 6;
  var SMART_SLOT_COUNT = 2;
  var HISTORY_FREQUENCY_SCAN_LIMIT = 10000;
  var HISTORY_REFRESH_DEBOUNCE_MS = 250;
  var HISTORY_RETRY_DELAYS = [300, 1200, 3000];

  var DEFAULT_LINKS = [
    {
      id: id(),
      label: "YouTube",
      url: "https://www.youtube.com/",
      icon: "https://www.youtube.com/favicon.ico",
      accent: "#ff0033"
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
      label: "OpenAI",
      url: "https://chatgpt.com/",
      icon: "https://openai.com/favicon.ico",
      accent: "#10a37f"
    },
    {
      id: id(),
      label: "Email",
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
      label: "X",
      url: "https://x.com/",
      icon: "https://www.google.com/s2/favicons?sz=128&domain_url=https%3A%2F%2Fx.com%2F",
      accent: "#111111"
    },
    {
      id: id(),
      label: "Box",
      url: "https://app.box.com/",
      icon: "https://www.google.com/s2/favicons?sz=128&domain_url=https%3A%2F%2Fapp.box.com%2F",
      accent: "#0061d5"
    },
    {
      id: id(),
      label: "Facebook Ads",
      url: "https://adsmanager.facebook.com/",
      icon: "https://www.google.com/s2/favicons?sz=128&domain_url=https%3A%2F%2Fadsmanager.facebook.com%2F",
      accent: "#1877f2"
    },
    {
      id: id(),
      label: "GitHub",
      url: "https://github.com/",
      icon: "https://github.com/favicon.ico",
      accent: "#6b7280"
    },
    {
      id: id(),
      label: "Reddit",
      url: "https://www.reddit.com/",
      icon: "https://www.redditstatic.com/desktop2x/img/favicon/favicon-96x96.png",
      accent: "#ff4500"
    }
  ];

  var LOCAL_STARTER_LINKS = [
    {
      id: id(),
      label: "Drive",
      url: "https://drive.google.com/",
      icon: "https://www.google.com/s2/favicons?sz=128&domain_url=https%3A%2F%2Fdrive.google.com%2F",
      accent: "#34a853"
    },
    {
      id: id(),
      label: "Docs",
      url: "https://docs.google.com/",
      icon: "https://www.google.com/s2/favicons?sz=128&domain_url=https%3A%2F%2Fdocs.google.com%2F",
      accent: "#4285f4"
    }
  ];

  var LEGACY_AUTO_URLS = [
    "https://drive.google.com/",
    "https://www.perplexity.ai/",
    "https://www.notion.so/",
    "https://www.google.com/",
    "https://maps.google.com/"
  ];

  var LEGACY_DEFAULT_LABELS = {
    "https://chatgpt.com/": "OpenAI",
    "https://claude.ai/": "Claude",
    "https://www.youtube.com/": "YouTube",
    "https://mail.google.com/": "Gmail",
    "https://calendar.google.com/": "Calendar",
    "https://drive.google.com/": "Drive",
    "https://www.google.com/": "Search",
    "https://maps.google.com/": "Maps",
    "https://x.com/": "X",
    "https://app.box.com/": "Box",
    "https://adsmanager.facebook.com/": "Facebook Ads",
    "https://github.com/": "GitHub",
    "https://www.reddit.com/": "Reddit"
  };

  var state = loadState();
  var smartLinks = [];
  var historyRefreshTimer = 0;

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
    registerServiceWorker();
    refreshOpenTab();
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
      refreshOpenTab();
    });
    els.clearRecent.addEventListener("click", function () {
      state.recent = [];
      saveState();
      refreshOpenTab();
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
    window.addEventListener("focus", scheduleChromeHistoryRefresh);
    window.addEventListener("pageshow", scheduleChromeHistoryRefresh);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) scheduleChromeHistoryRefresh();
    });
  }

  function refreshOpenTab() {
    state.links = normalizeLinks(state.links);
    smartLinks = buildLocalSmartLinks();
    renderLinks();

    if (!isChromeHistoryAvailable()) {
      setHistoryMode("local");
      renderLocalRecent();
      return;
    }

    setHistoryMode("chrome");
    refreshChromeHistoryData(0);
  }

  function scheduleChromeHistoryRefresh() {
    if (!isChromeHistoryAvailable()) return;

    window.clearTimeout(historyRefreshTimer);
    historyRefreshTimer = window.setTimeout(function () {
      refreshChromeHistoryData(0);
    }, HISTORY_REFRESH_DEBOUNCE_MS);
  }

  function refreshChromeHistoryData(attempt) {
    setHistoryMode("chrome");
    queryChromeHistory(HISTORY_FREQUENCY_SCAN_LIMIT, function (items) {
      smartLinks = buildFrequentSmartLinks(items);
      renderLinks();
      renderChromeHistoryLinks(items);
    }, function () {
      if (attempt < HISTORY_RETRY_DELAYS.length) {
        historyRefreshTimer = window.setTimeout(function () {
          refreshChromeHistoryData(attempt + 1);
        }, HISTORY_RETRY_DELAYS[attempt]);
        return;
      }

      setHistoryMode("local");
      smartLinks = buildLocalSmartLinks();
      renderLinks();
      renderLocalRecent();
    });
  }

  function renderLinks() {
    els.linkGrid.innerHTML = "";
    var displayLinks = state.links.concat(smartLinks);

    displayLinks.forEach(function (link) {
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

    applyGridShape();
  }

  function renderLocalRecent() {
    var recent = (state.recent || []).map(normalizeLink).filter(function (link) {
      return link.label && link.url;
    }).slice(0, 6);

    state.recent = recent;

    if (recent.length) {
      els.recentLabel.textContent = "Recent";
      els.recentStrip.setAttribute("aria-label", "Recently opened");
      els.clearRecent.hidden = false;
      renderRecentLinks(recent);
      return;
    }

    els.recentLabel.textContent = "Start";
    els.recentStrip.setAttribute("aria-label", "Starter links");
    els.clearRecent.hidden = true;
    renderRecentLinks(localStarterLinks(6));
  }

  function localStarterLinks(limit) {
    return uniqueSmartLinks(LOCAL_STARTER_LINKS, state.links, limit);
  }

  function buildLocalSmartLinks() {
    return uniqueSmartLinks((state.recent || []).concat(LOCAL_STARTER_LINKS), state.links, SMART_SLOT_COUNT);
  }

  function renderChromeHistoryLinks(items) {
    els.recentLabel.textContent = "History";
    els.recentStrip.setAttribute("aria-label", "Chrome history");
    els.clearRecent.hidden = true;

    var seen = {};
    var historyLinks = items
      .filter(function (item) {
        if (!item || !usableHistoryUrl(item.url)) return false;
        var url = safeUrl(item.url);
        if (seen[url]) return false;
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
  }

  function historyQueryFailed(fallback) {
    if (typeof fallback === "function") {
      fallback();
      return;
    }
    renderLocalRecent();
  }

  function queryChromeHistory(maxResults, callback, fallback) {
    try {
      chrome.history.search({
        text: "",
        startTime: 0,
        maxResults: maxResults
      }, function (items) {
        if (chrome.runtime && chrome.runtime.lastError) {
          historyQueryFailed(fallback);
          return;
        }
        callback(items || []);
      });
    } catch (error) {
      historyQueryFailed(fallback);
    }
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
    refreshOpenTab();
  }

  function isChromeHistoryAvailable() {
    return Boolean(window.chrome && chrome.history && typeof chrome.history.search === "function");
  }

  function setHistoryMode(mode) {
    document.documentElement.dataset.historyMode = mode;
  }

  function registerServiceWorker() {
    var webProtocol = location.protocol === "http:" || location.protocol === "https:";
    if (!webProtocol || !("serviceWorker" in navigator)) return;

    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").catch(function () {});
    });
  }

  function usableHistoryUrl(value) {
    var raw = String(value || "").trim();
    if (!/^https?:\/\//i.test(raw)) return false;
    try {
      var url = new URL(raw);
      return ["localhost", "127.0.0.1", "::1"].indexOf(url.hostname) === -1;
    } catch (error) {
      return false;
    }
  }

  function buildFrequentSmartLinks(items) {
    var excludedHosts = hostSet(state.links);
    var byHost = {};

    items.forEach(function (item) {
      if (!item || !usableHistoryUrl(item.url)) return;

      var host = domainLabel(item.url);
      if (!host || excludedHosts[host]) return;

      var existing = byHost[host];
      var visitCount = Number(item.visitCount || 0);
      var lastVisitTime = Number(item.lastVisitTime || 0);

      if (!existing) {
        byHost[host] = {
          host: host,
          url: item.url,
          label: smartLabel(item),
          visits: visitCount,
          lastVisitTime: lastVisitTime
        };
        return;
      }

      existing.visits += visitCount;
      if (lastVisitTime > existing.lastVisitTime) {
        existing.url = item.url;
        existing.label = smartLabel(item);
        existing.lastVisitTime = lastVisitTime;
      }
    });

    var historyLinks = Object.keys(byHost)
      .map(function (host) {
        return byHost[host];
      })
      .sort(function (a, b) {
        if (b.visits !== a.visits) return b.visits - a.visits;
        return b.lastVisitTime - a.lastVisitTime;
      })
      .map(function (entry, index) {
        return normalizeLink({
          id: "smart-" + index,
          label: entry.label,
          url: entry.url,
          icon: faviconUrl(entry.url)
        }, index);
      });

    return uniqueSmartLinks(historyLinks, state.links, SMART_SLOT_COUNT);
  }

  function uniqueSmartLinks(candidates, excludeLinks, limit) {
    var excludedHosts = hostSet(excludeLinks);
    var seenHosts = {};
    var results = [];

    candidates.forEach(function (candidate, index) {
      if (results.length >= limit) return;

      var link = normalizeLink(candidate, index);
      var host = domainLabel(link.url);
      if (!host || excludedHosts[host] || seenHosts[host]) return;

      seenHosts[host] = true;
      results.push(link);
    });

    return results;
  }

  function hostSet(links) {
    var set = {};
    (links || []).forEach(function (link) {
      var host = domainLabel(link.url);
      if (host) set[host] = true;
    });
    return set;
  }

  function smartLabel(item) {
    var title = String(item.title || "").trim();
    if (title && title.length <= 34) return title;

    var host = domainLabel(item.url);
    var parts = host.split(".");
    var label = parts.length > 2 ? parts[0] : parts[0] || host;
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  function applyGridShape() {
    var count = Math.max(1, els.linkGrid.children.length || state.links.length + smartLinks.length);
    var mobile = window.innerWidth <= 850;
    var columns;

    if (mobile) {
      columns = count === 1 ? 1 : count > 10 ? 3 : 2;
    } else if (count <= 4) {
      columns = count;
    } else if (count <= 6) {
      columns = 3;
    } else if (count === 9) {
      columns = 3;
    } else if (count === 10) {
      columns = 5;
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
    refreshOpenTab();
  }

  function exportConfig() {
    var blob = new Blob([JSON.stringify({ version: STATE_VERSION, links: state.links, recent: state.recent || [] }, null, 2)], { type: "application/json" });
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
        state.links = migrateStoredLinks(imported.links, imported.version || 1);
        state.recent = Array.isArray(imported.recent) ? imported.recent.map(normalizeLink).slice(0, 6) : [];
        saveState();
        fillSettings();
        refreshOpenTab();
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
      if (!stored) return { version: STATE_VERSION, links: clone(DEFAULT_LINKS), recent: [] };
      var parsed = JSON.parse(stored);
      return {
        version: STATE_VERSION,
        links: migrateStoredLinks(parsed.links, parsed.version || 1),
        recent: Array.isArray(parsed.recent) ? parsed.recent.map(normalizeLink).slice(0, 6) : []
      };
    } catch (error) {
      return { version: STATE_VERSION, links: clone(DEFAULT_LINKS), recent: [] };
    }
  }

  function saveState() {
    state.version = STATE_VERSION;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function normalizeLinks(links) {
    return (links || []).map(normalizeLink).filter(function (link) {
      return link.label && link.url;
    });
  }

  function migrateStoredLinks(links, version) {
    var normalized = normalizeLinks(Array.isArray(links) ? links : clone(DEFAULT_LINKS));
    if (version >= STATE_VERSION) return normalized.length ? normalized : clone(DEFAULT_LINKS);

    var byUrl = {};
    normalized.forEach(function (link) {
      byUrl[safeUrl(link.url)] = link;
    });

    var defaultUrls = urlSet(DEFAULT_LINKS);
    var legacyAutoUrls = urlSet(LEGACY_AUTO_URLS.map(function (url) {
      return { url: url };
    }));
    var migrated = DEFAULT_LINKS.map(function (link) {
      var url = safeUrl(link.url);
      var stored = byUrl[url];
      if (!stored || stored.label === LEGACY_DEFAULT_LABELS[url]) return normalizeLink(link);
      return normalizeLink(stored);
    });

    normalized.forEach(function (link) {
      var url = safeUrl(link.url);
      if (defaultUrls[url] || legacyAutoUrls[url]) return;
      migrated.push(link);
    });

    return migrated;
  }

  function urlSet(links) {
    var set = {};
    (links || []).forEach(function (link) {
      set[safeUrl(link.url)] = true;
    });
    return set;
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
