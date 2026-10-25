(function initializeModel3DWorkspace() {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const utils = window.Model3DUtils;
  const DB_NAME = "gugu-image-edit-model3d";
  const DB_STORE = "sessions";
  const MAX_MODEL_BYTES = 200 * 1024 * 1024;
  const renderModes = [
    ["material", "原始材质"],
    ["clay", "素模"],
    ["depth", "深度图"],
    ["normal", "法线图"],
    ["wireframe", "线框"]
  ];
  const primitiveLabels = { box: "立方体", sphere: "球体", cone: "圆锥", cylinder: "圆柱", plane: "平面", torus: "圆环" };
  const lightLabels = { directional: "平行光", point: "点光", spot: "聚光" };

  const elements = {};
  const state = {
    controller: null,
    modelBlob: null,
    modelName: "",
    modelFormat: "",
    captureBlob: null,
    captureName: "",
    captureAt: null,
    captureUrl: "",
    ratio: "1:1",
    maskAlpha: 0.6,
    showGrid: false,
    envBackground: false,
    shadow: true,
    ao: false,
    panMode: false,
    busy: false,
    saveTimer: null,
    storedSession: null,
    activated: false,
    userScope: "anonymous"
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
  else initialize();

  function initialize() {
    Object.assign(elements, {
      workspace: $("#model3dWorkspace"),
      landing: $("#model3dLanding"),
      editor: $("#model3dEditor"),
      input: $("#model3dInput"),
      dropZone: $("#model3dDropZone"),
      chooseButton: $("#model3dChooseButton"),
      restoreButton: $("#model3dRestoreButton"),
      clearButton: $("#model3dClearButton"),
      storedSummary: $("#model3dStoredSummary"),
      fileName: $("#model3dFileName"),
      fileMeta: $("#model3dFileMeta"),
      replaceButton: $("#model3dReplaceButton"),
      fullscreenButton: $("#model3dFullscreenButton"),
      stage: $("#model3dStage"),
      loading: $("#model3dLoading"),
      mask: $("#model3dMask"),
      maskWindow: $("#model3dMaskWindow"),
      outliner: $("#model3dOutliner"),
      props: $("#model3dProps"),
      renderMode: $("#model3dRenderMode"),
      fov: $("#model3dFov"),
      fovLabel: $("#model3dFovLabel"),
      ratio: $("#model3dRatio"),
      maskAlpha: $("#model3dMaskAlpha"),
      environment: $("#model3dEnvironment"),
      backgroundColor: $("#model3dBackgroundColor"),
      aoRadius: $("#model3dAoRadius"),
      viewButton: $("#model3dViewButton"),
      panButton: $("#model3dPanButton"),
      resetButton: $("#model3dResetButton"),
      saveCloseButton: $("#model3dSaveCloseButton"),
      captureButton: $("#model3dCaptureButton"),
      hint: $("#model3dHint"),
      captureCard: $("#model3dCaptureCard"),
      captureImage: $("#model3dCaptureImage"),
      captureMeta: $("#model3dCaptureMeta"),
      downloadButton: $("#model3dDownloadButton"),
      sendGenerateButton: $("#model3dSendGenerateButton"),
      sendPreciseButton: $("#model3dSendPreciseButton"),
      sendMaterialButton: $("#model3dSendMaterialButton")
    });
    if (!elements.workspace || !utils) return;

    elements.renderMode.innerHTML = renderModes.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
    elements.ratio.innerHTML = utils.ratioOptions.map(([label]) => `<option value="${label}">${label}</option>`).join("");
    bindEvents();
    updateFovLabel();
    refreshStoredSession();
    window.addEventListener("gugu-mode-change", (event) => {
      if (event.detail?.mode === "model3d") activate();
      else if (state.activated) deactivate();
    });
    window.GuguModel3D = { activate, deactivate, save: saveSession, setUserScope };
  }

  function bindEvents() {
    elements.chooseButton.addEventListener("click", () => elements.input.click());
    elements.replaceButton.addEventListener("click", () => elements.input.click());
    elements.input.addEventListener("change", () => loadSelectedFile(elements.input.files?.[0]));
    elements.dropZone.addEventListener("click", (event) => {
      if (!event.target.closest("button")) elements.input.click();
    });
    elements.dropZone.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); elements.input.click(); }
    });
    for (const name of ["dragenter", "dragover"]) {
      elements.dropZone.addEventListener(name, (event) => { event.preventDefault(); elements.dropZone.classList.add("dragging"); });
    }
    for (const name of ["dragleave", "drop"]) {
      elements.dropZone.addEventListener(name, (event) => { event.preventDefault(); elements.dropZone.classList.remove("dragging"); });
    }
    elements.dropZone.addEventListener("drop", (event) => loadSelectedFile(Array.from(event.dataTransfer?.files || [])[0]));
    elements.restoreButton.addEventListener("click", restoreStoredSession);
    elements.clearButton.addEventListener("click", clearStoredSession);
    elements.fullscreenButton.addEventListener("click", toggleFullscreen);
    elements.saveCloseButton.addEventListener("click", closeEditor);
    elements.captureButton.addEventListener("click", captureFrame);
    elements.sendGenerateButton.addEventListener("click", () => sendCapture("imageGenerate"));
    elements.sendPreciseButton.addEventListener("click", () => sendCapture("precise"));
    elements.sendMaterialButton.addEventListener("click", () => sendCapture("materialTransfer"));
    elements.renderMode.addEventListener("change", () => { state.controller?.setRenderMode(elements.renderMode.value); scheduleSave(); });
    elements.fov.addEventListener("input", () => { state.controller?.setFov(elements.fov.value); updateFovLabel(); scheduleSave(); });
    elements.ratio.addEventListener("change", () => { state.ratio = elements.ratio.value; updateMask(); scheduleSave(); });
    elements.maskAlpha.addEventListener("input", () => { state.maskAlpha = Number(elements.maskAlpha.value) / 100; updateMask(); scheduleSave(); });
    elements.environment.addEventListener("input", () => { state.controller?.setEnvIntensity(Number(elements.environment.value) / 100); scheduleSave(); });
    elements.backgroundColor.addEventListener("input", () => { state.controller?.setBackground(elements.backgroundColor.value); scheduleSave(); });
    elements.aoRadius.addEventListener("input", () => { state.controller?.setAORadius(Number(elements.aoRadius.value) / 100); scheduleSave(); });
    elements.viewButton.addEventListener("click", toggleViewMode);
    elements.panButton.addEventListener("click", togglePanMode);
    elements.resetButton.addEventListener("click", () => { state.controller?.resetView(); syncCameraControls(); scheduleSave(); });
    elements.workspace.addEventListener("click", handleWorkspaceClick);
    elements.props.addEventListener("input", handlePropertyInput);
    window.addEventListener("resize", resize);
    document.addEventListener("keydown", handleKeyboard);
  }

  async function activate() {
    state.activated = true;
    if (!state.storedSession) await refreshStoredSession();
    if (state.controller) requestAnimationFrame(resize);
  }

  async function deactivate() {
    state.activated = false;
    if (state.controller) {
      await saveSession();
      disposeController();
      elements.editor.hidden = true;
      elements.landing.hidden = false;
      await refreshStoredSession();
    }
    exitFullscreen();
  }

  async function ensureEngine() {
    if (window.Model3D?.available) return;
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 8000);
      window.addEventListener("gugu-model3d-ready", () => { clearTimeout(timer); resolve(); }, { once: true });
    });
    if (!window.Model3D?.available) throw new Error("3D 引擎未就绪，请确认浏览器支持 WebGL 后刷新页面");
  }

  async function loadSelectedFile(file) {
    if (!file || state.busy) return;
    try {
      const format = utils.validateFile(file, MAX_MODEL_BYTES);
      elements.input.value = "";
      await openModel({ modelBlob: file, modelName: file.name, modelFormat: format, view: null, captureBlob: null });
      toast("模型已在本机载入，可以开始取景");
    } catch (error) {
      toast(error.message);
      setLoading(false);
    }
  }

  async function restoreStoredSession() {
    if (!state.storedSession || state.busy) return;
    try {
      await openModel(state.storedSession);
      toast("已恢复上次保存的 3D 场景");
    } catch (error) {
      toast(`恢复失败：${error.message}`);
      setLoading(false);
    }
  }

  async function openModel(record) {
    state.busy = true;
    setLoading(true, "正在解析模型与材质…");
    elements.landing.hidden = true;
    elements.editor.hidden = false;
    elements.captureCard.hidden = true;
    disposeController();
    revokeCaptureUrl();
    try {
      await ensureEngine();
      state.modelBlob = record.modelBlob;
      state.modelName = record.modelName || "未命名模型";
      state.modelFormat = record.modelFormat || utils.detectFormat(state.modelName);
      state.captureBlob = record.captureBlob || null;
      state.captureName = record.captureName || "";
      state.captureAt = record.captureAt || null;
      const saved = record.view || {};
      state.ratio = saved.aspect || "1:1";
      state.maskAlpha = typeof saved.maskAlpha === "number" ? saved.maskAlpha : 0.6;
      state.showGrid = Boolean(saved.showGrid);
      state.envBackground = Boolean(saved.envBackground);
      state.shadow = saved.shadow !== false;
      state.ao = Boolean(saved.ao);
      elements.fileName.textContent = state.modelName;
      elements.fileMeta.textContent = `${state.modelFormat.toUpperCase()} · ${formatBytes(state.modelBlob.size)} · 文件仅保存在本机`;
      elements.renderMode.value = saved.renderMode || "clay";
      elements.ratio.value = state.ratio;
      elements.maskAlpha.value = String(Math.round(state.maskAlpha * 100));
      elements.environment.value = String(Math.round((typeof saved.envIntensity === "number" ? saved.envIntensity : 1) * 100));
      elements.backgroundColor.value = saved.background || "#f0f1f5";
      elements.aoRadius.value = String(Math.round((typeof saved.aoRadius === "number" ? saved.aoRadius : 0.5) * 100));
      state.controller = window.Model3D.mount(elements.stage, {
        renderMode: elements.renderMode.value,
        onSelectionChange: refreshInspector,
        onChange: scheduleSave
      });
      await state.controller.loadModel(state.modelBlob, state.modelFormat);
      if (record.view) state.controller.setState(record.view);
      state.controller.setGrid(state.showGrid);
      state.controller.setShadow(state.shadow);
      state.controller.setAO(state.ao);
      syncAllControls();
      refreshInspector();
      if (record.captureBlob) showCapture(record.captureBlob, record.captureName || utils.captureFilename(state.modelName), record.captureAt, false);
      await saveSession();
    } catch (error) {
      disposeController();
      elements.editor.hidden = true;
      elements.landing.hidden = false;
      throw error;
    } finally {
      state.busy = false;
      setLoading(false);
    }
  }

  function disposeController() {
    if (!state.controller) return;
    try { state.controller.dispose(); } catch (_) {}
    state.controller = null;
  }

  async function closeEditor() {
    if (!state.controller || state.busy) return;
    await saveSession();
    disposeController();
    elements.editor.hidden = true;
    elements.landing.hidden = false;
    exitFullscreen();
    await refreshStoredSession();
    toast("场景已保存到这台电脑");
  }

  function handleWorkspaceClick(event) {
    const objectButton = event.target.closest("[data-m3d-object]");
    if (objectButton) { state.controller?.selectById(objectButton.dataset.m3dObject); return; }
    const actionButton = event.target.closest("[data-m3d-action]");
    if (!actionButton || !state.controller) return;
    const action = actionButton.dataset.m3dAction;
    if (action === "add") {
      state.controller.addPrimitive(actionButton.dataset.kind);
      refreshInspector();
    } else if (action === "addlight") {
      state.controller.addLight(actionButton.dataset.kind);
      refreshInspector();
    } else if (action === "gmode") {
      state.controller.setGizmoMode(actionButton.dataset.mode);
      syncGizmoButtons();
    } else if (action === "gspace") {
      const next = state.controller.getGizmoSpace() === "local" ? "world" : "local";
      state.controller.setGizmoSpace(next);
      actionButton.textContent = next === "local" ? "本地" : "世界";
      actionButton.classList.toggle("active", next === "local");
    } else if (action === "delete") {
      state.controller.deleteSelected();
      refreshInspector();
    } else if (action === "grid") {
      state.showGrid = !state.showGrid;
      state.controller.setGrid(state.showGrid);
      actionButton.classList.toggle("active", state.showGrid);
    } else if (action === "background") {
      state.envBackground = !state.envBackground;
      state.controller.setEnvBackground(state.envBackground);
      actionButton.classList.toggle("active", state.envBackground);
    } else if (action === "shadow") {
      state.shadow = !state.shadow;
      state.controller.setShadow(state.shadow);
      actionButton.classList.toggle("active", state.shadow);
    } else if (action === "ao") {
      state.ao = !state.ao;
      state.controller.setAO(state.ao);
      actionButton.classList.toggle("active", state.ao);
    }
    scheduleSave();
  }

  function toggleViewMode() {
    if (!state.controller) return;
    const mode = state.controller.toggleViewMode();
    const shot = mode === "shot";
    elements.viewButton.textContent = shot ? "视角：摄像机" : "视角：自由";
    elements.viewButton.classList.toggle("active", !shot);
    elements.hint.textContent = shot
      ? "取景视角 · 遮罩窗口内就是最终截图"
      : "自由观察 · 线框显示取景相机范围，截图仍使用取景相机";
    updateMask();
    scheduleSave();
  }

  function togglePanMode() {
    if (!state.controller) return;
    state.panMode = !state.panMode;
    state.controller.setPanMode(state.panMode);
    elements.panButton.textContent = state.panMode ? "操作：平移" : "操作：旋转";
    elements.panButton.classList.toggle("active", state.panMode);
    elements.panButton.setAttribute("aria-pressed", String(state.panMode));
  }

  function syncAllControls() {
    if (!state.controller) return;
    elements.renderMode.value = state.controller.getRenderMode();
    elements.fov.value = String(Math.round(state.controller.getFov()));
    elements.environment.value = String(Math.round(state.controller.getEnvIntensity() * 100));
    elements.aoRadius.value = String(Math.round(state.controller.getAORadius() * 100));
    elements.backgroundColor.value = state.controller.getBackground() || "#f0f1f5";
    state.envBackground = state.controller.getEnvBackground();
    state.shadow = state.controller.getShadow();
    state.ao = state.controller.getAO();
    updateFovLabel();
    syncCameraControls();
    syncGizmoButtons();
    syncToggleButtons();
    updateMask();
    requestAnimationFrame(resize);
  }

  function syncCameraControls() {
    if (!state.controller) return;
    const shot = state.controller.getViewMode() === "shot";
    elements.viewButton.textContent = shot ? "视角：摄像机" : "视角：自由";
    elements.viewButton.classList.toggle("active", !shot);
    elements.fov.value = String(Math.round(state.controller.getFov()));
    updateFovLabel();
    updateMask();
  }

  function syncGizmoButtons() {
    const mode = state.controller?.getGizmoMode() || "translate";
    $$('[data-m3d-action="gmode"]', elements.workspace).forEach((button) => button.classList.toggle("active", button.dataset.mode === mode));
    const spaceButton = $('[data-m3d-action="gspace"]', elements.workspace);
    if (spaceButton && state.controller) {
      const local = state.controller.getGizmoSpace() === "local";
      spaceButton.textContent = local ? "本地" : "世界";
      spaceButton.classList.toggle("active", local);
    }
  }

  function syncToggleButtons() {
    const map = { grid: state.showGrid, background: state.envBackground, shadow: state.shadow, ao: state.ao };
    Object.entries(map).forEach(([action, on]) => $(`[data-m3d-action="${action}"]`, elements.workspace)?.classList.toggle("active", on));
  }

  function updateFovLabel() {
    const fov = Number(elements.fov?.value) || 35;
    if (elements.fovLabel) elements.fovLabel.textContent = `≈${Math.round(12 / Math.tan((fov * Math.PI) / 360))}mm`;
  }

  function updateMask() {
    if (!state.controller || !elements.stage.clientWidth) return;
    const shot = state.controller.getViewMode() === "shot";
    elements.mask.hidden = !shot;
    if (!shot) return;
    const width = elements.stage.clientWidth;
    const height = elements.stage.clientHeight;
    const crop = utils.cropRect(width, height, utils.ratioNumber(state.ratio));
    elements.maskWindow.style.width = `${crop.width}px`;
    elements.maskWindow.style.height = `${crop.height}px`;
    elements.maskWindow.style.boxShadow = `0 0 0 9999px rgba(2, 4, 12, ${state.maskAlpha})`;
  }

  function refreshInspector() {
    if (!state.controller) return;
    buildOutliner();
    buildProperties(state.controller.getSelectionInfo());
  }

  function buildOutliner() {
    const objects = state.controller.getObjects();
    const icons = { model: "◇", primitive: "▢", light: "✦" };
    elements.outliner.innerHTML = objects.length
      ? objects.map((item) => `<button class="m3d-object ${item.selected ? "active" : ""}" type="button" data-m3d-object="${item.id}"><span>${icons[item.kind] || "•"}</span><strong>${escapeHtml(item.label)}</strong></button>`).join("")
      : '<p class="m3d-empty-note">场景中还没有对象</p>';
  }

  function buildProperties(info) {
    if (!info?.kind) {
      const clip = state.controller.getCameraClip();
      elements.props.innerHTML = `
        <div class="m3d-prop-title"><span>取景相机</span><small>裁剪与对焦</small></div>
        <label class="m3d-toggle-row"><input type="checkbox" data-m3d-prop="clipEnabled" ${clip.enabled ? "checked" : ""}><span>启用对焦裁剪</span></label>
        ${clip.enabled ? `
          <label class="m3d-range-row"><span>对焦</span><input type="range" min="${clip.unit * 0.1}" max="${clip.unit * 10}" step="${clip.unit * 0.02}" value="${clip.focus}" data-m3d-prop="focus"></label>
          <label class="m3d-range-row"><span>前景</span><input type="range" min="0" max="${clip.unit * 8}" step="${clip.unit * 0.02}" value="${clip.front}" data-m3d-prop="front"></label>
          <label class="m3d-range-row"><span>背景</span><input type="range" min="${clip.unit * 0.1}" max="${clip.unit * 30}" step="${clip.unit * 0.05}" value="${clip.back}" data-m3d-prop="back"></label>
          <p class="m3d-empty-note">切到自由视角可查看对焦平面与裁剪视锥。</p>` : '<p class="m3d-empty-note">开启后可限制取景相机的前后景范围。</p>'}`;
      return;
    }
    if (info.kind === "primitive") {
      elements.props.innerHTML = `
        <div class="m3d-prop-title"><span>${primitiveLabels[info.primKind] || "几何体"}</span><small>零件材质</small></div>
        <label class="m3d-color-row"><span>颜色</span><input type="color" value="${info.color || "#bcbcc4"}" data-m3d-prop="primitiveColor"></label>
        <p class="m3d-empty-note">W/E/R 切换变换工具，Delete 删除；颜色只在原始材质模式显示。</p>`;
      return;
    }
    if (info.kind === "light") {
      elements.props.innerHTML = `
        <div class="m3d-prop-title"><span>${lightLabels[info.lightType] || "灯光"}</span><small>光照属性</small></div>
        <label class="m3d-range-row"><span>强度 <b data-m3d-intensity-label>${Number(info.intensity).toFixed(1)}</b></span><input type="range" min="0" max="10" step="0.1" value="${info.intensity}" data-m3d-prop="lightIntensity"></label>
        <label class="m3d-color-row"><span>颜色</span><input type="color" value="${info.color}" data-m3d-prop="lightColor"></label>
        <p class="m3d-empty-note">移动灯位即可改变照明方向，Delete 删除灯光。</p>`;
      return;
    }
    if (info.kind === "model") {
      const channels = info.channels;
      elements.props.innerHTML = channels ? `
        <div class="m3d-prop-title"><span>模型材质</span><small>全模型</small></div>
        ${materialRange("金属度", "metalness", channels.metalness, 0, 1, 0.01)}
        ${materialRange("粗糙度", "roughness", channels.roughness, 0, 1, 0.01)}
        ${materialRange("反射", "envMapIntensity", channels.envMapIntensity, 0, 3, 0.05)}
        ${materialRange("自发光", "emissiveIntensity", channels.emissiveIntensity, 0, 3, 0.05)}
        <label class="m3d-color-row"><span>基础色</span><input type="color" value="${channels.color}" data-m3d-material="color"></label>
        <p class="m3d-empty-note">材质通道只在“原始材质”模式显示。</p>` : '<div class="m3d-prop-title"><span>模型材质</span></div><p class="m3d-empty-note">这个模型没有可调的标准材质。</p>';
    }
  }

  function materialRange(label, channel, value, min, max, step) {
    return `<label class="m3d-range-row"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-m3d-material="${channel}"></label>`;
  }

  function handlePropertyInput(event) {
    if (!state.controller) return;
    const prop = event.target.dataset.m3dProp;
    const material = event.target.dataset.m3dMaterial;
    if (prop === "clipEnabled") {
      state.controller.setClipEnabled(event.target.checked);
      buildProperties(state.controller.getSelectionInfo());
    } else if (["focus", "front", "back"].includes(prop)) {
      state.controller.setCameraClip({ [prop]: Number(event.target.value) });
    } else if (prop === "primitiveColor") {
      state.controller.setPrimitiveColor(event.target.value);
    } else if (prop === "lightIntensity") {
      state.controller.setLightParam("intensity", event.target.value);
      $("[data-m3d-intensity-label]", elements.props).textContent = Number(event.target.value).toFixed(1);
    } else if (prop === "lightColor") {
      state.controller.setLightParam("color", event.target.value);
    } else if (material) {
      state.controller.setMaterialChannel(material, event.target.value);
    }
    scheduleSave();
  }

  async function captureFrame() {
    if (!state.controller || state.busy) return;
    state.busy = true;
    elements.captureButton.disabled = true;
    elements.captureButton.querySelector("span").textContent = "正在截取…";
    try {
      const dataUrl = state.controller.capture("image/png", utils.ratioNumber(state.ratio));
      const blob = dataUrlToBlob(dataUrl);
      const filename = utils.captureFilename(state.modelName);
      await showCapture(blob, filename, new Date().toISOString(), true);
      await saveSession();
      elements.captureCard.scrollIntoView({ behavior: "smooth", block: "start" });
      toast("当前取景已保存为 PNG，可以下载或发送到图片模块");
    } catch (error) {
      toast(`截取失败：${error.message}`);
    } finally {
      state.busy = false;
      elements.captureButton.disabled = false;
      elements.captureButton.querySelector("span").textContent = "截取当前画面";
    }
  }

  function dataUrlToBlob(dataUrl) {
    const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(String(dataUrl || ""));
    if (!match) throw new Error("截图数据无效");
    const mime = match[1] || "application/octet-stream";
    const binary = match[2] ? atob(match[3]) : decodeURIComponent(match[3]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  async function showCapture(blob, filename, capturedAt, scroll) {
    revokeCaptureUrl();
    state.captureBlob = blob;
    state.captureName = filename;
    state.captureAt = capturedAt || new Date().toISOString();
    state.captureUrl = URL.createObjectURL(blob);
    elements.captureImage.src = state.captureUrl;
    elements.downloadButton.href = state.captureUrl;
    elements.downloadButton.download = filename;
    let dimensions = "";
    try {
      const bitmap = await createImageBitmap(blob);
      dimensions = `${bitmap.width}×${bitmap.height} · `;
      bitmap.close();
    } catch (_) {}
    elements.captureMeta.textContent = `${dimensions}${formatBytes(blob.size)} · ${capturedAt ? new Date(capturedAt).toLocaleString() : "刚刚"}`;
    elements.captureCard.hidden = false;
    if (scroll) requestAnimationFrame(() => elements.captureCard.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function revokeCaptureUrl() {
    if (state.captureUrl) URL.revokeObjectURL(state.captureUrl);
    state.captureUrl = "";
  }

  async function sendCapture(mode) {
    if (!state.captureBlob) return;
    if (!window.GuguImageEdit?.importLocalImage) { toast("图片模块尚未就绪，请刷新页面后重试"); return; }
    const file = new File([state.captureBlob], state.captureName || "3d-capture.png", { type: "image/png" });
    try {
      await saveSession();
      await window.GuguImageEdit.importLocalImage(file, mode);
      const message = mode === "precise"
        ? "已将 3D 取景发送到精确图片编辑"
        : (mode === "materialTransfer" ? "已将 3D 取景设为材质迁移结构母版" : "已将 3D 取景加入图片生成参考图");
      toast(message);
    } catch (error) {
      toast(error.message);
    }
  }

  function toggleFullscreen() {
    const fullscreen = !elements.workspace.classList.contains("fullscreen");
    elements.workspace.classList.toggle("fullscreen", fullscreen);
    document.body.classList.toggle("model3d-fullscreen-open", fullscreen);
    elements.fullscreenButton.textContent = fullscreen ? "退出全屏" : "全屏工作台";
    requestAnimationFrame(resize);
  }

  function exitFullscreen() {
    elements.workspace.classList.remove("fullscreen");
    document.body.classList.remove("model3d-fullscreen-open");
    if (elements.fullscreenButton) elements.fullscreenButton.textContent = "全屏工作台";
  }

  function handleKeyboard(event) {
    if (!state.activated || !state.controller || event.defaultPrevented) return;
    const tag = event.target.tagName;
    if (["INPUT", "SELECT", "TEXTAREA"].includes(tag)) return;
    if (event.key === "Escape") {
      if (elements.workspace.classList.contains("fullscreen")) exitFullscreen();
      else if (state.controller.hasSelection()) state.controller.deselect();
      return;
    }
    if (event.ctrlKey || event.metaKey) {
      if (event.key.toLowerCase() === "c") { event.preventDefault(); state.controller.copySelected(); }
      else if (event.key.toLowerCase() === "v") { event.preventDefault(); state.controller.pasteClipboard(); refreshInspector(); scheduleSave(); }
      return;
    }
    if (event.key.toLowerCase() === "w") state.controller.setGizmoMode("translate");
    else if (event.key.toLowerCase() === "e") state.controller.setGizmoMode("rotate");
    else if (event.key.toLowerCase() === "r") state.controller.setGizmoMode("scale");
    else if (event.key === "Delete" || event.key === "Backspace") { state.controller.deleteSelected(); refreshInspector(); scheduleSave(); }
    else return;
    syncGizmoButtons();
  }

  function resize() {
    if (!state.controller || elements.editor.hidden || elements.workspace.hidden) return;
    state.controller.resize();
    updateMask();
  }

  function setLoading(on, message = "正在准备 3D 场景…") {
    elements.loading.hidden = !on;
    elements.loading.textContent = message;
  }

  function scheduleSave() {
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(() => saveSession().catch(() => {}), 350);
  }

  async function saveSession() {
    clearTimeout(state.saveTimer);
    if (!state.modelBlob) return;
    const view = state.controller ? state.controller.getState() : (state.storedSession?.view || null);
    if (view) Object.assign(view, { aspect: state.ratio, maskAlpha: state.maskAlpha, showGrid: state.showGrid });
    const record = {
      id: currentSessionId(),
      modelBlob: state.modelBlob,
      modelName: state.modelName,
      modelFormat: state.modelFormat,
      view,
      captureBlob: state.captureBlob,
      captureName: state.captureName,
      captureAt: state.captureBlob ? (state.captureAt || new Date().toISOString()) : null,
      savedAt: new Date().toISOString()
    };
    await databasePut(record);
    state.storedSession = record;
  }

  async function refreshStoredSession() {
    try {
      state.storedSession = await databaseGet(currentSessionId());
      if (!state.storedSession && state.userScope === "1") {
        const legacy = await databaseGet("active");
        if (legacy) {
          state.storedSession = { ...legacy, id: currentSessionId() };
          await databasePut(state.storedSession);
        }
      }
    } catch (_) {
      state.storedSession = null;
    }
    const record = state.storedSession;
    elements.restoreButton.hidden = !record;
    elements.clearButton.hidden = !record;
    elements.storedSummary.hidden = !record;
    if (record) {
      elements.storedSummary.innerHTML = `<strong>${escapeHtml(record.modelName)}</strong><span>${record.modelFormat.toUpperCase()} · ${formatBytes(record.modelBlob?.size || 0)} · ${new Date(record.savedAt).toLocaleString()}</span>`;
    }
  }

  async function clearStoredSession() {
    if (!state.storedSession) return;
    if (!window.confirm("确定删除本机保存的 3D 模型、场景设置和截图吗？")) return;
    await databaseDelete(currentSessionId());
    state.storedSession = null;
    state.modelBlob = null;
    state.captureBlob = null;
    state.captureAt = null;
    revokeCaptureUrl();
    await refreshStoredSession();
    toast("已删除本机 3D 场景记录");
  }

  function currentSessionId() {
    return `user:${state.userScope}`;
  }

  async function setUserScope(userId) {
    const next = String(userId || "anonymous");
    if (state.userScope === next) return;
    if (state.modelBlob) await saveSession();
    state.userScope = next;
    state.storedSession = null;
    state.modelBlob = null;
    state.captureBlob = null;
    state.captureAt = null;
    revokeCaptureUrl();
    await refreshStoredSession();
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("无法打开 3D 本地数据库"));
    });
  }

  async function databaseGet(id) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = database.transaction(DB_STORE, "readonly").objectStore(DB_STORE).get(id);
      request.onsuccess = () => { resolve(request.result || null); database.close(); };
      request.onerror = () => { reject(request.error); database.close(); };
    });
  }

  async function databasePut(record) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(DB_STORE, "readwrite");
      transaction.objectStore(DB_STORE).put(record);
      transaction.oncomplete = () => { resolve(); database.close(); };
      transaction.onerror = () => { reject(transaction.error); database.close(); };
    });
  }

  async function databaseDelete(id) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(DB_STORE, "readwrite");
      transaction.objectStore(DB_STORE).delete(id);
      transaction.oncomplete = () => { resolve(); database.close(); };
      transaction.onerror = () => { reject(transaction.error); database.close(); };
    });
  }

  function formatBytes(bytes) {
    const size = Number(bytes) || 0;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function toast(message) {
    const element = $("#toast");
    if (!element) return;
    element.textContent = String(message || "");
    element.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { element.hidden = true; }, 4500);
  }
})();
