const {
  HUMAN_KEYS,
  labelByLevel,
  getTemplateFit,
  buildPromptPayload: buildCorePromptPayload,
  buildGptPastePrompt
} = window.VibeBabyCore;

const templateSelect = document.getElementById("templateSelect");
const templateMeta = document.getElementById("templateMeta");
const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");
const previewPlaceholder = document.getElementById("previewPlaceholder");

const ageMonthsInput = document.getElementById("ageMonths");
const outputCountInput = document.getElementById("outputCount");
const aspectRatioInput = document.getElementById("aspectRatio");
const fidelityInput = document.getElementById("fidelity");
const moodInput = document.getElementById("mood");
const backgroundInput = document.getElementById("backgroundComplexity");
const propInput = document.getElementById("propLevel");
const notesInput = document.getElementById("notes");

const fidelityValue = document.getElementById("fidelityValue");
const backgroundValue = document.getElementById("backgroundValue");
const propValue = document.getElementById("propValue");

const fidelityHint = document.getElementById("fidelityHint");
const backgroundHint = document.getElementById("backgroundHint");
const propHint = document.getElementById("propHint");

const promptOutput = document.getElementById("promptOutput");
const summaryBox = document.getElementById("summaryBox");
const statusBox = document.getElementById("statusBox");
const resultGrid = document.getElementById("resultGrid");

const generateBtn = document.getElementById("generateBtn");
const copyPromptBtn = document.getElementById("copyPromptBtn");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");

const LOCAL_STATE_KEY = "vibebaby-state-v2";
const FALLBACK_TEMPLATE_FILES = [
  "cream-100days.json",
  "forest-fairy.json",
  "moon-dream.json",
  "pastel-bedtime.json",
  "minimal-korean.json",
  "birthday-party.json",
  "vintage-storybook.json",
  "christmas-wonderland.json"
];

let templates = [];
let currentPhotoName = "";
let currentPhotoUrl = "";

function getAspectRatioValue(ratio) {
  const map = {
    "4:5": "4 / 5",
    "3:4": "3 / 4",
    "1:1": "1 / 1",
    "16:9": "16 / 9"
  };
  return map[ratio] || "4 / 5";
}

async function loadTemplateFilesFromIndex() {
  try {
    const res = await fetch("./templates/index.json", { cache: "no-store" });
    if (!res.ok) throw new Error("index.json not found");
    const data = await res.json();
    if (!Array.isArray(data.files) || data.files.length === 0) {
      throw new Error("invalid template index");
    }
    return data.files;
  } catch {
    return FALLBACK_TEMPLATE_FILES;
  }
}

async function loadTemplates() {
  const files = await loadTemplateFilesFromIndex();
  const loaded = await Promise.all(
    files.map(async file => {
      const res = await fetch(`./templates/${file}`);
      if (!res.ok) throw new Error(`Template load failed: ${file}`);
      return res.json();
    })
  );

  templates = loaded;
  templateSelect.innerHTML = templates
    .map(template => `<option value="${template.id}">${template.name}</option>`)
    .join("");

  const saved = loadSavedState();
  if (saved && saved.templateId && templates.some(t => t.id === saved.templateId)) {
    templateSelect.value = saved.templateId;
  }

  applyTemplateDefaults();
  renderTemplateMeta();
  renderPrompt();
}

function getSelectedTemplate() {
  return templates.find(template => template.id === templateSelect.value) || templates[0];
}

function loadSavedState() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STATE_KEY) || "null");
  } catch {
    return null;
  }
}

function getCurrentControls() {
  return {
    ageMonths: Number(ageMonthsInput.value || 0),
    fidelity: Number(fidelityInput.value || 0),
    mood: moodInput.value,
    backgroundComplexity: Number(backgroundInput.value || 0),
    propLevel: Number(propInput.value || 0),
    aspectRatio: aspectRatioInput.value,
    outputCount: Number(outputCountInput.value || 4),
    notes: notesInput.value.trim()
  };
}

