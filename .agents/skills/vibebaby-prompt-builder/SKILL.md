---
name: vibebaby-prompt-builder
description: Convert VibeBaby UI parameters and template data into a structured prompt payload for baby photography generation.
---

# VibeBaby Prompt Builder

## Purpose
Transform template JSON + user controls into a clean structured prompt payload.

## Expected inputs
- template object
- ageMonths
- fidelity
- mood
- backgroundComplexity
- propLevel
- aspectRatio
- outputCount
- uploaded photo presence
- optional notes

## Human-friendly control mapping

### fidelity
Represents how strongly the generated result should preserve the baby's identity.
- 0-30: loose resemblance
- 31-60: moderate resemblance
- 61-85: strong resemblance
- 86-100: very strong resemblance

Map to prompt language:
- low: inspired by the baby reference
- medium: preserve major facial traits
- high: strongly preserve facial identity and baby likeness
- very high: preserve facial identity, proportions, and key facial details as faithfully as possible

### mood
Possible values:
- 柔和
- 明亮
- 梦幻
- 高级
- 温暖
- 节日

Map to language:
- 柔和: soft, gentle, delicate, diffused light
- 明亮: bright, airy, clean highlights
- 梦幻: dreamy, whimsical, magical softness
- 高级: premium, editorial, refined, polished
- 温暖: warm, cozy, intimate
- 节日: festive, celebratory, joyful

### backgroundComplexity
- 0-30: minimal background
- 31-60: styled but controlled background
- 61-100: rich scenic background

### propLevel
- 0-30: almost no props
- 31-60: a few tasteful props
- 61-100: richer storytelling props

## Output requirements
Always produce a structured object with:
- subjectPrompt
- scenePrompt
- stylingPrompt
- lightingPrompt
- compositionPrompt
- identityPrompt
- safetyPrompt
- negativePrompt
- meta

## Safety and quality rules
- preserve baby age appropriateness
- avoid adult body proportions
- avoid glam makeup
- avoid sexualized or mature styling
- avoid horror, injury, unsafe props, dangerous poses
- avoid deformed hands or anatomy
- avoid extra limbs, fingers, duplicated features

## Example output
```json
{
  "subjectPrompt": "portrait of a baby, age-appropriate appearance, natural baby proportions",
  "scenePrompt": "soft cream studio background with minimal visual clutter",
  "stylingPrompt": "premium knitwear, soft baby styling, tasteful and delicate details",
  "lightingPrompt": "diffused studio lighting, soft shadows, creamy highlights",
  "compositionPrompt": "close-up portrait, centered framing, baby photography composition",
  "identityPrompt": "strongly preserve facial identity and baby likeness from the uploaded reference photo",
  "safetyPrompt": "age-appropriate baby portrait, safe pose, soft props only, no adult-like styling",
  "negativePrompt": "adult face, mature styling, extra fingers, extra limbs, distorted anatomy, harsh shadows, cluttered scene, low detail",
  "meta": {
    "aspectRatio": "4:5",
    "outputCount": 4,
    "mood": "柔和",
    "fidelity": 85
  }
}