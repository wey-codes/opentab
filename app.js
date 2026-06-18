(function () {
  var STORAGE_KEY = "opentab-state-v1";
  var COLORS = ["#56d6c5", "#ff7d66", "#ffc857", "#9bd66b", "#7aa9ff", "#f7f2e8"];

  var DEFAULT_STATE = {
    onboarded: true,
    name: "",
    emailUrl: "https://mail.google.com/",
    hourlyWage: 0,
    workStart: "09:00",
    workEnd: "17:00",
    links: [
      { id: id(), label: "OpenAI", url: "https://chatgpt.com/" },
      { id: id(), label: "Claude", url: "https://claude.ai/" },
      { id: id(), label: "YouTube", url: "https://www.youtube.com/" },
      { id: id(), label: "Gmail", url: "https://mail.google.com/" },
      { id: id(), label: "Calendar", url: "https://calendar.google.com/" },
      { id: id(), label: "Drive", url: "https://drive.google.com/" },
      { id: id(), label: "Perplexity", url: "https://www.perplexity.ai/" },
      { id: id(), label: "Notion", url: "https://www.notion.so/" }
    ],
    routine: [
      { id: id(), label: "Set top focus" },
      { id: id(), label: "Check calendar" },
      { id: id(), label: "Clear urgent email" },
      { id: id(), label: "Move body" },
      { id: id(), label: "Review money pulse" }
    ],
    daily: blankDaily()
  };

  var state = loadState();
  ensureDaily();

  var els = {
    dayLine: document.getElementById("dayLine"),
    greeting: document.getElementById("greeting"),
    emailButton: document.getElementById("emailButton"),
    settingsButton: document.getElementById("settingsButton"),
    clock: document.getElementById("clock"),
    dateLine: document.getElementById("dateLine"),
    progressPill: document.getElementById("progressPill"),
    routinePill: document.getElementById("routinePill"),
    focusInput: document.getElementById("focusInput"),
    focusDone: document.getElementById("focusDone"),
    linkGrid: document.getElementById("linkGrid"),
    quickAddLink: document.getElementById("quickAddLink"),
    routineReset: document.getElementById("routineReset"),
    routineList: document.getElementById("routineList"),
    netBadge: document.getElementById("netBadge"),
    earnedAmount: document.getElementById("earnedAmount"),
    workWindow: document.getElementById("workWindow"),
    wageLine: document.getElementById("wageLine"),
    dialog: document.getElementById("settingsDialog"),
    form: document.getElementById("settingsForm"),
    closeSettings: document.getElementById("closeSettings"),
    settingName: document.getElementById("settingName"),
    settingEmail: document.getElementById("settingEmail"),
    settingWage: document.getElementById("settingWage"),
    settingStart: document.getElementById("settingStart"),
    settingEnd: document.getElementById("settingEnd"),
    linkEditor: document.getElementById("linkEditor"),
    routineEditor: document.getElementById("routineEditor"),
    addLinkRow: document.getElementById("addLinkRow"),
    addRoutineRow: document.getElementById("addRoutineRow"),
    restoreDefaults: document.getElementById("restoreDefaults"),
    importConfig: document.getElementById("importConfig"),
    exportConfig: document.getElementById("exportConfig"),
    importFile: document.getElementById("importFile")
  };

  init();

  function init() {
    initThree();
    wireEvents();
    renderAll();
    tick();
    window.setInterval(tick, 1000);

  }

  function wireEvents() {
    els.focusInput.addEventListener("input", function () {
      state.daily.focus = els.focusInput.value;
      saveState();
    });

    els.focusDone.addEventListener("change", function () {
      state.daily.focusDone = els.focusDone.checked;
      saveState();
      renderProgress();
    });

    els.settingsButton.addEventListener("click", openSettings);
    els.quickAddLink.addEventListener("click", function () {
      openSettings();
      window.setTimeout(function () {
        addLinkEditorRow({ id: id(), label: "", url: "" });
        els.dialog.scrollTo({ top: els.linkEditor.offsetTop - 20, behavior: "smooth" });
      }, 50);
    });

    els.closeSettings.addEventListener("click", closeSettings);

    els.routineReset.addEventListener("click", function () {
      state.daily.completed = {};
      saveState();
      renderRoutine();
      renderProgress();
    });

    els.addLinkRow.addEventListener("click", function () {
      addLinkEditorRow({ id: id(), label: "", url: "" });
    });

    els.addRoutineRow.addEventListener("click", function () {
      addRoutineEditorRow({ id: id(), label: "" });
    });

    els.restoreDefaults.addEventListener("click", function () {
      var fresh = clone(DEFAULT_STATE);
      fresh.onboarded = true;
      fresh.daily = state.daily;
      state = fresh;
      saveState();
      fillSettings();
      renderAll();
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

    window.addEventListener("resize", resizeRenderer);
  }

  function renderAll() {
    els.focusInput.value = state.daily.focus || "";
    els.focusDone.checked = Boolean(state.daily.focusDone);
    els.emailButton.href = state.emailUrl || DEFAULT_STATE.emailUrl;

    var hour = new Date().getHours();
    var greeting = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
    els.greeting.textContent = state.name ? greeting + ", " + state.name : "OpenTab";

    renderLinks();
    renderRoutine();
    renderMoney();
    renderProgress();
  }

  function tick() {
    ensureDaily();
    renderClock();
    renderMoney();
    renderProgress();
  }

  function renderClock() {
    var now = new Date();
    els.clock.textContent = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
    els.dateLine.textContent = now.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric"
    });
    els.dayLine.textContent = now.toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function renderProgress() {
    var done = Object.keys(state.daily.completed || {}).filter(function (key) {
      return state.daily.completed[key];
    }).length;
    var total = state.routine.length;
    var routineText = total ? done + "/" + total + " routine" : "0 routine";
    els.routinePill.textContent = routineText;

    var progress = workdayProgress();
    els.progressPill.textContent = Math.round(progress * 100) + "% workday";
  }

  function renderLinks() {
    els.linkGrid.innerHTML = "";
    state.links.forEach(function (link, index) {
      var a = document.createElement("a");
      a.className = "link-tile";
      a.href = safeUrl(link.url);
      a.rel = "noopener noreferrer";

      var mark = document.createElement("span");
      mark.className = "link-mark";
      mark.style.background = COLORS[index % COLORS.length];
      mark.textContent = initials(link.label);

      var name = document.createElement("span");
      name.className = "link-name";
      name.textContent = link.label || "Link";

      a.append(mark, name);
      els.linkGrid.appendChild(a);
    });
  }

  function renderRoutine() {
    els.routineList.innerHTML = "";
    state.routine.forEach(function (item) {
      var label = document.createElement("label");
      label.className = "routine-item";
      if (state.daily.completed[item.id]) label.classList.add("done");

      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = Boolean(state.daily.completed[item.id]);
      checkbox.addEventListener("change", function () {
        state.daily.completed[item.id] = checkbox.checked;
        saveState();
        renderRoutine();
        renderProgress();
      });

      var text = document.createElement("span");
      text.textContent = item.label;

      label.append(checkbox, text);
      els.routineList.appendChild(label);
    });
  }

  function renderMoney() {
    var earned = earnedToday();

    els.earnedAmount.textContent = money(earned);
    els.netBadge.textContent = Math.round(workdayProgress() * 100) + "%";
    els.netBadge.style.background = state.hourlyWage ? "var(--gold)" : "var(--teal)";
    els.workWindow.textContent = formatTimeLabel(state.workStart) + " - " + formatTimeLabel(state.workEnd);
    els.wageLine.textContent = state.hourlyWage ? money(state.hourlyWage) + "/hr" : "set wage";
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
    if (!state.onboarded) {
      state.onboarded = true;
      saveState();
    }
    if (typeof els.dialog.close === "function") {
      els.dialog.close();
    } else {
      els.dialog.removeAttribute("open");
    }
  }

  function fillSettings() {
    els.settingName.value = state.name || "";
    els.settingEmail.value = state.emailUrl || "";
    els.settingWage.value = state.hourlyWage || "";
    els.settingStart.value = state.workStart || "09:00";
    els.settingEnd.value = state.workEnd || "17:00";

    els.linkEditor.innerHTML = "";
    state.links.forEach(addLinkEditorRow);

    els.routineEditor.innerHTML = "";
    state.routine.forEach(addRoutineEditorRow);
  }

  function addLinkEditorRow(link) {
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
    labelInput.focus();
  }

  function addRoutineEditorRow(item) {
    var row = document.createElement("div");
    row.className = "editor-row routine-editor-row";
    row.dataset.id = item.id || id();

    var labelWrap = document.createElement("label");
    labelWrap.innerHTML = "<span>Item</span>";
    var input = document.createElement("input");
    input.type = "text";
    input.maxLength = 60;
    input.value = item.label || "";
    input.placeholder = "Check calendar";
    input.dataset.field = "label";
    labelWrap.appendChild(input);

    var remove = document.createElement("button");
    remove.type = "button";
    remove.className = "icon-button small";
    remove.title = "Remove routine item";
    remove.setAttribute("aria-label", "Remove routine item");
    remove.textContent = "x";
    remove.addEventListener("click", function () {
      row.remove();
    });

    row.append(labelWrap, remove);
    els.routineEditor.appendChild(row);
    input.focus();
  }

  function applySettingsFromEditor() {
    state.name = els.settingName.value.trim();
    state.emailUrl = safeUrl(els.settingEmail.value.trim() || DEFAULT_STATE.emailUrl);
    state.hourlyWage = Number(els.settingWage.value || 0);
    state.workStart = els.settingStart.value || "09:00";
    state.workEnd = els.settingEnd.value || "17:00";
    state.onboarded = true;

    state.links = Array.from(els.linkEditor.querySelectorAll(".editor-row"))
      .map(function (row) {
        return {
          id: row.dataset.id || id(),
          label: row.querySelector('[data-field="label"]').value.trim(),
          url: safeUrl(row.querySelector('[data-field="url"]').value.trim())
        };
      })
      .filter(function (link) {
        return link.label && link.url;
      });

    state.routine = Array.from(els.routineEditor.querySelectorAll(".editor-row"))
      .map(function (row) {
        return {
          id: row.dataset.id || id(),
          label: row.querySelector('[data-field="label"]').value.trim()
        };
      })
      .filter(function (item) {
        return item.label;
      });

    saveState();
    renderAll();
  }

  function ensureDaily() {
    var today = localDateKey();
    if (!state.daily || state.daily.date !== today) {
      state.daily = blankDaily();
      saveState();
    }
  }

  function blankDaily() {
    return {
      date: localDateKey(),
      focus: "",
      focusDone: false,
      completed: {}
    };
  }

  function loadState() {
    try {
      var stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return clone(DEFAULT_STATE);
      return mergeState(clone(DEFAULT_STATE), JSON.parse(stored));
    } catch (error) {
      return clone(DEFAULT_STATE);
    }
  }

  function saveState() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function exportConfig() {
    var payload = {
      name: state.name,
      emailUrl: state.emailUrl,
      hourlyWage: state.hourlyWage,
      workStart: state.workStart,
      workEnd: state.workEnd,
      links: state.links,
      routine: state.routine
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "opentab-config.json";
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
        state = mergeState(state, imported);
        state.onboarded = true;
        saveState();
        fillSettings();
        renderAll();
      } catch (error) {
        window.alert("OpenTab could not read that config file.");
      } finally {
        els.importFile.value = "";
      }
    });
    reader.readAsText(file);
  }

  function mergeState(base, incoming) {
    Object.keys(incoming || {}).forEach(function (key) {
      if (key === "daily") {
        base.daily = Object.assign(blankDaily(), incoming.daily || {});
      } else if (Array.isArray(incoming[key])) {
        base[key] = incoming[key];
      } else if (incoming[key] && typeof incoming[key] === "object") {
        base[key] = Object.assign(base[key] || {}, incoming[key]);
      } else {
        base[key] = incoming[key];
      }
    });
    return base;
  }

  function earnedToday() {
    var wage = Number(state.hourlyWage || 0);
    if (!wage) return 0;
    var now = new Date();
    var start = timeOnDate(now, state.workStart);
    var end = timeOnDate(now, state.workEnd);
    if (end <= start) end.setDate(end.getDate() + 1);
    var elapsedMs = Math.max(0, Math.min(now, end) - start);
    return wage * (elapsedMs / 3600000);
  }

  function workdayProgress() {
    var now = new Date();
    var start = timeOnDate(now, state.workStart);
    var end = timeOnDate(now, state.workEnd);
    if (end <= start) end.setDate(end.getDate() + 1);
    var total = end - start;
    if (!total) return 0;
    return Math.max(0, Math.min(1, (now - start) / total));
  }

  function timeOnDate(date, value) {
    var parts = String(value || "09:00").split(":");
    var result = new Date(date);
    result.setHours(Number(parts[0] || 0), Number(parts[1] || 0), 0, 0);
    return result;
  }

  function formatTimeLabel(value) {
    return timeOnDate(new Date(), value).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function localDateKey() {
    var date = new Date();
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function safeUrl(value) {
    if (!value) return "";
    var trimmed = value.trim();
    if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) return trimmed;
    return "https://" + trimmed.replace(/^\/+/, "");
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

  function money(value) {
    return Number(value || 0).toLocaleString([], {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2
    });
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function id() {
    return "id-" + Math.random().toString(36).slice(2, 10);
  }

  var renderer;
  var camera;
  var scene;
  var rig;

  function initThree() {
    var canvas = document.getElementById("spaceCanvas");
    if (!window.THREE) {
      document.documentElement.dataset.sceneEngine = "fallback";
      drawFallback(canvas);
      return;
    }

    document.documentElement.dataset.sceneEngine = "three";
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.4, 8.2);

    rig = new THREE.Group();
    scene.add(rig);

    var keyLight = new THREE.DirectionalLight(0xfff0d0, 1.15);
    keyLight.position.set(4, 5, 7);
    scene.add(keyLight);

    var coolLight = new THREE.PointLight(0x56d6c5, 1.4, 22);
    coolLight.position.set(-5, -1, 4);
    scene.add(coolLight);

    var warmLight = new THREE.PointLight(0xff7d66, 1.0, 20);
    warmLight.position.set(5, 1, 3);
    scene.add(warmLight);

    var ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x56d6c5,
      roughness: 0.38,
      metalness: 0.55,
      wireframe: true
    });
    var ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.015, 12, 160), ringMaterial);
    rig.add(ring);

    var ringTwo = ring.clone();
    ringTwo.material = new THREE.MeshStandardMaterial({
      color: 0xffc857,
      roughness: 0.5,
      metalness: 0.35,
      wireframe: true
    });
    ringTwo.rotation.x = Math.PI / 2.7;
    ringTwo.rotation.y = Math.PI / 6;
    rig.add(ringTwo);

    var barMaterial = new THREE.MeshStandardMaterial({
      color: 0xf7f2e8,
      roughness: 0.6,
      metalness: 0.2
    });
    for (var i = 0; i < 18; i += 1) {
      var bar = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 1.1 + (i % 4) * 0.28), barMaterial);
      var angle = (i / 18) * Math.PI * 2;
      bar.position.set(Math.cos(angle) * 3.05, Math.sin(angle) * 1.2, -0.55 + (i % 3) * 0.32);
      bar.rotation.z = angle;
      bar.rotation.y = angle * 0.5;
      rig.add(bar);
    }

    var nodeGeometry = new THREE.IcosahedronGeometry(0.18, 1);
    [0x56d6c5, 0xff7d66, 0xffc857, 0x9bd66b, 0x7aa9ff].forEach(function (color, index) {
      var node = new THREE.Mesh(
        nodeGeometry,
        new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.42,
          metalness: 0.25
        })
      );
      var angle = (index / 5) * Math.PI * 2;
      node.position.set(Math.cos(angle) * 3.15, Math.sin(angle) * 1.65, -0.2 + index * 0.12);
      rig.add(node);
    });

    resizeRenderer();
    animateThree();
  }

  function resizeRenderer() {
    if (!renderer || !camera) return;
    var width = window.innerWidth;
    var height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function animateThree() {
    if (!renderer) return;
    var now = performance.now() * 0.001;
    rig.rotation.x = Math.sin(now * 0.21) * 0.12;
    rig.rotation.y = now * 0.09;
    rig.rotation.z = Math.sin(now * 0.14) * 0.08;
    renderer.render(scene, camera);
    window.requestAnimationFrame(animateThree);
  }

  function drawFallback(canvas) {
    var ctx = canvas.getContext("2d");
    function draw() {
      var width = canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
      var height = canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(86, 214, 197, 0.45)";
      ctx.lineWidth = 2;
      for (var i = 0; i < 8; i += 1) {
        ctx.beginPath();
        ctx.ellipse(width / 2, height / 2, 180 + i * 45, 45 + i * 17, i * 0.38, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255, 200, 87, 0.8)";
      ctx.fillRect(width / 2 - 4, height / 2 - 4, 8, 8);
    }
    draw();
    window.addEventListener("resize", draw);
  }
})();
