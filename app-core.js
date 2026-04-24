(function initCore(globalScope) {
  const HUMAN_KEYS = {
    fidelity: "像本人程度",
    mood: "画面氛围",
    backgroundComplexity: "背景复杂度",
    propLevel: "道具丰富度",
    aspectRatio: "输出比例"
  };

  function labelByLevel(n, low, mid, high) {
    if (n <= 33) return low;
    if (n <= 66) return mid;
    return high;
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

  function getTemplateFit(template, ageMonths) {
    const [minAge = 0, maxAge = 36] = template.ageRange || [];
    const age = Number(ageMonths || 0);

    if (age >= minAge && age <= maxAge) {
      return {
        level: "strong",
        label: "很适合",
        message: `很适合当前 ${age} 个月宝宝，模板推荐月龄为 ${minAge}-${maxAge} 个月。`
      };
    }

    const distance = age < minAge ? minAge - age : age - maxAge;
    if (distance <= 3) {
      return {
        level: "ok",
        label: "可用但略偏",
        message: `可用但略偏，当前 ${age} 个月，模板推荐月龄为 ${minAge}-${maxAge} 个月。`
      };
    }

    return {
      level: "weak",
      label: "不太推荐",
      message: `不太推荐当前月龄使用，当前 ${age} 个月，模板推荐月龄为 ${minAge}-${maxAge} 个月。`
    };
  }

  function getPhotoReadiness(hasUploadedPhoto) {
    if (hasUploadedPhoto) {
      return {
        level: "ready",
        label: "已上传参考照",
        message: "已上传参考照，可以更好保留宝宝身份特征。"
      };
    }

    return {
      level: "missing",
      label: "未上传参考照",
      message: "未上传参考照，身份保留能力较弱；建议先上传一张清晰正脸或半身照。"
    };
  }

  function buildPositivePrompt(template, controls, ageDirection) {
    return [
      template.promptFragments.subject,
      template.promptFragments.scene,
      inferBackgroundPrompt(controls.backgroundComplexity),
      template.promptFragments.styling,
      inferPropPrompt(controls.propLevel),
      template.promptFragments.lighting,
      inferMoodPrompt(controls.mood),
      template.promptFragments.composition,
      ageDirection.composition,
      `pose: ${ageDirection.pose}`
    ].filter(Boolean).join("; ");
  }

  function buildPromptPayload({ template, controls, photo, hints }) {
    const ageMonths = Number(controls.ageMonths || 0);
    const fidelity = Number(controls.fidelity || 0);
    const backgroundComplexity = Number(controls.backgroundComplexity || 0);
    const propLevel = Number(controls.propLevel || 0);
    const outputCount = Number(controls.outputCount || 4);
    const ageDirection = getAgeDirection(ageMonths);
    const templateFit = getTemplateFit(template, ageMonths);
    const photoReadiness = getPhotoReadiness(Boolean(photo.hasUploadedPhoto));
    const identityInstruction = inferIdentityPrompt(fidelity);
    const safetyInstruction = "age-appropriate baby portrait, natural baby proportions, safe pose, no adult-like styling";
    const negativePrompt = "adult face, mature styling, unsafe props, harsh shadows, cluttered composition, distorted anatomy";

    return {
      version: "1.1",
      generatedAt: new Date().toISOString(),
      mode: "prompt-json-only",
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        tags: template.tags,
        ageRange: template.ageRange,
        fit: templateFit
      },
      input: {
        ageMonths,
        hasUploadedPhoto: Boolean(photo.hasUploadedPhoto),
        uploadedPhotoName: photo.uploadedPhotoName || "",
        photoReadiness,
        notes: controls.notes || ""
      },
      parameters: {
        humanReadable: {
          [HUMAN_KEYS.fidelity]: {
            value: fidelity,
            meaning: hints.fidelity || ""
          },
          [HUMAN_KEYS.mood]: controls.mood,
          [HUMAN_KEYS.backgroundComplexity]: {
            value: backgroundComplexity,
            meaning: hints.background || ""
          },
          [HUMAN_KEYS.propLevel]: {
            value: propLevel,
            meaning: hints.prop || ""
          },
          [HUMAN_KEYS.aspectRatio]: controls.aspectRatio
        },
        inferredPromptControls: {
          identityPrompt: identityInstruction,
          moodPrompt: inferMoodPrompt(controls.mood),
          backgroundPrompt: inferBackgroundPrompt(backgroundComplexity),
          propPrompt: inferPropPrompt(propLevel),
          ageDirection,
          templateFit,
          photoReadiness
        }
      },
      promptBlocks: {
        subjectPrompt: template.promptFragments.subject,
        scenePrompt: `${template.promptFragments.scene}; ${inferBackgroundPrompt(backgroundComplexity)}`,
        stylingPrompt: `${template.promptFragments.styling}; ${inferPropPrompt(propLevel)}`,
        lightingPrompt: `${template.promptFragments.lighting}; ${inferMoodPrompt(controls.mood)}`,
        compositionPrompt: `${template.promptFragments.composition}; ${ageDirection.composition}; pose: ${ageDirection.pose}`,
        identityPrompt: identityInstruction,
        safetyPrompt: safetyInstruction,
        negativePrompt
      },
      prompt: {
        positivePrompt: buildPositivePrompt(template, controls, ageDirection),
        identityInstruction,
        safetyInstruction,
        negativePrompt,
        userNotes: controls.notes || ""
      },
      output: {
        count: outputCount,
        aspectRatio: controls.aspectRatio,
        placeholdersOnly: true
      },
      nextStep: "connect generateWithOpenAI(payload) when generation API is ready"
    };
  }

  function buildGptPastePrompt(payload) {
    return [
      "请根据我上传的宝宝参考照和下面的 Prompt JSON 生成宝宝摄影图片。",
      "",
      "如果没有收到宝宝参考照，请不要生成图片，只回复：请上传您的宝宝的照片即可生成。",
      "",
      "生成要求：",
      "- 严格保留宝宝身份特征、年龄感和自然比例。",
      "- 保持安全、自然、适龄的宝宝摄影姿态。",
      "- 不要成人化造型，不要成熟脸，不要危险道具。",
      "- 按 JSON 里的 template、prompt 和 output 配置执行。",
      "",
      "Prompt JSON:",
      "```json",
      JSON.stringify(payload, null, 2),
      "```"
    ].join("\n");
  }

  const api = {
    HUMAN_KEYS,
    labelByLevel,
    inferIdentityPrompt,
    inferMoodPrompt,
    inferBackgroundPrompt,
    inferPropPrompt,
    getAgeDirection,
    getTemplateFit,
    getPhotoReadiness,
    buildPromptPayload,
    buildGptPastePrompt
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.VibeBabyCore = api;
})(typeof window !== "undefined" ? window : globalThis);
