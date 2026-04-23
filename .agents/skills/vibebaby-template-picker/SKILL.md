---
name: vibebaby-template-picker
description: Choose the most suitable baby photography template based on age, vibe, and scene intent.
---

# VibeBaby Template Picker

## Purpose
Help select the best template from the local /templates JSON files.

## Inputs
Possible user or system inputs:
- age in months
- desired vibe
- shooting purpose
- preferred background complexity
- preferred ratio
- seasonal or holiday context

## Responsibilities
1. Recommend one best-fit template
2. Explain why the template matches
3. Warn when a template is not suitable for the baby's stage
4. Suggest 1-2 backup templates if relevant

## Selection logic
Use these rules:

### Age fit
- 0-3 months:
  - prefer wrapped, lying, close-up, soft studio, dreamy minimal scenes
  - avoid overly dynamic action scenes
- 4-8 months:
  - prefer sitting support poses, playful expression, light props
  - moderate fantasy is okay
- 9-18 months:
  - allow richer props, birthday scenes, more active expressions

### Scene fit
- if user wants clean / premium / timeless:
  - prefer cream, minimal, korean, bedtime pastel
- if user wants story / fantasy:
  - prefer forest, moon dream, storybook
- if user wants celebration:
  - prefer birthday, christmas

### Complexity fit
- low complexity:
  - cream, minimal-korean, pastel-bedtime
- medium complexity:
  - moon-dream, vintage-storybook, birthday
- high complexity:
  - forest-fairy, christmas

## Constraints
- always prioritize age appropriateness
- keep styling baby-safe, soft, and tasteful
- do not recommend adult-like fashion framing
- do not over-style newborns

## Output format
Return:
- selectedTemplateId
- reason
- backupTemplateIds
- warnings (if any)

## Example output
```json
{
  "selectedTemplateId": "cream-100days",
  "reason": "Best for 0-3 month babies with a soft premium studio look and simple background.",
  "backupTemplateIds": ["pastel-bedtime", "minimal-korean"],
  "warnings": []
}