(function () {
    "use strict";

    /* Feature switches. Batch can be turned off later without removing the section below. */
    /* Analytics placeholder: no tracker is loaded.
       A static page has no visit log without a third-party account or a server.
       If you add one later, call it from here and never send image bytes. */
    var FEATURES = { batch: true, batchMax: 100 };
    document.documentElement.setAttribute("data-batch", FEATURES.batch ? "on" : "off");

    var UNIT_SI = 1000;
    var UNIT_IEC = 1024;
    var PRESETS = [
      { kb: 10 },
      { kb: 20 },
      { kb: 25 },
      { kb: 30 },
      { kb: 50 },
      { kb: 100 },
      { kb: 200 }
    ];

    var els = {
      drop: document.getElementById("drop"),
      file: document.getElementById("file"),
      batchFile: document.getElementById("batchFile"),
      batchUpload: document.getElementById("batchUpload"),
      tabSingle: document.getElementById("tabSingle"),
      tabBatch: document.getElementById("tabBatch"),
      stageTools: document.getElementById("stageTools"),
      compressNew: document.getElementById("compressNew"),
      dropTitle: document.getElementById("dropTitle"),
      stage: document.getElementById("stage"),
      view: document.getElementById("view"),
      targetKb: document.getElementById("targetKb"),
      presets: document.getElementById("presets"),
      pixW: document.getElementById("pixW"),
      pixH: document.getElementById("pixH"),
      fitWhite: document.getElementById("fitWhite"),
      cleanBg: document.getElementById("cleanBg"),
      grayscale: document.getElementById("grayscale"),
      siUnits: document.getElementById("siUnits"),
      status: document.getElementById("status"),
      progress: document.getElementById("progress"),
      progressFill: document.getElementById("progressFill"),
      progressPct: document.getElementById("progressPct"),
      result: document.getElementById("result"),
      resultMain: document.getElementById("resultMain"),
      resultSub: document.getElementById("resultSub"),
      resultMark: document.getElementById("resultMark"),
      imgBefore: document.getElementById("imgBefore"),
      imgAfter: document.getElementById("imgAfter"),
      tagAfter: document.getElementById("tagAfter"),
      handle: document.getElementById("handle"),
      knob: document.getElementById("knob"),
      metaLeft: document.getElementById("metaLeft"),
      metaRight: document.getElementById("metaRight"),
      download: document.getElementById("download"),
      zipBtn: document.getElementById("zipBtn"),
      batch: document.getElementById("batch"),
      batchList: document.getElementById("batchList"),
      batchNote: document.getElementById("batchNote"),
      addMore: document.getElementById("addMore"),
      clearAll: document.getElementById("clearAll"),
      backBatch: document.getElementById("backBatch"),
      modePhoto: document.getElementById("mode-photo"),
      modeSignature: document.getElementById("mode-signature"),
      compressBtn: document.getElementById("compressBtn"),
      replacePhoto: document.getElementById("replacePhoto"),
      moreBtn: document.getElementById("moreBtn"),
      morePanel: document.getElementById("morePanel"),
      step1: document.getElementById("step1"),
      step2: document.getElementById("step2"),
      step3: document.getElementById("step3"),
      line1: document.getElementById("line1"),
      line2: document.getElementById("line2")
    };

    var state = {
      mode: "photo",
      file: null,
      loaded: false,
      dims: null,
      beforeUrl: null,
      afterUrl: null,
      running: false,
      runId: 0,
      readId: 0,
      hasResult: false,
      resultSignature: "",
      downloaded: false,
      split: 50,
      items: [],
      nextId: 1,
      replacing: false,
      inspecting: false,
      panel: "single"
    };

    var lastResult = null;

    function unit() {
      return els.siUnits.checked ? UNIT_SI : UNIT_IEC;
    }

    function kbLabel(bytes, u) {
      u = u || unit();
      var kb = bytes / u;
      var n = kb >= 10 ? (Math.round(kb * 10) / 10) : (Math.round(kb * 100) / 100);
      return String(n);
    }

    function formatKB(bytes, u) {
      return kbLabel(bytes, u) + " KB";
    }

    function formatBytes(bytes) {
      var u = unit();
      var kb = bytes / u;
      if (kb >= 1000) {
        var mb = kb / 1000;
        var n = mb >= 10 ? (Math.round(mb * 10) / 10) : (Math.round(mb * 100) / 100);
        return (n % 1 === 0 ? String(n) : String(n)) + " MB";
      }
      return formatKB(bytes, u);
    }

    function setStatus(msg, kind) {
      els.status.textContent = msg || "";
      els.status.className = "status" + (kind ? " is-" + kind : "");
    }

    function setProgress(pct, label, phase) {
      pct = Math.max(0, Math.min(100, Math.round(pct)));
      els.progress.dataset.pct = String(pct);
      els.progress.dataset.phase = phase || "";
      els.progressFill.style.width = pct + "%";
      els.progress.setAttribute("aria-valuenow", String(pct));
      els.progressPct.textContent = pct + "%";
      if (label) setStatus(label, pct < 100 ? "busy" : "");
    }

    function targetIsValid() {
      var kb = Number(els.targetKb.value);
      return Number.isFinite(kb) && kb >= 1 && kb <= 20000;
    }

    function optionsSignature() {
      return [
        els.targetKb.value,
        els.pixW.value,
        els.pixH.value,
        els.fitWhite.checked ? "1" : "0",
        els.cleanBg.checked ? "1" : "0",
        els.grayscale.checked ? "1" : "0",
        els.siUnits.checked ? "1" : "0",
        state.mode
      ].join("|");
    }

    function isBatch() {
      return state.items.length >= 2;
    }

    function updateZipButton() {
      var batch = inBatchPanel();
      var ready = batch && !state.running && state.items.some(function (item) { return item.status === "done" && item.result; });
      els.zipBtn.hidden = !batch;
      els.zipBtn.disabled = !ready;
      els.download.hidden = batch && !state.inspecting;
    }

    function settingsKey() {
      return state.mode + "|" + String(els.targetKb.value) + "|" + (els.siUnits.checked ? "1000" : "1024");
    }

    function neverCompressed(item) {
      return !item.settings;
    }

    function inBatchPanel() {
      return FEATURES.batch && state.panel === "batch" && state.items.length > 0;
    }

    function updateToolbar() {
      var batch = FEATURES.batch && state.panel === "batch";
      els.tabSingle.setAttribute("aria-selected", batch ? "false" : "true");
      if (els.tabBatch) els.tabBatch.setAttribute("aria-selected", batch ? "true" : "false");
      var has = batch ? state.items.length > 0 : !!state.file;
      els.stageTools.hidden = !has;
      els.addMore.hidden = !batch;
    }

    function updateCompressButton() {
      if (inBatchPanel()) {
        var fresh = state.items.filter(neverCompressed).length;
        var total = state.items.length;
        var showNew = fresh > 0 && fresh < total;
        els.compressNew.hidden = !showNew;
        els.compressNew.disabled = state.running || !targetIsValid();
        els.compressNew.textContent = "Compress new (" + fresh + ")";
        els.compressBtn.disabled = state.running || !targetIsValid();
        els.compressBtn.textContent = state.running ? "Compressing…" : ("Compress all (" + total + ")");
        updateZipButton();
        updateToolbar();
        return;
      }
      els.compressNew.hidden = true;
      var ready = !!(state.file && state.loaded && targetIsValid() && !state.running);
      els.compressBtn.disabled = !ready;
      if (state.running && state.loaded) els.compressBtn.textContent = "Compressing…";
      else if (state.running) els.compressBtn.textContent = "Reading…";
      else if (state.hasResult) els.compressBtn.textContent = "Compress again";
      else els.compressBtn.textContent = "Compress";
      updateZipButton();
      updateToolbar();
    }

    function noteIfStale() {
      if (state.panel === "batch" || !state.hasResult || state.running) return;
      if (optionsSignature() !== state.resultSignature) {
        setStatus("Press Compress again to update.");
      }
    }

    function paintStep(el, n, label, kind) {
      el.className = "step" + (kind === "todo" ? "" : " " + kind);
      el.dataset.state = kind;
      var num = el.querySelector(".num");
      num.textContent = "";
      if (kind === "done") num.appendChild(svgIcon("check", 14));
      else num.textContent = String(n);
      el.querySelector(".step-label").textContent = label;
    }

    function updateSteps() {
      var uploaded = isBatch() ? state.items.length > 0 : !!(state.file && state.loaded);
      var compressed = isBatch()
        ? state.items.length > 0 && state.items.every(function (item) { return item.status === "done" || item.status === "fail"; })
        : !!state.hasResult;
      var downloaded = !!state.downloaded && compressed;
      paintStep(els.step1, 1, "Upload", uploaded ? "done" : "current");
      paintStep(els.step2, 2, "Choose KB", compressed ? "done" : (uploaded ? "current" : "todo"));
      paintStep(els.step3, 3, "Download", downloaded ? "done" : (compressed ? "current" : "todo"));
      els.line1.classList.toggle("done", uploaded);
      els.line2.classList.toggle("done", compressed);
    }

    function renderedImageBox() {
      var viewRect = els.view.getBoundingClientRect();
      var img = els.imgBefore;
      var nw = img.naturalWidth;
      var nh = img.naturalHeight;
      if (!nw || !nh || !viewRect.width || !viewRect.height) {
        return {
          left: viewRect.left,
          top: viewRect.top,
          width: viewRect.width,
          height: viewRect.height,
          viewLeft: viewRect.left,
          viewWidth: viewRect.width
        };
      }
      var scale = Math.min(viewRect.width / nw, viewRect.height / nh);
      var w = nw * scale;
      var h = nh * scale;
      return {
        left: viewRect.left + (viewRect.width - w) / 2,
        top: viewRect.top + (viewRect.height - h) / 2,
        width: w,
        height: h,
        viewLeft: viewRect.left,
        viewWidth: viewRect.width
      };
    }

    function setSplit(pct) {
      pct = Math.max(0, Math.min(100, pct));
      state.split = pct;
      var shown = Math.round(pct * 10) / 10;
      els.view.dataset.split = String(shown);
      var box = renderedImageBox();
      var localX = (box.left - box.viewLeft) + (pct / 100) * box.width;
      var rightClip = Math.max(0, box.viewWidth - localX);
      els.imgBefore.style.clipPath = "inset(0 " + rightClip + "px 0 0)";
      els.handle.style.left = localX + "px";
      els.knob.setAttribute("aria-valuenow", String(Math.round(pct)));
    }

    function applyPagePreset() {
      var preset = document.body.getAttribute("data-preset");
      if (preset) els.targetKb.value = preset;
      var mode = document.body.getAttribute("data-mode");
      if (mode === "signature" || mode === "photo") setMode(mode);
    }

    function setMode(mode) {
      state.mode = mode === "signature" ? "signature" : "photo";
      document.body.dataset.mode = state.mode;
      var photo = state.mode === "photo";
      els.modePhoto.classList.toggle("on", photo);
      els.modeSignature.classList.toggle("on", !photo);
      els.modePhoto.setAttribute("aria-pressed", photo ? "true" : "false");
      els.modeSignature.setAttribute("aria-pressed", photo ? "false" : "true");
      renderPresets();
      updateCompressButton();
      noteIfStale();
      refreshBatchLabels();
    }

    function renderPresets() {
      els.presets.innerHTML = "";
      var current = Number(els.targetKb.value);
      PRESETS.forEach(function (p) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.kb = String(p.kb);
        btn.appendChild(document.createTextNode(String(p.kb) + " KB"));
        var on = current === p.kb;
        btn.classList.toggle("on", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        btn.addEventListener("click", function () {
          els.targetKb.value = String(p.kb);
          syncPresetPressed();
          updateCompressButton();
          noteIfStale();
        });
        els.presets.appendChild(btn);
      });
    }

    function syncPresetPressed() {
      var current = Number(els.targetKb.value);
      Array.prototype.forEach.call(els.presets.querySelectorAll("button"), function (btn) {
        var on = Number(btn.dataset.kb) === current;
        btn.classList.toggle("on", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    function revoke(url) {
      if (url) URL.revokeObjectURL(url);
    }

    function isLikelyHeic(file) {
      var type = (file.type || "").toLowerCase();
      var name = (file.name || "").toLowerCase();
      return type === "image/heic" || type === "image/heif" || /\.hei[cf]$/.test(name);
    }

    function isJpegFile(file) {
      var type = (file.type || "").toLowerCase();
      var name = (file.name || "").toLowerCase();
      return type === "image/jpeg" || type === "image/jpg" || /\.jpe?g$/.test(name);
    }

    function isPngOrWebp(file) {
      var type = (file.type || "").toLowerCase();
      var name = (file.name || "").toLowerCase();
      return type === "image/png" || type === "image/webp" || /\.png$/.test(name) || /\.webp$/.test(name);
    }

    function mayExceedOriginal(file) {
      return isPngOrWebp(file) || isLikelyHeic(file);
    }

    function needsReencode(options) {
      return !!(options.targetW && options.targetH) || !!options.cleanBg || !!options.grayscale;
    }

    function isSupportedType(file) {
      var type = (file.type || "").toLowerCase();
      var name = (file.name || "").toLowerCase();
      if (/^image\/(jpeg|jpg|png|webp|heic|heif)$/.test(type)) return true;
      if (/\.(jpe?g|png|webp|hei[cf])$/.test(name)) return true;
      if (!type && !name) return true;
      return type.indexOf("image/") === 0;
    }

    function loadImageFile(file) {
      return new Promise(function (resolve, reject) {
        var heic = isLikelyHeic(file);
        var failHeic = function () {
          reject(new Error("This browser cannot open HEIC photos. Save as JPG or PNG and try again."));
        };
        var failGeneric = function () {
          reject(new Error("Could not read this image. Try a JPG or PNG."));
        };
        function fromBitmap(bitmap) { resolve(bitmap); }
        function fallbackImage() {
          var url = URL.createObjectURL(file);
          var img = new Image();
          img.onload = function () {
            URL.revokeObjectURL(url);
            resolve(img);
          };
          img.onerror = function () {
            URL.revokeObjectURL(url);
            if (heic) failHeic();
            else failGeneric();
          };
          img.src = url;
        }
        if (typeof createImageBitmap === "function") {
          createImageBitmap(file, { imageOrientation: "from-image" }).then(fromBitmap).catch(function () {
            createImageBitmap(file).then(fromBitmap).catch(function () {
              if (heic) failHeic();
              else fallbackImage();
            });
          });
        } else {
          fallbackImage();
        }
      });
    }

    function sourceSize(img) {
      return { w: img.naturalWidth || img.width, h: img.naturalHeight || img.height };
    }

    function makeCanvas(w, h) {
      var c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(w));
      c.height = Math.max(1, Math.round(h));
      var ctx = c.getContext("2d", { alpha: false });
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      return { canvas: c, ctx: ctx };
    }

    function drawSource(img, options) {
      var src = sourceSize(img);
      var tw = options.targetW;
      var th = options.targetH;
      var outW, outH, canvas, ctx;
      if (tw && th) {
        outW = tw;
        outH = th;
        var made = makeCanvas(outW, outH);
        canvas = made.canvas;
        ctx = made.ctx;
        var scale = options.fitWhite
          ? Math.min(outW / src.w, outH / src.h)
          : Math.max(outW / src.w, outH / src.h);
        var dw = src.w * scale;
        var dh = src.h * scale;
        ctx.drawImage(img, (outW - dw) / 2, (outH - dh) / 2, dw, dh);
      } else {
        outW = src.w;
        outH = src.h;
        var made2 = makeCanvas(outW, outH);
        canvas = made2.canvas;
        ctx = made2.ctx;
        ctx.drawImage(img, 0, 0, outW, outH);
      }
      if (options.cleanBg || options.grayscale) {
        applySignatureFilters(ctx, canvas.width, canvas.height, options);
      }
      return canvas;
    }

    function applySignatureFilters(ctx, w, h, options) {
      var data = ctx.getImageData(0, 0, w, h);
      var px = data.data;
      var thresh = 200;
      for (var i = 0; i < px.length; i += 4) {
        var r = px[i], g = px[i + 1], b = px[i + 2], a = px[i + 3];
        if (a < 255) {
          var t = a / 255;
          r = Math.round(r * t + 255 * (1 - t));
          g = Math.round(g * t + 255 * (1 - t));
          b = Math.round(b * t + 255 * (1 - t));
        }
        var y = 0.299 * r + 0.587 * g + 0.114 * b;
        if (options.cleanBg && y >= thresh) {
          r = g = b = 255;
        } else if (options.grayscale) {
          var v = Math.round(y);
          r = g = b = v;
        }
        px[i] = r;
        px[i + 1] = g;
        px[i + 2] = b;
        px[i + 3] = 255;
      }
      ctx.putImageData(data, 0, 0);
    }

    function canvasToBlob(canvas, quality) {
      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (!blob) reject(new Error("Could not encode a JPEG from this image."));
          else resolve(blob);
        }, "image/jpeg", quality);
      });
    }

    function nextSize(w, h) {
      var nw = Math.max(1, Math.floor(w * 0.85));
      var nh = Math.max(1, Math.floor(h * 0.85));
      if (nw === w && nh === h) {
        nw = Math.max(1, w - 1);
        nh = Math.max(1, h - 1);
      }
      return { w: nw, h: nh };
    }

    function resizeCanvas(src, w, h) {
      var made = makeCanvas(w, h);
      made.ctx.drawImage(src, 0, 0, w, h);
      return made.canvas;
    }

    async function bestJpegAtSize(canvas, targetBytes, onStep) {
      var candidates = [];
      async function tryQ(q) {
        q = Math.round(q * 1000) / 1000;
        if (onStep) onStep("Compressing…");
        var blob = await canvasToBlob(canvas, q);
        candidates.push({ q: q, blob: blob });
        return blob;
      }
      var high = await tryQ(0.95);
      if (high.size <= targetBytes) return { blob: high, quality: 0.95, fits: true };
      var low = await tryQ(0.05);
      if (low.size > targetBytes) return { blob: low, quality: 0.05, fits: false };
      var lo = 0.05, hi = 0.95;
      for (var i = 0; i < 14; i++) {
        var mid = (lo + hi) / 2;
        var blob = await tryQ(mid);
        if (blob.size <= targetBytes) lo = mid;
        else hi = mid;
      }
      var fit = candidates.filter(function (c) { return c.blob.size <= targetBytes; });
      fit.sort(function (a, b) { return b.blob.size - a.blob.size; });
      return { blob: fit[0].blob, quality: fit[0].q, fits: true };
    }

    function applySmartCap(canvas, options) {
      if (!options || (options.targetW && options.targetH)) return canvas;
      var maxSide = 0;
      if (options.targetKb <= 50) maxSide = 1200;
      else if (options.targetKb <= 100) maxSide = 1600;
      if (!maxSide) return canvas;
      var w = canvas.width;
      var h = canvas.height;
      var longSide = Math.max(w, h);
      if (longSide <= maxSide) return canvas;
      var scale = maxSide / longSide;
      return resizeCanvas(canvas, Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)));
    }

    async function compressToTarget(sourceCanvas, targetBytes, onStep, options) {
      var requested = { w: sourceCanvas.width, h: sourceCanvas.height };
      var canvas = applySmartCap(sourceCanvas, options);
      var safety = 80;
      while (safety--) {
        var attempt = await bestJpegAtSize(canvas, targetBytes, onStep);
        if (attempt.fits) {
          return {
            blob: attempt.blob,
            width: canvas.width,
            height: canvas.height,
            quality: attempt.quality,
            requested: requested,
            downscaled: canvas.width !== requested.w || canvas.height !== requested.h
          };
        }
        if (canvas.width <= 1 && canvas.height <= 1) {
          throw new Error("Could not get this image under " + formatKB(targetBytes) + ". Try a simpler image or a larger target.");
        }
        if (onStep) onStep("Resizing to fit the limit…");
        var n = nextSize(canvas.width, canvas.height);
        canvas = resizeCanvas(canvas, n.w, n.h);
      }
      throw new Error("Could not get this image under the target size.");
    }

    function readOptions() {
      var kb = Number(els.targetKb.value);
      if (!Number.isFinite(kb) || kb < 1) {
        throw new Error("Enter a target size of at least 1 KB.");
      }
      var tw = parseInt(els.pixW.value, 10);
      var th = parseInt(els.pixH.value, 10);
      var hasW = Number.isFinite(tw) && tw > 0;
      var hasH = Number.isFinite(th) && th > 0;
      if (hasW !== hasH) {
        throw new Error("Enter both width and height, or leave both blank.");
      }
      if (hasW && (tw > 10000 || th > 10000)) {
        throw new Error("Pixel size is too large (max 10000).");
      }
      return {
        targetBytes: Math.round(kb * unit()),
        targetKb: kb,
        targetW: hasW ? tw : 0,
        targetH: hasH ? th : 0,
        fitWhite: els.fitWhite.checked,
        cleanBg: state.mode === "signature" && els.cleanBg.checked,
        grayscale: state.mode === "signature" && els.grayscale.checked,
        mode: state.mode,
        unit: unit()
      };
    }

    function closeImage(img) {
      if (img && img.close) {
        try { img.close(); } catch (e) {}
      }
    }

    function jpegBlobFromFile(file) {
      var type = (file.type || "").toLowerCase();
      if (type === "image/jpeg" || type === "image/jpg") return file;
      return new Blob([file], { type: "image/jpeg" });
    }

    async function processFile(file, options, onStep) {
      options = options || readOptions();
      var img = await loadImageFile(file);
      var src = sourceSize(img);
      if (onStep) onStep("Preparing image…");
      var canvas = drawSource(img, options);
      closeImage(img);
      var result = await compressToTarget(canvas, options.targetBytes, onStep, options);
      if (result.blob.size > options.targetBytes) {
        throw new Error("The file is still over the limit. Please try a larger target.");
      }
      result.keptOriginal = false;
      result.originalBytes = file.size;
      result.originalWidth = src.w;
      result.originalHeight = src.h;
      result.options = options;
      result.type = "image/jpeg";
      lastResult = result;
      window.UnderKB.lastResult = result;
      return result;
    }

    function fileStem(fileName) {
      var parts = splitFileName(fileName || "photo");
      return (parts.base || "photo").replace(/[^\w.\-]+/g, "-").replace(/^-+|-+$/g, "") || "photo";
    }

    function downloadFileName(fileName, bytes, u) {
      return fileStem(fileName) + "-" + kbLabel(bytes, u) + "kb.jpg";
    }

    function splitFileName(name) {
      var n = name || "photo";
      var slash = Math.max(n.lastIndexOf("/"), n.lastIndexOf("\\"));
      if (slash >= 0) n = n.slice(slash + 1);
      var dot = n.lastIndexOf(".");
      if (dot <= 0) return { base: n, ext: "" };
      return { base: n.slice(0, dot), ext: n.slice(dot) };
    }

    function setFileCaption(el, fileName, sizeText, dimsText) {
      var full = fileName || "photo";
      var parts = splitFileName(full);
      var tail = " · " + sizeText + (dimsText ? " · " + dimsText : "");
      el.title = full;
      el.textContent = "";
      var base = document.createElement("span");
      base.className = "cap-base";
      base.textContent = parts.base;
      var ext = document.createElement("span");
      ext.className = "cap-ext";
      ext.textContent = parts.ext;
      var rest = document.createElement("span");
      rest.className = "cap-rest";
      rest.textContent = tail;
      el.appendChild(base);
      el.appendChild(ext);
      el.appendChild(rest);
    }

    function refreshMeta() {
      if (!state.file) {
        els.metaLeft.textContent = "";
        els.metaLeft.removeAttribute("title");
        els.metaRight.textContent = "";
        return;
      }
      var dims = state.dims ? (state.dims.w + "×" + state.dims.h) : "…";
      setFileCaption(els.metaLeft, state.file.name || "photo", formatBytes(state.file.size), dims);
    }

    function clearCompressed() {
      revoke(state.afterUrl);
      state.afterUrl = null;
      state.hasResult = false;
      state.resultSignature = "";
      state.downloaded = false;
      els.imgAfter.removeAttribute("src");
      els.imgAfter.hidden = true;
      els.imgBefore.style.clipPath = "none";
      els.view.classList.remove("is-split");
      els.handle.hidden = true;
      els.tagAfter.hidden = true;
      els.metaRight.textContent = "";
      els.result.hidden = true;
      els.result.classList.remove("is-warn");
      els.result.dataset.ready = "0";
      els.result.dataset.ok = "0";
      delete els.result.dataset.bytes;
      delete els.result.dataset.width;
      delete els.result.dataset.height;
      delete els.result.dataset.kept;
      els.resultMain.textContent = "";
      els.resultSub.textContent = "";
      els.download.removeAttribute("href");
      els.download.removeAttribute("download");
      els.download.setAttribute("aria-disabled", "true");
      els.download.textContent = "Download";
      updateSteps();
    }

    function showLimitFailure(kb) {
      els.result.hidden = false;
      els.result.classList.add("is-warn");
      els.result.classList.remove("is-on");
      els.resultMark.textContent = "!";
      els.resultMain.textContent = "Could not reach " + kb + " KB";
      els.resultSub.textContent = "";
      els.result.dataset.ok = "0";
      els.result.dataset.ready = "0";
      state.hasResult = false;
      updateSteps();
      updateCompressButton();
    }

    function showResult(file, result) {
      revoke(state.afterUrl);
      state.afterUrl = URL.createObjectURL(result.blob);
      els.imgAfter.hidden = false;
      els.imgAfter.src = state.afterUrl;
      els.view.classList.add("is-split");
      els.handle.hidden = false;
      els.tagAfter.hidden = false;
      setSplit(state.split || 50);
      var kbText = formatKB(result.blob.size);
      els.metaRight.textContent = kbText + " · " + result.width + "×" + result.height;
      setFileCaption(els.metaLeft, file.name || "photo", formatBytes(result.originalBytes), result.originalWidth + "×" + result.originalHeight);
      els.result.hidden = false;
      els.result.classList.remove("is-warn");
      els.result.classList.add("is-on");
      els.resultMark.textContent = "✓";
      els.resultMain.textContent = kbText + " of " + result.options.targetKb + " KB";
      els.resultSub.textContent = file.size <= result.options.targetBytes
        ? "Under the limit. Camera metadata removed."
        : "Under the limit";
      els.download.download = downloadFileName(file.name, result.blob.size, result.options.unit);
      els.download.href = state.afterUrl;
      els.download.setAttribute("aria-disabled", "false");
      els.download.textContent = "Download " + kbText + " JPG";
      els.result.dataset.ready = "1";
      els.result.dataset.bytes = String(result.blob.size);
      els.result.dataset.width = String(result.width);
      els.result.dataset.height = String(result.height);
      els.result.dataset.kept = result.keptOriginal ? "1" : "0";
      els.result.dataset.ok = "1";
      state.hasResult = true;
      state.downloaded = false;
      state.resultSignature = optionsSignature();
      updateSteps();
    }

    function readFileWithProgress(file, readId) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        setProgress(0, "Reading image…", "read");
        reader.onprogress = function (e) {
          if (readId !== state.readId) return;
          var pct = 0;
          if (e.lengthComputable && e.total > 0) pct = (e.loaded / e.total) * 100;
          else if (file.size > 0) pct = (e.loaded / file.size) * 100;
          setProgress(Math.min(99, pct), "Reading image…", "read");
        };
        reader.onload = function () {
          if (readId !== state.readId) return;
          setProgress(100, "Image ready", "read");
          resolve(reader.result);
        };
        reader.onerror = function () {
          reject(new Error("Could not read this file."));
        };
        reader.readAsArrayBuffer(file);
      });
    }

    function isLimitError(err) {
      var m = (err && err.message) || "";
      return m.indexOf("under ") !== -1 || m.indexOf("over the limit") !== -1 || m.indexOf("under the target") !== -1;
    }

    async function runProcess() {
      if (!state.file || !state.loaded || state.running || !targetIsValid()) return;
      var runId = ++state.runId;
      state.running = true;
      state.downloaded = false;
      els.progress.dataset.steps = "0";
      updateCompressButton();
      els.result.dataset.ready = "0";
      els.result.dataset.ok = "0";
      var pct = 2;
      setProgress(pct, "Compressing…", "compress");
      function onStep(msg) {
        if (runId !== state.runId) return;
        var steps = Number(els.progress.dataset.steps || 0) + 1;
        els.progress.dataset.steps = String(steps);
        var remain = 97 - pct;
        pct = Math.min(97, pct + Math.max(1, remain * 0.12));
        setProgress(pct, msg || "Compressing…", "compress");
      }
      try {
        var options = readOptions();
        var result = await processFile(state.file, options, onStep);
        if (runId !== state.runId) return;
        showResult(state.file, result);
        setProgress(100, "", "compress");
        setStatus("");
      } catch (err) {
        if (runId !== state.runId) return;
        lastResult = null;
        window.UnderKB.lastResult = null;
        if (isLimitError(err)) {
          var kb = Number(els.targetKb.value) || "";
          showLimitFailure(kb);
          setProgress(100, "", "compress");
          setStatus("");
        } else {
          clearCompressed();
          setStatus(err && err.message ? err.message : "Something went wrong.", "error");
        }
      } finally {
        if (runId === state.runId) {
          state.running = false;
          updateCompressButton();
        }
      }
    }

    function showOriginalShell(file) {
      revoke(state.beforeUrl);
      state.beforeUrl = URL.createObjectURL(file);
      els.imgBefore.src = state.beforeUrl;
      els.drop.hidden = true;
      els.view.hidden = false;
      els.view.dataset.loaded = "0";
      refreshMeta();
    }

    async function readAndPreview(file, readId) {
      try {
        await readFileWithProgress(file, readId);
        if (readId !== state.readId) return;
        var img = await loadImageFile(file);
        if (readId !== state.readId) {
          closeImage(img);
          return;
        }
        var src = sourceSize(img);
        closeImage(img);
        state.loaded = true;
        state.dims = src;
        els.view.dataset.loaded = "1";
        refreshMeta();
        els.imgBefore.alt = "Original image, " + src.w + " by " + src.h + " pixels";
        setProgress(0, "", "");
        setStatus("");
        updateSteps();
      } catch (err) {
        if (readId !== state.readId) return;
        state.file = null;
        state.loaded = false;
        state.dims = null;
        els.view.hidden = true;
        els.drop.hidden = false;
        setStatus(err && err.message ? err.message : "Could not read this image.", "error");
      } finally {
        if (readId === state.readId) {
          state.running = false;
          updateCompressButton();
          updateSteps();
        }
      }
    }

    /* ---- Batch compression (gated by FEATURES.batch) ---- */
    var CRC_TABLE = (function () {
      var table = new Uint32Array(256);
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        table[n] = c >>> 0;
      }
      return table;
    })();

    function crc32(bytes) {
      var c = 0xffffffff;
      for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ (c >>> 8);
      return (c ^ 0xffffffff) >>> 0;
    }

    function concatBytes(parts) {
      var len = 0;
      parts.forEach(function (p) { len += p.length; });
      var out = new Uint8Array(len);
      var o = 0;
      parts.forEach(function (p) { out.set(p, o); o += p.length; });
      return out;
    }

    function u16(n) { return new Uint8Array([n & 255, (n >> 8) & 255]); }
    function u32(n) { return new Uint8Array([n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255]); }

    function buildZip(entries) {
      var locals = [];
      var centrals = [];
      var offset = 0;
      entries.forEach(function (entry) {
        var nameBytes = new TextEncoder().encode(entry.name);
        var data = entry.data;
        var crc = crc32(data);
        var local = concatBytes([
          u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
          u32(crc), u32(data.length), u32(data.length),
          u16(nameBytes.length), u16(0), nameBytes, data
        ]);
        locals.push(local);
        centrals.push(concatBytes([
          u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
          u32(crc), u32(data.length), u32(data.length),
          u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0),
          u32(offset), nameBytes
        ]));
        offset += local.length;
      });
      var central = concatBytes(centrals);
      var end = concatBytes([
        u32(0x06054b50), u16(0), u16(0),
        u16(entries.length), u16(entries.length),
        u32(central.length), u32(offset), u16(0)
      ]);
      return new Blob([concatBytes(locals), central, end], { type: "application/zip" });
    }

    function makeItem(file) {
      return {
        id: state.nextId++,
        file: file,
        status: "new",
        settings: null,
        stamp: 0,
        result: null,
        thumbUrl: URL.createObjectURL(file),
        outName: "",
        error: ""
      };
    }

    function revokeItem(item) {
      if (!item) return;
      if (item.thumbUrl) URL.revokeObjectURL(item.thumbUrl);
      if (item.dlUrl) URL.revokeObjectURL(item.dlUrl);
    }

    function statusLabel(status) {
      if (status === "compressing") return "Compressing";
      if (status === "done") return "Done under limit";
      if (status === "fail" || status === "failed") return "Could not reach target";
      return "Waiting";
    }

    function svgIcon(name, size) {
      var paths = {
        download: "<path d=\"M12 3v12\"/><path d=\"m7 10 5 5 5-5\"/><path d=\"M5 21h14\"/>",
        x: "<path d=\"M18 6 6 18\"/><path d=\"m6 6 12 12\"/>",
        plus: "<path d=\"M12 5v14\"/><path d=\"M5 12h14\"/>",
        trash: "<path d=\"M3 6h18\"/><path d=\"M8 6V4h8v2\"/><path d=\"M19 6l-1 14H6L5 6\"/>",
        check: "<path d=\"M20 6 9 17l-5-5\"/>",
        alert: "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\"/><path d=\"M12 9v4\"/><path d=\"M12 17h.01\"/>",
        upload: "<path d=\"M12 16V4\"/><path d=\"m7 9 5-5 5 5\"/><path d=\"M5 20h14\"/>",
        lock: "<rect x=\"5\" y=\"11\" width=\"14\" height=\"10\" rx=\"2\"/><path d=\"M8 11V8a4 4 0 0 1 8 0v3\"/>"
      };
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("width", String(size || 18));
      svg.setAttribute("height", String(size || 18));
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "1.75");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");
      svg.setAttribute("aria-hidden", "true");
      svg.innerHTML = paths[name] || "";
      return svg;
    }

    function outputBaseName(file, bytes, u, used) {
      var stem = fileStem(file && file.name) + "-" + kbLabel(bytes, u) + "kb";
      var name = stem + ".jpg";
      var n = 2;
      while (used[name]) {
        name = stem + "-" + n + ".jpg";
        n++;
      }
      used[name] = true;
      return name;
    }

    function renderBatch() {
      els.batchList.textContent = "";
      state.items.forEach(function (item) {
        var row = document.createElement("div");
        row.className = "batch-item";
        row.dataset.id = String(item.id);
        row.dataset.status = item.status;
        row.dataset.stamp = String(item.stamp || 0);
        row.dataset.bytes = item.result ? String(item.result.blob.size) : "";
        var open = document.createElement("button");
        open.type = "button";
        open.className = "batch-open";
        var thumb = document.createElement("img");
        thumb.className = "batch-thumb";
        thumb.alt = "";
        thumb.src = item.thumbUrl;
        var copy = document.createElement("span");
        copy.className = "batch-copy";
        var name = document.createElement("span");
        name.className = "batch-name";
        var parts = splitFileName(item.file.name || "photo");
        var base = document.createElement("span");
        base.className = "cap-base";
        base.textContent = parts.base;
        var ext = document.createElement("span");
        ext.className = "cap-ext";
        ext.textContent = parts.ext;
        name.title = item.file.name || "photo";
        name.appendChild(base);
        name.appendChild(ext);
        var sizes = document.createElement("span");
        sizes.className = "batch-sizes";
        var outSize = item.result ? formatKB(item.result.blob.size) : "—";
        sizes.textContent = formatBytes(item.file.size) + " → " + outSize;
        var status = document.createElement("span");
        status.className = "batch-status" + (item.status === "done" ? " is-done" : item.status === "fail" ? " is-fail" : "");
        status.textContent = statusLabel(item.status);
        copy.appendChild(name);
        copy.appendChild(sizes);
        var statusRow = document.createElement("span");
        statusRow.className = "batch-statusline";
        statusRow.appendChild(status);
        if (item.status === "done" && item.settings && item.settings !== settingsKey()) {
          var old = document.createElement("span");
          old.className = "batch-outdated";
          old.textContent = "Outdated";
          statusRow.appendChild(old);
        }
        copy.appendChild(statusRow);
        open.appendChild(thumb);
        open.appendChild(copy);
        open.addEventListener("click", function () { inspectItem(item.id); });
        var actions = document.createElement("div");
        actions.className = "batch-actions";
        var dl = document.createElement("a");
        dl.className = "icon-btn download";
        dl.appendChild(svgIcon("download", 16));
        dl.setAttribute("aria-label", "Download");
        dl.title = "Download";
        if (item.result && item.dlUrl) {
          dl.href = item.dlUrl;
          dl.download = item.outName || "photo.jpg";
        } else {
          dl.setAttribute("aria-disabled", "true");
          dl.href = "#";
        }
        dl.addEventListener("click", function (e) {
          if (!item.result) e.preventDefault();
        });
        var rm = document.createElement("button");
        rm.type = "button";
        rm.className = "icon-btn remove";
        rm.appendChild(svgIcon("x", 16));
        rm.setAttribute("aria-label", "Remove");
        rm.title = "Remove";
        rm.disabled = state.running;
        rm.addEventListener("click", function () { removeItem(item.id); });
        actions.appendChild(dl);
        actions.appendChild(rm);
        row.appendChild(open);
        row.appendChild(actions);
        els.batchList.appendChild(row);
      });
    }

    function showBatchList() {
      state.panel = "batch";
      state.inspecting = false;
      els.drop.hidden = true;
      els.view.hidden = true;
      els.batch.hidden = false;
      els.backBatch.hidden = true;
      els.replacePhoto.hidden = false;
      renderBatch();
      updateCompressButton();
      updateSteps();
    }

    var batchNoteTimer = 0;
    function batchLimitNote() {
      return "Batch limit is " + FEATURES.batchMax + " images. Extra files were skipped.";
    }
    function setBatchNote(msg) {
      if (!els.batchNote) return;
      if (batchNoteTimer) {
        clearTimeout(batchNoteTimer);
        batchNoteTimer = 0;
      }
      var text = els.batchNote.querySelector(".batch-note-text");
      if (!text) {
        els.batchNote.textContent = "";
        els.batchNote.setAttribute("role", "status");
        var icon = svgIcon("alert", 16);
        icon.classList.add("batch-note-icon");
        text = document.createElement("p");
        text.className = "batch-note-text";
        var close = document.createElement("button");
        close.type = "button";
        close.className = "icon-btn remove";
        close.setAttribute("aria-label", "Dismiss notice");
        close.appendChild(svgIcon("x", 16));
        close.addEventListener("click", function () { setBatchNote(""); });
        els.batchNote.appendChild(icon);
        els.batchNote.appendChild(text);
        els.batchNote.appendChild(close);
      }
      if (!msg) {
        els.batchNote.hidden = true;
        text.textContent = "";
        return;
      }
      text.textContent = msg;
      els.batchNote.hidden = false;
      batchNoteTimer = setTimeout(function () { setBatchNote(""); }, 12000);
    }

    function inspectItem(id) {
      var item = state.items.filter(function (it) { return it.id === id; })[0];
      if (!item) return;
      state.inspecting = true;
      state.file = item.file;
      state.loaded = true;
      clearCompressed();
      showOriginalShell(item.file);
      state.dims = { w: item.result ? item.result.originalWidth : 0, h: item.result ? item.result.originalHeight : 0 };
      if (item.result) {
        state.dims = { w: item.result.originalWidth, h: item.result.originalHeight };
        showResult(item.file, item.result);
      } else {
        refreshMeta();
        els.view.dataset.loaded = "1";
      }
      els.batch.hidden = true;
      els.backBatch.hidden = false;
      els.replacePhoto.hidden = true;
      updateZipButton();
    }

    function removeItem(id) {
      if (state.running) return;
      var next = [];
      state.items.forEach(function (item) {
        if (item.id === id) revokeItem(item);
        else next.push(item);
      });
      state.items = next;
      if (state.items.length >= 2) showBatchList();
      else if (state.items.length === 1) {
        setBatchNote("");
        acceptFile(state.items[0].file);
      } else {
        clearAllItems();
      }
    }

    function clearAllItems() {
      state.runId++;
      state.items.forEach(revokeItem);
      state.items = [];
      state.inspecting = false;
      state.file = null;
      state.loaded = false;
      state.dims = null;
      state.running = false;
      els.batch.hidden = true;
      els.backBatch.hidden = true;
      els.replacePhoto.hidden = false;
      els.view.hidden = true;
      els.drop.hidden = false;
      if (els.dropTitle) els.dropTitle.textContent = state.panel === "batch" ? "Drop photos here, or click to choose" : "Drop a photo here, or click to choose";
      setBatchNote("");
      clearCompressed();
      setProgress(0, "", "");
      setStatus("");
      renderBatch();
      updateCompressButton();
      updateSteps();
    }

    function acceptFiles(fileList) {
      if (!FEATURES.batch) {
        var firstOnly = fileList && fileList[0];
        if (firstOnly && isSupportedType(firstOnly)) acceptFile(firstOnly);
        else setStatus("Please choose a photo (JPG, PNG, WebP, or HEIC).", "error");
        return;
      }
      var incoming = [];
      for (var i = 0; i < fileList.length; i++) incoming.push(fileList[i]);
      var supported = incoming.filter(isSupportedType);
      if (!supported.length) {
        setStatus("Please choose a photo (JPG, PNG, WebP, or HEIC).", "error");
        return;
      }
      var replacing = state.replacing;
      var adding = state.adding;
      state.replacing = false;
      state.adding = false;
      if (replacing) {
        state.items.forEach(revokeItem);
        state.items = [];
      }
      if (!adding && !isBatch() && supported.length === 1) {
        acceptFile(supported[0]);
        return;
      }
      if (replacing && supported.length === 1) {
        acceptFile(supported[0]);
        return;
      }
      var note = "";
      var room = FEATURES.batchMax - state.items.length;
      if (supported.length > room) {
        supported = supported.slice(0, Math.max(0, room));
        note = batchLimitNote();
      }
      if (!supported.length) {
        setBatchNote(batchLimitNote());
        return;
      }
      var wasRunning = state.running;
      supported.forEach(function (file) { state.items.push(makeItem(file)); });
      setBatchNote(note);
      if (state.items.length === 1) {
        acceptFile(state.items[0].file);
        return;
      }
      state.panel = "batch";
      state.file = state.items[0].file;
      state.loaded = true;
      if (wasRunning) {
        renderBatch();
        updateCompressButton();
        updateSteps();
        return;
      }
      showBatchList();
      setProgress(0, "", "");
      setStatus("");
    }

    async function blobBytes(blob) {
      var buf = await blob.arrayBuffer();
      return new Uint8Array(buf);
    }

    async function downloadZip() {
      var ready = state.items.filter(function (item) { return item.status === "done" && item.result; });
      if (!ready.length) return;
      var entries = [];
      for (var i = 0; i < ready.length; i++) {
        entries.push({ name: ready[i].outName, data: await blobBytes(ready[i].result.blob) });
      }
      var zip = buildZip(entries);
      var url = URL.createObjectURL(zip);
      var a = document.createElement("a");
      a.href = url;
      a.download = "images-" + (Number(els.targetKb.value) || 30) + "kb.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      state.downloaded = true;
      updateSteps();
    }

    function settleBatchUi() {
      state.items.forEach(function (item) {
        if (item.status !== "compressing") return;
        item.status = item.result ? "done" : (item.settings ? "fail" : "new");
      });
      var doneNow = state.items.filter(function (item) { return item.status === "done" && item.result; }).length;
      var all = state.items.length;
      if (all) {
        setProgress(Math.round((doneNow / all) * 100), "", "compress");
        els.progressPct.textContent = doneNow + "/" + all;
        setStatus(doneNow + " of " + all);
      }
      state.hasResult = doneNow > 0;
      state.running = false;
      updateCompressButton();
      updateSteps();
      if (state.panel === "batch" && !state.inspecting) renderBatch();
    }

    async function runBatch(onlyNew) {
      if (!FEATURES.batch || !inBatchPanel() || state.running || !targetIsValid()) return;
      var queue = state.items.filter(function (item) {
        return onlyNew ? neverCompressed(item) : true;
      });
      if (!queue.length) return;
      var runId = ++state.runId;
      state.running = true;
      state.inspecting = false;
      state.downloaded = false;
      var options;
      var key = settingsKey();
      try {
        options = readOptions();
        showBatchList();
        updateCompressButton();
        var used = {};
        state.items.forEach(function (item) {
          if (queue.indexOf(item) === -1 && item.outName) used[item.outName] = true;
        });
        var total = queue.length;
        for (var i = 0; i < queue.length; i++) {
          if (runId !== state.runId) break;
          var item = queue[i];
          var previousStatus = item.status;
          var previousResult = item.result;
          var previousUrl = item.dlUrl;
          var previousName = item.outName;
          var previousSettings = item.settings;
          var previousStamp = item.stamp;
          item.status = "compressing";
          renderBatch();
          setProgress(Math.round((i / total) * 100), i + " of " + total, "compress");
          els.progressPct.textContent = i + "/" + total;
          try {
            var result = await processFile(item.file, options);
            if (runId !== state.runId) {
              item.status = previousStatus;
              item.result = previousResult;
              item.dlUrl = previousUrl;
              item.outName = previousName;
              item.settings = previousSettings;
              item.stamp = previousStamp;
              break;
            }
            if (previousUrl) URL.revokeObjectURL(previousUrl);
            item.result = result;
            item.status = "done";
            item.settings = key;
            item.stamp = (previousStamp || 0) + 1;
            item.outName = outputBaseName(item.file, result.blob.size, options.unit, used);
            item.dlUrl = URL.createObjectURL(result.blob);
          } catch (err) {
            if (runId !== state.runId) {
              item.status = previousStatus;
              item.result = previousResult;
              item.dlUrl = previousUrl;
              item.outName = previousName;
              item.settings = previousSettings;
              item.stamp = previousStamp;
              break;
            }
            item.status = "fail";
            item.settings = key;
            item.result = null;
            if (previousUrl) URL.revokeObjectURL(previousUrl);
            item.dlUrl = "";
            item.error = err && err.message ? err.message : "";
          }
          renderBatch();
          updateCompressButton();
        }
      } catch (err) {
        if (runId === state.runId) setStatus(err && err.message ? err.message : "Something went wrong.", "error");
      } finally {
        if (runId === state.runId) settleBatchUi();
      }
    }

    function acceptFile(file) {
      if (!file) return;
      if (!isSupportedType(file)) {
        setStatus("Please choose a photo (JPG, PNG, WebP, or HEIC).", "error");
        return;
      }
      state.runId++;
      state.items.forEach(revokeItem);
      state.items = [makeItem(file)];
      state.panel = "single";
      state.inspecting = false;
      state.file = file;
      state.loaded = false;
      state.dims = null;
      state.running = true;
      state.downloaded = false;
      els.batch.hidden = true;
      els.backBatch.hidden = true;
      els.replacePhoto.hidden = false;
      setBatchNote("");
      clearCompressed();
      showOriginalShell(file);
      updateCompressButton();
      updateSteps();
      readAndPreview(file, ++state.readId);
    }

    var dragging = false;
    var activePointer = null;
    function splitFromEvent(e) {
      var box = renderedImageBox();
      if (!box.width) return;
      setSplit(((e.clientX - box.left) / box.width) * 100);
    }
    function onPointerDown(e) {
      if (!state.hasResult) return;
      if (e.target.closest && e.target.closest("#replacePhoto, #clearSingle, #backBatch, .preview-actions")) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (dragging && e.pointerId === activePointer) return;
      dragging = true;
      activePointer = e.pointerId;
      els.view.classList.add("is-dragging");
      try { els.view.setPointerCapture(e.pointerId); } catch (err) {}
      if (e.cancelable) e.preventDefault();
      splitFromEvent(e);
    }
    function onPointerMove(e) {
      if (!dragging || e.pointerId !== activePointer) return;
      if (e.cancelable) e.preventDefault();
      splitFromEvent(e);
    }
    function onPointerUp(e) {
      if (activePointer !== null && e.pointerId !== activePointer) return;
      dragging = false;
      activePointer = null;
      els.view.classList.remove("is-dragging");
      if (els.view.hasPointerCapture && e.pointerId !== undefined && els.view.hasPointerCapture(e.pointerId)) {
        try { els.view.releasePointerCapture(e.pointerId); } catch (err) {}
      }
    }
    els.view.addEventListener("pointerdown", onPointerDown, { passive: false });
    els.handle.addEventListener("pointerdown", onPointerDown, { passive: false });
    els.view.addEventListener("pointermove", onPointerMove, { passive: false });
    els.handle.addEventListener("pointermove", onPointerMove, { passive: false });
    els.view.addEventListener("pointerup", onPointerUp, { passive: false });
    els.handle.addEventListener("pointerup", onPointerUp, { passive: false });
    els.view.addEventListener("pointercancel", onPointerUp, { passive: false });
    els.handle.addEventListener("pointercancel", onPointerUp, { passive: false });
    window.addEventListener("resize", function () {
      if (state.hasResult) setSplit(state.split);
    });
    window.addEventListener("orientationchange", function () {
      if (state.hasResult) setSplit(state.split);
    });
    els.imgBefore.addEventListener("load", function () {
      if (state.hasResult) setSplit(state.split);
    });
    els.imgAfter.addEventListener("load", function () {
      if (state.hasResult) setSplit(state.split);
    });
    els.knob.addEventListener("keydown", function (e) {
      if (!state.hasResult) return;
      var step = e.shiftKey ? 10 : 2;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        setSplit(state.split - step);
      } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        setSplit(state.split + step);
      }
    });

    els.modePhoto.addEventListener("click", function () { setMode("photo"); });
    els.modeSignature.addEventListener("click", function () { setMode("signature"); });
    function refreshBatchLabels() {
      if (state.panel === "batch" && state.items.length && !state.running) renderBatch();
      updateCompressButton();
    }
    els.targetKb.addEventListener("input", function () {
      syncPresetPressed();
      updateCompressButton();
      noteIfStale();
      refreshBatchLabels();
    });
    ["pixW", "pixH", "fitWhite", "cleanBg", "grayscale", "siUnits"].forEach(function (id) {
      document.getElementById(id).addEventListener("change", function () {
        if (id === "siUnits") {
          refreshMeta();
          refreshBatchLabels();
        }
        updateCompressButton();
        noteIfStale();
      });
    });
    els.file.addEventListener("change", function () {
      if (els.file.files && els.file.files.length) acceptFiles(els.file.files);
      els.file.value = "";
    });
    els.batchFile.addEventListener("change", function () {
      if (!FEATURES.batch) return;
      if (els.batchFile.files && els.batchFile.files.length) {
        state.replacing = false;
        state.adding = true;
        acceptFiles(els.batchFile.files);
      }
      els.batchFile.value = "";
    });
    function setPanel(panel) {
      if (panel === "batch" && !FEATURES.batch) return;
      state.panel = panel;
      state.inspecting = false;
      els.backBatch.hidden = true;
      if (panel === "batch") {
        if (state.items.length === 0 && state.file) state.items = [makeItem(state.file)];
        if (state.items.length) showBatchList();
        else {
          els.batch.hidden = true;
          els.view.hidden = true;
          els.drop.hidden = false;
          if (els.dropTitle) els.dropTitle.textContent = "Drop photos here, or click to choose";
          updateToolbar();
          updateCompressButton();
        }
      } else {
        els.batch.hidden = true;
        if (els.dropTitle) els.dropTitle.textContent = "Drop a photo here, or click to choose";
        if (state.file && state.items.length <= 1) {
          els.drop.hidden = !!state.file;
          els.view.hidden = !state.file;
        } else {
          els.view.hidden = true;
          els.drop.hidden = false;
        }
        updateToolbar();
        updateCompressButton();
        updateSteps();
      }
    }
    els.tabSingle.addEventListener("click", function () { setPanel("single"); });
    els.tabBatch.addEventListener("click", function () { setPanel("batch"); });
    els.drop.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("#stageToolbar")) return;
      if (FEATURES.batch && state.panel === "batch") els.batchFile.click();
      else els.file.click();
    });
    els.drop.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        els.file.click();
      }
    });
    els.replacePhoto.addEventListener("click", function (e) {
      e.stopPropagation();
      state.replacing = true;
      els.file.click();
    });
    els.addMore.addEventListener("click", function () {
      if (!FEATURES.batch) return;
      state.replacing = false;
      state.adding = true;
      els.batchFile.click();
    });
    els.clearAll.addEventListener("click", function () { clearAllItems(); });
    els.backBatch.addEventListener("click", function () { showBatchList(); });
    els.zipBtn.addEventListener("click", function () { downloadZip(); });
    els.stage.addEventListener("dragover", function (e) {
      e.preventDefault();
      els.drop.classList.add("is-drag");
    });
    els.stage.addEventListener("dragleave", function () {
      els.drop.classList.remove("is-drag");
    });
    els.stage.addEventListener("drop", function (e) {
      e.preventDefault();
      els.drop.classList.remove("is-drag");
      var files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length) acceptFiles(files);
    });
    els.compressBtn.addEventListener("click", function () {
      if (inBatchPanel()) runBatch(false);
      else runProcess();
    });
    els.compressNew.addEventListener("click", function () { runBatch(true); });
    els.download.addEventListener("click", function () {
      if (els.download.getAttribute("aria-disabled") === "true") return;
      state.downloaded = true;
      updateSteps();
    });
    els.moreBtn.addEventListener("click", function () {
      var open = els.moreBtn.getAttribute("aria-expanded") === "true";
      els.moreBtn.setAttribute("aria-expanded", open ? "false" : "true");
      els.morePanel.hidden = open;
    });

    renderPresets();
    applyPagePreset();
    updateCompressButton();
    updateSteps();

    window.UnderKB = {
      processFile: processFile,
      compressToTarget: compressToTarget,
      readOptions: readOptions,
      unit: unit,
      get lastResult() { return lastResult; },
      set lastResult(v) { lastResult = v; },
      PRESETS: PRESETS
    };
  })();
