/* ============================================================
   Forest Plot Recorder
   Self-contained field-data app. Data lives in localStorage
   during use and is exported to CSV / JSON files.
   ============================================================ */

(function () {
  "use strict";

  const STORAGE_KEY = "forestPlotRecorder.v1";

  /** @typedef {{id:string,name:string,date:string,surveyor:string,
   *  lat:string,lng:string,shape:string,size:string,slope:string,
   *  aspect:string,canopy:string,notes:string,trees:Tree[]}} Plot */
  /** @typedef {{id:string,species:string,tag:string,dbh:string,
   *  height:string,health:string,status:string,notes:string}} Tree */

  /** @type {{plots: Plot[], selectedPlotId: string|null}} */
  let state = { plots: [], selectedPlotId: null };

  // -------- persistence --------
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) state = JSON.parse(raw);
    } catch (e) {
      console.warn("Could not load saved data:", e);
    }
    if (!Array.isArray(state.plots)) state.plots = [];
  }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      toast("⚠️ Could not save locally (storage full or blocked)");
    }
  }

  const uid = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const $ = (id) => document.getElementById(id);

  function selectedPlot() {
    return state.plots.find((p) => p.id === state.selectedPlotId) || null;
  }

  // -------- toast --------
  let toastTimer;
  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 2600);
  }

  /* ============================================================
     PLOT FORM
     ============================================================ */
  const plotForm = $("plotForm");

  plotForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = $("plotId").value;
    const data = {
      number: $("plotNumber").value,
      name: $("plotName").value.trim(),
      date: $("plotDate").value,
      surveyor: $("plotSurveyor").value.trim(),
      lat: $("plotLat").value.trim(),
      lng: $("plotLng").value.trim(),
      shape: $("plotShape").value,
      size: $("plotSize").value.trim(),
      slope: $("plotSlope").value.trim(),
      aspect: $("plotAspect").value,
      canopy: $("plotCanopy").value.trim(),
      gaps: $("plotGaps").value.trim(),
      soilTexture: $("plotSoilTexture").value,
      soilColour: $("plotSoilColour").value.trim(),
      litterDepth: $("plotLitterDepth").value.trim(),
      drainage: $("plotDrainage").value,
      disturbance: $("plotDisturbance").value,
      notes: $("plotNotes").value.trim(),
    };

    if (id) {
      const plot = state.plots.find((p) => p.id === id);
      if (plot) Object.assign(plot, data);
      toast("Plot updated");
    } else {
      state.plots.unshift({ id: uid(), ...data, trees: [] });
      state.selectedPlotId = state.plots[0].id;
      toast("Plot added");
    }
    save();
    resetPlotForm();
    renderPlots();
    renderTrees();
  });

  $("plotCancelBtn").addEventListener("click", resetPlotForm);

  function resetPlotForm() {
    plotForm.reset();
    $("plotId").value = "";
    $("plotCancelBtn").hidden = true;
    plotForm.querySelector("button[type=submit]").textContent = "Save plot";
    if (!$("plotDate").value) $("plotDate").value = today();
  }

  // Fill the 1–50 plot-number dropdown.
  function populatePlotNumbers() {
    const sel = $("plotNumber");
    for (let n = 1; n <= 50; n++) {
      const o = document.createElement("option");
      o.value = String(n);
      o.textContent = String(n);
      sel.appendChild(o);
    }
  }

  function editPlot(plot) {
    $("plotId").value = plot.id;
    $("plotNumber").value = plot.number || "";
    $("plotName").value = plot.name || "";
    $("plotDate").value = plot.date || "";
    $("plotSurveyor").value = plot.surveyor || "";
    $("plotLat").value = plot.lat || "";
    $("plotLng").value = plot.lng || "";
    $("plotShape").value = plot.shape || "circular";
    $("plotSize").value = plot.size || "";
    $("plotSlope").value = plot.slope || "";
    $("plotAspect").value = plot.aspect || "";
    $("plotCanopy").value = plot.canopy || "";
    $("plotGaps").value = plot.gaps || "";
    $("plotSoilTexture").value = plot.soilTexture || "";
    $("plotSoilColour").value = plot.soilColour || "";
    $("plotLitterDepth").value = plot.litterDepth || "";
    $("plotDrainage").value = plot.drainage || "";
    $("plotDisturbance").value = plot.disturbance || "";
    $("plotNotes").value = plot.notes || "";
    $("plotCancelBtn").hidden = false;
    plotForm.querySelector("button[type=submit]").textContent = "Update plot";
    plotForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // -------- GPS --------
  $("gpsBtn").addEventListener("click", () => {
    if (!navigator.geolocation) {
      toast("Geolocation not supported on this device");
      return;
    }
    toast("Getting location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        $("plotLat").value = pos.coords.latitude.toFixed(6);
        $("plotLng").value = pos.coords.longitude.toFixed(6);
        toast("Location captured");
      },
      (err) => toast("Location error: " + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  /* ============================================================
     TREE FORM
     ============================================================ */
  const treeForm = $("treeForm");

  treeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const plot = selectedPlot();
    if (!plot) return;
    const id = $("treeId").value;
    const distance = $("treeDistance").value.trim();
    const angleBase = $("treeAngleBase").value.trim();
    const angleTop = $("treeAngleTop").value.trim();
    const data = {
      running: $("treeRunning").value.trim(),
      speciesLocal: $("treeSpeciesLocal").value.trim(),
      speciesId: $("treeSpeciesId").value.trim(),
      dbh: $("treeDbh").value.trim(),
      distance: distance,
      angleBase: angleBase,
      angleTop: angleTop,
      height: heightString(distance, angleBase, angleTop),
      canopyX: $("treeCanopyX").value.trim(),
      canopyY: $("treeCanopyY").value.trim(),
      crownClass: $("treeCrownClass").value,
      health: $("treeHealth").value,
      notes: $("treeNotes").value.trim(),
    };

    if (id) {
      const tree = plot.trees.find((t) => t.id === id);
      if (tree) Object.assign(tree, data);
      toast("Tree updated");
    } else {
      plot.trees.push({ id: uid(), ...data });
      toast("Tree added");
    }
    save();
    resetTreeForm();
    renderPlots();
    renderTrees();
  });

  $("treeCancelBtn").addEventListener("click", resetTreeForm);

  // Clinometer tangent method. Angles in degrees, signed relative to
  // horizontal (looking up = +, looking down = −). The base angle is
  // usually negative on flat ground; the difference of tangents times
  // the horizontal distance gives the tree height.
  function computeHeight(distance, angleBase, angleTop) {
    const d = parseFloat(distance);
    const ab = parseFloat(angleBase);
    const at = parseFloat(angleTop);
    if ([d, ab, at].some((n) => isNaN(n))) return null;
    const rad = (deg) => (deg * Math.PI) / 180;
    return d * (Math.tan(rad(at)) - Math.tan(rad(ab)));
  }
  function heightString(distance, angleBase, angleTop) {
    const h = computeHeight(distance, angleBase, angleTop);
    return h == null ? "" : (Math.round(h * 100) / 100).toString();
  }

  // Live height preview as the three measurements are typed.
  function updateHeightPreview() {
    const h = computeHeight(
      $("treeDistance").value,
      $("treeAngleBase").value,
      $("treeAngleTop").value
    );
    $("treeHeightCalc").textContent = h == null ? "—" : (Math.round(h * 10) / 10).toString();
  }
  ["treeDistance", "treeAngleBase", "treeAngleTop"].forEach((id) =>
    $(id).addEventListener("input", updateHeightPreview)
  );

  function resetTreeForm() {
    treeForm.reset();
    $("treeId").value = "";
    $("treeCancelBtn").hidden = true;
    treeForm.querySelector("button[type=submit]").textContent = "Add tree";
    suggestRunningNumber();
    updateHeightPreview();
    $("treeRunning").focus();
  }

  // Pre-fill the next running number for the selected plot.
  function suggestRunningNumber() {
    const plot = selectedPlot();
    if (!plot || !plot.trees) return;
    const max = plot.trees.reduce((m, t) => {
      const n = parseInt(t.running, 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    $("treeRunning").value = String(max + 1);
  }

  function editTree(tree) {
    $("treeId").value = tree.id;
    $("treeRunning").value = tree.running || "";
    $("treeSpeciesLocal").value = tree.speciesLocal || "";
    $("treeSpeciesId").value = tree.speciesId || "";
    $("treeDbh").value = tree.dbh || "";
    $("treeDistance").value = tree.distance || "";
    $("treeAngleBase").value = tree.angleBase || "";
    $("treeAngleTop").value = tree.angleTop || "";
    $("treeCanopyX").value = tree.canopyX || "";
    $("treeCanopyY").value = tree.canopyY || "";
    $("treeCrownClass").value = tree.crownClass || "";
    $("treeHealth").value = tree.health || "";
    $("treeNotes").value = tree.notes || "";
    $("treeCancelBtn").hidden = false;
    treeForm.querySelector("button[type=submit]").textContent = "Update tree";
    updateHeightPreview();
    treeForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ============================================================
     RENDERING
     ============================================================ */
  function renderPlots() {
    const list = $("plotList");
    $("plotCount").textContent = String(state.plots.length);
    list.innerHTML = "";

    if (state.plots.length === 0) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "No plots yet. Add one above.";
      list.appendChild(li);
      return;
    }

    state.plots.forEach((plot) => {
      const li = document.createElement("li");
      li.className = "plot-item" + (plot.id === state.selectedPlotId ? " active" : "");
      li.tabIndex = 0;

      const meta = document.createElement("div");
      meta.className = "meta";
      const name = document.createElement("span");
      name.className = "name";
      name.textContent =
        (plot.number ? "Plot " + plot.number : "(no number)") +
        (plot.name ? " — " + plot.name : "");
      const sub = document.createElement("span");
      sub.className = "sub";
      sub.textContent = [plot.date, plot.surveyor, coordLabel(plot)]
        .filter(Boolean)
        .join(" · ");
      meta.append(name, sub);

      const actions = document.createElement("div");
      actions.className = "actions";
      const badge = document.createElement("span");
      badge.className = "tree-badge";
      badge.textContent = (plot.trees ? plot.trees.length : 0) + "🌳";

      const editBtn = iconButton("✏️", "Edit plot", (ev) => {
        ev.stopPropagation();
        editPlot(plot);
      });
      const delBtn = iconButton("🗑", "Delete plot", (ev) => {
        ev.stopPropagation();
        if (confirm(`Delete ${plotLabel(plot)} and its ${plot.trees.length} tree(s)?`)) {
          state.plots = state.plots.filter((p) => p.id !== plot.id);
          if (state.selectedPlotId === plot.id) state.selectedPlotId = null;
          save();
          renderPlots();
          renderTrees();
          toast("Plot deleted");
        }
      });
      delBtn.classList.add("danger");
      actions.append(badge, editBtn, delBtn);

      li.append(meta, actions);
      const selectPlot = () => {
        state.selectedPlotId = plot.id;
        save();
        renderPlots();
        renderTrees();
      };
      li.addEventListener("click", selectPlot);
      li.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          selectPlot();
        }
      });
      list.appendChild(li);
    });
  }

  function renderTrees() {
    const plot = selectedPlot();
    const ctx = $("treeContext");
    const table = $("treeTable");
    const body = $("treeBody");
    const empty = $("treeEmpty");
    const stats = $("plotStats");

    if (!plot) {
      treeForm.hidden = true;
      table.hidden = true;
      stats.hidden = true;
      empty.hidden = false;
      ctx.textContent = "Select a plot";
      return;
    }

    ctx.textContent = plotLabel(plot);
    treeForm.hidden = false;
    refreshSpeciesList();
    if (!$("treeId").value) suggestRunningNumber();

    body.innerHTML = "";
    if (!plot.trees || plot.trees.length === 0) {
      table.hidden = true;
      empty.hidden = false;
      empty.querySelector("p").textContent = "No trees recorded in this plot yet.";
    } else {
      empty.hidden = true;
      table.hidden = false;
      plot.trees.forEach((tree) => {
        const tr = document.createElement("tr");
        tr.append(
          td(tree.running || "", "num"),
          td(tree.speciesLocal || "—"),
          td(tree.dbh || "", "num"),
          td(tree.height || "", "num"),
          td(tree.crownClass || ""),
          td(tree.health || "")
        );
        const actions = document.createElement("td");
        actions.append(
          iconButton("✏️", "Edit tree", () => editTree(tree)),
          (() => {
            const b = iconButton("🗑", "Delete tree", () => {
              plot.trees = plot.trees.filter((t) => t.id !== tree.id);
              save();
              renderPlots();
              renderTrees();
              toast("Tree removed");
            });
            b.classList.add("danger");
            return b;
          })()
        );
        tr.appendChild(actions);
        body.appendChild(tr);
      });
    }

    renderStats(plot, stats);
  }

  function renderStats(plot, container) {
    const trees = plot.trees || [];
    if (trees.length === 0) {
      container.hidden = true;
      return;
    }
    const dbhVals = trees.map((t) => parseFloat(t.dbh)).filter((n) => !isNaN(n));
    const htVals = trees.map((t) => parseFloat(t.height)).filter((n) => !isNaN(n));
    const species = new Set(
      trees
        .map((t) => (t.speciesId || t.speciesLocal || "").trim().toLowerCase())
        .filter(Boolean)
    );
    const avg = (a) => (a.length ? (a.reduce((s, n) => s + n, 0) / a.length) : null);

    container.hidden = false;
    container.innerHTML = "";
    container.append(
      stat(trees.length, "Trees"),
      stat(species.size, "Species"),
      stat(fmt(avg(dbhVals)), "Avg DBH cm"),
      stat(fmt(avg(htVals)), "Avg height m")
    );
  }

  // -------- small DOM helpers --------
  function td(text, cls) {
    const el = document.createElement("td");
    el.textContent = text;
    if (cls) el.className = cls;
    return el;
  }
  function stat(val, lbl) {
    const d = document.createElement("div");
    d.className = "stat";
    d.innerHTML = `<div class="val"></div><div class="lbl"></div>`;
    d.querySelector(".val").textContent = val == null ? "—" : val;
    d.querySelector(".lbl").textContent = lbl;
    return d;
  }
  function iconButton(label, title, handler) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn-icon";
    b.textContent = label;
    b.title = title;
    b.setAttribute("aria-label", title);
    b.addEventListener("click", handler);
    return b;
  }

  function refreshSpeciesList() {
    const local = new Set();
    const ids = new Set();
    state.plots.forEach((p) =>
      (p.trees || []).forEach((t) => {
        if (t.speciesLocal) local.add(t.speciesLocal.trim());
        if (t.speciesId) ids.add(t.speciesId.trim());
      })
    );
    fillDatalist("speciesLocalList", local);
    fillDatalist("speciesIdList", ids);
  }
  function fillDatalist(id, values) {
    const dl = $(id);
    dl.innerHTML = "";
    [...values].sort().forEach((s) => {
      const o = document.createElement("option");
      o.value = s;
      dl.appendChild(o);
    });
  }

  /* ============================================================
     EXPORT / IMPORT
     ============================================================ */
  // Files are named per plot: CG_P_<number>.csv / .json
  const FILE_PREFIX = "CG_P_";

  function exportFilename(plot, ext) {
    const num = plot.number || "x";
    return `${FILE_PREFIX}${num}.${ext}`;
  }

  // Guard shared by both export buttons: must have a plot selected,
  // and it must carry a plot number (the basis for the filename).
  function plotForExport() {
    const plot = selectedPlot();
    if (!plot) {
      toast("Select a plot to export");
      return null;
    }
    if (!plot.number) {
      toast("This plot has no number — edit it and set 1–50");
      return null;
    }
    return plot;
  }

  $("exportJsonBtn").addEventListener("click", () => {
    const plot = plotForExport();
    if (!plot) return;
    const payload = {
      app: "Forest Plot Recorder",
      version: 1,
      exportedAt: new Date().toISOString(),
      plots: [plot],
    };
    download(
      JSON.stringify(payload, null, 2),
      exportFilename(plot, "json"),
      "application/json"
    );
    toast(`Exported ${exportFilename(plot, "json")}`);
  });

  $("exportCsvBtn").addEventListener("click", () => {
    const plot = plotForExport();
    if (!plot) return;
    download(buildCsv(plot), exportFilename(plot, "csv"), "text/csv");
    toast(`Exported ${exportFilename(plot, "csv")}`);
  });

  // One row per tree, with plot fields repeated. A plot with no trees
  // still produces a single row so an empty site visit isn't lost.
  function buildCsv(plot) {
    const plotHeaders = [
      "plot_number", "plot_name", "date", "surveyor", "latitude", "longitude",
      "plot_shape", "plot_size", "slope_deg", "aspect", "canopy_cover_pct",
      "soil_texture", "soil_colour", "litter_depth_cm", "drainage",
      "disturbance_level", "number_of_gaps", "plot_notes",
    ];
    const treeHeaders = [
      "running_number", "species_local", "species_id", "dbh_cm",
      "distance_m", "angle_base_deg", "angle_top_deg", "height_m",
      "canopy_dia_x_m", "canopy_dia_y_m", "crown_class", "health_status",
      "tree_notes",
    ];
    const base = [
      plot.number, plot.name, plot.date, plot.surveyor, plot.lat, plot.lng,
      plot.shape, plot.size, plot.slope, plot.aspect, plot.canopy,
      plot.soilTexture, plot.soilColour, plot.litterDepth, plot.drainage,
      plot.disturbance, plot.gaps, plot.notes,
    ];
    const rows = [plotHeaders.concat(treeHeaders)];
    if (!plot.trees || plot.trees.length === 0) {
      rows.push([...base, ...treeHeaders.map(() => "")]);
    } else {
      plot.trees.forEach((t) => {
        rows.push([
          ...base, t.running, t.speciesLocal, t.speciesId, t.dbh,
          t.distance, t.angleBase, t.angleTop, t.height,
          t.canopyX, t.canopyY, t.crownClass, t.health, t.notes,
        ]);
      });
    }
    return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  }

  function csvCell(v) {
    const s = v == null ? "" : String(v);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function download(content, filename, mime) {
    const blob = new Blob([content], { type: mime + ";charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  $("importBtn").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const incoming = Array.isArray(parsed) ? parsed : parsed.plots;
        if (!Array.isArray(incoming)) throw new Error("No plots array found");
        const merge = state.plots.length > 0
          ? confirm(`Import ${incoming.length} plot(s)?\n\nOK = merge with current data\nCancel = replace everything`)
          : true;
        const normalized = incoming.map((p) => ({
          id: p.id || uid(),
          number: p.number || "",
          name: p.name || "",
          date: p.date || "",
          surveyor: p.surveyor || "",
          lat: p.lat || "",
          lng: p.lng || "",
          shape: p.shape || "",
          size: p.size || "",
          slope: p.slope || "",
          aspect: p.aspect || "",
          canopy: p.canopy || "",
          gaps: p.gaps || "",
          soilTexture: p.soilTexture || "",
          soilColour: p.soilColour || "",
          litterDepth: p.litterDepth || "",
          drainage: p.drainage || "",
          disturbance: p.disturbance || "",
          notes: p.notes || "",
          trees: Array.isArray(p.trees) ? p.trees.map((t) => ({ id: t.id || uid(), ...t })) : [],
        }));
        state.plots = merge ? normalized.concat(state.plots) : normalized;
        save();
        renderPlots();
        renderTrees();
        toast(`Imported ${incoming.length} plot(s)`);
      } catch (err) {
        toast("Import failed: " + err.message);
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  });

  /* ============================================================
     UTILITIES
     ============================================================ */
  function today() {
    return new Date().toISOString().slice(0, 10);
  }
  function fmt(n) {
    return n == null ? "—" : (Math.round(n * 10) / 10).toString();
  }
  function plotLabel(p) {
    const base = p.number ? "Plot " + p.number : "(no number)";
    return p.name ? base + " — " + p.name : base;
  }
  function coordLabel(p) {
    if (!p.lat || !p.lng) return "";
    return `${p.lat}, ${p.lng}`;
  }

  /* ============================================================
     INIT
     ============================================================ */
  load();
  populatePlotNumbers();
  resetPlotForm();
  resetTreeForm();
  renderPlots();
  renderTrees();
})();