function saveState() {
  const payload = buildPromptPayload();
  const state = {
    templateId: payload.template.id,
    ageMonths: payload.input.ageMonths,
    fidelity: payload.parameters.humanReadable[HUMAN_KEYS.fidelity].value,
    mood: payload.parameters.humanReadable[HUMAN_KEYS.mood],
    backgroundComplexity: payload.parameters.humanReadable[HUMAN_KEYS.backgroundComplexity].value,
    propLevel: payload.parameters.humanReadable[HUMAN_KEYS.propLevel].value,
    aspectRatio: payload.parameters.humanReadable[HUMAN_KEYS.aspectRatio],
    outputCount: payload.output.count,
    notes: payload.input.notes
  };
  localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state));
}

function applyTemplateDefaults() {
  const template = getSelectedTemplate();
  if (!template) return;

  const saved = loadSavedState();
  const useSaved = saved && saved.templateId === template.id;
  const source = useSaved ? saved : template.defaultParams;

  fidelityInput.value = source.fidelity ?? template.defaultParams.fidelity;
  moodInput.value = source.mood ?? template.defaultParams.mood;
  backgroundInput.value = source.backgroundComplexity ?? template.defaultParams.backgroundComplexity;
  propInput.value = source.propLevel ?? template.defaultParams.propLevel;
  aspectRatioInput.value = source.aspectRatio ?? template.defaultParams.aspectRatio;
  outputCountInput.value = String(source.outputCount ?? template.defaultParams.outputCount);

  if (saved && saved.ageMonths !== undefined) {
    ageMonthsInput.value = saved.ageMonths;
  }
  if (saved && saved.notes !== undefined) {
    notesInput.value = saved.notes;
  }

  syncRangeDisplay();
}

function syncRangeDisplay() {
  const fidelity = Number(fidelityInput.value);
  const background = Number(backgroundInput.value);
  const prop = Number(propInput.value);

  fidelityValue.textContent = String(fidelity);
  backgroundValue.textContent = String(background);
  propValue.textContent = String(prop);

  fidelityHint.textContent = labelByLevel(
    fidelity,
    "风格化优先，允许与本人有差异",
    "保留主要五官特征",
    "高度贴近本人，优先保留真实神态"
  );

  backgroundHint.textContent = labelByLevel(
    background,
    "极简背景，注意力集中在宝宝",
    "中等布景，兼顾主体与氛围",
    "场景丰富，强调故事感"
  );

  propHint.textContent = labelByLevel(
    prop,
    "少量道具，干净克制",
    "适量道具，画面更有层次",
    "道具更丰富，但宝宝仍是主角"
  );
}

function renderTemplateMeta() {
  const template = getSelectedTemplate();
  if (!template) return;

  const tags = Array.isArray(template.tags) ? template.tags : [];
  const [minAge, maxAge] = template.ageRange || [0, 24];
  const fit = getTemplateFit(template, Number(ageMonthsInput.value || 0));

  templateMeta.innerHTML = `
    <div class="template-title">${template.name}</div>
    <p>${template.description}</p>
    <p>推荐月龄：${minAge}-${maxAge} 个月</p>
    <p class="fit-note ${fit.level}">${fit.label}：${fit.message}</p>
    <div class="tag-row">${tags.map(tag => `<span class="tag">${tag}</span>`).join("")}</div>
  `;
}

function buildPromptPayload() {
  const template = getSelectedTemplate();
  const controls = getCurrentControls();

  return buildCorePromptPayload({
    template,
    controls,
    photo: {
      hasUploadedPhoto: Boolean(currentPhotoUrl),
      uploadedPhotoName: currentPhotoName
    },
    hints: {
      fidelity: fidelityHint.textContent,
      background: backgroundHint.textContent,
      prop: propHint.textContent
    }
  });
}

function renderStatus(payload) {
  const fit = payload.template.fit;
  const photoReadiness = payload.input.photoReadiness;

  statusBox.innerHTML = `
    <div class="status-item ${fit.level}">
      <strong>${fit.label}</strong>
      <span>${fit.message}</span>
    </div>
    <div class="status-item ${photoReadiness.level}">
      <strong>${photoReadiness.label}</strong>
      <span>${photoReadiness.message}</span>
    </div>
  `;
}

