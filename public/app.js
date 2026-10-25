"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const elements = {
  authOverlay: $("#authOverlay"),
  authForm: $("#authForm"),
  authTitle: $("#authTitle"),
  authIntro: $("#authIntro"),
  authSubmit: $("#authSubmit"),
  authMessage: $("#authMessage"),
  appShell: $("#appShell"),
  modeButtons: $$(".mode-button"),
  stepStrip: $(".step-strip"),
  standardWorkspace: $(".workspace"),
  portraitCreationHub: $("#portraitCreationHub"),
  studioPurposeButtons: $$('[data-studio-purpose]'),
  studioPersonRow: $("#studioPersonRow"),
  studioPersonSelect: $("#studioPersonSelect"),
  studioUsePersonButton: $("#studioUsePersonButton"),
  studioSavePortraitButton: $("#studioSavePortraitButton"),
  studioLibrary: $("#studioLibrary"),
  studioLibraryGrid: $("#studioLibraryGrid"),
  studioLibraryCount: $("#studioLibraryCount"),
  model3dWorkspace: $("#model3dWorkspace"),
  providerBadge: $("#providerBadge"),
  settingsButton: $("#settingsButton"),
  installButton: $("#installButton"),
  historyButton: $("#historyButton"),
  userBadgeName: $("#userBadgeName"),
  userBadgeBalance: $("#userBadgeBalance"),
  accountButton: $("#accountButton"),
  adminButton: $("#adminButton"),
  logoutButton: $("#logoutButton"),
  uploadZone: $("#uploadZone"),
  uploadModeLabel: $("#uploadModeLabel"),
  uploadModeHelp: $("#uploadModeHelp"),
  imageInput: $("#imageInput"),
  chooseImageButton: $("#chooseImageButton"),
  productBackgroundUploader: $("#productBackgroundUploader"),
  productImageInput: $("#productImageInput"),
  backgroundImageInput: $("#backgroundImageInput"),
  productUploadCard: $("#productUploadCard"),
  backgroundUploadCard: $("#backgroundUploadCard"),
  productImagePreview: $("#productImagePreview"),
  backgroundImagePreview: $("#backgroundImagePreview"),
  productUploadPlaceholder: $("#productUploadPlaceholder"),
  backgroundUploadPlaceholder: $("#backgroundUploadPlaceholder"),
  productFileSummary: $("#productFileSummary"),
  backgroundFileSummary: $("#backgroundFileSummary"),
  materialTransferUploader: $("#materialTransferUploader"),
  materialStructureInput: $("#materialStructureInput"),
  materialReferenceInput: $("#materialReferenceInput"),
  materialStructureCard: $("#materialStructureCard"),
  materialReferenceCard: $("#materialReferenceCard"),
  materialStructurePreview: $("#materialStructurePreview"),
  materialReferencePreview: $("#materialReferencePreview"),
  materialStructurePlaceholder: $("#materialStructurePlaceholder"),
  materialReferencePlaceholder: $("#materialReferencePlaceholder"),
  materialStructureSummary: $("#materialStructureSummary"),
  materialReferenceSummary: $("#materialReferenceSummary"),
  editStageShell: $("#editStageShell"),
  editForm: $("#editForm"),
  emptySettings: $("#emptySettings"),
  emptySettingsText: $("#emptySettingsText"),
  fileMeta: $("#fileMeta"),
  editorEyebrow: $("#editorEyebrow"),
  editorTitle: $("#editorTitle"),
  settingsTitle: $("#settingsTitle"),
  replaceImageButton: $("#replaceImageButton"),
  resetEditButton: $("#resetEditButton"),
  expandStage: $("#expandStage"),
  expandFrame: $("#expandFrame"),
  expandImage: $("#expandImage"),
  expandProvider: $("#expandProvider"),
  expandModel: $("#expandModel"),
  preciseProvider: $("#preciseProvider"),
  preciseModel: $("#preciseModel"),
  preciseModelNote: $("#preciseModelNote"),
  lockRatio: $("#lockRatio"),
  padTop: $("#padTop"),
  padRight: $("#padRight"),
  padBottom: $("#padBottom"),
  padLeft: $("#padLeft"),
  expandSize: $("#expandSize"),
  expandSizeError: $("#expandSizeError"),
  expandQuality: $("#expandQuality"),
  expandPrompt: $("#expandPrompt"),
  annotationCanvas: $("#annotationCanvas"),
  annotationTools: $("#annotationTools"),
  markCount: $("#markCount"),
  preciseSize: $("#preciseSize"),
  outputFormat: $("#outputFormat"),
  promptOptimizationField: $("#promptOptimizationField"),
  promptOptimization: $("#promptOptimization"),
  precisePrompt: $("#precisePrompt"),
  productBackgroundProvider: $("#productBackgroundProvider"),
  productBackgroundModel: $("#productBackgroundModel"),
  productBackgroundAspectSource: $("#productBackgroundAspectSource"),
  productBackgroundSize: $("#productBackgroundSize"),
  productBackgroundPrompt: $("#productBackgroundPrompt"),
  materialTransferProvider: $("#materialTransferProvider"),
  materialTransferModel: $("#materialTransferModel"),
  materialTransferStrength: $("#materialTransferStrength"),
  materialTransferHint: $("#materialTransferHint"),
  materialTransferExtra: $("#materialTransferExtra"),
  materialTransferSize: $("#materialTransferSize"),
  imageGenerationStage: $("#imageGenerationStage"),
  imageGenerationPrompt: $("#imageGenerationPrompt"),
  imageGenerationPromptCount: $("#imageGenerationPromptCount"),
  imageGenerationClearPrompt: $("#imageGenerationClearPrompt"),
  imageGenerationReferenceInput: $("#imageGenerationReferenceInput"),
  imageGenerationAddReferenceButton: $("#imageGenerationAddReferenceButton"),
  imageGenerationReferenceGrid: $("#imageGenerationReferenceGrid"),
  imageGenerationProvider: $("#imageGenerationProvider"),
  imageGenerationModel: $("#imageGenerationModel"),
  imageGenerationModelNote: $("#imageGenerationModelNote"),
  imageGenerationQualityField: $("#imageGenerationQualityField"),
  imageGenerationQuality: $("#imageGenerationQuality"),
  imageGenerationRatio: $("#imageGenerationRatio"),
  imageGenerationTier: $("#imageGenerationTier"),
  imageGenerationOutputFormatField: $("#imageGenerationOutputFormatField"),
  imageGenerationOutputFormat: $("#imageGenerationOutputFormat"),
  imageGenerationPromptOptimizationField: $("#imageGenerationPromptOptimizationField"),
  imageGenerationPromptOptimization: $("#imageGenerationPromptOptimization"),
  imageGenerationSize: $("#imageGenerationSize"),
  imageGenerationSizeNote: $("#imageGenerationSizeNote"),
  imageGenerationModeTitle: $("#imageGenerationModeTitle"),
  imageGenerationModeHelp: $("#imageGenerationModeHelp"),
  stickerPackStage: $("#stickerPackStage"),
  stickerPackImage: $("#stickerPackImage"),
  stickerPackProvider: $("#stickerPackProvider"),
  stickerPackModel: $("#stickerPackModel"),
  stickerPackCount: $("#stickerPackCount"),
  stickerPackStyle: $("#stickerPackStyle"),
  stickerPackSize: $("#stickerPackSize"),
  stickerCaptionModeInputs: $$("input[name='stickerCaptionMode']"),
  stickerCustomCaptionEditor: $("#stickerCustomCaptionEditor"),
  stickerRandomCaptionNote: $("#stickerRandomCaptionNote"),
  stickerCaptionFields: $("#stickerCaptionFields"),
  stickerPackExtra: $("#stickerPackExtra"),
  portraitStudioStage: $("#portraitStudioStage"),
  portraitStudioImage: $("#portraitStudioImage"),
  portraitReferenceRail: $("#portraitReferenceRail"),
  portraitPhotoAnalysis: $("#portraitPhotoAnalysis"),
  portraitProvider: $("#portraitProvider"),
  portraitModel: $("#portraitModel"),
  portraitReferenceInput: $("#portraitReferenceInput"),
  portraitAddReferenceButton: $("#portraitAddReferenceButton"),
  portraitUsage: $("#portraitUsage"),
  portraitMood: $("#portraitMood"),
  portraitIntensity: $("#portraitIntensity"),
  portraitRecommendations: $("#portraitRecommendations"),
  portraitStyleGrid: $("#portraitStyleGrid"),
  portraitExpressionGrid: $("#portraitExpressionGrid"),
  portraitExpressionIntensity: $("#portraitExpressionIntensity"),
  portraitRatio: $("#portraitRatio"),
  portraitResolution: $("#portraitResolution"),
  portraitQualityField: $("#portraitQualityField"),
  portraitQuality: $("#portraitQuality"),
  portraitExtra: $("#portraitExtra"),
  portraitScene: $("#portraitScene"),
  portraitCamera: $("#portraitCamera"),
  portraitWardrobe: $("#portraitWardrobe"),
  portraitAction: $("#portraitAction"),
  portraitLighting: $("#portraitLighting"),
  portraitAdultConsent: $("#portraitAdultConsent"),
  portraitRightsConsent: $("#portraitRightsConsent"),
  portraitSaveSource: $("#portraitSaveSource"),
  referenceInput: $("#referenceInput"),
  addReferenceButton: $("#addReferenceButton"),
  referenceList: $("#referenceList"),
  generateButton: $("#generateButton"),
  jobPanel: $("#jobPanel"),
  jobStage: $("#jobStage"),
  jobProgress: $("#jobProgress"),
  jobProgressText: $("#jobProgressText"),
  jobMessage: $("#jobMessage"),
  resultCard: $("#resultCard"),
  resultImage: $("#resultImage"),
  originalImage: $("#originalImage"),
  compareStage: $("#compareStage"),
  compareSlider: $("#compareSlider"),
  compareOriginalClip: $("#compareOriginalClip"),
  compareDivider: $("#compareDivider"),
  compareBeforeLabel: $("#compareBeforeLabel"),
  fullscreenCompareButton: $("#fullscreenCompareButton"),
  fullscreenCompareButtonLabel: $("#fullscreenCompareButtonLabel"),
  fullscreenCompare: $("#fullscreenCompare"),
  fullscreenCompareStage: $("#fullscreenCompareStage"),
  fullscreenResultImage: $("#fullscreenResultImage"),
  fullscreenOriginalImage: $("#fullscreenOriginalImage"),
  fullscreenCompareSlider: $("#fullscreenCompareSlider"),
  fullscreenOriginalClip: $("#fullscreenOriginalClip"),
  fullscreenCompareDivider: $("#fullscreenCompareDivider"),
  fullscreenBeforeLabel: $("#fullscreenBeforeLabel"),
  fullscreenCompareTitle: $("#fullscreenCompareTitle"),
  fullscreenCompareMeta: $("#fullscreenCompareMeta"),
  fullscreenCompareFooterHint: $("#fullscreenCompareFooterHint"),
  resultMeta: $("#resultMeta"),
  resultMode: $("#resultMode"),
  resultModel: $("#resultModel"),
  resultSize: $("#resultSize"),
  resultFile: $("#resultFile"),
  downloadOriginalButton: $("#downloadOriginalButton"),
  downloadResultButton: $("#downloadResultButton"),
  newEditButton: $("#newEditButton"),
  portraitExpandSeriesButton: $("#portraitExpandSeriesButton"),
  portraitSeriesCard: $("#portraitSeriesCard"),
  portraitSeriesMeta: $("#portraitSeriesMeta"),
  portraitSeriesGrid: $("#portraitSeriesGrid"),
  portraitDownloadAllButton: $("#portraitDownloadAllButton"),
  settingsModal: $("#settingsModal"),
  settingsForm: $("#settingsForm"),
  defaultBaseUrl: $("#defaultBaseUrl"),
  defaultApiKey: $("#defaultApiKey"),
  defaultModel: $("#defaultModel"),
  defaultProviderState: $("#defaultProviderState"),
  volcBaseUrl: $("#volcBaseUrl"),
  volcApiKey: $("#volcApiKey"),
  volcModel: $("#volcModel"),
  volcWatermark: $("#volcWatermark"),
  volcProviderState: $("#volcProviderState"),
  historyDrawer: $("#historyDrawer"),
  historyToolbar: $("#historyToolbar"),
  historySelectAll: $("#historySelectAll"),
  historySelectedCount: $("#historySelectedCount"),
  historyDeleteButton: $("#historyDeleteButton"),
  historyList: $("#historyList"),
  accountModal: $("#accountModal"),
  accountUsername: $("#accountUsername"),
  accountBalance: $("#accountBalance"),
  accountReserved: $("#accountReserved"),
  accountAvailable: $("#accountAvailable"),
  accountRecordList: $("#accountRecordList"),
  adminModal: $("#adminModal"),
  adminOverview: $("#adminOverview"),
  adminRefreshButton: $("#adminRefreshButton"),
  adminUserList: $("#adminUserList"),
  adminUserDetail: $("#adminUserDetail"),
  adminDataTabs: $("#adminDataTabs"),
  adminRecordList: $("#adminRecordList"),
  teamSettingsForm: $("#teamSettingsForm"),
  registrationEnabled: $("#registrationEnabled"),
  teamCostGrid: $("#teamCostGrid"),
  adminAuditList: $("#adminAuditList"),
  toast: $("#toast"),
  localAddress: $("#localAddress")
};

const state = {
  mode: "expand",
  base: null,
  workspaces: {
    imageGenerate: { base: null, references: [], comparisonOriginal: "", lastResult: null },
    expand: { base: null, comparisonOriginal: "", lastResult: null },
    precise: { base: null, comparisonOriginal: "", lastResult: null },
    productBackground: { base: null, background: null, comparisonOriginal: "", lastResult: null },
    materialTransfer: { base: null, material: null, comparisonOriginal: "", lastResult: null },
    stickerPack: { base: null, comparisonOriginal: "", lastResult: null },
    portraitStudio: { base: null, references: [], metrics: null, comparisonOriginal: "", lastResult: null, seriesId: "", seriesResults: {} },
    model3d: { base: null },
    characterStudio: { base: null }
  },
  references: [],
  pads: { top: 0.25, right: 0.25, bottom: 0.25, left: 0.25 },
  marks: [],
  undoStack: [],
  tool: "point",
  pointerId: null,
  activeMark: null,
  activeJobId: "",
  clientRequestId: "",
  busy: false,
  backend: null,
  portraitOptions: null,
  portraitStyleId: "clear-natural-light",
  portraitExpressionId: "auto",
  portraitExpressionIntensity: "balanced",
  installPrompt: null,
  expandDrag: null,
  selectedHistoryIds: new Set(),
  displayedJob: null,
  displayedOriginal: null,
  displayedFromHistory: false,
  studioPurpose: "portrait",
  studioPerson: null,
  currentUser: null,
  teamSettings: null,
  appStarted: false,
  authMode: "login",
  accountTab: "transactions",
  adminTab: "transactions",
  adminSelectedUserId: null,
  adminUsers: []
};

const preciseSizes = Array.from(elements.preciseSize.options).map((option) => option.value);

initialize();

async function initialize() {
  bindEvents();
  bindTeamEvents();
  elements.localAddress.textContent = location.origin;
  try {
    const session = await api("/api/auth/me");
    state.teamSettings = session.team;
    if (session.user) {
      state.currentUser = session.user;
      await startAuthenticatedApp();
    } else {
      showAuth("login");
    }
  } catch (error) {
    showAuth("login", `无法连接团队服务：${error.message}`);
  }
}

async function startAuthenticatedApp() {
  elements.authOverlay.hidden = true;
  elements.appShell.hidden = false;
  renderCurrentUser();
  window.GuguModel3D?.setUserScope?.(String(state.currentUser.id));
  if (state.appStarted) return;
  state.appStarted = true;
  await Promise.all([loadStatus(), loadPortraitOptions()]);
  setMode("expand");
  registerPwa();
}

