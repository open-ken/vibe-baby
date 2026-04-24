const assert = require("node:assert/strict");

const {
  getTemplateFit,
  getPhotoReadiness,
  buildPromptPayload,
  buildGptPastePrompt
} = require("../app-core");

const template = {
  id: "cream-100days",
  name: "奶油系百日照",
  description: "干净、柔和、影楼感强，适合满月和百日纪念。",
  ageRange: [0, 6],
  tags: ["百日照", "奶油风"],
  promptFragments: {
    subject: "a baby portrait with soft natural baby proportions",
    scene: "soft cream studio backdrop",
    styling: "soft knitwear",
    lighting: "diffused studio lighting",
    composition: "close-up baby portrait"
  }
};

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

test("rates age inside template range as a strong fit", () => {
  const fit = getTemplateFit(template, 4);

  assert.equal(fit.level, "strong");
  assert.match(fit.label, /很适合/);
});

test("warns when age is outside template range", () => {
  const fit = getTemplateFit(template, 14);

  assert.equal(fit.level, "weak");
  assert.match(fit.message, /不太推荐/);
});

test("describes missing reference photo as weaker identity guidance", () => {
  const readiness = getPhotoReadiness(false);

  assert.equal(readiness.level, "missing");
  assert.match(readiness.message, /身份保留/);
});

test("builds explicit prompt sections for future generation APIs", () => {
  const payload = buildPromptPayload({
    template,
    controls: {
      ageMonths: 4,
      fidelity: 88,
      mood: "柔和",
      backgroundComplexity: 18,
      propLevel: 20,
      aspectRatio: "4:5",
      outputCount: 4,
      notes: "更干净一点"
    },
    photo: {
      hasUploadedPhoto: true,
      uploadedPhotoName: "baby.jpg"
    },
    hints: {
      fidelity: "高度贴近本人",
      background: "极简背景",
      prop: "少量道具"
    }
  });

  assert.equal(payload.input.photoReadiness.level, "ready");
  assert.equal(payload.template.fit.level, "strong");
  assert.match(payload.prompt.positivePrompt, /baby portrait/);
  assert.match(payload.prompt.identityInstruction, /preserve facial identity/);
  assert.match(payload.prompt.safetyInstruction, /age-appropriate baby portrait/);
  assert.match(payload.prompt.negativePrompt, /adult face/);
});

test("builds a GPT-ready paste prompt when a photo is uploaded", () => {
  const payload = buildPromptPayload({
    template,
    controls: {
      ageMonths: 4,
      fidelity: 88,
      mood: "柔和",
      backgroundComplexity: 18,
      propLevel: 20,
      aspectRatio: "4:5",
      outputCount: 4,
      notes: ""
    },
    photo: {
      hasUploadedPhoto: true,
      uploadedPhotoName: "baby.jpg"
    },
    hints: {
      fidelity: "高度贴近本人",
      background: "极简背景",
      prop: "少量道具"
    }
  });

  const text = buildGptPastePrompt(payload);

  assert.match(text, /请根据我上传的宝宝参考照/);
  assert.match(text, /```json/);
  assert.match(text, /"template"/);
});

test("asks GPT to request a baby photo when no photo is uploaded", () => {
  const payload = buildPromptPayload({
    template,
    controls: {
      ageMonths: 4,
      fidelity: 88,
      mood: "柔和",
      backgroundComplexity: 18,
      propLevel: 20,
      aspectRatio: "4:5",
      outputCount: 4,
      notes: ""
    },
    photo: {
      hasUploadedPhoto: false,
      uploadedPhotoName: ""
    },
    hints: {
      fidelity: "高度贴近本人",
      background: "极简背景",
      prop: "少量道具"
    }
  });

  const text = buildGptPastePrompt(payload);

  assert.match(text, /如果没有收到宝宝参考照/);
  assert.match(text, /请上传您的宝宝的照片即可生成。/);
});

for (const { name, fn } of tests) {
  fn();
  console.log(`ok - ${name}`);
}

console.log(`${tests.length} tests passed`);
