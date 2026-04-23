# VibeBaby Agent Guide

## Project goal
Build a minimal personal-use VibeBaby tool for parameterized baby photography generation.

This is not a production app.
This is not a Next.js project.
This is not a backend project.

The goal is:
- keep the directory very small
- use static HTML/CSS/JS
- use local JSON templates
- support image upload, template selection, parameter editing, and prompt generation
- keep everything understandable and editable by one person

## Product scope
The tool should allow:
1. upload one baby photo
2. choose one of 8 photography templates
3. adjust a few human-friendly parameters
4. generate a structured prompt payload
5. display result placeholders in the UI
6. save recent settings in localStorage

Do not add:
- auth
- database
- server
- build tools
- framework migration
- payment
- admin backend
- complex optimization

## UX principles
- make the interface feel like a small creative studio
- prioritize clarity over feature count
- avoid technical jargon in the UI
- use human-friendly labels such as:
  - 像本人程度
  - 画面氛围
  - 背景复杂度
  - 道具丰富度
  - 输出比例
- default to a calm, premium, soft visual style

## Technical principles
- plain HTML + CSS + JS only
- no dependencies unless explicitly requested
- keep files small and readable
- prefer modular but simple JavaScript
- templates live in /templates as JSON
- app state should be stored in memory and localStorage
- uploaded photos should be previewed locally with FileReader or URL.createObjectURL

## Prompt-generation principles
- never expose low-level model parameters directly in the UI
- UI controls should map to higher-level creative intent
- output should be a structured prompt object
- preserve baby identity strongly
- avoid adult-like styling
- avoid unsafe or unrealistic instructions
- favor studio-quality, soft, tasteful, age-appropriate photography language

## Working rules for Codex
When editing this project:
1. preserve the minimal architecture
2. do not introduce frameworks
3. do not rename files unless necessary
4. keep comments useful and short
5. keep Chinese UI copy natural
6. prefer incremental improvement
7. when adding new template logic, keep it data-driven in JSON
8. do not hardcode template-specific behavior if it can live in template data

## Skills to use
- vibebaby-template-picker: choose the best template or explain template fit
- vibebaby-prompt-builder: turn UI parameters + template data into a structured prompt
- vibebaby-photo-director: enforce baby-age-appropriate photography direction

## First priority tasks
1. build a working studio.html with left / center / right layout
2. load all templates from /templates
3. allow choosing template and adjusting parameters
4. generate structured output in JSON
5. save and restore last-used settings
6. make the tool pleasant enough for personal daily use

## Output style
When presenting changes:
- explain what changed
- explain why it helps the VibeBaby workflow
- keep explanations brief