function bindEvents() {
  $$("[data-sticker-tab]").forEach((button, index, tabs) => {
    button.addEventListener("click", () => selectStickerSettingsTab(button.dataset.stickerTab));
    button.addEventListener("keydown", (event) => {
      const offset = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (!offset && !["Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + offset + tabs.length) % tabs.length;
      selectStickerSettingsTab(tabs[next].dataset.stickerTab);
      tabs[next].focus();
    });
  });
  $$("[data-portrait-tab]").forEach((button, index, tabs) => {
    button.addEventListener("click", () => selectPortraitSettingsTab(button.dataset.portraitTab));
    button.addEventListener("keydown", (event) => {
      const offset = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (!offset && !["Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + offset + tabs.length) % tabs.length;
      selectPortraitSettingsTab(tabs[next].dataset.portraitTab);
      tabs[next].focus();
    });
  });
  elements.modeButtons.forEach((button) => button.addEventListener("click", () => button.dataset.mode === "portraitStudio" ? setStudioPurpose(state.studioPurpose) : setMode(button.dataset.mode)));
  elements.studioPurposeButtons.forEach((button) => button.addEventListener("click", () => setStudioPurpose(button.dataset.studioPurpose)));
  elements.studioUsePersonButton.addEventListener("click", () => void useSelectedStudioPerson());
  elements.studioPersonSelect.addEventListener("change", () => {
    elements.studioUsePersonButton.disabled = !elements.studioPersonSelect.value;
    if (`${state.studioPerson?.projectId}|${state.studioPerson?.versionId}` !== elements.studioPersonSelect.value) state.studioPerson = null;
    updateStudioSaveButton();
  });
  elements.studioSavePortraitButton.addEventListener("click", () => void savePortraitToPerson());
  elements.studioLibrary.addEventListener("toggle", () => { if (elements.studioLibrary.open) void renderStudioLibrary(); });
  elements.uploadZone.addEventListener("click", () => elements.imageInput.click());
  elements.uploadZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      elements.imageInput.click();
    }
  });
  elements.chooseImageButton.addEventListener("click", (event) => {
    event.stopPropagation();
    elements.imageInput.click();
  });
  elements.imageInput.addEventListener("change", () => {
    if (state.mode === "portraitStudio") {
      state.studioPerson = null;
      elements.studioPersonSelect.value = "";
      elements.studioUsePersonButton.disabled = true;
    }
    void loadBaseFile(elements.imageInput.files?.[0]);
    updateStudioSaveButton();
  });
  elements.replaceImageButton.addEventListener("click", () => elements.imageInput.click());
  elements.productUploadCard.addEventListener("click", () => elements.productImageInput.click());
  elements.backgroundUploadCard.addEventListener("click", () => elements.backgroundImageInput.click());
  elements.productImageInput.addEventListener("change", () => loadProductBackgroundFile("product", elements.productImageInput.files?.[0]));
  elements.backgroundImageInput.addEventListener("change", () => loadProductBackgroundFile("background", elements.backgroundImageInput.files?.[0]));
  elements.materialStructureCard.addEventListener("click", () => elements.materialStructureInput.click());
  elements.materialReferenceCard.addEventListener("click", () => elements.materialReferenceInput.click());
  elements.materialStructureInput.addEventListener("change", () => loadMaterialTransferFile("structure", elements.materialStructureInput.files?.[0]));
  elements.materialReferenceInput.addEventListener("change", () => loadMaterialTransferFile("material", elements.materialReferenceInput.files?.[0]));
  for (const eventName of ["dragenter", "dragover"]) {
    elements.uploadZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.uploadZone.classList.add("dragover");
    });
  }
  for (const eventName of ["dragleave", "drop"]) {
    elements.uploadZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.uploadZone.classList.remove("dragover");
    });
  }
  elements.uploadZone.addEventListener("drop", (event) => loadBaseFile(firstImageFile(event.dataTransfer?.files)));

  elements.expandProvider.addEventListener("change", populateExpandModels);
  elements.expandModel.addEventListener("change", updateExpandLayout);
  elements.imageGenerationProvider.addEventListener("change", populateImageGenerationModels);
  elements.imageGenerationModel.addEventListener("change", updateImageGenerationOptions);
  elements.imageGenerationRatio.addEventListener("change", updateImageGenerationSize);
  elements.imageGenerationTier.addEventListener("change", updateImageGenerationSize);
  elements.imageGenerationPrompt.addEventListener("input", updateImageGenerationPromptCount);
  elements.imageGenerationClearPrompt.addEventListener("click", () => {
    elements.imageGenerationPrompt.value = "";
    updateImageGenerationPromptCount();
    elements.imageGenerationPrompt.focus();
  });
  elements.imageGenerationAddReferenceButton.addEventListener("click", () => elements.imageGenerationReferenceInput.click());
  elements.imageGenerationReferenceInput.addEventListener("change", () => addImageGenerationReferenceFiles(elements.imageGenerationReferenceInput.files));
  elements.imageGenerationReferenceGrid.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-generation-reference-remove]");
    if (removeButton) {
      currentWorkspace().references.splice(Number(removeButton.dataset.generationReferenceRemove), 1);
      renderImageGenerationReferences();
      updateImageGenerationModeNote();
      return;
    }
    const reference = event.target.closest("[data-generation-reference-insert]");
    if (reference) insertImageGenerationMention(Number(reference.dataset.generationReferenceInsert));
  });
  elements.preciseProvider.addEventListener("change", populatePreciseModels);
  elements.preciseModel.addEventListener("change", () => {
    updatePreciseModelOptions();
    updateProviderBadge();
  });
  elements.productBackgroundProvider.addEventListener("change", populateProductBackgroundModels);
  elements.productBackgroundModel.addEventListener("change", updateProviderBadge);
  elements.productBackgroundAspectSource.addEventListener("change", updateProductBackgroundSize);
  elements.materialTransferProvider.addEventListener("change", populateMaterialTransferModels);
  elements.materialTransferModel.addEventListener("change", updateProviderBadge);
  elements.stickerPackProvider.addEventListener("change", populateStickerPackModels);
  elements.stickerPackModel.addEventListener("change", updateProviderBadge);
  elements.portraitProvider.addEventListener("change", populatePortraitModels);
  elements.portraitModel.addEventListener("change", updateProviderBadge);
  elements.portraitAddReferenceButton.addEventListener("click", () => elements.portraitReferenceInput.click());
  elements.portraitReferenceInput.addEventListener("change", () => addPortraitReferenceFiles(elements.portraitReferenceInput.files));
  elements.portraitReferenceRail.addEventListener("click", (event) => {
    const button = event.target.closest("[data-portrait-reference-remove]");
    if (!button) return;
    currentWorkspace().references.splice(Number(button.dataset.portraitReferenceRemove), 1);
    renderPortraitWorkspace();
    updatePortraitRecommendations();
  });
  [elements.portraitUsage, elements.portraitMood, elements.portraitIntensity].forEach((select) => select.addEventListener("change", updatePortraitRecommendations));
  elements.portraitRecommendations.addEventListener("click", (event) => selectPortraitStyle(event.target.closest("[data-portrait-style]")?.dataset.portraitStyle));
  elements.portraitStyleGrid.addEventListener("click", (event) => selectPortraitStyle(event.target.closest("[data-portrait-style]")?.dataset.portraitStyle));
  elements.portraitExpressionGrid.addEventListener("click", (event) => {
    const id = event.target.closest("[data-portrait-expression]")?.dataset.portraitExpression;
    if (!id) return;
    state.portraitExpressionId = id;
    renderPortraitExpressions();
  });
  elements.portraitExpressionIntensity.addEventListener("click", (event) => {
    const id = event.target.closest("[data-portrait-expression-intensity]")?.dataset.portraitExpressionIntensity;
    if (!id) return;
    state.portraitExpressionIntensity = id;
    $$('[data-portrait-expression-intensity]', elements.portraitExpressionIntensity).forEach((button) => button.classList.toggle("active", button.dataset.portraitExpressionIntensity === id));
  });
  elements.portraitExpandSeriesButton.addEventListener("click", expandPortraitSeries);
  elements.portraitDownloadAllButton.addEventListener("click", downloadPortraitSeries);
  elements.portraitSeriesGrid.addEventListener("click", handlePortraitSeriesAction);
  elements.stickerPackCount.addEventListener("change", () => {
    renderStickerCaptionFields();
    updateStickerPackSize();
    updateStickerCaptionMode();
  });
  elements.stickerCaptionModeInputs.forEach((input) => input.addEventListener("change", updateStickerCaptionMode));
  elements.lockRatio.addEventListener("change", () => {
    if (elements.lockRatio.checked) {
      const average = (state.pads.top + state.pads.right + state.pads.bottom + state.pads.left) / 4;
      state.pads = { top: average, right: average, bottom: average, left: average };
      syncPadInputs();
      updateExpandLayout();
    }
  });
  [elements.padTop, elements.padRight, elements.padBottom, elements.padLeft].forEach((input) => input.addEventListener("input", () => {
    const side = input.id.replace("pad", "").toLowerCase();
    const value = clamp(Number(input.value) || 0, 0, 300) / 100;
    if (elements.lockRatio.checked) state.pads = { top: value, right: value, bottom: value, left: value };
    else state.pads[side] = value;
    syncPadInputs();
    updateExpandLayout();
  }));
  $$(".expand-handle").forEach((handle) => handle.addEventListener("pointerdown", startExpandDrag));
  window.addEventListener("pointermove", moveExpandDrag);
  window.addEventListener("pointerup", finishExpandDrag);
  window.addEventListener("pointercancel", finishExpandDrag);
  window.addEventListener("resize", () => {
    updateExpandLayout();
    updateCompareSlider();
    updateFullscreenCompareSlider();
  });

  elements.annotationTools.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tool]");
    if (!button) return;
    state.tool = button.dataset.tool;
    $$('[data-tool]', elements.annotationTools).forEach((item) => item.classList.toggle("active", item === button));
  });
  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-annotation-action]")?.dataset.annotationAction;
    if (action === "undo") undoAnnotation();
    if (action === "clear") clearAnnotations();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.fullscreenCompare.hidden) {
      closeFullscreenCompare();
      return;
    }
    if (state.mode === "precise" && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      undoAnnotation();
    }
  });
  elements.annotationCanvas.addEventListener("pointerdown", annotationPointerDown);
  elements.annotationCanvas.addEventListener("pointermove", annotationPointerMove);
  elements.annotationCanvas.addEventListener("pointerup", annotationPointerFinish);
  elements.annotationCanvas.addEventListener("pointercancel", annotationPointerFinish);

  elements.addReferenceButton.addEventListener("click", () => elements.referenceInput.click());
  elements.referenceInput.addEventListener("change", () => addReferenceFiles(elements.referenceInput.files));
  elements.referenceList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-reference-remove]");
    if (!button) return;
    state.references.splice(Number(button.dataset.referenceRemove), 1);
    renderReferences();
  });
  elements.preciseSize.addEventListener("change", () => {});
  elements.resetEditButton.addEventListener("click", resetEdit);
  elements.editForm.addEventListener("submit", submitGeneration);

  elements.compareSlider.addEventListener("input", updateCompareSlider);
  elements.fullscreenCompareButton.addEventListener("click", openFullscreenCompare);
  elements.fullscreenCompareSlider.addEventListener("input", updateFullscreenCompareSlider);
  $$('[data-fullscreen-close]').forEach((button) => button.addEventListener("click", closeFullscreenCompare));
  elements.fullscreenCompare.addEventListener("click", (event) => {
    if (event.target === elements.fullscreenCompare) closeFullscreenCompare();
  });
  elements.downloadOriginalButton.addEventListener("click", downloadOriginal);
  elements.newEditButton.addEventListener("click", continueEditingDisplayedOriginal);

  elements.settingsButton.addEventListener("click", openSettings);
  $$('[data-modal-close]').forEach((button) => button.addEventListener("click", closeSettings));
  elements.settingsModal.addEventListener("click", (event) => {
    if (event.target === elements.settingsModal) closeSettings();
  });
  elements.settingsForm.addEventListener("submit", saveSettings);

  elements.historyButton.addEventListener("click", openHistory);
  $$('[data-history-close]').forEach((button) => button.addEventListener("click", closeHistory));
  elements.historyDrawer.addEventListener("click", (event) => {
    if (event.target === elements.historyDrawer) closeHistory();
    const resultButton = event.target.closest("[data-history-result]");
    if (resultButton) showHistoricalResult(resultButton.dataset.historyResult);
  });
  elements.historyList.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-history-select]");
    if (!checkbox) return;
    if (checkbox.checked) state.selectedHistoryIds.add(checkbox.dataset.historySelect);
    else state.selectedHistoryIds.delete(checkbox.dataset.historySelect);
    updateHistorySelectionUi();
  });
  elements.historySelectAll.addEventListener("change", () => {
    const checkboxes = $$('[data-history-select]:not(:disabled)', elements.historyList);
    for (const checkbox of checkboxes) {
      if (elements.historySelectAll.checked) state.selectedHistoryIds.add(checkbox.dataset.historySelect);
      else state.selectedHistoryIds.delete(checkbox.dataset.historySelect);
    }
    updateHistorySelectionUi();
  });
  elements.historyDeleteButton.addEventListener("click", deleteSelectedHistory);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.installPrompt = event;
    elements.installButton.hidden = false;
  });
  elements.installButton.addEventListener("click", installPwa);
}

function bindTeamEvents() {
  $$("[data-auth-mode]").forEach((button) => button.addEventListener("click", () => showAuth(button.dataset.authMode)));
  elements.authForm.addEventListener("submit", handleAuthSubmit);
  elements.logoutButton.addEventListener("click", async () => {
    try { await api("/api/auth/logout", { method: "POST" }); } catch {}
    location.reload();
  });
  elements.accountButton.addEventListener("click", openAccount);
  $$('[data-account-close]').forEach((button) => button.addEventListener("click", () => { elements.accountModal.hidden = true; }));
  elements.accountModal.addEventListener("click", (event) => { if (event.target === elements.accountModal) elements.accountModal.hidden = true; });
  $$("[data-account-tab]").forEach((button) => button.addEventListener("click", () => {
    state.accountTab = button.dataset.accountTab;
    $$("[data-account-tab]").forEach((item) => item.classList.toggle("active", item === button));
    void renderAccountRecords();
  }));
  elements.adminButton.addEventListener("click", openAdmin);
  elements.adminRefreshButton.addEventListener("click", () => void loadAdmin());
  $$('[data-admin-close]').forEach((button) => button.addEventListener("click", () => { elements.adminModal.hidden = true; }));
  elements.adminModal.addEventListener("click", (event) => { if (event.target === elements.adminModal) elements.adminModal.hidden = true; });
  elements.adminUserList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-admin-user-id]");
    if (!button) return;
    state.adminSelectedUserId = Number(button.dataset.adminUserId);
    renderAdminUsers();
    renderAdminUserDetail();
    void renderAdminRecords();
  });
  elements.adminDataTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-admin-tab]");
    if (!button) return;
    state.adminTab = button.dataset.adminTab;
    $$('[data-admin-tab]', elements.adminDataTabs).forEach((item) => item.classList.toggle("active", item === button));
    void renderAdminRecords();
  });
  elements.adminRecordList.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-admin-delete-job]");
    if (!button || !window.confirm("确定删除这条任务记录及其结果文件吗？此操作不可恢复。")) return;
    try {
      await api(`/api/admin/jobs/${encodeURIComponent(button.dataset.adminDeleteJob)}`, { method: "DELETE" });
      showToast("任务记录和结果文件已删除");
      await loadAdmin();
    } catch (error) { showToast(error.message); }
  });
  elements.adminUserDetail.addEventListener("click", handleAdminUserAction);
  elements.teamSettingsForm.addEventListener("submit", saveTeamSettings);
}

function showAuth(mode = "login", message = "") {
  state.authMode = mode === "register" ? "register" : "login";
  elements.appShell.hidden = true;
  elements.authOverlay.hidden = false;
  $$("[data-auth-mode]").forEach((button) => button.classList.toggle("active", button.dataset.authMode === state.authMode));
  elements.authTitle.textContent = state.authMode === "login" ? "登录工作台" : "注册团队账号";
  elements.authIntro.textContent = state.authMode === "login" ? "使用管理员已审核的团队账号登录。" : "注册成功后，需要管理员审核并分配积分。";
  elements.authSubmit.textContent = state.authMode === "login" ? "登录" : "提交注册";
  elements.authMessage.textContent = message;
  elements.authMessage.classList.remove("success");
  const registerButton = $("[data-auth-mode='register']");
  if (registerButton && state.teamSettings) registerButton.hidden = state.teamSettings.registrationEnabled === false;
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const form = new FormData(elements.authForm);
  elements.authSubmit.disabled = true;
  elements.authMessage.textContent = state.authMode === "login" ? "正在登录…" : "正在提交…";
  elements.authMessage.classList.remove("success");
  try {
    const result = await api(`/api/auth/${state.authMode}`, {
      method: "POST",
      body: JSON.stringify({ username: form.get("username"), password: form.get("password") })
    });
    if (state.authMode === "register") {
      elements.authForm.reset();
      showAuth("login", result.message || "注册成功，请等待管理员审核");
      elements.authMessage.classList.add("success");
      return;
    }
    state.currentUser = result.user;
    state.teamSettings = result.team;
    elements.authForm.reset();
    await startAuthenticatedApp();
  } catch (error) {
    elements.authMessage.textContent = error.message;
  } finally {
    elements.authSubmit.disabled = false;
  }
}

function renderCurrentUser() {
  const user = state.currentUser;
  if (!user) return;
  elements.userBadgeName.textContent = `${user.username}${user.isAdmin ? " · 管理员" : ""}`;
  elements.userBadgeBalance.textContent = `${user.availableBalance} 可用积分`;
  elements.adminButton.hidden = !user.isAdmin;
  elements.settingsButton.hidden = !user.isAdmin;
  const billingNote = $(".billing-note");
  if (billingNote) billingNote.textContent = `生成由团队统一计费；当前模式每次 ${state.teamSettings?.costs?.[state.mode] ?? 0} 积分，失败自动释放冻结积分。`;
}

async function refreshCurrentUser() {
  const session = await api("/api/auth/me");
  if (!session.user) { location.reload(); return; }
  state.currentUser = session.user;
  state.teamSettings = session.team;
  renderCurrentUser();
}

async function openAccount() {
  await refreshCurrentUser();
  const user = state.currentUser;
  elements.accountUsername.textContent = `${user.username}${user.isAdmin ? "（管理员）" : ""}`;
  elements.accountBalance.textContent = user.balance;
  elements.accountReserved.textContent = user.reservedBalance;
  elements.accountAvailable.textContent = user.availableBalance;
  elements.accountModal.hidden = false;
  state.accountTab = "transactions";
  $$("[data-account-tab]").forEach((button) => button.classList.toggle("active", button.dataset.accountTab === state.accountTab));
  await renderAccountRecords();
}

async function renderAccountRecords() {
  elements.accountRecordList.innerHTML = '<p class="muted">正在读取…</p>';
  try {
    const data = await api(`/api/billing/${state.accountTab}`);
    const rows = data[state.accountTab] || [];
    elements.accountRecordList.innerHTML = renderTeamRecords(state.accountTab, rows);
  } catch (error) { elements.accountRecordList.innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`; }
}

async function openAdmin() {
  if (!state.currentUser?.isAdmin) return;
  elements.adminModal.hidden = false;
  await loadAdmin();
}

async function loadAdmin() {
  elements.adminUserList.innerHTML = '<p class="muted">正在读取用户…</p>';
  try {
    const [overview, userData, team, audit] = await Promise.all([
      api("/api/admin/overview"),
      api("/api/admin/users"),
      api("/api/admin/team-settings"),
      api("/api/admin/audit?limit=50")
    ]);
    state.adminUsers = userData.users || [];
    state.teamSettings = team;
    if (!state.adminUsers.some((item) => item.id === state.adminSelectedUserId)) {
      state.adminSelectedUserId = state.adminUsers.find((item) => item.status === "pending")?.id || state.adminUsers[0]?.id || null;
    }
    elements.adminOverview.innerHTML = [
      ["用户总数", overview.users], ["待审核", overview.pendingUsers], ["活跃用户", overview.activeUsers],
      ["任务总数", overview.jobs], ["累计消耗", `${overview.spentCredits} 分`], ["运行中", overview.queue.active], ["排队中", overview.queue.waiting]
    ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
    renderAdminUsers();
    renderAdminUserDetail();
    renderTeamSettings();
    elements.adminAuditList.innerHTML = (audit.items || []).length
      ? audit.items.map((item) => `<div class="team-record-row"><time>${escapeHtml(formatTeamTime(item.created_at))}</time><span>${escapeHtml(item.admin_username || "系统")}</span><strong>${escapeHtml(item.action)}</strong><span>${escapeHtml(item.target_username || "—")} · ${escapeHtml(item.detail || "")}</span></div>`).join("")
      : '<p class="muted">暂无管理员操作记录。</p>';
    await renderAdminRecords();
  } catch (error) { showToast(error.message); }
}

function renderAdminUsers() {
  elements.adminUserList.innerHTML = state.adminUsers.map((user) => `
    <button class="team-admin-user ${user.id === state.adminSelectedUserId ? "active" : ""}" type="button" data-admin-user-id="${user.id}">
      <span><strong>${escapeHtml(user.username)}</strong><br><small>${user.isAdmin ? "管理员" : "普通用户"} · ${user.availableBalance} 可用积分</small></span>
      <span class="team-status ${user.status}">${teamStatusLabel(user.status)}</span>
    </button>`).join("") || '<p class="muted">暂无用户。</p>';
}

function renderAdminUserDetail() {
  const user = state.adminUsers.find((item) => item.id === state.adminSelectedUserId);
  elements.adminDataTabs.hidden = !user;
  if (!user) { elements.adminUserDetail.innerHTML = '<p class="muted">选择一个用户进行管理。</p>'; return; }
  const protectedAdmin = user.isAdmin;
  elements.adminUserDetail.innerHTML = `
    <div class="team-admin-section-head"><div><strong>${escapeHtml(user.username)}</strong> <span class="team-status ${user.status}">${teamStatusLabel(user.status)}</span></div><span>${user.availableBalance} / ${user.balance} 积分</span></div>
    <small>注册：${escapeHtml(formatTeamTime(user.createdAt))}${user.lastLoginAt ? ` · 最近登录：${escapeHtml(formatTeamTime(user.lastLoginAt))}` : ""}</small>
    <div class="team-user-controls">
      <button class="primary-small" type="button" data-admin-status="active" ${protectedAdmin ? "disabled" : ""}>审核并启用</button>
      <button class="soft-button" type="button" data-admin-status="disabled" ${protectedAdmin ? "disabled" : ""}>停用账号</button>
      <label><span>积分调整</span><input id="adminCreditAmount" type="number" step="1" placeholder="正数增加，负数扣减"></label>
      <label><span>备注</span><input id="adminCreditNote" maxlength="200" placeholder="调整原因"></label>
      <button class="primary-small full" type="button" data-admin-credit>提交积分调整</button>
      <button class="soft-button full" type="button" data-admin-password>重置登录密码</button>
    </div>`;
}

async function handleAdminUserAction(event) {
  const userId = state.adminSelectedUserId;
  if (!userId) return;
  try {
    const statusButton = event.target.closest("[data-admin-status]");
    if (statusButton) await api(`/api/admin/users/${userId}/status`, { method: "POST", body: JSON.stringify({ status: statusButton.dataset.adminStatus }) });
    else if (event.target.closest("[data-admin-credit]")) {
      const amount = Number($("#adminCreditAmount")?.value || 0);
      if (!amount) throw new Error("请输入非零积分调整值");
      await api("/api/admin/credit", { method: "POST", body: JSON.stringify({ userId, amount, note: $("#adminCreditNote")?.value || "管理员调整" }) });
    } else if (event.target.closest("[data-admin-password]")) {
      const password = window.prompt("请输入 8–128 位新密码。重置后该用户的现有会话会全部退出：");
      if (password === null) return;
      await api(`/api/admin/users/${userId}/password`, { method: "POST", body: JSON.stringify({ password }) });
      showToast("密码已重置，旧会话已失效");
    } else return;
    await refreshCurrentUser();
    await loadAdmin();
  } catch (error) { showToast(error.message); }
}

async function renderAdminRecords() {
  if (!state.adminSelectedUserId) { elements.adminRecordList.innerHTML = ""; return; }
  elements.adminRecordList.innerHTML = '<p class="muted">正在读取…</p>';
  try {
    const data = await api(`/api/admin/users/${state.adminSelectedUserId}/${state.adminTab}`);
    const rows = data[state.adminTab] || (state.adminTab === "content" ? {} : []);
    elements.adminRecordList.innerHTML = renderTeamRecords(state.adminTab, rows);
  } catch (error) { elements.adminRecordList.innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`; }
}