function renderSummary(payload = buildPromptPayload()) {
  summaryBox.innerHTML = `
    <div><strong>模板</strong><span>${payload.template.name}</span></div>
    <div><strong>月龄</strong><span>${payload.input.ageMonths} 个月</span></div>
    <div><strong>像本人程度</strong><span>${payload.parameters.humanReadable[HUMAN_KEYS.fidelity].value}</span></div>
    <div><strong>画面氛围</strong><span>${payload.parameters.humanReadable[HUMAN_KEYS.mood]}</span></div>
    <div><strong>背景复杂度</strong><span>${payload.parameters.humanReadable[HUMAN_KEYS.backgroundComplexity].value}</span></div>
    <div><strong>道具丰富度</strong><span>${payload.parameters.humanReadable[HUMAN_KEYS.propLevel].value}</span></div>
    <div><strong>输出比例</strong><span>${payload.output.aspectRatio}</span></div>
    <div><strong>输出张数</strong><span>${payload.output.count} 张</span></div>
    <div><strong>参考照</strong><span>${payload.input.photoReadiness.label}</span></div>
  `;
}

function renderPlaceholders(count = Number(outputCountInput.value || 4), ratio = aspectRatioInput.value) {
  resultGrid.innerHTML = "";
  resultGrid.style.setProperty("--result-aspect", getAspectRatioValue(ratio));

  for (let i = 0; i < count; i += 1) {
    const card = document.createElement("div");
    card.className = "result-card";
    card.innerHTML = `
      <span>输出位 ${i + 1}</span>
      <small>${ratio} · 等待接入生成能力</small>
    `;
    resultGrid.appendChild(card);
  }
}

function renderPrompt() {
  const payload = buildPromptPayload();
  promptOutput.textContent = JSON.stringify(payload, null, 2);
  renderTemplateMeta();
  renderStatus(payload);
  renderSummary(payload);
  renderPlaceholders(payload.output.count, payload.output.aspectRatio);
}

function resetState() {
  localStorage.removeItem(LOCAL_STATE_KEY);
  notesInput.value = "";
  ageMonthsInput.value = 3;
  templateSelect.value = templates[0]?.id || "";
  currentPhotoName = "";
  if (currentPhotoUrl) {
    URL.revokeObjectURL(currentPhotoUrl);
  }
  currentPhotoUrl = "";
  photoInput.value = "";
  photoPreview.src = "";
  photoPreview.style.display = "none";
  previewPlaceholder.style.display = "flex";

  applyTemplateDefaults();
  renderTemplateMeta();
  renderPrompt();
}

async function copyPromptJson() {
  const pastePrompt = buildGptPastePrompt(buildPromptPayload());

  try {
    await navigator.clipboard.writeText(pastePrompt);
    copyPromptBtn.textContent = "已复制";
  } catch {
    promptOutput.textContent = pastePrompt;
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(promptOutput);
    selection.removeAllRanges();
    selection.addRange(range);
    copyPromptBtn.textContent = "已选中";
  }

  window.setTimeout(() => {
    copyPromptBtn.textContent = "复制给 GPT";
  }, 1200);
}

async function generateWithOpenAI(promptPayload) {
  void promptPayload;
  // TODO: 接入 OpenAI 图像生成能力时，在这里实现实际调用。
}

photoInput.addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (!file) return;

  currentPhotoName = file.name;
  if (currentPhotoUrl) {
    URL.revokeObjectURL(currentPhotoUrl);
  }
  currentPhotoUrl = URL.createObjectURL(file);

  photoPreview.src = currentPhotoUrl;
  photoPreview.style.display = "block";
  previewPlaceholder.style.display = "none";
  renderPrompt();
});

templateSelect.addEventListener("change", () => {
  applyTemplateDefaults();
  renderPrompt();
});

[fidelityInput, backgroundInput, propInput].forEach(element => {
  element.addEventListener("input", () => {
    syncRangeDisplay();
    renderPrompt();
  });
});

[
  ageMonthsInput,
  outputCountInput,
  aspectRatioInput,
  moodInput,
  notesInput
].forEach(element => {
  element.addEventListener("input", renderPrompt);
  element.addEventListener("change", renderPrompt);
});

generateBtn.addEventListener("click", async () => {
  const payload = buildPromptPayload();
  renderPrompt();
  await generateWithOpenAI(payload);
});

copyPromptBtn.addEventListener("click", copyPromptJson);

saveBtn.addEventListener("click", () => {
  saveState();
  alert("已保存当前配置");
});

resetBtn.addEventListener("click", resetState);

loadTemplates().catch(error => {
  promptOutput.textContent = JSON.stringify({
    error: "模板加载失败",
    detail: error.message
  }, null, 2);
});
