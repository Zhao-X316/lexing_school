---
name: claude-md-management
description: >-
  Audits and improves CLAUDE.md (and .cursor rules) files; captures session
  learnings into project memory. Use when the user asks to check, audit,
  update, improve, or fix CLAUDE.md; to capture what was learned this session;
  or mentions "project memory", "CLAUDE.md maintenance", or "revise CLAUDE.md".
---

# CLAUDE.md / Project Memory Management

Maintain and improve project context files (CLAUDE.md, .cursor rules) so future sessions have optimal context. Two modes:

| Mode | Purpose | Trigger |
|------|---------|--------|
| **Audit & improve** | Align CLAUDE.md with current codebase | "audit my CLAUDE.md", "check if CLAUDE.md is up to date" |
| **Capture session** | Write learnings from this session | "revise CLAUDE.md", "add what we learned to CLAUDE.md" |

**This skill can write to CLAUDE.md and project docs.** For audit mode, output a quality report first and get user approval before editing.

---

## Mode A: Audit & Improve CLAUDE.md

### 1. Discovery

Find all project-memory files:

- `CLAUDE.md`, `.claude.md`, `.claude.local.md` (Claude Code)
- `.cursor/rules/*.mdc` or project rules (Cursor)

Locations that matter:

| Type | Location | Purpose |
|------|----------|---------|
| Project root | `./CLAUDE.md` | Primary context (shared, in git) |
| Local | `./.claude.local.md` | Personal overrides (gitignored) |
| Cursor | `.cursor/rules/` | Cursor-specific rules |
| Monorepo | `./packages/*/CLAUDE.md` | Package-level context |

### 2. Quality assessment

For each file, score against criteria. See [references/quality-criteria.md](references/quality-criteria.md) for rubrics.

**Quick checklist:**

| Criterion | Weight | Check |
|-----------|--------|-------|
| Commands/workflows | High | Build/test/deploy commands present? |
| Architecture | High | Codebase structure clear? |
| Non-obvious patterns | Medium | Gotchas and quirks documented? |
| Conciseness | Medium | No filler or obvious info? |
| Currency | High | Matches current codebase? |
| Actionability | High | Instructions copy-paste ready? |

**Grades:** A (90–100), B (70–89), C (50–69), D (30–49), F (0–29).

### 3. Output report first

**Always output the quality report before making any edits.**

```
## CLAUDE.md Quality Report

### Summary
- Files found: X | Average score: X/100 | Needing update: X

### File-by-File

#### 1. ./CLAUDE.md
**Score: XX/100 (Grade: X)**

| Criterion | Score | Notes |
| Commands/workflows | X/20 | ... |
| Architecture | X/20 | ... |
| Non-obvious patterns | X/15 | ... |
| Conciseness | X/15 | ... |
| Currency | X/15 | ... |
| Actionability | X/15 | ... |

**Issues:** [specific problems]
**Recommended additions:** [what to add]
```

### 4. Targeted updates (after approval)

- **Add only useful content:** commands discovered, gotchas, package relationships, test patterns, config quirks.
- **Keep minimal:** no restating the obvious, no generic advice, no one-off fixes.
- **Show diffs** per file: path, exact addition (diff block), one-line reason.

After user approval, apply with the Edit tool; preserve existing structure.

Templates by project type: [references/templates.md](references/templates.md).

---

## Mode B: Capture Session Learnings

Use when the user wants to record what was learned this session (e.g. "revise CLAUDE.md", "add session learnings").

### 1. Reflect

What would have helped earlier in the session?

- Bash commands used or discovered
- Code style patterns followed
- Testing approaches that worked
- Env/config quirks
- Warnings or gotchas

### 2. Choose target file

- `CLAUDE.md` → team-shared (in git)
- `.claude.local.md` → personal only (gitignored)

### 3. Draft additions

- One line per concept; CLAUDE.md is in the prompt—brevity matters.
- Format: `Topic` - `concise fact`.
- Avoid: long explanations, obvious info, one-off fixes.

### 4. Propose then apply

Show proposed changes as diffs; ask for approval; only edit files the user approves.

```
### Update: ./CLAUDE.md
**Why:** [one-line reason]
```diff
+ [brief addition]
```
```

---

## Common issues to flag

1. Stale commands (build/test no longer work)
2. Missing dependencies or tools
3. Outdated architecture or file layout
4. Missing env/setup (vars, config)
5. Broken or changed test commands
6. Undocumented gotchas

## What makes a great CLAUDE.md

- Concise, human-readable
- Copy-paste ready commands
- Project-specific patterns, not generic advice
- Non-obvious gotchas and warnings

**Useful sections (only when relevant):** Commands, Architecture, Key Files, Code Style, Environment, Testing, Gotchas, Workflow.

## User tips

- **Keep it concise:** dense is better than verbose.
- **Actionable:** all commands copy-paste ready.
- **`.claude.local.md`:** for personal preferences (add to `.gitignore`).
- **Global defaults:** user-wide preferences in `~/.claude/CLAUDE.md`.