function renderTeamRecords(kind, rows) {
  if (kind === "content") {
    const projects = rows.projects || [], portraits = rows.portraits || [], storage = rows.storage || {};
    return `<div class="team-account-summary"><div><span>角色项目</span><strong>${projects.length}</strong></div><div><span>写真作品</span><strong>${portraits.length}</strong></div><div><span>文件数量</span><strong>${storage.files || 0}</strong></div><div><span>占用空间</span><strong>${formatBytes(storage.bytes || 0)}</strong></div></div>
      ${projects.length ? `<h3>角色项目</h3>${projects.map((item) => `<div class="team-record-row"><time>${escapeHtml(formatTeamTime(item.updatedAt))}</time><span>${escapeHtml(item.id)}</span><strong>${escapeHtml(item.displayName)}</strong><span>${item.versions} 个版本 · ${item.assets} 个资产</span></div>`).join("")}` : '<p class="muted">暂无角色项目。</p>'}`;
  }
  if (!rows.length) return '<p class="muted">暂无记录。</p>';
  if (kind === "jobs") return rows.map((job) => `<div class="team-record-row"><time>${escapeHtml(formatTeamTime(job.createdAt))}</time><span>${escapeHtml(modeLabel(job.mode))}</span><strong>${escapeHtml(statusLabel(job.status))}</strong><span>${escapeHtml(job.model || "")} · ${job.creditCost || 0} 分 ${["succeeded", "failed"].includes(job.status) ? `<button class="soft-button" type="button" data-admin-delete-job="${escapeHtml(job.id)}">删除</button>` : ""}</span></div>`).join("");
  if (kind === "usage") return rows.map((row) => `<div class="team-record-row"><time>${escapeHtml(formatTeamTime(row.created_at))}</time><span>${escapeHtml(row.route)}</span><strong>${row.cost} 分</strong><span>${escapeHtml(row.model || "")} · ${escapeHtml(row.status || "")}</span></div>`).join("");
  return rows.map((row) => `<div class="team-record-row"><time>${escapeHtml(formatTeamTime(row.created_at))}</time><span>${escapeHtml(transactionLabel(row.type))}</span><strong class="${row.amount >= 0 ? "positive" : "negative"}">${row.amount >= 0 ? "+" : ""}${row.amount}</strong><span>余额 ${row.balance_after} · ${escapeHtml(row.description || "")}</span></div>`).join("");
}

function renderTeamSettings() {
  elements.registrationEnabled.checked = state.teamSettings?.registrationEnabled !== false;
  const labels = { imageGenerate: "图片生成", expand: "图片扩展", precise: "精确编辑", productBackground: "产品换背景", materialTransfer: "材质迁移", stickerPack: "Q版表情包", portraitStudio: "人像写真", characterStudio: "角色素材" };
  elements.teamCostGrid.innerHTML = Object.entries(labels).map(([key, label]) => `<label><span>${label}</span><input type="number" min="0" max="100000" step="1" name="${key}" value="${state.teamSettings?.costs?.[key] ?? 0}"></label>`).join("");
}

async function saveTeamSettings(event) {
  event.preventDefault();
  const form = new FormData(elements.teamSettingsForm);
  const costs = {};
  for (const key of Object.keys(state.teamSettings.costs || {})) costs[key] = Number(form.get(key) || 0);
  try {
    state.teamSettings = await api("/api/admin/team-settings", { method: "PUT", body: JSON.stringify({ registrationEnabled: elements.registrationEnabled.checked, costs }) });
    renderTeamSettings();
    renderCurrentUser();
    showToast("团队设置已保存");
  } catch (error) { showToast(error.message); }
}

function teamStatusLabel(status) { return ({ pending: "待审核", active: "已启用", disabled: "已停用" })[status] || status; }
function transactionLabel(type) { return ({ admin_credit: "管理员加分", admin_debit: "管理员扣分", spend: "生成消耗" })[type] || type; }
function formatTeamTime(value) { return value ? new Date(value).toLocaleString() : "—"; }

async function loadStatus() {
  try {
    state.backend = await api("/api/status");
    populateProviders();
    updateProviderBadge();
  } catch (error) {
    elements.providerBadge.className = "provider-badge warning";
    elements.providerBadge.querySelector("span").textContent = "本地服务异常";
    showToast(error.message);
  }
}

async function loadPortraitOptions() {
  try {
    state.portraitOptions = await api("/api/portrait-options");
    renderPortraitStyles();
    renderPortraitExpressions();
    applyPortraitStylePlaceholders();
  } catch (error) {
    showToast(`写真风格读取失败：${error.message}`);
  }
}

function populateProviders() {
  const providers = state.backend?.providers || {};
  const options = Object.entries(providers)
    .map(([id, item]) => `<option value="${escapeHtml(id)}">${escapeHtml(item.label)}${item.configured ? "" : "（未配置）"}</option>`)
    .join("");
  const expandCurrent = elements.expandProvider.value || "default";
  const imageGenerationCurrent = elements.imageGenerationProvider.value || "default";
  const preciseCurrent = elements.preciseProvider.value || "volc";
  const productBackgroundCurrent = elements.productBackgroundProvider.value || "default";
  const materialTransferCurrent = elements.materialTransferProvider.value || "default";
  const stickerPackCurrent = elements.stickerPackProvider.value || "default";
  const portraitCurrent = elements.portraitProvider.value || "default";
  elements.expandProvider.innerHTML = options;
  elements.imageGenerationProvider.innerHTML = options;
  elements.preciseProvider.innerHTML = options;
  elements.productBackgroundProvider.innerHTML = options;
  elements.materialTransferProvider.innerHTML = options;
  elements.stickerPackProvider.innerHTML = options;
  elements.portraitProvider.innerHTML = options;
  elements.expandProvider.value = providers[expandCurrent] ? expandCurrent : "default";
  elements.imageGenerationProvider.value = providers[imageGenerationCurrent] ? imageGenerationCurrent : "default";
  elements.preciseProvider.value = providers[preciseCurrent] ? preciseCurrent : (providers.volc ? "volc" : "default");
  elements.productBackgroundProvider.value = providers[productBackgroundCurrent] ? productBackgroundCurrent : "default";
  elements.materialTransferProvider.value = providers[materialTransferCurrent] ? materialTransferCurrent : "default";
  elements.stickerPackProvider.value = providers[stickerPackCurrent] ? stickerPackCurrent : "default";
  elements.portraitProvider.value = providers[portraitCurrent] ? portraitCurrent : "default";
  populateExpandModels();
  populateImageGenerationModels();
  populatePreciseModels();
  populateProductBackgroundModels();
  populateMaterialTransferModels();
  populateStickerPackModels();
  populatePortraitModels();
}

function populateImageGenerationModels() {
  const provider = state.backend?.providers?.[elements.imageGenerationProvider.value];
  const previous = elements.imageGenerationModel.value;
  elements.imageGenerationModel.innerHTML = (provider?.models || [])
    .map((model) => `<option value="${escapeHtml(model.id)}">${escapeHtml(model.label || model.id)}</option>`)
    .join("");
  elements.imageGenerationModel.value = (provider?.models || []).some((model) => model.id === previous)
    ? previous
    : (provider?.defaultModel || "");
  updateImageGenerationOptions();
}

function updateImageGenerationOptions() {
  const helper = window.ImageGeneration;
  const providerId = elements.imageGenerationProvider.value;
  const model = elements.imageGenerationModel.value;
  const seedream = providerId === "volc" || helper.isSeedreamModel(model);
  const seedreamPro = seedream && helper.isSeedreamProModel(model);
  const previousRatio = elements.imageGenerationRatio.value || "1:1";
  const previousTier = elements.imageGenerationTier.value || "2K";
  elements.imageGenerationRatio.innerHTML = helper.RATIO_OPTIONS
    .map(([id, label]) => `<option value="${id}">${escapeHtml(label)}</option>`)
    .join("");
  elements.imageGenerationRatio.value = helper.RATIO_OPTIONS.some(([id]) => id === previousRatio) ? previousRatio : "1:1";
  const tiers = seedream ? helper.SEEDREAM_TIER_OPTIONS : helper.GPT_TIER_OPTIONS;
  elements.imageGenerationTier.innerHTML = tiers.map(([id, label]) => `<option value="${id}">${label}</option>`).join("");
  elements.imageGenerationTier.value = tiers.some(([id]) => id === previousTier) ? previousTier : "2K";
  elements.imageGenerationQualityField.hidden = seedream;
  elements.imageGenerationOutputFormatField.hidden = !seedream;
  elements.imageGenerationPromptOptimizationField.hidden = !seedreamPro;
  elements.imageGenerationPromptOptimization.disabled = !seedreamPro;
  elements.imageGenerationModelNote.textContent = seedream
    ? `${state.backend?.providers?.[providerId]?.label || "火山 Seedream"} · 最多 10 张参考图`
    : `${state.backend?.providers?.[providerId]?.label || "147 图片"} · 支持文生图与参考图生图`;
  updateImageGenerationSize();
  updateProviderBadge();
}

function updateImageGenerationSize() {
  const helper = window.ImageGeneration;
  const size = helper.sizeFor(
    elements.imageGenerationModel.value,
    elements.imageGenerationRatio.value,
    elements.imageGenerationTier.value
  );
  elements.imageGenerationSize.textContent = size.replace("x", " × ");
  const seedream = elements.imageGenerationProvider.value === "volc";
  elements.imageGenerationSizeNote.textContent = seedream
    ? "Seedream 按比例与分辨率档位自动匹配有效像素尺寸"
    : "GPT Image 按比例与 1K / 2K / 4K 档位输出";
}

function populateExpandModels() {
  const provider = state.backend?.providers?.[elements.expandProvider.value];
  const previous = elements.expandModel.value;
  elements.expandModel.innerHTML = (provider?.models || []).map((model) => `<option value="${escapeHtml(model.id)}">${escapeHtml(model.label || model.id)}</option>`).join("");
  elements.expandModel.value = (provider?.models || []).some((model) => model.id === previous) ? previous : (provider?.defaultModel || "");
  updateExpandLayout();
  updateProviderBadge();
}

function populatePreciseModels() {
  const provider = state.backend?.providers?.[elements.preciseProvider.value];
  const previous = elements.preciseModel.value;
  elements.preciseModel.innerHTML = (provider?.models || [])
    .map((model) => `<option value="${escapeHtml(model.id)}">${escapeHtml(model.label || model.id)}</option>`)
    .join("");
  elements.preciseModel.value = (provider?.models || []).some((model) => model.id === previous)
    ? previous
    : (provider?.defaultModel || "");
  elements.preciseModelNote.textContent = `${provider?.label || "图片渠道"} · 最多 10 张输入图`;
  updatePreciseModelOptions();
  updateProviderBadge();
}

function updatePreciseModelOptions() {
  const seedreamSelected = elements.preciseProvider.value === "volc";
  const flashSelected = /^doubao-seedream-5-0-flash(?:-|$)/i.test(elements.preciseModel.value);
  if (flashSelected) elements.promptOptimization.value = "standard";
  elements.promptOptimization.disabled = !seedreamSelected || flashSelected;
  elements.promptOptimizationField.title = !seedreamSelected
    ? "提示词优化仅由 Seedream 渠道使用"
    : (flashSelected ? "Seedream 5.0 Flash 使用模型内置的高速优化" : "");
}

function populateProductBackgroundModels() {
  const provider = state.backend?.providers?.[elements.productBackgroundProvider.value];
  const previous = elements.productBackgroundModel.value;
  elements.productBackgroundModel.innerHTML = (provider?.models || [])
    .map((model) => `<option value="${escapeHtml(model.id)}">${escapeHtml(model.label || model.id)}</option>`)
    .join("");
  elements.productBackgroundModel.value = (provider?.models || []).some((model) => model.id === previous)
    ? previous
    : (provider?.defaultModel || "");
  updateProductBackgroundSize();
  updateProviderBadge();
}

function populateMaterialTransferModels() {
  const provider = state.backend?.providers?.[elements.materialTransferProvider.value];
  const previous = elements.materialTransferModel.value;
  elements.materialTransferModel.innerHTML = (provider?.models || [])
    .map((model) => `<option value="${escapeHtml(model.id)}">${escapeHtml(model.label || model.id)}</option>`)
    .join("");
  elements.materialTransferModel.value = (provider?.models || []).some((model) => model.id === previous)
    ? previous
    : (provider?.defaultModel || "");
  updateMaterialTransferSize();
  updateProviderBadge();
}

function populateStickerPackModels() {
  const provider = state.backend?.providers?.[elements.stickerPackProvider.value];
  const previous = elements.stickerPackModel.value;
  elements.stickerPackModel.innerHTML = (provider?.models || [])
    .map((model) => `<option value="${escapeHtml(model.id)}">${escapeHtml(model.label || model.id)}</option>`)
    .join("");
  elements.stickerPackModel.value = (provider?.models || []).some((model) => model.id === previous)
    ? previous
    : (provider?.defaultModel || "");
  updateProviderBadge();
}

function populatePortraitModels() {
  const provider = state.backend?.providers?.[elements.portraitProvider.value];
  const previous = elements.portraitModel.value;
  elements.portraitModel.innerHTML = (provider?.models || [])
    .map((model) => `<option value="${escapeHtml(model.id)}">${escapeHtml(model.label || model.id)}</option>`)
    .join("");
  elements.portraitModel.value = (provider?.models || []).some((model) => model.id === previous)
    ? previous
    : (provider?.defaultModel || "");
  elements.portraitQualityField.hidden = elements.portraitProvider.value === "volc";
  updateProviderBadge();
}

function setMode(mode) {
  if (!["imageGenerate", "expand", "precise", "productBackground", "materialTransfer", "stickerPack", "portraitStudio", "model3d", "characterStudio"].includes(mode) || state.busy) return;
  if (mode === "portraitStudio") state.studioPurpose = "portrait";
  const previousMode = state.mode;
  state.mode = mode;
  renderCurrentUser();
  const isModel3D = mode === "model3d";
  const isCharacter = mode === "characterStudio";
  const isStudio = mode === "portraitStudio" || isCharacter;
  document.body.classList.toggle("portrait-creation-active", isStudio);
  window.GuguImageEdit = Object.assign(window.GuguImageEdit || {}, { studioPurpose: state.studioPurpose });
  elements.portraitCreationHub.hidden = !isStudio;
  elements.studioPersonRow.hidden = mode !== "portraitStudio";
  elements.studioLibrary.hidden = mode !== "portraitStudio";
  elements.studioPurposeButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.studioPurpose === state.studioPurpose)));
  document.getElementById("characterStudioWorkspace").hidden = !isCharacter;
  elements.standardWorkspace.hidden = isModel3D || isCharacter;
  elements.stepStrip.hidden = isModel3D || isStudio;
  elements.model3dWorkspace.hidden = !isModel3D;
  elements.resultCard.hidden = isModel3D;
  if (isModel3D) { elements.portraitSeriesCard.hidden = true; elements.jobPanel.hidden = true; }
  $(".workspace").classList.toggle("portrait-workspace", mode === "portraitStudio");
  $(".workspace").classList.toggle("sticker-workspace", mode === "stickerPack");
  $(".workspace").classList.toggle("image-generation-workspace", mode === "imageGenerate");
  state.base = currentWorkspace().base;
  elements.modeButtons.forEach((button) => button.classList.toggle("active", button.dataset.mode === mode || (isCharacter && button.dataset.mode === "portraitStudio")));
  if (isStudio) void refreshStudioPeople();
  if (isCharacter) {
    elements.resultCard.hidden = true;
    elements.portraitSeriesCard.hidden = true;
    elements.jobPanel.hidden = true;
    elements.providerBadge.querySelector("span").textContent = "角色项目 · 两种渠道";
    import("/character-studio/studio.js?v=11").then(module => {
      module.mount(document.getElementById("characterStudioRoot"));
      window.dispatchEvent(new CustomEvent("gugu-studio-purpose", { detail: { purpose: state.studioPurpose } }));
    }).catch(error => showToast(`人物模块加载失败：${error.message}`));
    window.dispatchEvent(new CustomEvent("gugu-mode-change", { detail: { mode, previousMode } }));
    return;
  }
  if (isModel3D) {
    updateProviderBadge();
    window.dispatchEvent(new CustomEvent("gugu-mode-change", { detail: { mode, previousMode } }));
    return;
  }
  $$(".image-generation-only").forEach((element) => { element.hidden = mode !== "imageGenerate"; });
  $$(".expand-only").forEach((element) => { element.hidden = mode !== "expand"; });
  $$(".precise-only").forEach((element) => { element.hidden = mode !== "precise"; });
  $$(".product-background-only").forEach((element) => { element.hidden = mode !== "productBackground"; });
  $$(".material-transfer-only").forEach((element) => { element.hidden = mode !== "materialTransfer"; });
  $$(".sticker-pack-only").forEach((element) => { element.hidden = mode !== "stickerPack"; });
  $$(".portrait-studio-only").forEach((element) => { element.hidden = mode !== "portraitStudio"; });
  elements.settingsTitle.textContent = ({
    imageGenerate: "图片生成参数",
    expand: "扩展参数",
    precise: "精确编辑参数",
    productBackground: "产品换背景参数",
    materialTransfer: "材质迁移参数",
    stickerPack: "Q版表情包参数",
    portraitStudio: "写真生成参数"
  })[mode];
  elements.uploadModeLabel.textContent = ({
    expand: "上传用于图片扩展的原图",
    precise: "上传需要精确编辑的原图",
    stickerPack: "上传人物或宠物照片",
    portraitStudio: "上传 1–4 张成年人物参考图"
  })[mode] || "上传图片";
  elements.uploadModeHelp.textContent = mode === "stickerPack"
    ? "上传一张清晰的人物或宠物照片；一次生成 6、9 或 12 张完整宫格"
    : (mode === "portraitStudio"
      ? "先选择一张清晰、无遮挡的成年人物照片；进入设置后可再添加 3 张身份参考"
      : "拖入图片，或点击选择；推荐 PNG、JPEG、WebP，单张不超过 30MB");
  elements.uploadZone.setAttribute("aria-label", ({
    expand: "上传图片扩展原图",
    precise: "上传精确编辑原图",
    stickerPack: "上传表情包人物或宠物照片",
    portraitStudio: "上传写真身份主参考图"
  })[mode] || "上传图片");
  if (mode !== "portraitStudio") elements.portraitSeriesCard.hidden = true;
  updateGenerateButtonLabel();
  renderActiveWorkspace();
  updateProviderBadge();
  window.dispatchEvent(new CustomEvent("gugu-mode-change", { detail: { mode, previousMode } }));
}

