# OpenSpec Reference

Detailed reference for the OpenSpec skill. See [SKILL.md](SKILL.md) for quick start and command summary.

## Command Syntax and Behavior

### `/opsx:propose [change-name-or-description]`

- Creates `openspec/changes/<name>/` and generates all planning artifacts (proposal, specs, design, tasks).
- Argument: optional kebab-case name or plain-language description.
- Stops when ready for `/opsx:apply`.

### `/opsx:explore [topic]`

- No artifacts created. Opens exploratory conversation; can investigate codebase, compare options, create diagrams.
- When insights crystallize, user can run `/opsx:propose` or `/opsx:new` (expanded).

### `/opsx:new [change-name] [--schema <schema-name>]`

- Creates only the change folder and `.openspec.yaml`. First artifact is “ready to create”; use `/opsx:continue` or `/opsx:ff` to generate artifacts.

### `/opsx:continue [change-name]`

- Reads artifact dependency graph, creates the next ready artifact (one at a time). Shows what’s ready vs blocked.

### `/opsx:ff [change-name]`

- Creates all planning artifacts in dependency order. Stops when all apply-required artifacts are complete.

### `/opsx:apply [change-name]`

- Reads `tasks.md`, works through incomplete tasks, writes code, marks tasks `[x]`. Can resume; use `change-name` when multiple changes exist.

### `/opsx:verify [change-name]`

- **Completeness:** All tasks done, requirements implemented, scenarios covered.
- **Correctness:** Implementation matches spec intent, edge cases handled.
- **Coherence:** Design decisions reflected in code, naming consistent.
- Reports CRITICAL / WARNING / SUGGESTION; does not block archive.

### `/opsx:sync`

- Merges delta specs from the change into main specs (e.g. `openspec/specs/`). Archive may prompt to sync.

### `/opsx:archive`

- Moves change to `openspec/changes/archive/<date>-<name>/`. Prompts to sync specs if not done. Can warn on incomplete tasks but does not block.

### `/opsx:bulk-archive`

- Archives multiple completed changes; detects when several touch the same specs and resolves order (e.g. by checking what’s implemented).

## Workflow Patterns (Expanded Mode)

- **Quick feature:** `/opsx:new` → `/opsx:ff` → `/opsx:apply` → `/opsx:verify` → `/opsx:archive`
- **Exploratory:** `/opsx:explore` → `/opsx:new` → `/opsx:continue` (repeated) → `/opsx:apply`
- **Parallel:** Multiple changes with `/opsx:apply <name>`; finish with `/opsx:bulk-archive` when several are done

## Project Config: `openspec/config.yaml`

```yaml
schema: spec-driven

context: |
  Tech stack: TypeScript, React, Node.js
  API conventions: RESTful, JSON responses
  Testing: Vitest, Playwright
  Style: ESLint, Prettier, strict TypeScript

rules:
  proposal:
    - Include rollback plan
    - Identify affected teams
  specs:
    - Use Given/When/Then for scenarios
  design:
    - Include sequence diagrams for complex flows
```

- **Schema precedence:** CLI `--schema` > change `.openspec.yaml` > project config > default `spec-driven`.
- **Context:** Injected into every artifact (wrapped in tags); max 50KB.
- **Rules:** Injected per artifact ID; unknown IDs produce warnings.

## Artifact IDs (spec-driven)

- `proposal` — Change proposal
- `specs` — Specifications
- `design` — Technical design
- `tasks` — Implementation tasks

## Update vs New Change (Summary)

**Update existing:** Same intent, refined execution; scope narrows (e.g. MVP first); learning-driven corrections (codebase or design tweaks).

**New change:** Intent fundamentally different; scope exploded; original change can be “done” standalone; patches would confuse more than clarify.

## Naming and Hygiene

- Change names: descriptive kebab-case (`add-dark-mode`, `fix-login-redirect`). Avoid `update`, `changes`, `wip`.
- One logical unit of work per change. Prefer two changes over “add X and refactor Y” in one.

## Links

- [OpenSpec GitHub](https://github.com/Fission-AI/OpenSpec)
- [OpenSpec Docs](https://github.com/Fission-AI/OpenSpec/tree/main/docs) — getting-started, workflows, commands, cli, concepts, customization
