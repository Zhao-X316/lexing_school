---
name: openspec
description: >-
  Guides use of OpenSpec (spec-driven development for AI coding). Use when the
  user mentions OpenSpec, /opsx commands, spec-driven development, planning
  before code, change proposals, or creating specs/design/tasks for a feature.
  Covers slash commands, workflows, and project setup.
---

# OpenSpec (Spec-Driven Development)

OpenSpec adds a lightweight spec layer so human and AI agree on what to build before code is written. Philosophy: **fluid not rigid**, **iterative not waterfall**, **easy not complex**.

## Prerequisites

- **Node.js 20.19.0+**
- Install: `npm install -g @fission-ai/openspec@latest`
- In project: `openspec init` (creates `openspec/` and AI guidance; run `openspec update` to refresh)

## Core Commands (Default `core` Profile)

| Command | Purpose |
|---------|---------|
| `/opsx:propose [name-or-description]` | Create a change and generate planning artifacts in one step |
| `/opsx:explore [topic]` | Think through ideas, investigate, clarify requirements (no artifacts) |
| `/opsx:apply [change-name]` | Implement tasks from the change; marks tasks complete in `tasks.md` |
| `/opsx:archive` | Archive completed change (prompts to sync specs if needed) |

**Default flow:** `/opsx:propose` → `/opsx:apply` → `/opsx:archive`

## Expanded Workflow Commands

Enable with `openspec config profile` then `openspec update`. Then available:

| Command | Purpose |
|---------|---------|
| `/opsx:new [change-name]` | Start change scaffold only |
| `/opsx:continue [change-name]` | Create the next artifact (one at a time) |
| `/opsx:ff [change-name]` | Create all planning artifacts at once |
| `/opsx:verify [change-name]` | Validate implementation vs artifacts (completeness, correctness, coherence) |
| `/opsx:sync` | Merge delta specs into main specs |
| `/opsx:bulk-archive` | Archive multiple completed changes |
| `/opsx:onboard` | Guided tutorial through full workflow |

## Artifacts (spec-driven Schema)

Each change lives under `openspec/changes/<change-name>/`:

- **proposal.md** — Why we're doing this, what's changing
- **specs/** — Requirements and scenarios
- **design.md** — Technical approach
- **tasks.md** — Implementation checklist (agent checks off `[x]` as it implements)

Dependency order: `proposal` → `specs` → `design` → `tasks` → implement.

## When to Use What

- **Clear scope, fast path:** `/opsx:propose` then `/opsx:apply`.
- **Unclear requirements:** `/opsx:explore` first, then `/opsx:propose` or `/opsx:new`.
- **Step-by-step control (expanded):** `/opsx:new` → `/opsx:continue` (or `/opsx:ff` if scope is clear) → `/opsx:apply` → `/opsx:verify` → `/opsx:archive`.
- **Parallel changes:** Use `/opsx:apply <change-name>` to target a change; use `/opsx:bulk-archive` when multiple are done.

**Update vs new change:** Update existing when same intent/scope, refined execution, or learning-driven corrections. Start a new change when intent or scope fundamentally changes.

## Project Config (Optional)

`openspec/config.yaml` can set:

- `schema` — Default schema (e.g. `spec-driven`)
- `context` — Project context injected into all artifact instructions (tech stack, conventions)
- `rules` — Per-artifact rules (e.g. `proposal`, `specs`, `design`)

Context and rules are injected into artifact generation; keep context under 50KB.

## Agent Behavior When Using OpenSpec

1. **Propose:** Create `openspec/changes/<name>/`, then generate proposal, specs, design, tasks so the change is ready for apply.
2. **Apply:** Read `tasks.md`, implement tasks one by one, mark completed with `[x]`.
3. **Verify:** Check completeness (all tasks/requirements/scenarios), correctness (matches spec), coherence (design reflected in code); report CRITICAL/WARNING/SUGGESTION.
4. **Archive:** Move change to `openspec/changes/archive/<date>-<name>/`, sync delta specs to main if needed.

Use kebab-case for change names (e.g. `add-dark-mode`, `fix-login-redirect`). Avoid generic names like `update`, `wip`.

## Usage Notes (from OpenSpec)

- Works best with high-reasoning models (e.g. Opus 4.5, GPT 5.2).
- Good context hygiene helps; clear context before starting implementation when appropriate.

## Additional Resources

- Full command reference, config details, and workflow patterns: [reference.md](reference.md)
- Upstream: [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)