function setStudioPurpose(purpose) {
  if (!['portrait', 'model-card', 'assets'].includes(purpose) || state.busy) return;
  state.studioPurpose = purpose;
  setMode(purpose === 'portrait' ? 'portraitStudio' : 'characterStudio');
}

async function refreshStudioPeople() {
  try {
    const projects = await api('/api/character/projects');
    const previous = state.studioPerson ? `${state.studioPerson.projectId}|${state.studioPerson.versionId}` : elements.studioPersonSelect.value;
    elements.studioPersonSelect.replaceChildren(new Option('直接上传照片', ''));
    for (const project of projects) {
      for (const version of project.versions || []) {
        if (version.status !== 'locked') continue;
        const face = (project.assets || []).find((asset) => asset.versionId === version.id && asset.role === 'face-front' && asset.status === 'ready');
        if (!face) continue;
        const option = new Option(`${project.displayName} · ${version.id}`, `${project.id}|${version.id}`);
        option.dataset.assetId = face.id;
        elements.studioPersonSelect.add(option);
      }
    }
    if (Array.from(elements.studioPersonSelect.options).some((option) => option.value === previous)) elements.studioPersonSelect.value = previous;
    elements.studioUsePersonButton.disabled = !elements.studioPersonSelect.value;
  } catch (error) {
    elements.studioPersonSelect.replaceChildren(new Option('人物列表读取失败', ''));
    elements.studioUsePersonButton.disabled = true;
  }
  if (elements.studioLibrary.open) void renderStudioLibrary();
}

async function useSelectedStudioPerson() {
  const option = elements.studioPersonSelect.selectedOptions[0];
  if (!option?.value || !option.dataset.assetId || state.busy) return;
  const [projectId, versionId] = option.value.split('|');
  try {
    const response = await fetch(`/api/character/projects/${encodeURIComponent(projectId)}/assets/${encodeURIComponent(option.dataset.assetId)}`);
    if (!response.ok) throw new Error('人物标准图读取失败');
    const blob = await response.blob();
    const loaded = await loadBaseFile(new File([blob], `${option.textContent}.png`, { type: blob.type || 'image/png' }));
    if (!loaded) return;
    state.studioPerson = { projectId, versionId };
    updateStudioSaveButton();
    showToast(`已使用 ${option.textContent}，请选择写真风格`);
  } catch (error) { showToast(friendlyError(error)); }
}

function updateStudioSaveButton() {
  const jobs = Object.values(state.workspaces.portraitStudio.seriesResults || {}).filter((job) => job?.status === 'succeeded' && job?.result);
  elements.studioSavePortraitButton.hidden = state.mode !== 'portraitStudio' || !state.studioPerson || jobs.length === 0;
  elements.studioSavePortraitButton.textContent = jobs.length > 1 ? `保存 ${jobs.length} 张成片到人物` : '保存成片到人物';
}

async function savePortraitToPerson() {
  const person = state.studioPerson;
  if (!person || state.busy) return;
  const jobIds = Object.values(state.workspaces.portraitStudio.seriesResults || {}).filter((job) => job?.status === 'succeeded' && job?.result).map((job) => job.id);
  if (!jobIds.length) return;
  elements.studioSavePortraitButton.disabled = true;
  try {
    const saved = await api('/api/studio/portraits', { method: 'POST', body: JSON.stringify({ ...person, jobIds }) });
    showToast(saved.created.length ? `已保存 ${saved.created.length} 张写真到人物` : '这些写真已保存到人物');
    elements.studioLibrary.open = true;
    await renderStudioLibrary();
  } catch (error) { showToast(friendlyError(error)); }
  finally { elements.studioSavePortraitButton.disabled = false; }
}

async function renderStudioLibrary() {
  try {
    const { items } = await api('/api/studio/portraits');
    elements.studioLibraryCount.textContent = `(${items.length})`;
    elements.studioLibraryGrid.innerHTML = items.length ? items.map((item) => `<div class="portrait-creation-library-item"><a href="${item.imageUrl}" target="_blank" rel="noopener" title="打开写真原图"><img src="${item.imageUrl}" alt="${escapeHtml(item.displayName)} ${escapeHtml(portraitShotLabel(item.shotId))}" loading="lazy"><span>${escapeHtml(item.displayName)} · ${escapeHtml(item.versionId)}<br>${escapeHtml(portraitShotLabel(item.shotId))}</span></a><a class="portrait-creation-library-download" href="${item.imageUrl}" download="${escapeHtml(item.displayName)}-${escapeHtml(item.versionId)}-${escapeHtml(item.shotId)}.png">下载成片</a></div>`).join('') : '<p>尚无保存到人物的写真。拍好后点击“保存成片到人物”。</p>';
  } catch (error) { elements.studioLibraryGrid.innerHTML = `<p>${escapeHtml(friendlyError(error))}</p>`; }
}

function currentWorkspace() {
  return state.workspaces[state.mode];
}

function renderActiveWorkspace() {
  const base = state.base;
  elements.resultCard.hidden = true;
  elements.jobPanel.hidden = true;
  elements.replaceImageButton.hidden = state.mode === "imageGenerate";
  elements.resetEditButton.textContent = state.mode === "imageGenerate" ? "重置创作" : "重置编辑";
  if (state.mode === "imageGenerate") {
    renderImageGenerationWorkspace();
    return;
  }
  if (state.mode === "productBackground") {
    renderProductBackgroundWorkspace();
    return;
  }
  if (state.mode === "materialTransfer") {
    renderMaterialTransferWorkspace();
    return;
  }
  elements.productBackgroundUploader.hidden = true;
  elements.materialTransferUploader.hidden = true;
  elements.portraitSeriesCard.hidden = state.mode !== "portraitStudio" || Object.keys(currentWorkspace().seriesResults || {}).length === 0;
  elements.emptySettingsText.textContent = "上传图片后即可设置参数";
  if (!base) {
    elements.uploadZone.hidden = false;
    elements.editStageShell.hidden = true;
    elements.emptySettings.hidden = false;
    elements.editForm.hidden = true;
    elements.fileMeta.hidden = true;
    elements.editorEyebrow.textContent = "STEP 1 · 上传图片";
    elements.editorTitle.textContent = ({
      expand: "选择一张需要扩展的图片",
      precise: "选择一张需要精确编辑的图片",
      stickerPack: "选择一张清晰的人物或宠物照片",
      portraitStudio: "选择成年人物的身份主参考图"
    })[state.mode];
    setStep(1);
    return;
  }

  elements.uploadZone.hidden = true;
  elements.editStageShell.hidden = false;
  elements.emptySettings.hidden = true;
  elements.editForm.hidden = false;
  elements.fileMeta.hidden = false;
  elements.fileMeta.textContent = `${base.name} · ${base.width}×${base.height} · ${formatBytes(base.bytes)}`;
  elements.editorEyebrow.textContent = "STEP 2 · 编辑设置";
  elements.editorTitle.textContent = ({
    expand: "拖动边框设置扩展范围",
    precise: "在图片上标记需要修改的位置",
    stickerPack: "设置表情文字并生成完整宫格",
    portraitStudio: "选择写真风格并锁定人物身份"
  })[state.mode];
  if (state.mode === "expand") {
    elements.expandImage.src = base.dataUrl;
    requestAnimationFrame(updateExpandLayout);
  } else if (state.mode === "precise") {
    drawAnnotationCanvas();
  } else if (state.mode === "stickerPack") {
    elements.stickerPackImage.src = base.dataUrl;
    renderStickerCaptionFields();
    updateStickerPackSize();
    updateStickerCaptionMode();
  } else if (state.mode === "portraitStudio") {
    renderPortraitWorkspace();
    updatePortraitRecommendations();
  }
  setStep(2);
}

function renderImageGenerationWorkspace() {
  const workspace = currentWorkspace();
  elements.uploadZone.hidden = true;
  elements.productBackgroundUploader.hidden = true;
  elements.materialTransferUploader.hidden = true;
  elements.editStageShell.hidden = false;
  elements.emptySettings.hidden = true;
  elements.editForm.hidden = false;
  elements.fileMeta.hidden = workspace.references.length === 0;
  elements.fileMeta.textContent = workspace.references.length ? `已添加 ${workspace.references.length} 张参考图` : "";
  elements.editorEyebrow.textContent = "STEP 2 · 创意设置";
  elements.editorTitle.textContent = "描述画面并按需添加参考图";
  renderImageGenerationReferences();
  updateImageGenerationPromptCount();
  updateImageGenerationOptions();
  updateImageGenerationModeNote();
  setStep(2);
}

async function addImageGenerationReferenceFiles(fileList) {
  try {
    const workspace = currentWorkspace();
    const files = Array.from(fileList || []);
    window.ImageGeneration.validateReferenceCount(workspace.references.length + files.length);
    for (const file of files) {
      validateImageFile(file);
      workspace.references.push({ file, name: file.name, dataUrl: await fileToDataUrl(file) });
    }
    elements.imageGenerationReferenceInput.value = "";
    renderImageGenerationReferences();
    updateImageGenerationModeNote();
  } catch (error) {
    elements.imageGenerationReferenceInput.value = "";
    showToast(error.message);
  }
}

function renderImageGenerationReferences() {
  const references = currentWorkspace().references || [];
  elements.imageGenerationReferenceGrid.innerHTML = references.length
    ? references.map((item, index) => `
      <article class="generation-reference-card">
        <span class="generation-reference-index">图片 ${index + 1}</span>
        <button type="button" data-generation-reference-remove="${index}" aria-label="移除图片 ${index + 1}">×</button>
        <img src="${item.dataUrl}" alt="参考图片 ${index + 1}" title="点击插入 @图片${index + 1}" data-generation-reference-insert="${index + 1}">
        <small>${escapeHtml(item.name || item.file?.name || `参考图 ${index + 1}`)}</small>
      </article>`).join("")
    : `<div class="generation-reference-empty"><span>◇</span><strong>无需参考图也能直接生成</strong><small>添加人物、产品、风格或构图参考后，模型会结合文字理解</small></div>`;
  elements.imageGenerationAddReferenceButton.disabled = state.busy || references.length >= 10;
  elements.fileMeta.hidden = references.length === 0;
  elements.fileMeta.textContent = references.length ? `已添加 ${references.length} 张参考图` : "";
}

function insertImageGenerationMention(index) {
  const textarea = elements.imageGenerationPrompt;
  const mention = `@图片${index}`;
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? start;
  const prefix = start > 0 && !/\s$/.test(textarea.value.slice(0, start)) ? " " : "";
  const suffix = end < textarea.value.length && !/^\s/.test(textarea.value.slice(end)) ? " " : "";
  textarea.setRangeText(`${prefix}${mention}${suffix}`, start, end, "end");
  textarea.focus();
  updateImageGenerationPromptCount();
}

function updateImageGenerationPromptCount() {
  elements.imageGenerationPromptCount.textContent = `${elements.imageGenerationPrompt.value.length} / 5000`;
}

function updateImageGenerationModeNote() {
  const count = currentWorkspace().references?.length || 0;
  elements.imageGenerationModeTitle.textContent = count ? `参考图生成 · ${count} 张输入` : "文字生成图片";
  elements.imageGenerationModeHelp.textContent = count
    ? "系统会按图片编号把参考图与描述一起提交；点击缩略图可插入对应编号。"
    : "不上传参考图时直接按描述生成；加入参考图后自动切换为多图参考生成。";
  updateGenerateButtonLabel();
}

function renderProductBackgroundWorkspace() {
  const workspace = currentWorkspace();
  const product = workspace.base;
  const background = workspace.background;
  const ready = Boolean(product && background);
  elements.uploadZone.hidden = true;
  elements.editStageShell.hidden = true;
  elements.materialTransferUploader.hidden = true;
  elements.productBackgroundUploader.hidden = false;
  elements.emptySettings.hidden = ready;
  elements.editForm.hidden = !ready;
  elements.fileMeta.hidden = !product && !background;
  elements.fileMeta.textContent = [
    product ? `产品 ${product.width}×${product.height}` : "产品待上传",
    background ? `背景 ${background.width}×${background.height}` : "背景待上传"
  ].join(" · ");

  renderProductBackgroundSlot(product, elements.productImagePreview, elements.productUploadPlaceholder, elements.productFileSummary, "上传产品原图，保留外观、文字与材质");
  renderProductBackgroundSlot(background, elements.backgroundImagePreview, elements.backgroundUploadPlaceholder, elements.backgroundFileSummary, "上传目标场景，作为环境与光照依据");

  elements.emptySettingsText.textContent = !product
    ? "请先上传产品图和背景图"
    : (!background ? "还需要上传背景图" : "两张图片已准备完成");
  elements.editorEyebrow.textContent = ready ? "STEP 2 · 编辑设置" : "STEP 1 · 上传图片";
  elements.editorTitle.textContent = ready
    ? "确认产品与目标背景"
    : (!product && !background ? "分别上传产品图和背景图" : (!product ? "还需要上传产品图" : "还需要上传背景图"));
  updateProductBackgroundSize();
  setStep(ready ? 2 : 1);
}

function renderMaterialTransferWorkspace() {
  const workspace = currentWorkspace();
  const structure = workspace.base;
  const material = workspace.material;
  const ready = Boolean(structure && material);
  elements.uploadZone.hidden = true;
  elements.editStageShell.hidden = true;
  elements.productBackgroundUploader.hidden = true;
  elements.materialTransferUploader.hidden = false;
  elements.emptySettings.hidden = ready;
  elements.editForm.hidden = !ready;
  elements.fileMeta.hidden = !structure && !material;
  elements.fileMeta.textContent = [
    structure ? `结构 ${structure.width}×${structure.height}` : "结构待上传",
    material ? `材质 ${material.width}×${material.height}` : "材质待上传"
  ].join(" · ");

  renderDualImageSlot(structure, elements.materialStructurePreview, elements.materialStructurePlaceholder, elements.materialStructureSummary, "锁定主体、形体、视角、细节与背景");
  renderDualImageSlot(material, elements.materialReferencePreview, elements.materialReferencePlaceholder, elements.materialReferenceSummary, "只提取颜色、纹理、光泽、反射与透光属性");

  elements.emptySettingsText.textContent = !structure
    ? "请先上传主体 / 结构图和材质参考图"
    : (!material ? "还需要上传材质参考图" : "两张图片已准备完成");
  elements.editorEyebrow.textContent = ready ? "STEP 2 · 编辑设置" : "STEP 1 · 上传图片";
  elements.editorTitle.textContent = ready
    ? "确认结构母版与材质样本"
    : (!structure && !material ? "分别上传主体图和材质参考图" : (!structure ? "还需要上传主体 / 结构图" : "还需要上传材质参考图"));
  updateMaterialTransferSize();
  setStep(ready ? 2 : 1);
}

function renderProductBackgroundSlot(item, preview, placeholder, summary, emptyText) {
  renderDualImageSlot(item, preview, placeholder, summary, emptyText);
}

function renderDualImageSlot(item, preview, placeholder, summary, emptyText) {
  preview.hidden = !item;
  placeholder.hidden = Boolean(item);
  if (item) {
    preview.src = item.dataUrl;
    summary.textContent = `${item.name} · ${item.width}×${item.height} · ${formatBytes(item.bytes)}`;
  } else {
    preview.removeAttribute("src");
    summary.textContent = emptyText;
  }
}

function renderPortraitWorkspace() {
  if (state.mode !== "portraitStudio") return;
  const workspace = currentWorkspace();
  if (!workspace.base) return;
  elements.portraitStudioImage.src = workspace.base.dataUrl;
  elements.portraitReferenceRail.innerHTML = [workspace.base, ...(workspace.references || [])].map((item, index) => `
    <div class="portrait-reference-thumb">
      <img src="${item.dataUrl}" alt="写真参考图 ${index + 1}">
      <span>${String(index + 1).padStart(2, "0")}${index === 0 ? " · 主参考" : " · 补充"}</span>
      ${index ? `<button type="button" data-portrait-reference-remove="${index - 1}" aria-label="移除写真参考图 ${index + 1}">×</button>` : ""}
    </div>`).join("");
  const metrics = workspace.metrics;
  elements.portraitPhotoAnalysis.textContent = metrics
    ? `${metrics.width}×${metrics.height} · ${metrics.orientationLabel} · ${metrics.brightnessLabel}${metrics.warning ? ` · ${metrics.warning}` : ""} · 共 ${1 + workspace.references.length} 张参考图`
    : `正在分析照片 · 共 ${1 + workspace.references.length} 张参考图`;
  elements.portraitAddReferenceButton.disabled = workspace.references.length >= 3 || state.busy;
  renderPortraitSeries();
}

