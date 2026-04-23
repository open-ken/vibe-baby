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
const resultGrid = document.getElementById("resultGrid");

const generateBtn = document.getElementById("generateBtn");
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

function labelByLevel(n, low, mid, high) {
  if (n <= 33) return low;
  if (n <= 66) return mid;
  return high;
}

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

function saveState() {
  const payload = buildPromptPayload();
  const state = {
    templateId: payload.template.id,
    ageMonths: payload.input.ageMonths,
    fidelity: payload.parameters.humanReadable["像本人程度"].value,
    mood: payload.parameters.humanReadable["画面氛围"],
    backgroundComplexity: payload.parameters.humanReadable["背景复杂度"].value,
    propLevel: payload.parameters.humanReadable["道具丰富度"].value,
    aspectRatio: payload.parameters.humanReadable["输出比例"],
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

  templateMeta.innerHTML = `
    <div class="template-title">${template.name}</div>
    <p>${template.description}</p>
    <p>推荐月龄：${minAge}-${maxAge} 月</p>
    <div class="tag-row">${tags.map(tag => `<span class="tag">${tag}</span>`).join("")}</div>
  `;
}

function inferIdentityPrompt(fidelity) {
  if (fidelity <= 30) return "loosely inspired by the baby reference photo";
  if (fidelity <= 60) return "preserve major facial traits from the baby reference photo";
  if (fidelity <= 85) return "strongly preserve facial identity and baby likeness from the reference photo";
  return "preserve facial identity, baby likeness, proportions, and key facial details as faithfully as possible";
}

function inferMoodPrompt(mood) {
  const map = {
    "柔和": "soft, gentle, delicate, diffused light",
    "明亮": "bright, airy, clean highlights",
    "梦幻": "dreamy, whimsical, magical softness",
    "高级": "premium, editorial, refined, polished",
    "温暖": "warm, cozy, intimate",
    "节日": "festive, celebratory, joyful"
  };
  return map[mood] || map["柔和"];
}

function inferBackgroundPrompt(value) {
  if (value <= 30) return "minimal clean background with very low clutter";
  if (value <= 60) return "styled but controlled background with balanced scene detail";
  return "rich scenic background with stronger environmental storytelling";
}

function inferPropPrompt(value) {
  if (value <= 30) return "minimal props only";
  if (value <= 60) return "a few tasteful props";
  return "richer storytelling props while keeping the baby as the visual focus";
}

function getAgeDirection(ageMonths) {
  if (ageMonths <= 3) {
    return {
      stage: "newborn",
      composition: "close-up or half-body newborn portrait",
      pose: "lying down or gently supported safe pose",
      note: "优先柔和包裹感，避免复杂动作"
    };
  }

  if (ageMonths <= 8) {
    return {
      stage: "infant",
      composition: "supported sitting or half-body playful portrait",
      pose: "gentle supported sitting or tummy-time style pose",
      note: "强调自然互动，保持安全稳定"
    };
  }

  return {
    stage: "older-baby",
    composition: "environmental portrait or playful half-body portrait",
    pose: "active joyful seated or naturally playful pose",
    note: "可加入成长纪念与节日叙事感"
  };
}

function buildPromptPayload() {
  const template = getSelectedTemplate();
  const ageMonths = Number(ageMonthsInput.value || 0);
  const fidelity = Number(fidelityInput.value || 0);
  const mood = moodInput.value;
  const backgroundComplexity = Number(backgroundInput.value || 0);
  const propLevel = Number(propInput.value || 0);
  const aspectRatio = aspectRatioInput.value;
  const outputCount = Number(outputCountInput.value || 4);
  const notes = notesInput.value.trim();
  const ageDirection = getAgeDirection(ageMonths);

  return {
    version: "1.0",
    generatedAt: new Date().toISOString(),
    mode: "prompt-json-only",
    template: {
      id: template.id,
      name: template.name,
      description: template.description,
      tags: template.tags,
      ageRange: template.ageRange
    },
    input: {
      ageMonths,
      hasUploadedPhoto: Boolean(currentPhotoUrl),
      uploadedPhotoName: currentPhotoName || "",
      notes
    },
    parameters: {
      humanReadable: {
        "像本人程度": {
          value: fidelity,
          meaning: fidelityHint.textContent
        },
        "画面氛围": mood,
        "背景复杂度": {
          value: backgroundComplexity,
          meaning: backgroundHint.textContent
        },
        "道具丰富度": {
          value: propLevel,
          meaning: propHint.textContent
        },
        "输出比例": aspectRatio
      },
      inferredPromptControls: {
        identityPrompt: inferIdentityPrompt(fidelity),
        moodPrompt: inferMoodPrompt(mood),
        backgroundPrompt: inferBackgroundPrompt(backgroundComplexity),
        propPrompt: inferPropPrompt(propLevel),
        ageDirection
      }
    },
    promptBlocks: {
      subjectPrompt: template.promptFragments.subject,
      scenePrompt: `${template.promptFragments.scene}; ${inferBackgroundPrompt(backgroundComplexity)}`,
      stylingPrompt: `${template.promptFragments.styling}; ${inferPropPrompt(propLevel)}`,
      lightingPrompt: `${template.promptFragments.lighting}; ${inferMoodPrompt(mood)}`,
      compositionPrompt: `${template.promptFragments.composition}; ${ageDirection.composition}; pose: ${ageDirection.pose}`,
      identityPrompt: inferIdentityPrompt(fidelity),
      safetyPrompt: "age-appropriate baby portrait, natural baby proportions, safe pose, no adult-like styling",
      negativePrompt: "adult face, mature styling, unsafe props, harsh shadows, cluttered composition, distorted anatomy"
    },
    output: {
      count: outputCount,
      aspectRatio,
      placeholdersOnly: true
    },
    nextStep: "connect generateWithOpenAI(payload) when generation API is ready"
  };
}

function renderSummary(payload = buildPromptPayload()) {
  summaryBox.innerHTML = `
    <div><strong>模板</strong><span>${payload.template.name}</span></div>
    <div><strong>月龄</strong><span>${payload.input.ageMonths} 个月</span></div>
    <div><strong>像本人程度</strong><span>${payload.parameters.humanReadable["像本人程度"].value}</span></div>
    <div><strong>画面氛围</strong><span>${payload.parameters.humanReadable["画面氛围"]}</span></div>
    <div><strong>背景复杂度</strong><span>${payload.parameters.humanReadable["背景复杂度"].value}</span></div>
    <div><strong>道具丰富度</strong><span>${payload.parameters.humanReadable["道具丰富度"].value}</span></div>
    <div><strong>输出比例</strong><span>${payload.output.aspectRatio}</span></div>
    <div><strong>输出张数</strong><span>${payload.output.count} 张</span></div>
    <div><strong>已上传参考照</strong><span>${payload.input.hasUploadedPhoto ? "是" : "否"}</span></div>
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
  photoPreview.src = "";
  photoPreview.style.display = "none";
  previewPlaceholder.style.display = "flex";

  applyTemplateDefaults();
  renderTemplateMeta();
  renderPrompt();
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
  renderTemplateMeta();
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
