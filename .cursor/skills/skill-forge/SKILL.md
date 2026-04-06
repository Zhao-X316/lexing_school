---
name: skill-forge
description: Creates high-quality, production-grade Cursor skills. Covers skill architecture, workflow design, prompt engineering, and structure. Use when the user wants to create a new skill, build a skill, design a skill, write a skill, update or improve an existing skill, or apply skill best practices.
---

# Skill Forge

IRON LAW: Every line in a skill must justify its token cost. If it doesn't make the agent's output better, more consistent, or more reliable — cut it.

## What is a Skill

A skill is an onboarding guide for the agent — procedural knowledge and domain expertise in a single place.

```
skill-name/
├── SKILL.md           # Required: workflow + instructions (<500 lines)
├── scripts/           # Optional: deterministic, repeatable operations
├── references/        # Optional: loaded into context on demand
└── assets/            # Optional: used in output, not loaded into context
```

**Default assumption: The agent is already very smart.** Only add what it doesn't already know.

## Workflow Checklist

- [ ] **Step 1: Understand the skill** – Purpose, 3+ concrete usage examples, trigger scenarios and keywords.
- [ ] **Step 2: Plan architecture** – What goes in scripts vs references vs SKILL.md; progressive loading; parameters if needed.
- [ ] **Step 3: Write description** – Third person; WHAT + WHEN; include trigger terms (description drives when the skill is applied).
- [ ] **Step 4: Write SKILL.md body**
  - [ ] Set Iron Law (one rule that prevents the most likely mistake).
  - [ ] Design workflow checklist (trackable steps; mark REQUIRED/BLOCKING where needed).
  - [ ] Add confirmation gates before destructive/generative operations.
  - [ ] Parameter system if applicable (e.g. --quick, --style).
  - [ ] Question-style instructions where possible; list anti-patterns (what NOT to do).
  - [ ] Pre-delivery checklist (concrete, verifiable checks; no placeholders like TODO/FIXME).
- [ ] **Step 5: Build resources** – Scripts (document command/args only in SKILL.md); references (one level deep, clear "when to load"); assets for output only.
- [ ] **Step 6: Review** – SKILL.md under 500 lines; description has triggers; no vague "ensure good quality"; present summary to user before finalizing.
- [ ] **Step 7: Iterate** – After real usage, strengthen steps where the agent struggles.

## Writing Principles

- **Concise** – Only add what the agent doesn't already know.
- **Imperative** – "Analyze the input" not "You should analyze the input."
- **Match freedom to fragility** – Narrow bridge → specific guardrails; open field → many routes.
- **Progressive disclosure** – Essential in SKILL.md; detail in references, loaded when needed.

## Description Best Practices

- Third person; specific; include both WHAT and WHEN.
- Put trigger keywords and usage scenarios in the **description** (body loads after trigger).
- Bad: "A tool for X." Good: "Processes Excel files and generates reports. Use when working with .xlsx, spreadsheets, or when the user asks for report generation."

## Anti-Patterns to Avoid

- One massive SKILL.md (>500 lines).
- Vague description; no workflow (agent freestyles).
- No confirmation gates before destructive/generative steps.
- Vague checks like "ensure good quality" instead of "no TODO/FIXME remaining."
- "When to Use" only in body instead of in description.
- Windows-style paths (use `scripts/helper.py` not `scripts\helper.py`).

## Pre-Delivery Checklist

- SKILL.md under 500 lines; frontmatter has `name` and `description`.
- Description includes trigger keywords and usage scenarios.
- Iron Law or core constraint at top; trackable workflow with markers.
- Confirmation gates before destructive/generative operations.
- Question-style instructions; anti-patterns listed.
- References loaded progressively; scripts tested; references one level deep.

## Reference

For Cursor skill format and storage: personal skills in `~/.cursor/skills/`, project skills in `.cursor/skills/`. See the create-skill guide for full structure and examples.