function analyzePortraitPhoto(item) {
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 64 / Math.max(item.width, item.height));
  canvas.width = Math.max(1, Math.round(item.width * scale));
  canvas.height = Math.max(1, Math.round(item.height * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(item.image, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let total = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    total += 0.2126 * pixels[index] / 255 + 0.7152 * pixels[index + 1] / 255 + 0.0722 * pixels[index + 2] / 255;
  }
  const luminance = total / Math.max(1, pixels.length / 4);
  const aspect = item.width / item.height;
  const orientation = aspect >= .95 && aspect <= 1.05 ? "square" : (aspect < 1 ? "portrait" : "landscape");
  const brightness = luminance < .35 ? "dark" : (luminance >= .68 ? "bright" : "neutral");
  return {
    width: item.width, height: item.height, orientation, brightness, luminance,
    orientationLabel: { portrait: "竖幅", landscape: "横幅", square: "方形" }[orientation],
    brightnessLabel: { dark: "偏暗", neutral: "亮度正常", bright: "明亮" }[brightness],
    warning: item.width < 512 || item.height < 512 ? "分辨率较低，可能影响身份细节" : ""
  };
}

async function addPortraitReferenceFiles(fileList) {
  if (state.mode !== "portraitStudio") return;
  const workspace = currentWorkspace();
  const available = 3 - workspace.references.length;
  const files = Array.from(fileList || []).filter((file) => String(file.type || "").startsWith("image/")).slice(0, available);
  if (!files.length) return;
  try {
    for (const file of files) {
      validateImageFile(file);
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("写真参考图仅支持 PNG、JPEG 或 WebP");
      const dataUrl = await fileToDataUrl(file);
      const image = await loadImage(dataUrl);
      workspace.references.push({ file, dataUrl, image, width: image.naturalWidth, height: image.naturalHeight, name: file.name, mime: file.type, bytes: file.size });
    }
    elements.portraitReferenceInput.value = "";
    workspace.seriesResults = {};
    renderPortraitWorkspace();
    updatePortraitRecommendations();
  } catch (error) {
    showToast(error.message);
  }
}

function renderPortraitStyles() {
  const styles = state.portraitOptions?.styles || [];
  $("#portraitSelectedStyle").textContent = styles.find((item) => item.id === state.portraitStyleId)?.title || "请选择风格";
  elements.portraitStyleGrid.innerHTML = styles.map((style) => `
    <button class="portrait-style-card ${style.id === state.portraitStyleId ? "active" : ""}" type="button" data-portrait-style="${escapeHtml(style.id)}" aria-pressed="${style.id === state.portraitStyleId}" title="${escapeHtml(style.summary)}">
      <span class="portrait-style-preview" data-preview-column="${style.preview.column}" data-preview-row="${style.preview.row}" role="img" aria-label="${escapeHtml(style.title)}风格预览"></span>
      <span><strong>${escapeHtml(style.title)}</strong><small>${style.family === "photo" ? "摄影方向" : "艺术方向"}</small></span>
    </button>`).join("");
}

function renderPortraitExpressions() {
  const expressions = state.portraitOptions?.expressions || [];
  elements.portraitExpressionGrid.innerHTML = expressions.map((item) => `
    <button class="${item.id === state.portraitExpressionId ? "active" : ""}" type="button" data-portrait-expression="${escapeHtml(item.id)}" title="${escapeHtml(item.phrase)}">${escapeHtml(item.label)}</button>`).join("");
}

function selectPortraitStyle(id) {
  if (!id || !(state.portraitOptions?.styles || []).some((item) => item.id === id)) return;
  state.portraitStyleId = id;
  currentWorkspace().seriesResults = {};
  renderPortraitStyles();
  updatePortraitRecommendations();
  applyPortraitStylePlaceholders();
  renderPortraitSeries();
}

function applyPortraitStylePlaceholders() {
  const selected = (state.portraitOptions?.styles || []).find((item) => item.id === state.portraitStyleId);
  if (!selected) return;
  elements.portraitScene.placeholder = selected.slots.scene;
  elements.portraitCamera.placeholder = selected.slots.camera;
  elements.portraitWardrobe.placeholder = selected.slots.wardrobe;
  elements.portraitAction.placeholder = selected.slots.action;
  elements.portraitLighting.placeholder = selected.slots.lighting;
}

function updatePortraitRecommendations() {
  const workspace = state.workspaces.portraitStudio;
  const metrics = workspace.metrics;
  const styles = state.portraitOptions?.styles || [];
  if (!metrics || !styles.length) {
    elements.portraitRecommendations.innerHTML = '<span class="muted">上传主参考图后显示推荐。</span>';
    return;
  }
  const input = {
    usage: elements.portraitUsage.value,
    mood: elements.portraitMood.value,
    intensity: elements.portraitIntensity.value,
    orientation: metrics.orientation,
    brightness: metrics.brightness
  };
  const ranked = styles.map((style) => {
    let score = 0;
    const reasons = [];
    for (const [field, value, weight, reason] of style.matchRules || []) {
      if (input[field] === value) { score += Number(weight) || 0; reasons.push(reason); }
    }
    if (input.intensity === "light" && style.family === "art") score -= 100;
    if (1 + workspace.references.length === 1 && style.family === "photo") { score += 2; reasons.push("单张参考优先身份更稳定的摄影方向"); }
    if (1 + workspace.references.length >= 3 && style.family === "art") { score += 1; reasons.push("多张参考提供更多身份锚点"); }
    return { style, score, reason: reasons[0] || style.summary };
  }).sort((a, b) => b.score - a.score || a.style.id.localeCompare(b.style.id)).slice(0, 3);
  elements.portraitRecommendations.innerHTML = ranked.map(({ style, reason }, index) => `
    <button class="portrait-recommendation ${style.id === state.portraitStyleId ? "active" : ""}" type="button" data-portrait-style="${escapeHtml(style.id)}">
      <strong>0${index + 1} · ${escapeHtml(style.title)}</strong><small>${escapeHtml(reason)}</small>
    </button>`).join("");
}

function selectPortraitSettingsTab(name) {
  if (!["style", "expression", "output"].includes(name)) return;
  $$("[data-portrait-tab]").forEach((button) => {
    const active = button.dataset.portraitTab === name;
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });
  $$("[data-portrait-panel]").forEach((panel) => { panel.hidden = panel.dataset.portraitPanel !== name; });
  $(".portrait-settings-body").scrollTop = 0;
}

function portraitSettings(shotId, directedInstruction = "") {
  const selectedStyle = (state.portraitOptions?.styles || []).find((item) => item.id === state.portraitStyleId);
  if (!selectedStyle) throw new Error("请先选择写真风格");
  if (!elements.portraitAdultConsent.checked || !elements.portraitRightsConsent.checked) {
    selectPortraitSettingsTab("output");
    const missing = !elements.portraitAdultConsent.checked ? elements.portraitAdultConsent : elements.portraitRightsConsent;
    missing.focus();
    throw new Error(!elements.portraitAdultConsent.checked ? "请确认照片中的人物均为成年人" : "请确认这是本人或已获得肖像使用授权");
  }
  const settingsSignature = portraitSettingsSignature();
  return {
    styleId: selectedStyle.id,
    styleVersion: selectedStyle.version,
    shotId,
    ratio: elements.portraitRatio.value,
    resolution: elements.portraitResolution.value,
    quality: elements.portraitProvider.value === "volc" ? "medium" : elements.portraitQuality.value,
    expression: { id: state.portraitExpressionId, intensity: state.portraitExpressionIntensity },
    questionnaire: { usage: elements.portraitUsage.value, mood: elements.portraitMood.value, intensity: elements.portraitIntensity.value },
    extra: elements.portraitExtra.value,
    directedInstruction,
    overrides: {
      scene: elements.portraitScene.value, camera: elements.portraitCamera.value,
      wardrobe: elements.portraitWardrobe.value, action: elements.portraitAction.value, lighting: elements.portraitLighting.value
    },
    adultConsent: true,
    rightsConsent: true,
    saveSource: elements.portraitSaveSource.checked,
    seriesId: currentWorkspace().seriesId,
    settingsSignature
  };
}

function portraitSettingsSignature() {
  const value = JSON.stringify({
    providerId: elements.portraitProvider.value,
    model: elements.portraitModel.value,
    styleId: state.portraitStyleId,
    expressionId: state.portraitExpressionId,
    expressionIntensity: state.portraitExpressionIntensity,
    usage: elements.portraitUsage.value,
    mood: elements.portraitMood.value,
    intensity: elements.portraitIntensity.value,
    ratio: elements.portraitRatio.value,
    resolution: elements.portraitResolution.value,
    quality: elements.portraitProvider.value === "volc" ? "medium" : elements.portraitQuality.value,
    extra: elements.portraitExtra.value,
    scene: elements.portraitScene.value,
    camera: elements.portraitCamera.value,
    wardrobe: elements.portraitWardrobe.value,
    action: elements.portraitAction.value,
    lighting: elements.portraitLighting.value,
    referenceNames: (state.workspaces.portraitStudio.references || []).map((item) => `${item.name}:${item.bytes}`)
  });
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `v1-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

async function loadBaseFile(file) {
  if (!file) return;
  try {
    validateImageFile(file);
    if (state.mode === "portraitStudio" && !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      throw new Error("拍写真仅支持 PNG、JPEG 或 WebP 图片");
    }
    const dataUrl = await fileToDataUrl(file);
    const image = await loadImage(dataUrl);
    const base = {
      file,
      dataUrl,
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      name: file.name,
      mime: file.type,
      bytes: file.size
    };
    const workspace = currentWorkspace();
    workspace.base = base;
    workspace.comparisonOriginal = "";
    workspace.lastResult = null;
    state.base = base;
    if (state.mode === "precise") {
      state.marks = [];
      state.undoStack = [];
      state.references = [];
    } else if (state.mode === "portraitStudio") {
      workspace.references = [];
      workspace.metrics = analyzePortraitPhoto(base);
      workspace.seriesId = crypto.randomUUID();
      workspace.seriesResults = {};
      elements.portraitAdultConsent.checked = false;
      elements.portraitRightsConsent.checked = false;
    }
    elements.imageInput.value = "";
    elements.precisePrompt.value ||= "按照标记位置精确编辑图片，使修改自然融入原画面。";
    if (state.mode === "precise") {
      syncPreciseSizeToImage();
      renderReferences();
    } else if (state.mode === "portraitStudio") {
      updatePortraitRecommendations();
    }
    renderActiveWorkspace();
    return true;
  } catch (error) {
    showToast(error.message);
    return false;
  }
}

async function loadProductBackgroundFile(role, file) {
  if (!file || state.mode !== "productBackground") return;
  try {
    validateImageFile(file);
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      throw new Error("产品换背景仅支持 PNG、JPEG 或 WebP 图片");
    }
    const dataUrl = await fileToDataUrl(file);
    const image = await loadImage(dataUrl);
    const item = {
      file,
      dataUrl,
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      name: file.name,
      mime: file.type,
      bytes: file.size
    };
    const workspace = currentWorkspace();
    if (role === "background") workspace.background = item;
    else {
      workspace.base = item;
      state.base = item;
    }
    workspace.comparisonOriginal = "";
    workspace.lastResult = null;
    elements.productImageInput.value = "";
    elements.backgroundImageInput.value = "";
    renderActiveWorkspace();
  } catch (error) {
    showToast(error.message);
  }
}

async function loadMaterialTransferFile(role, file) {
  if (!file || state.mode !== "materialTransfer") return;
  try {
    validateImageFile(file);
    const dataUrl = await fileToDataUrl(file);
    const image = await loadImage(dataUrl);
    const item = {
      file,
      dataUrl,
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      name: file.name,
      mime: file.type,
      bytes: file.size
    };
    const workspace = currentWorkspace();
    if (role === "material") workspace.material = item;
    else {
      workspace.base = item;
      state.base = item;
    }
    workspace.comparisonOriginal = "";
    workspace.lastResult = null;
    elements.materialStructureInput.value = "";
    elements.materialReferenceInput.value = "";
    renderActiveWorkspace();
  } catch (error) {
    showToast(error.message);
  }
}

function productBackgroundOutputSize() {
  const workspace = state.workspaces.productBackground;
  const source = elements.productBackgroundAspectSource.value === "background" ? workspace.background : workspace.base;
  if (!source) return "2048x2048";
  return window.ProductBackground.nearestSizeForAspect(source.width, source.height, preciseSizes, "2048x2048");
}

function updateProductBackgroundSize() {
  if (!elements.productBackgroundSize) return;
  const size = productBackgroundOutputSize();
  const label = elements.productBackgroundAspectSource.value === "background" ? "背景图" : "产品图";
  elements.productBackgroundSize.textContent = `${size.replace("x", " × ")} · 跟随${label}`;
}

function materialTransferOutputSize() {
  const structure = state.workspaces.materialTransfer.base;
  if (!structure) return "2048x2048";
  return window.MaterialTransfer.nearestSizeForAspect(structure.width, structure.height, preciseSizes, "2048x2048");
}

function updateMaterialTransferSize() {
  if (!elements.materialTransferSize) return;
  const size = materialTransferOutputSize();
  elements.materialTransferSize.textContent = `${size.replace("x", " × ")} · 跟随主体图`;
}

function stickerPackOutputSize() {
  return window.StickerPack.packForCount(elements.stickerPackCount.value).size;
}

function updateStickerPackSize() {
  const pack = window.StickerPack.packForCount(elements.stickerPackCount.value);
  elements.stickerPackSize.textContent = `${pack.columns}×${pack.rows} · ${pack.size.replace("x", " × ")}`;
}

function readStickerCaptions() {
  return $$("input[data-sticker-caption]", elements.stickerCaptionFields).map((input) => input.value);
}

function selectedStickerCaptionMode() {
  return elements.stickerCaptionModeInputs.find((input) => input.checked)?.value === "random" ? "random" : "custom";
}

function updateStickerCaptionMode() {
  const randomMode = selectedStickerCaptionMode() === "random";
  elements.stickerCustomCaptionEditor.hidden = randomMode;
  elements.stickerRandomCaptionNote.hidden = !randomMode;
  $$("input[data-sticker-caption]", elements.stickerCaptionFields).forEach((input) => { input.disabled = randomMode; });
  updateGenerateButtonLabel();
}

function selectStickerSettingsTab(name) {
  if (!["grid", "captions", "details"].includes(name)) return;
  $$("[data-sticker-tab]").forEach((button) => {
    const active = button.dataset.stickerTab === name;
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });
  $$("[data-sticker-panel]").forEach((panel) => { panel.hidden = panel.dataset.stickerPanel !== name; });
  $(".sticker-settings-body").scrollTop = 0;
}

function renderStickerCaptionFields() {
  const count = window.StickerPack.normalizeCount(elements.stickerPackCount.value);
  const existing = readStickerCaptions();
  const captions = window.StickerPack.normalizeCaptions(existing, count);
  elements.stickerCaptionFields.innerHTML = captions.map((caption, index) => `
    <label class="sticker-caption-field">
      <span>${String(index + 1).padStart(2, "0")}</span>
      <input type="text" maxlength="12" value="${escapeHtml(caption)}" data-sticker-caption="${index}" aria-label="第 ${index + 1} 个表情文字">
    </label>`).join("");
}

function updateGenerateButtonLabel() {
  const label = state.mode === "imageGenerate"
    ? "生成图片"
    : state.mode === "productBackground"
    ? "更换背景"
    : (state.mode === "materialTransfer" ? "迁移材质" : (state.mode === "stickerPack" ? "生成表情包" : (state.mode === "portraitStudio" ? "生成写真预览" : "生成图片")));
  elements.generateButton.querySelector("span").textContent = label;
  elements.generateButton.querySelector("small").textContent = ({
    imageGenerate: currentWorkspace().references?.length ? "结合文字与参考图生成，仅调用一次接口" : "按文字描述从零生成，仅调用一次接口",
    productBackground: "产品图在前，背景图在后",
    materialTransfer: "主体图在前，材质参考在后",
    stickerPack: selectedStickerCaptionMode() === "random"
      ? "AI 看图随机配梗，一次生成完整宫格"
      : "一次生成完整宫格，仅调用一次接口",
    portraitStudio: "先付费生成 1 张主肖像，满意后再扩展系列"
  })[state.mode] || "提交后请勿重复点击";
}

function validateImageFile(file) {
  if (!String(file.type || "").startsWith("image/")) throw new Error("请选择图片文件");
  if (file.size > 30 * 1024 * 1024) throw new Error("单张图片不能超过 30MB");
  if (!file.size) throw new Error("图片文件为空");
}

function firstImageFile(fileList) {
  return Array.from(fileList || []).find((file) => String(file.type || "").startsWith("image/"));
}

function syncPreciseSizeToImage() {
  if (!state.base) return;
  const targetAspect = state.base.width / state.base.height;
  const selected = parseSize(elements.preciseSize.value) || { width: 2048, height: 2048 };
  const targetPixels = selected.width * selected.height;
  let best = elements.preciseSize.value;
  let bestScore = Infinity;
  for (const size of preciseSizes) {
    const parsed = parseSize(size);
    const aspectError = Math.abs(Math.log((parsed.width / parsed.height) / targetAspect));
    const areaError = Math.abs(Math.log((parsed.width * parsed.height) / targetPixels));
    const score = aspectError * 100 + areaError;
    if (score < bestScore) { best = size; bestScore = score; }
  }
  elements.preciseSize.value = best;
}

function resetEdit() {
  if (state.mode === "imageGenerate") {
    elements.imageGenerationPrompt.value = "";
    elements.imageGenerationRatio.value = "1:1";
    elements.imageGenerationTier.value = "2K";
    elements.imageGenerationQuality.value = "medium";
    elements.imageGenerationOutputFormat.value = "png";
    elements.imageGenerationPromptOptimization.value = "standard";
    currentWorkspace().references = [];
    renderImageGenerationReferences();
    updateImageGenerationPromptCount();
    updateImageGenerationSize();
    updateImageGenerationModeNote();
  } else if (state.mode === "expand") {
    state.pads = { top: 0.25, right: 0.25, bottom: 0.25, left: 0.25 };
    elements.lockRatio.checked = false;
    elements.expandPrompt.value = "";
    syncPadInputs();
    updateExpandLayout();
  } else if (state.mode === "precise") {
    clearAnnotations();
    elements.precisePrompt.value = "按照标记位置精确编辑图片，使修改自然融入原画面。";
  } else if (state.mode === "stickerPack") {
    elements.stickerPackCount.value = "12";
    elements.stickerPackStyle.value = "cute";
    elements.stickerCaptionModeInputs.forEach((input) => { input.checked = input.value === "custom"; });
    elements.stickerPackExtra.value = "";
    elements.stickerCaptionFields.innerHTML = "";
    renderStickerCaptionFields();
    updateStickerPackSize();
    updateStickerCaptionMode();
  } else if (state.mode === "portraitStudio") {
    state.portraitStyleId = "clear-natural-light";
    state.portraitExpressionId = "auto";
    state.portraitExpressionIntensity = "balanced";
    elements.portraitUsage.value = "profile";
    elements.portraitMood.value = "natural";
    elements.portraitIntensity.value = "light";
    elements.portraitRatio.value = "2:3";
    elements.portraitResolution.value = "1K";
    elements.portraitQuality.value = "medium";
    elements.portraitExtra.value = "";
    for (const input of [elements.portraitScene, elements.portraitCamera, elements.portraitWardrobe, elements.portraitAction, elements.portraitLighting]) input.value = "";
    currentWorkspace().seriesResults = {};
    renderPortraitStyles();
    renderPortraitExpressions();
    updatePortraitRecommendations();
    applyPortraitStylePlaceholders();
    renderPortraitSeries();
  }
}

function syncPadInputs() {
  elements.padTop.value = Math.round(state.pads.top * 100);
  elements.padRight.value = Math.round(state.pads.right * 100);
  elements.padBottom.value = Math.round(state.pads.bottom * 100);
  elements.padLeft.value = Math.round(state.pads.left * 100);
}

function startExpandDrag(event) {
  if (!state.base || state.busy) return;
  event.preventDefault();
  state.expandDrag = { side: event.currentTarget.dataset.side, x: event.clientX, y: event.clientY };
  event.currentTarget.setPointerCapture?.(event.pointerId);
}

function moveExpandDrag(event) {
  const drag = state.expandDrag;
  if (!drag || !state.base) return;
  const imageRect = elements.expandImage.getBoundingClientRect();
  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;
  drag.x = event.clientX;
  drag.y = event.clientY;
  let delta = 0;
  if (drag.side === "right") delta = dx / Math.max(1, imageRect.width);
  if (drag.side === "left") delta = -dx / Math.max(1, imageRect.width);
  if (drag.side === "bottom") delta = dy / Math.max(1, imageRect.height);
  if (drag.side === "top") delta = -dy / Math.max(1, imageRect.height);
  if (elements.lockRatio.checked) {
    const average = (state.pads.top + state.pads.right + state.pads.bottom + state.pads.left) / 4;
    const next = clamp(average + delta, 0, 3);
    state.pads = { top: next, right: next, bottom: next, left: next };
  } else {
    state.pads[drag.side] = clamp(state.pads[drag.side] + delta, 0, 3);
  }
  syncPadInputs();
  updateExpandLayout();
}

function finishExpandDrag() {
  state.expandDrag = null;
}

function updateExpandLayout() {
  if (!state.base || state.mode !== "expand" || elements.expandStage.hidden) return;
  const { width: originalWidth, height: originalHeight } = state.base;
  const frameWidthUnits = originalWidth * (1 + state.pads.left + state.pads.right);
  const frameHeightUnits = originalHeight * (1 + state.pads.top + state.pads.bottom);
  const availableWidth = Math.max(120, elements.expandStage.clientWidth - 58);
  const availableHeight = Math.max(120, elements.expandStage.clientHeight - 64);
  const scale = Math.min(availableWidth / frameWidthUnits, availableHeight / frameHeightUnits);
  const frameWidth = Math.max(50, frameWidthUnits * scale);
  const frameHeight = Math.max(50, frameHeightUnits * scale);
  Object.assign(elements.expandFrame.style, { width: `${frameWidth}px`, height: `${frameHeight}px` });
  Object.assign(elements.expandImage.style, {
    left: `${state.pads.left * originalWidth / frameWidthUnits * 100}%`,
    top: `${state.pads.top * originalHeight / frameHeightUnits * 100}%`,
    width: `${originalWidth / frameWidthUnits * 100}%`,
    height: `${originalHeight / frameHeightUnits * 100}%`
  });
  const target = expandTargetSize();
  elements.expandSize.textContent = target.valid ? `${target.width} × ${target.height}` : "尺寸不可用";
  elements.expandSizeError.textContent = target.valid ? "" : target.error;
}

function expandTargetSize() {
  if (!state.base) return { valid: false, error: "尚未上传图片" };
  const width = state.base.width * (1 + state.pads.left + state.pads.right);
  const height = state.base.height * (1 + state.pads.top + state.pads.bottom);
  return isGptImage2Model(elements.expandModel.value) ? fitGptDimensions(width, height) : fitGenericDimensions(width, height);
}

function fitGenericDimensions(width, height) {
  const cap = 2048;
  const scale = Math.min(1, cap / Math.max(width, height));
  return { valid: true, width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)), error: "" };
}

function fitGptDimensions(width, height) {
  const grid = 16;
  const maxEdge = 3840;
  const maxAspect = 3;
  const minPixels = 655360;
  const maxPixels = 8294400;
  const aspect = width / height;
  if (!Number.isFinite(aspect) || aspect <= 0) return { valid: false, error: "画面比例无效" };
  if (aspect > maxAspect || aspect < 1 / maxAspect) return { valid: false, error: "长短边比例不能超过 3:1" };
  const rawPixels = width * height;
  const areaScale = Math.sqrt(clamp(rawPixels, minPixels, maxPixels) / rawPixels);
  const edgeScale = maxEdge / Math.max(width, height);
  const preferredPixels = rawPixels * Math.min(areaScale, edgeScale) ** 2;
  let best = null;
  let bestScore = Infinity;
  for (let candidateWidth = grid; candidateWidth <= maxEdge; candidateWidth += grid) {
    const nearestHeight = Math.round(candidateWidth / aspect / grid) * grid;
    for (let offset = -2; offset <= 2; offset += 1) {
      const candidateHeight = nearestHeight + offset * grid;
      if (candidateHeight <= 0 || candidateHeight > maxEdge) continue;
      const pixels = candidateWidth * candidateHeight;
      if (pixels < minPixels || pixels > maxPixels) continue;
      if (Math.max(candidateWidth, candidateHeight) / Math.min(candidateWidth, candidateHeight) > maxAspect) continue;
      const aspectError = Math.abs(Math.log((candidateWidth / candidateHeight) / aspect));
      const areaError = Math.abs(Math.log(pixels / preferredPixels));
      const score = aspectError * 100 + areaError;
      if (score < bestScore) {
        best = { valid: true, width: candidateWidth, height: candidateHeight, error: "" };
        bestScore = score;
      }
    }
  }
  return best || { valid: false, error: "找不到符合模型约束的输出尺寸" };
}

function drawAnnotationCanvas() {
  if (!state.base) return;
  const canvas = elements.annotationCanvas;
  if (canvas.width !== state.base.width || canvas.height !== state.base.height) {
    canvas.width = state.base.width;
    canvas.height = state.base.height;
  }
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(state.base.image, 0, 0, canvas.width, canvas.height);
  drawMarks(context, state.marks, canvas.width, canvas.height);
  elements.markCount.textContent = `已标记 ${state.marks.length} 处`;
}

function drawMarks(context, marks, width, height) {
  const lineWidth = Math.max(4, Math.min(width, height) * 0.006);
  context.save();
  context.strokeStyle = "#8b5cf6";
  context.fillStyle = "#8b5cf6";
  context.lineWidth = lineWidth;
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const mark of marks) {
    if (mark.type === "point") {
      const x = mark.x * width;
      const y = mark.y * height;
      const radius = lineWidth * 2.2;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.moveTo(x - radius * 1.5, y); context.lineTo(x + radius * 1.5, y);
      context.moveTo(x, y - radius * 1.5); context.lineTo(x, y + radius * 1.5);
      context.stroke();
    } else if (mark.type === "box") {
      const x = Math.min(mark.x1, mark.x2) * width;
      const y = Math.min(mark.y1, mark.y2) * height;
      context.strokeRect(x, y, Math.abs(mark.x2 - mark.x1) * width, Math.abs(mark.y2 - mark.y1) * height);
    } else if (mark.type === "arrow") {
      const x1 = mark.x1 * width, y1 = mark.y1 * height, x2 = mark.x2 * width, y2 = mark.y2 * height;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const head = lineWidth * 4;
      context.beginPath();
      context.moveTo(x1, y1); context.lineTo(x2, y2);
      context.lineTo(x2 - Math.cos(angle - Math.PI / 6) * head, y2 - Math.sin(angle - Math.PI / 6) * head);
      context.moveTo(x2, y2);
      context.lineTo(x2 - Math.cos(angle + Math.PI / 6) * head, y2 - Math.sin(angle + Math.PI / 6) * head);
      context.stroke();
    } else if (mark.type === "brush" && mark.points?.length) {
      context.beginPath();
      context.moveTo(mark.points[0].x * width, mark.points[0].y * height);
      mark.points.slice(1).forEach((point) => context.lineTo(point.x * width, point.y * height));
      context.stroke();
    }
  }
  context.restore();
}

function annotationPoint(event) {
  const rect = elements.annotationCanvas.getBoundingClientRect();
  return { x: clamp((event.clientX - rect.left) / rect.width, 0, 1), y: clamp((event.clientY - rect.top) / rect.height, 0, 1) };
}

function annotationPointerDown(event) {
  if (!state.base || state.mode !== "precise" || state.busy) return;
  event.preventDefault();
  const point = annotationPoint(event);
  if (state.tool === "eraser") {
    const rect = elements.annotationCanvas.getBoundingClientRect();
    const tolerance = 14 / Math.max(1, Math.min(rect.width, rect.height));
    const index = findMarkAt(state.marks, point, tolerance);
    if (index >= 0) {
      rememberMarks();
      state.marks.splice(index, 1);
      drawAnnotationCanvas();
    }
    return;
  }
  rememberMarks();
  state.pointerId = event.pointerId;
  elements.annotationCanvas.setPointerCapture?.(event.pointerId);
  if (state.tool === "point") {
    state.marks.push({ type: "point", ...point });
    state.pointerId = null;
  } else if (state.tool === "box" || state.tool === "arrow") {
    state.activeMark = { type: state.tool, x1: point.x, y1: point.y, x2: point.x, y2: point.y };
    state.marks.push(state.activeMark);
  } else if (state.tool === "brush") {
    state.activeMark = { type: "brush", points: [point] };
    state.marks.push(state.activeMark);
  }
  drawAnnotationCanvas();
}

function annotationPointerMove(event) {
  if (state.pointerId !== event.pointerId || !state.activeMark) return;
  const point = annotationPoint(event);
  if (state.activeMark.type === "box" || state.activeMark.type === "arrow") {
    state.activeMark.x2 = point.x;
    state.activeMark.y2 = point.y;
  } else if (state.activeMark.type === "brush") {
    state.activeMark.points.push(point);
  }
  drawAnnotationCanvas();
}

function annotationPointerFinish(event) {
  if (state.pointerId !== event.pointerId) return;
  if (state.activeMark?.type === "brush") state.activeMark.points = simplifyPath(state.activeMark.points);
  state.pointerId = null;
  state.activeMark = null;
  drawAnnotationCanvas();
}

function rememberMarks() {
  state.undoStack.push(JSON.parse(JSON.stringify(state.marks)));
  if (state.undoStack.length > 30) state.undoStack.shift();
}

function undoAnnotation() {
  if (!state.undoStack.length) return;
  state.marks = state.undoStack.pop();
  drawAnnotationCanvas();
}

function clearAnnotations() {
  if (state.marks.length) rememberMarks();
  state.marks = [];
  drawAnnotationCanvas();
}

function simplifyPath(points, minimumDistance = 0.004) {
  if (!Array.isArray(points) || points.length < 3) return points || [];
  const kept = [points[0]];
  for (let index = 1; index < points.length - 1; index += 1) {
    if (pointDistance(kept[kept.length - 1], points[index]) >= minimumDistance) kept.push(points[index]);
  }
  const last = points[points.length - 1];
  if (pointDistance(kept[kept.length - 1], last) > 0) kept.push(last);
  return kept;
}

function findMarkAt(marks, point, tolerance) {
  for (let index = marks.length - 1; index >= 0; index -= 1) {
    const mark = marks[index];
    if (mark.type === "point" && pointDistance(mark, point) <= tolerance) return index;
    if (mark.type === "box") {
      const left = Math.min(mark.x1, mark.x2), right = Math.max(mark.x1, mark.x2);
      const top = Math.min(mark.y1, mark.y2), bottom = Math.max(mark.y1, mark.y2);
      if (point.x >= left - tolerance && point.x <= right + tolerance && point.y >= top - tolerance && point.y <= bottom + tolerance) return index;
    }
    if (mark.type === "arrow" && distanceToSegment(point, { x: mark.x1, y: mark.y1 }, { x: mark.x2, y: mark.y2 }) <= tolerance) return index;
    if (mark.type === "brush") {
      for (let p = 1; p < mark.points.length; p += 1) {
        if (distanceToSegment(point, mark.points[p - 1], mark.points[p]) <= tolerance) return index;
      }
    }
  }
  return -1;
}

function pointDistance(a, b) {
  return Math.hypot(Number(a.x) - Number(b.x), Number(a.y) - Number(b.y));
}

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x, dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return pointDistance(point, start);
  const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared, 0, 1);
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

async function addReferenceFiles(fileList) {
  try {
    const files = Array.from(fileList || []);
    if (state.references.length + files.length > 9) throw new Error("额外参考图最多 9 张");
    for (const file of files) {
      validateImageFile(file);
      state.references.push({ file, dataUrl: await fileToDataUrl(file) });
    }
    elements.referenceInput.value = "";
    renderReferences();
  } catch (error) {
    showToast(error.message);
  }
}

function renderReferences() {
  elements.referenceList.innerHTML = state.references.map((item, index) => `
    <div class="reference-thumb" title="${escapeHtml(item.file.name)}">
      <img src="${item.dataUrl}" alt="参考图 ${index + 1}">
      <button type="button" data-reference-remove="${index}" aria-label="移除参考图 ${index + 1}">×</button>
    </div>`).join("");
}

async function submitGeneration(event) {
  event.preventDefault();
  if (state.busy) return;
  if (state.mode !== "imageGenerate" && !state.base) { showToast("请先上传原图"); return; }
  try {
    const providerId = selectedProviderId();
    const provider = state.backend?.providers?.[providerId];
    if (!provider?.configured) {
      showToast(`请先配置“${provider?.label || providerId}”的 API Key`);
      openSettings();
      return;
    }
    let image;
    let prompt;
    let size;
    let referenceImages = [];
    let portrait;
    if (state.mode === "imageGenerate") {
      const references = currentWorkspace().references || [];
      window.ImageGeneration.validateReferenceCount(references.length);
      prompt = window.ImageGeneration.normalizePrompt(elements.imageGenerationPrompt.value);
      if (!prompt) throw new Error("请先描述想要生成的画面");
      size = window.ImageGeneration.sizeFor(
        elements.imageGenerationModel.value,
        elements.imageGenerationRatio.value,
        elements.imageGenerationTier.value
      );
      image = references[0]?.dataUrl;
      referenceImages = references.slice(1).map((item) => item.dataUrl);
      currentWorkspace().comparisonOriginal = references[0]?.dataUrl || "";
    } else if (state.mode === "expand") {
      if (state.pads.top + state.pads.right + state.pads.bottom + state.pads.left < 0.02) throw new Error("请先设置需要扩展的范围");
      const composite = await buildExpandComposite();
      image = composite.dataUrl;
      size = `${composite.width}x${composite.height}`;
      currentWorkspace().comparisonOriginal = image;
      prompt = buildExpandPrompt(elements.expandPrompt.value);
    } else if (state.mode === "precise") {
      drawAnnotationCanvas();
      image = elements.annotationCanvas.toDataURL("image/png");
      size = elements.preciseSize.value;
      currentWorkspace().comparisonOriginal = state.base.dataUrl;
      prompt = buildPrecisePrompt(elements.precisePrompt.value, state.marks);
      referenceImages = state.references.map((item) => item.dataUrl);
    } else if (state.mode === "productBackground") {
      const background = currentWorkspace().background;
      if (!background) throw new Error("请先上传背景图");
      image = state.base.dataUrl;
      referenceImages = [background.dataUrl];
      size = productBackgroundOutputSize();
      currentWorkspace().comparisonOriginal = state.base.dataUrl;
      prompt = window.ProductBackground.buildPrompt({
        extra: elements.productBackgroundPrompt.value,
        aspectSource: elements.productBackgroundAspectSource.value
      });
    } else if (state.mode === "materialTransfer") {
      const material = currentWorkspace().material;
      if (!material) throw new Error("请先上传材质参考图");
      window.MaterialTransfer.validateInputCount(2);
      image = state.base.dataUrl;
      referenceImages = [material.dataUrl];
      size = materialTransferOutputSize();
      currentWorkspace().comparisonOriginal = state.base.dataUrl;
      prompt = window.MaterialTransfer.buildPrompt({
        strength: elements.materialTransferStrength.value,
        materialHint: elements.materialTransferHint.value,
        extra: elements.materialTransferExtra.value
      });
    } else if (state.mode === "stickerPack") {
      image = state.base.dataUrl;
      size = stickerPackOutputSize();
      currentWorkspace().comparisonOriginal = state.base.dataUrl;
      prompt = window.StickerPack.buildPrompt({
        count: elements.stickerPackCount.value,
        captions: readStickerCaptions(),
        captionMode: selectedStickerCaptionMode(),
        style: elements.stickerPackStyle.value,
        extra: elements.stickerPackExtra.value
      });
    } else if (state.mode === "portraitStudio") {
      const workspace = currentWorkspace();
      if (!workspace.seriesId) workspace.seriesId = crypto.randomUUID();
      image = state.base.dataUrl;
      referenceImages = workspace.references.map((item) => item.dataUrl);
      currentWorkspace().comparisonOriginal = state.base.dataUrl;
      portrait = portraitSettings("hero");
      size = state.portraitOptions?.sizes?.[portrait.resolution]?.[portrait.ratio] || "1024x1536";
      prompt = "写真提示词由本机服务端安全编译";
    } else {
      throw new Error("当前编辑模式无效");
    }
    state.busy = true;
    state.clientRequestId = crypto.randomUUID();
    updateBusyUi(true);
    setStep(3);
    updateJobUi({ status: "queued", stage: "正在创建任务", progress: 3 });
    const job = await api("/api/jobs", {
      method: "POST",
      body: JSON.stringify({
        clientRequestId: state.clientRequestId,
        mode: state.mode,
        providerId,
        model: selectedModelId(),
        prompt,
        size,
        aspectRatio: state.mode === "imageGenerate" ? elements.imageGenerationRatio.value : undefined,
        sizeTier: state.mode === "imageGenerate" ? elements.imageGenerationTier.value : undefined,
        image,
        comparisonImage: ["precise", "imageGenerate"].includes(state.mode) ? (currentWorkspace().comparisonOriginal || undefined) : undefined,
        referenceImages,
        outputFormat: state.mode === "imageGenerate"
          ? elements.imageGenerationOutputFormat.value
          : (state.mode === "precise" ? elements.outputFormat.value : "png"),
        promptOptimization: state.mode === "imageGenerate"
          ? elements.imageGenerationPromptOptimization.value
          : (state.mode === "stickerPack" ? "fast" : elements.promptOptimization.value),
        quality: state.mode === "imageGenerate"
          ? elements.imageGenerationQuality.value
          : state.mode === "expand"
          ? elements.expandQuality.value
          : (state.mode === "materialTransfer" ? "high" : (state.mode === "stickerPack" ? "medium" : (state.mode === "portraitStudio" ? portrait.quality : undefined))),
        portrait,
        annotation: state.mode === "precise" ? { version: 1, width: state.base.width, height: state.base.height, marks: state.marks } : undefined
      })
    });
    state.activeJobId = job.id;
    await pollJob(job.id);
  } catch (error) {
    state.busy = false;
    state.clientRequestId = "";
    updateBusyUi(false);
    updateJobUi({ status: "failed", stage: "未能创建任务", progress: 100, error: { message: friendlyError(error) } });
    showToast(friendlyError(error));
  }
}

async function buildExpandComposite() {
  const target = expandTargetSize();
  if (!target.valid) throw new Error(target.error);
  const originalWidth = state.base.width, originalHeight = state.base.height;
  const frameWidth = originalWidth * (1 + state.pads.left + state.pads.right);
  const frameHeight = originalHeight * (1 + state.pads.top + state.pads.bottom);
  const scale = Math.min(target.width / frameWidth, target.height / frameHeight);
  const drawWidth = Math.round(originalWidth * scale), drawHeight = Math.round(originalHeight * scale);
  const drawX = Math.round((target.width - frameWidth * scale) / 2 + state.pads.left * originalWidth * scale);
  const drawY = Math.round((target.height - frameHeight * scale) / 2 + state.pads.top * originalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(state.base.image, drawX, drawY, drawWidth, drawHeight);
  return { dataUrl: canvas.toDataURL("image/png"), width: target.width, height: target.height };
}

function buildExpandPrompt(userText) {
  const directions = [];
  if (state.pads.top > 0.01) directions.push("上");
  if (state.pads.bottom > 0.01) directions.push("下");
  if (state.pads.left > 0.01) directions.push("左");
  if (state.pads.right > 0.01) directions.push("右");
  const directionText = directions.length ? `向${directions.join("、")}侧` : "";
  const base = `请把这张图${directionText}自然向外扩展（outpainting），填充四周透明或空白区域，与原图无缝衔接。保持原有主体、构图、透视、光线、色调和整体风格完全一致，不改动或裁切原有内容，新扩展部分要真实、连贯、自然。`;
  return String(userText || "").trim() ? `${base}\n补充说明：${String(userText).trim()}` : base;
}

function buildPrecisePrompt(userText, marks) {
  const base = String(userText || "").trim() || "按照标记位置精确编辑图片，使修改自然融入原画面。";
  const instruction = marks.length
    ? "紫色标记仅用于定位。完成修改后删除全部紫色标记，并保持未标记区域、构图和比例不变。"
    : "保持未要求修改的区域、构图和比例不变。";
  return `${base}\n${instruction}`;
}

async function pollJob(id) {
  for (;;) {
    const job = await api(`/api/jobs/${encodeURIComponent(id)}`);
    updateJobUi(job);
    if (job.status === "succeeded") {
      state.busy = false;
      state.clientRequestId = "";
      state.activeJobId = "";
      currentWorkspace().lastResult = job;
      if (job.mode === "portraitStudio") {
        const shotId = job.portrait?.shotId || "hero";
        currentWorkspace().seriesResults[shotId] = job;
        renderPortraitSeries();
        updateStudioSaveButton();
      }
      updateBusyUi(false);
      showResult(job);
      void refreshCurrentUser();
      return job;
    }
    if (job.status === "failed") {
      state.busy = false;
      state.clientRequestId = "";
      state.activeJobId = "";
      updateBusyUi(false);
      void refreshCurrentUser();
      throw new Error(job.error?.message || "生成失败");
    }
    await delay(1000);
  }
}

async function createPortraitShot(shotId, directedInstruction = "") {
  const workspace = state.workspaces.portraitStudio;
  const previous = workspace.seriesResults[shotId];
  const providerId = elements.portraitProvider.value || "default";
  const provider = state.backend?.providers?.[providerId];
  if (!provider?.configured) throw new Error(`请先配置“${provider?.label || providerId}”的 API Key`);
  const portrait = portraitSettings(shotId, directedInstruction);
  const size = state.portraitOptions?.sizes?.[portrait.resolution]?.[portrait.ratio] || "1024x1536";
  try {
    const job = await api("/api/jobs", {
      method: "POST",
      body: JSON.stringify({
        clientRequestId: crypto.randomUUID(),
        mode: "portraitStudio",
        providerId,
        model: elements.portraitModel.value,
        prompt: "写真提示词由本机服务端安全编译",
        size,
        image: workspace.base.dataUrl,
        referenceImages: workspace.references.map((item) => item.dataUrl),
        outputFormat: "png",
        quality: portrait.quality,
        portrait
      })
    });
    workspace.seriesResults[shotId] = job;
    renderPortraitSeries();
    for (;;) {
      const current = await api(`/api/jobs/${encodeURIComponent(job.id)}`);
      updateJobUi(current);
      workspace.seriesResults[shotId] = current;
      renderPortraitSeries();
      if (current.status === "succeeded") return current;
      if (current.status === "failed") throw new Error(current.error?.message || `${portraitShotLabel(shotId)}生成失败`);
      await delay(1000);
    }
  } catch (error) {
    if (previous?.result) workspace.seriesResults[shotId] = previous;
    renderPortraitSeries();
    throw error;
  }
}

async function expandPortraitSeries() {
  if (state.busy || state.mode !== "portraitStudio") return;
  const workspace = currentWorkspace();
  const hero = workspace.seriesResults.hero;
  if (!hero?.result) { showToast("请先生成并确认主肖像预览"); return; }
  const currentSize = state.portraitOptions?.sizes?.[elements.portraitResolution.value]?.[elements.portraitRatio.value];
  if (hero.providerId !== elements.portraitProvider.value || hero.model !== elements.portraitModel.value || hero.size !== currentSize || hero.portrait?.settingsSignature !== portraitSettingsSignature()) {
    showToast("写真参数或参考图已经改变，请先重新生成主肖像预览，再扩展系列。");
    return;
  }
  state.busy = true;
  updateBusyUi(true);
  setStep(3);
  elements.portraitSeriesCard.hidden = false;
  try {
    const pending = ["environment", "action", "detail"].filter((shotId) => !workspace.seriesResults[shotId]?.result);
    for (const shotId of pending) {
      await createPortraitShot(shotId);
    }
    elements.portraitSeriesMeta.textContent = "四张写真已经完成，可逐张下载、重新生成或定向修改。";
    showToast("写真系列生成完成");
    setStep(4);
  } catch (error) {
    showToast(friendlyError(error));
    elements.portraitSeriesMeta.textContent = `系列未全部完成：${friendlyError(error)}。已完成的成片会继续保留。`;
  } finally {
    state.busy = false;
    updateBusyUi(false);
    renderPortraitSeries();
  }
}

function portraitShotLabel(shotId) {
  return ({ hero: "主肖像", environment: "环境肖像", action: "动作抓拍", detail: "细节变化" })[shotId] || shotId;
}

function renderPortraitSeries() {
  const workspace = state.workspaces.portraitStudio;
  const results = workspace.seriesResults || {};
  const hasAny = Object.values(results).some((item) => item?.result || ["queued", "preprocessing", "submitting", "saving"].includes(item?.status));
  elements.portraitSeriesCard.hidden = state.mode !== "portraitStudio" || !hasAny;
  if (!hasAny) { elements.portraitSeriesGrid.innerHTML = ""; updateStudioSaveButton(); return; }
  const order = ["hero", "environment", "action", "detail"];
  elements.portraitSeriesGrid.innerHTML = order.map((shotId) => {
    const job = results[shotId];
    const ready = Boolean(job?.result?.url);
    const running = job && !["succeeded", "failed"].includes(job.status);
    const status = ready ? "已完成" : (job?.status === "failed" ? "生成失败" : (running ? (job.stage || "生成中") : "等待生成"));
    return `<article class="portrait-series-item" data-portrait-shot-card="${shotId}">
      <div class="portrait-series-image">${ready ? `<img src="${job.result.url}" alt="${portraitShotLabel(shotId)}结果">` : `<span>${escapeHtml(status)}</span>`}</div>
      <h3>${portraitShotLabel(shotId)}</h3><p>${escapeHtml(ready ? `${job.model} · ${job.size}` : status)}</p>
      ${ready ? `<div class="portrait-series-actions"><a href="${job.result.downloadUrl}" download="${escapeHtml(job.result.filename)}">下载</a><button type="button" data-portrait-action="regenerate" data-portrait-shot="${shotId}">重新生成</button></div>
      <div class="portrait-series-modify"><input type="text" maxlength="300" data-portrait-modify-input="${shotId}" placeholder="例如：表情更放松"><button type="button" data-portrait-action="modify" data-portrait-shot="${shotId}">定向修改</button></div>` : ""}
    </article>`;
  }).join("");
  updateStudioSaveButton();
}

async function handlePortraitSeriesAction(event) {
  const button = event.target.closest("[data-portrait-action]");
  if (!button || state.busy || state.mode !== "portraitStudio") return;
  const shotId = button.dataset.portraitShot;
  const action = button.dataset.portraitAction;
  const instruction = action === "modify"
    ? elements.portraitSeriesGrid.querySelector(`[data-portrait-modify-input="${shotId}"]`)?.value.trim()
    : "";
  if (action === "modify" && !instruction) { showToast("请先填写定向修改要求"); return; }
  state.busy = true;
  updateBusyUi(true);
  try {
    await createPortraitShot(shotId, instruction);
    showToast(`${portraitShotLabel(shotId)}已更新`);
  } catch (error) {
    showToast(friendlyError(error));
  } finally {
    state.busy = false;
    updateBusyUi(false);
    renderPortraitSeries();
  }
}

function downloadPortraitSeries() {
  const jobs = Object.values(state.workspaces.portraitStudio.seriesResults || {}).filter((job) => job?.result?.downloadUrl);
  if (!jobs.length) { showToast("还没有可下载的写真成片"); return; }
  for (const job of jobs) {
    const anchor = document.createElement("a");
    anchor.href = job.result.downloadUrl;
    anchor.download = job.result.filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  }
}

function updateBusyUi(busy) {
  elements.generateButton.disabled = busy;
  if (busy) elements.generateButton.querySelector("span").textContent = ({
    imageGenerate: "正在生成图片…",
    productBackground: "正在更换背景…",
    materialTransfer: "正在迁移材质…",
    stickerPack: "正在生成表情包…",
    portraitStudio: "正在生成写真…"
  })[state.mode] || "正在生成…";
  else updateGenerateButtonLabel();
  elements.modeButtons.forEach((button) => { button.disabled = busy; });
  elements.productUploadCard.disabled = busy;
  elements.backgroundUploadCard.disabled = busy;
  elements.materialStructureCard.disabled = busy;
  elements.materialReferenceCard.disabled = busy;
  elements.portraitAddReferenceButton.disabled = busy || state.workspaces.portraitStudio.references.length >= 3;
  elements.imageGenerationAddReferenceButton.disabled = busy || state.workspaces.imageGenerate.references.length >= 10;
  elements.portraitExpandSeriesButton.disabled = busy;
  elements.portraitDownloadAllButton.disabled = busy;
  elements.jobPanel.hidden = !busy && !elements.jobPanel.classList.contains("failed");
}

function updateJobUi(job) {
  elements.jobPanel.hidden = false;
  elements.jobPanel.classList.toggle("complete", job.status === "succeeded");
  elements.jobPanel.classList.toggle("failed", job.status === "failed");
  elements.jobStage.textContent = job.stage || "处理中";
  const progress = clamp(Number(job.progress) || 0, 0, 100);
  elements.jobProgress.style.width = `${progress}%`;
  elements.jobProgressText.textContent = `${progress}%`;
  if (job.status === "failed") elements.jobMessage.textContent = friendlyError(job.error?.message || "生成失败");
  else if (job.status === "succeeded") elements.jobMessage.textContent = "结果已安全保存到本机 output 目录。";
  else elements.jobMessage.textContent = "任务已进入本机队列，请勿关闭程序或重复提交。";
}

function showResult(job, { historical = false } = {}) {
  const savedSource = job.source?.url ? job.source : null;
  const liveSourceUrl = !historical ? (currentWorkspace().comparisonOriginal || state.base?.dataUrl || "") : "";
  const displayedOriginal = savedSource || (liveSourceUrl ? { url: liveSourceUrl, downloadUrl: "", filename: state.base?.name || "" } : null);
  const singleResult = !displayedOriginal;
  const textOnlyGeneration = job.mode === "imageGenerate" && !displayedOriginal;
  const historyWithoutSource = historical && !savedSource && job.mode !== "imageGenerate";
  const privacyProtectedPortrait = historyWithoutSource && job.mode === "portraitStudio";
  state.displayedJob = job;
  state.displayedOriginal = displayedOriginal;
  state.displayedFromHistory = historical;
  elements.resultCard.hidden = false;
  elements.resultImage.src = job.result.url;
  elements.originalImage.src = displayedOriginal?.url || job.result.url;
  elements.compareStage.classList.toggle("single-result", textOnlyGeneration);
  elements.downloadResultButton.href = job.result.downloadUrl;
  elements.downloadResultButton.download = job.result.filename;
  elements.resultMode.textContent = jobModeLabel(job);
  elements.resultModel.textContent = job.model;
  elements.resultSize.textContent = job.size;
  elements.resultFile.textContent = job.result.filename;
  elements.resultMeta.textContent = textOnlyGeneration
    ? `${new Date(job.completedAt || Date.now()).toLocaleString()} · ${formatBytes(job.result.bytes)} · 文字直接生成`
    : historyWithoutSource
    ? `${new Date(job.completedAt || Date.now()).toLocaleString()} · ${formatBytes(job.result.bytes)} · ${privacyProtectedPortrait ? "按隐私设置未保存参考原图" : "旧记录未保存对应原图，已停止自动关联"}`
    : `${new Date(job.completedAt || Date.now()).toLocaleString()} · ${formatBytes(job.result.bytes)}`;
  elements.compareBeforeLabel.textContent = historyWithoutSource ? "历史未保存原图" : "原图";
  elements.fullscreenBeforeLabel.textContent = historyWithoutSource ? "历史未保存原图" : "原图";
  elements.fullscreenCompareButton.hidden = false;
  elements.fullscreenCompareButtonLabel.textContent = singleResult ? "全屏查看" : "全屏对比";
  elements.fullscreenCompareButton.title = singleResult ? "全屏放大查看生成图片细节" : "全屏查看原图与结果对比";
  elements.downloadOriginalButton.hidden = textOnlyGeneration;
  elements.downloadOriginalButton.disabled = historyWithoutSource;
  elements.downloadOriginalButton.title = historyWithoutSource ? (privacyProtectedPortrait ? "这条写真按隐私设置未保存参考原图" : "这条旧历史生成时尚未保存原图，无法恢复") : "";
  elements.newEditButton.disabled = historyWithoutSource;
  elements.newEditButton.textContent = job.mode === "imageGenerate"
    ? "继续调整生成参数"
    : (historyWithoutSource ? (privacyProtectedPortrait ? "参考原图未保存" : "旧记录未保存原图") : "继续编辑这张原图");
  elements.portraitExpandSeriesButton.hidden = job.mode !== "portraitStudio" || historical || job.portrait?.shotId !== "hero";
  elements.compareSlider.value = "50";
  elements.resultImage.addEventListener("load", updateCompareSlider, { once: true });
  requestAnimationFrame(updateCompareSlider);
  setStep(4);
  elements.resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateCompareSlider() {
  if (elements.resultCard.hidden) return;
  const value = Number(elements.compareSlider.value) || 50;
  elements.compareOriginalClip.style.width = `${value}%`;
  elements.compareDivider.style.left = `${value}%`;
  elements.compareOriginalClip.style.setProperty("--compare-width", `${elements.compareStage.clientWidth}px`);
}

function openFullscreenCompare() {
  if (elements.resultCard.hidden || !elements.resultImage.src) return;
  const singleResult = !state.displayedOriginal;
  elements.fullscreenResultImage.src = elements.resultImage.currentSrc || elements.resultImage.src;
  elements.fullscreenOriginalImage.src = elements.originalImage.currentSrc || elements.originalImage.src;
  elements.fullscreenCompareStage.classList.toggle("single-result", singleResult);
  elements.fullscreenCompareSlider.value = elements.compareSlider.value || "50";
  elements.fullscreenCompareTitle.textContent = singleResult ? "生成图片全屏查看" : "原图与结果对比";
  elements.fullscreenCompareMeta.textContent = singleResult
    ? `${elements.resultMode.textContent} · ${elements.resultSize.textContent} · 全屏放大查看成图细节`
    : `${elements.resultMode.textContent} · ${elements.resultSize.textContent} · 拖动分界线查看细节`;
  elements.fullscreenCompareFooterHint.textContent = singleResult
    ? "图片已按当前窗口最大范围显示；按 Esc 可随时关闭"
    : "左右拖动分界线查看原图与结果；按 Esc 可随时关闭";
  elements.fullscreenCompare.hidden = false;
  document.body.classList.add("compare-modal-open");
  elements.fullscreenResultImage.addEventListener("load", updateFullscreenCompareSlider, { once: true });
  elements.fullscreenOriginalImage.addEventListener("load", updateFullscreenCompareSlider, { once: true });
  requestAnimationFrame(() => {
    updateFullscreenCompareSlider();
    elements.fullscreenCompare.querySelector("[data-fullscreen-close]")?.focus();
  });
}

function closeFullscreenCompare() {
  if (elements.fullscreenCompare.hidden) return;
  elements.compareSlider.value = elements.fullscreenCompareSlider.value;
  elements.fullscreenCompare.hidden = true;
  document.body.classList.remove("compare-modal-open");
  updateCompareSlider();
  elements.fullscreenCompareButton.focus();
}

function updateFullscreenCompareSlider() {
  if (elements.fullscreenCompare.hidden) return;
  const value = Number(elements.fullscreenCompareSlider.value) || 50;
  elements.fullscreenOriginalClip.style.width = `${value}%`;
  elements.fullscreenCompareDivider.style.left = `${value}%`;
  elements.fullscreenOriginalClip.style.setProperty("--compare-width", `${elements.fullscreenCompareStage.clientWidth}px`);
}

function downloadOriginal() {
  const source = state.displayedOriginal;
  if (!source?.url) return;
  const anchor = document.createElement("a");
  anchor.href = source.downloadUrl || source.url;
  anchor.download = source.filename || (state.mode === "expand"
    ? "gugu-expand-input.png"
    : (state.mode === "productBackground"
      ? `gugu-product-${state.base.name || "input.png"}`
      : (state.mode === "materialTransfer"
        ? `gugu-structure-${state.base.name || "input.png"}`
        : (state.mode === "stickerPack"
          ? `gugu-sticker-source-${state.base.name || "input.png"}`
          : (state.mode === "portraitStudio" ? `gugu-portrait-source-${state.base.name || "input.png"}` : (state.base.name || "gugu-original.png"))))));
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

function selectedProviderId() {
  return ({
    imageGenerate: elements.imageGenerationProvider.value || "default",
    expand: elements.expandProvider.value || "default",
    precise: elements.preciseProvider.value || "volc",
    productBackground: elements.productBackgroundProvider.value || "default",
    materialTransfer: elements.materialTransferProvider.value || "default",
    stickerPack: elements.stickerPackProvider.value || "default",
    portraitStudio: elements.portraitProvider.value || "default"
  })[state.mode] || "default";
}

function selectedModelId() {
  return ({
    imageGenerate: elements.imageGenerationModel.value,
    expand: elements.expandModel.value,
    precise: elements.preciseModel.value,
    productBackground: elements.productBackgroundModel.value,
    materialTransfer: elements.materialTransferModel.value,
    stickerPack: elements.stickerPackModel.value,
    portraitStudio: elements.portraitModel.value
  })[state.mode] || "";
}

function updateProviderBadge() {
  if (state.mode === "model3d") {
    elements.providerBadge.className = "provider-badge ready";
    elements.providerBadge.querySelector("span").textContent = "本机 3D · 无需接口";
    return;
  }
  const providerId = selectedProviderId();
  const provider = state.backend?.providers?.[providerId];
  const ready = Boolean(provider?.configured);
  elements.providerBadge.className = `provider-badge ${ready ? "ready" : "warning"}`;
  elements.providerBadge.querySelector("span").textContent = ready ? `${provider.label} 已配置` : `${provider?.label || "接口"} 未配置`;
}

function openSettings() {
  const providers = state.backend?.providers || {};
  const defaultProvider = providers.default || {};
  const volcProvider = providers.volc || {};
  elements.defaultBaseUrl.value = defaultProvider.baseUrl || "https://147ai.com/v1";
  elements.defaultApiKey.value = "";
  elements.defaultApiKey.placeholder = defaultProvider.configured ? `已保存 ${defaultProvider.apiKeyMasked}，留空保持不变` : "请输入 API Key";
  elements.defaultModel.value = defaultProvider.defaultModel || "gpt-image-2.5-flare";
  elements.defaultProviderState.textContent = defaultProvider.configured ? "已配置" : "未配置";
  elements.defaultProviderState.className = defaultProvider.configured ? "ready" : "";
  elements.volcBaseUrl.value = volcProvider.baseUrl || "https://ark.cn-beijing.volces.com/api/v3/images/generations";
  elements.volcApiKey.value = "";
  elements.volcApiKey.placeholder = volcProvider.configured ? `已保存 ${volcProvider.apiKeyMasked}，留空保持不变` : "请输入 Ark API Key";
  elements.volcModel.innerHTML = (volcProvider.models || [])
    .map((model) => `<option value="${escapeHtml(model.id)}">${escapeHtml(model.label || model.id)}</option>`)
    .join("");
  elements.volcModel.value = volcProvider.defaultModel || "doubao-seedream-5-0-flash-260915";
  elements.volcWatermark.checked = volcProvider.watermark !== false;
  elements.volcProviderState.textContent = volcProvider.configured ? "已配置" : "未配置";
  elements.volcProviderState.className = volcProvider.configured ? "ready" : "";
  elements.settingsModal.hidden = false;
}

function closeSettings() {
  elements.settingsModal.hidden = true;
}

async function saveSettings(event) {
  event.preventDefault();
  try {
    const response = await api("/api/settings", {
      method: "POST",
      body: JSON.stringify({
        providers: {
          default: {
            baseUrl: elements.defaultBaseUrl.value,
            apiKey: elements.defaultApiKey.value,
            defaultModel: elements.defaultModel.value
          },
          volc: {
            baseUrl: elements.volcBaseUrl.value,
            apiKey: elements.volcApiKey.value,
            defaultModel: elements.volcModel.value,
            watermark: elements.volcWatermark.checked
          }
        }
      })
    });
    state.backend.providers = response.providers;
    window.dispatchEvent(new CustomEvent("gugu-settings-changed"));
    populateProviders();
    updateProviderBadge();
    closeSettings();
    showToast("接口设置已安全保存到本机");
  } catch (error) {
    showToast(error.message);
  }
}

async function openHistory() {
  elements.historyDrawer.hidden = false;
  state.selectedHistoryIds.clear();
  elements.historyToolbar.hidden = true;
  elements.historyList.innerHTML = '<p class="muted">正在读取历史…</p>';
  try {
    const data = await api("/api/history");
    if (!data.items?.length) {
      elements.historyList.innerHTML = '<p class="muted">还没有生成记录。</p>';
      updateHistorySelectionUi();
      return;
    }
    elements.historyToolbar.hidden = false;
    elements.historyList.innerHTML = data.items.map((job) => `
      <article class="history-item" data-history-id="${escapeHtml(job.id)}">
        <div class="history-item-head">
          <label class="history-item-select" title="${isHistoryDeletableStatus(job.status) ? "选择此记录" : "运行中的任务不能删除"}">
            <input type="checkbox" data-history-select="${escapeHtml(job.id)}" aria-label="选择 ${escapeHtml(jobModeLabel(job))} ${escapeHtml(new Date(job.createdAt).toLocaleString())}" ${isHistoryDeletableStatus(job.status) ? "" : "disabled"}>
            <span aria-hidden="true"></span>
          </label>
          <strong>${escapeHtml(jobModeLabel(job))}</strong>
          <span class="status-pill ${escapeHtml(job.status)}">${statusLabel(job.status)}</span>
        </div>
        <time>${new Date(job.createdAt).toLocaleString()}</time>
        <p title="${escapeHtml(job.prompt)}">${escapeHtml(job.prompt || "无提示词")}</p>
        ${job.result ? `<button class="soft-button full-width" type="button" data-history-result="${escapeHtml(job.id)}">查看结果</button>` : ""}
      </article>`).join("");
    updateHistorySelectionUi();
  } catch (error) {
    elements.historyList.innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`;
    updateHistorySelectionUi();
  }
}

