---
name: code-review-expert
description: Expert code review of current git changes with a senior engineer lens. Covers SOLID, security, performance, error handling, boundary conditions. Use when reviewing pull requests, code changes, or when the user asks for a code review.
---

# Code Review Expert

## Overview

Perform a structured review of the current git changes with focus on SOLID, architecture, removal candidates, and security risks. Default to review-only output unless the user asks to implement changes.

## Severity Levels

| Level | Name | Description | Action |
|-------|------|-------------|--------|
| **P0** | Critical | Security vulnerability, data loss risk, correctness bug | Must block merge |
| **P1** | High | Logic error, significant SOLID violation, performance regression | Should fix before merge |
| **P2** | Medium | Code smell, maintainability concern, minor SOLID violation | Fix in this PR or create follow-up |
| **P3** | Low | Style, naming, minor suggestion | Optional improvement |

## Workflow

### 1) Preflight context

- Use `git status -sb`, `git diff --stat`, and `git diff` to scope changes.
- If needed, use `rg` or `grep` to find related modules, usages, and contracts.
- Identify entry points, ownership boundaries, and critical paths (auth, payments, data writes, network).

**Edge cases:**
- **No changes**: If `git diff` is empty, inform user and ask if they want to review staged changes or a specific commit range.
- **Large diff (>500 lines)**: Summarize by file first, then review in batches by module/feature area.
- **Mixed concerns**: Group findings by logical feature, not just file order.

### 2) SOLID + architecture smells

- Load [references/solid-checklist.md](references/solid-checklist.md) for specific prompts.
- Look for: SRP, OCP, LSP, ISP, DIP violations.
- When proposing a refactor, explain *why* it improves cohesion/coupling and outline a minimal, safe split.
- If refactor is non-trivial, propose an incremental plan instead of a large rewrite.

### 3) Removal candidates + iteration plan

- Load [references/removal-plan.md](references/removal-plan.md) for template.
- Identify code that is unused, redundant, or feature-flagged off.
- Distinguish **safe delete now** vs **defer with plan**.
- Provide a follow-up plan with concrete steps and checkpoints (tests/metrics).

### 4) Security and reliability scan

- Load [references/security-checklist.md](references/security-checklist.md) for coverage.
- Check for: XSS, injection, SSRF, path traversal, AuthZ/AuthN gaps, secret leakage, rate limits, race conditions, unsafe deserialization.
- Call out both **exploitability** and **impact**.

### 5) Code quality scan

- Load [references/code-quality-checklist.md](references/code-quality-checklist.md) for coverage.
- Check for: error handling, performance (N+1, hot paths, caching), boundary conditions (null, empty collections, numeric boundaries).
- Flag issues that may cause silent failures or production incidents.

### 6) Output format

Structure your review as follows:

```markdown
## Code Review Summary

**Files reviewed**: X files, Y lines changed
**Overall assessment**: [APPROVE / REQUEST_CHANGES / COMMENT]

---

## Findings

### P0 - Critical
(none or list)

### P1 - High
1. **[file:line]** Brief title
  - Description of issue
  - Suggested fix

### P2 - Medium
...

### P3 - Low
...

---

## Removal/Iteration Plan
(if applicable)

## Additional Suggestions
(optional improvements, not blocking)
```

For file-specific findings, cite `path/to/file.ts` and line number so the user can jump to the location.

**Clean review**: If no issues found, explicitly state what was checked, any areas not covered, and residual risks or recommended follow-up tests.

### 7) Next steps confirmation

After presenting findings, ask user how to proceed:

- Fix all / Fix P0/P1 only / Fix specific items / No changes

**Important**: Do NOT implement any changes until user explicitly confirms. This is a review-first workflow.

## Resources

| File | Purpose |
|------|---------|
| [references/solid-checklist.md](references/solid-checklist.md) | SOLID smell prompts and refactor heuristics |
| [references/security-checklist.md](references/security-checklist.md) | Web/app security and runtime risk checklist |
| [references/code-quality-checklist.md](references/code-quality-checklist.md) | Error handling, performance, boundary conditions |
| [references/removal-plan.md](references/removal-plan.md) | Template for deletion candidates and follow-up plan |