function closeHistory() {
  elements.historyDrawer.hidden = true;
  state.selectedHistoryIds.clear();
  updateHistorySelectionUi();
}

function isHistoryDeletableStatus(status) {
  return ["succeeded", "failed"].includes(status);
}

function updateHistorySelectionUi() {
  const checkboxes = $$('[data-history-select]:not(:disabled)', elements.historyList);
  for (const checkbox of checkboxes) {
    checkbox.checked = state.selectedHistoryIds.has(checkbox.dataset.historySelect);
    checkbox.closest(".history-item")?.classList.toggle("selected", checkbox.checked);
  }
  const selectedCount = checkboxes.filter((checkbox) => checkbox.checked).length;
  elements.historySelectedCount.textContent = `已选 ${selectedCount} 项`;
  elements.historyDeleteButton.disabled = selectedCount === 0;
  elements.historySelectAll.disabled = checkboxes.length === 0;
  elements.historySelectAll.checked = checkboxes.length > 0 && selectedCount === checkboxes.length;
  elements.historySelectAll.indeterminate = selectedCount > 0 && selectedCount < checkboxes.length;
}

async function deleteSelectedHistory() {
  const ids = [...state.selectedHistoryIds];
  if (!ids.length) return;
  const confirmed = window.confirm(`确定删除已选的 ${ids.length} 条历史记录吗？\n对应的本地结果文件也会删除，且无法恢复。`);
  if (!confirmed) return;

  const originalText = elements.historyDeleteButton.textContent;
  elements.historyDeleteButton.disabled = true;
  elements.historyDeleteButton.textContent = "正在删除…";
  try {
    const result = await api("/api/history", {
      method: "DELETE",
      body: JSON.stringify({ ids })
    });
    const fileMessage = result.deletedFiles ? `，同时清理 ${result.deletedFiles} 个本地图片文件` : "";
    const failedMessage = result.failedFiles ? `；有 ${result.failedFiles} 个文件未能清理` : "";
    showToast(`已删除 ${result.deletedRecords} 条历史记录${fileMessage}${failedMessage}`);
    await openHistory();
  } catch (error) {
    showToast(friendlyError(error));
  } finally {
    elements.historyDeleteButton.textContent = originalText;
    updateHistorySelectionUi();
  }
}

async function showHistoricalResult(id) {
  try {
    const job = await api(`/api/jobs/${encodeURIComponent(id)}`);
    if (!job.result) return;
    closeHistory();
    if (job.mode !== state.mode) setMode(job.mode);
    if (job.mode === "imageGenerate") restoreImageGenerationSettings(job);
    if (job.mode === "portraitStudio") {
      const workspace = state.workspaces.portraitStudio;
      const shotId = job.portrait?.shotId || "hero";
      workspace.seriesId = job.portrait?.seriesId || "";
      workspace.seriesResults = { [shotId]: job };
      renderPortraitSeries();
    }
    currentWorkspace().lastResult = job;
    currentWorkspace().comparisonOriginal = job.source?.url || "";
    showResult(job, { historical: true });
  } catch (error) {
    showToast(error.message);
  }
}

async function continueEditingDisplayedOriginal() {
  if (!state.displayedJob) return;
  try {
    if (state.displayedFromHistory && state.displayedJob.mode !== "imageGenerate") {
      if (!state.displayedJob.source?.url) return;
      await restoreHistoricalSource(state.displayedJob);
    } else if (state.displayedFromHistory && state.displayedJob.mode === "imageGenerate") {
      restoreImageGenerationSettings(state.displayedJob);
      if (state.displayedJob.source?.url) await restoreImageGenerationReference(state.displayedJob);
    }
    elements.resultCard.hidden = true;
    renderActiveWorkspace();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    showToast(`无法恢复这条历史的原图：${friendlyError(error)}`);
  }
}

async function restoreImageGenerationReference(job) {
  const response = await fetch(job.source.url, { headers: { Accept: "image/*" } });
  if (!response.ok) throw new Error(`读取参考图失败：HTTP ${response.status}`);
  const blob = await response.blob();
  state.workspaces.imageGenerate.references = [{
    file: null,
    name: job.source.filename || "历史参考图.png",
    dataUrl: await fileToDataUrl(blob)
  }];
  state.workspaces.imageGenerate.comparisonOriginal = state.workspaces.imageGenerate.references[0].dataUrl;
  renderImageGenerationReferences();
  updateImageGenerationModeNote();
}

function restoreImageGenerationSettings(job) {
  const workspace = state.workspaces.imageGenerate;
  workspace.references = [];
  workspace.comparisonOriginal = "";
  elements.imageGenerationPrompt.value = job.prompt || "";
  if (state.backend?.providers?.[job.providerId]) elements.imageGenerationProvider.value = job.providerId;
  populateImageGenerationModels();
  if ([...elements.imageGenerationModel.options].some((option) => option.value === job.model)) {
    elements.imageGenerationModel.value = job.model;
    updateImageGenerationOptions();
  }
  const presets = window.ImageGeneration.isSeedreamModel(job.model)
    ? window.ImageGeneration.SEEDREAM_PRESET_SIZES
    : window.ImageGeneration.GPT_PRESET_SIZES;
  const storedRatio = job.generation?.aspectRatio;
  const storedTier = job.generation?.sizeTier;
  if (storedRatio && presets[storedRatio]?.[storedTier] === job.size) {
    elements.imageGenerationRatio.value = storedRatio;
    elements.imageGenerationTier.value = storedTier;
  } else {
    for (const [ratio, tiers] of Object.entries(presets)) {
      const tier = Object.entries(tiers).find(([, size]) => size === job.size)?.[0];
      if (!tier) continue;
      elements.imageGenerationRatio.value = ratio;
      elements.imageGenerationTier.value = tier;
      break;
    }
  }
  if (job.generation?.quality) elements.imageGenerationQuality.value = job.generation.quality;
  if (job.generation?.outputFormat) elements.imageGenerationOutputFormat.value = job.generation.outputFormat;
  if (job.generation?.promptOptimization) elements.imageGenerationPromptOptimization.value = job.generation.promptOptimization;
  renderImageGenerationReferences();
  updateImageGenerationPromptCount();
  updateImageGenerationSize();
  updateImageGenerationModeNote();
}

async function restoreHistoricalSource(job) {
  const response = await fetch(job.source.url, { headers: { Accept: "image/*" } });
  if (!response.ok) throw new Error(`读取原图失败：HTTP ${response.status}`);
  const blob = await response.blob();
  const dataUrl = await fileToDataUrl(blob);
  const image = await loadImage(dataUrl);
  const base = {
    file: null,
    dataUrl,
    image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    name: job.source.filename || "history-source.png",
    mime: blob.type || job.source.mime || "image/png",
    bytes: blob.size || job.source.bytes || 0
  };
  const workspace = currentWorkspace();
  workspace.base = base;
  workspace.comparisonOriginal = dataUrl;
  workspace.lastResult = job;
  if (state.mode === "productBackground") workspace.background = null;
  if (state.mode === "materialTransfer") workspace.material = null;
  if (state.mode === "precise") {
    state.marks = [];
    state.undoStack = [];
    state.references = [];
    renderReferences();
    syncPreciseSizeToImage();
  } else if (state.mode === "portraitStudio") {
    workspace.references = [];
    workspace.metrics = analyzePortraitPhoto(base);
    workspace.seriesId = job.portrait?.seriesId || crypto.randomUUID();
    workspace.seriesResults = { [job.portrait?.shotId || "hero"]: job };
    elements.portraitAdultConsent.checked = false;
    elements.portraitRightsConsent.checked = false;
    updatePortraitRecommendations();
    renderPortraitSeries();
  }
  state.base = base;
  state.displayedFromHistory = false;
}

function statusLabel(status) {
  return ({ queued: "排队", preprocessing: "预处理", submitting: "生成中", saving: "保存中", succeeded: "成功", failed: "失败" })[status] || status;
}

function modeLabel(mode) {
  return ({
    imageGenerate: "图片生成",
    expand: "图片扩展",
    precise: "精确图片编辑",
    productBackground: "产品换背景",
    materialTransfer: "材质迁移",
    stickerPack: "Q版表情包大师",
    portraitStudio: "人像写真",
    model3d: "3D模型预览"
  })[mode] || mode;
}

function jobModeLabel(job) {
  if (job?.mode !== "portraitStudio") return modeLabel(job?.mode);
  return `${modeLabel(job.mode)} · ${job.portrait?.shotLabel || portraitShotLabel(job.portrait?.shotId || "hero")}`;
}

function setStep(active) {
  $$(".step").forEach((step) => {
    const number = Number(step.dataset.step);
    step.classList.toggle("active", number === active);
    step.classList.toggle("done", number < active);
  });
}

function friendlyError(error) {
  const text = String(error?.message || error || "未知错误");
  if (/API Key|api key|unauthorized|401/i.test(text)) return `API Key 未配置、无效或没有模型权限。\n${text}`;
  if (/quota|billing|insufficient/i.test(text)) return `上游账户额度不足，请充值或更换 API Key。\n${text}`;
  if (/safety|moderation|content.policy/i.test(text)) return `内容被模型安全审核拦截，请调整图片或编辑要求。\n${text}`;
  if (/429|rate limit/i.test(text)) return `请求过于频繁，已达到上游限流。请稍后再试。\n${text}`;
  if (/15 分钟|timeout|timed out/i.test(text)) return `等待超时。为避免重复扣费，程序没有自动重新提交；请先检查上游账单。\n${text}`;
  return text;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) }
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/api/auth/")) {
      state.currentUser = null;
      showAuth("login", "登录会话已过期，请重新登录。");
    }
    const error = new Error(data?.error || data?.message || data?.raw || `HTTP ${response.status}`);
    error.code = data?.code || "HTTP_ERROR";
    error.status = response.status;
    throw error;
  }
  return data;
}

function showToast(message) {
  elements.toast.textContent = String(message || "");
  elements.toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { elements.toast.hidden = true; }, 4500);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("浏览器无法解码这张图片，请改用 PNG、JPEG 或 WebP"));
    image.src = source;
  });
}

function parseSize(value) {
  const match = /^(\d+)x(\d+)$/i.exec(String(value || ""));
  return match ? { width: Number(match[1]), height: Number(match[2]) } : null;
}

function isGptImage2Model(model) {
  return /^gpt-image-2(?:\.|$|-)/i.test(String(model || ""));
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function formatBytes(bytes) {
  const number = Number(bytes) || 0;
  if (number < 1024) return `${number} B`;
  if (number < 1024 * 1024) return `${(number / 1024).toFixed(1)} KB`;
  return `${(number / 1024 / 1024).toFixed(1)} MB`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function importLocalImage(file, targetMode = "imageGenerate", context = null) {
  if (!(file instanceof File) || !String(file.type || "").startsWith("image/")) throw new Error("3D 取景截图不是有效图片");
  if (state.busy) throw new Error("当前有图片任务正在提交，请完成后再发送 3D 取景");
  if (targetMode === "imageGenerate") {
    setMode("imageGenerate");
    if (state.mode !== "imageGenerate") throw new Error("暂时无法切换到图片生成模块");
    await addImageGenerationReferenceFiles([file]);
    renderImageGenerationWorkspace();
    document.querySelector("#imageGenerationStage")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (targetMode === "precise") {
    setMode("precise");
    if (state.mode !== "precise") throw new Error("暂时无法切换到精确图片编辑模块");
    const loaded = await loadBaseFile(file);
    if (!loaded) throw new Error('人物参考图无法打开');
    document.querySelector("#editStageShell")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (targetMode === "materialTransfer") {
    setMode("materialTransfer");
    if (state.mode !== "materialTransfer") throw new Error("暂时无法切换到材质迁移模块");
    await loadMaterialTransferFile("structure", file);
    document.querySelector("#materialTransferUploader")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (targetMode === "portraitStudio") {
    setMode("portraitStudio");
    state.studioPerson = null;
    await loadBaseFile(file);
    await refreshStudioPeople();
    if (context?.projectId && context?.versionId && state.workspaces.portraitStudio.base && Array.from(elements.studioPersonSelect.options).some((option) => option.value === `${context.projectId}|${context.versionId}`)) {
      state.studioPerson = { projectId: context.projectId, versionId: context.versionId };
      elements.studioPersonSelect.value = `${context.projectId}|${context.versionId}`;
      elements.studioUsePersonButton.disabled = false;
    }
    updateStudioSaveButton();
    return;
  }
  throw new Error("不支持的图片接收模块");
}

window.GuguImageEdit = Object.assign(window.GuguImageEdit || {}, { importLocalImage });

async function installPwa() {
  if (!state.installPrompt) {
    showToast("请使用 Edge 或 Chrome 菜单中的“安装此应用”功能");
    return;
  }
  state.installPrompt.prompt();
  await state.installPrompt.userChoice;
  state.installPrompt = null;
  elements.installButton.hidden = true;
}

function registerPwa() {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
}
