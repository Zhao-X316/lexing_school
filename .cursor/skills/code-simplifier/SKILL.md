---
name: code-simplifier
description: >-
  Simplifies and refines code for clarity, consistency, and maintainability while
  preserving functionality. Use when user asks to simplify code, refactor for clarity,
  clean up code, improve readability, or when reviewing recently modified code.
---

# Code Simplifier

Adapted from [claude-plugins-official/code-simplifier](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/code-simplifier). Simplifies and refines code for clarity, consistency, and maintainability while preserving exact functionality.

## Core principles

1. **Preserve functionality** – Never change what the code does, only how it does it. All original features, outputs, and behaviors must remain intact.

2. **Apply project standards** – Follow CLAUDE.md, project-spec.mdc, or existing conventions:
   - Module style (ES modules, import order)
   - Function style (function vs arrow)
   - Type annotations where applicable
   - Error handling patterns
   - Naming conventions

3. **Enhance clarity**:
   - Reduce unnecessary complexity and nesting
   - Eliminate redundant code and abstractions
   - Improve readability with clear names
   - Consolidate related logic
   - Remove comments that describe obvious code
   - **Avoid nested ternaries** – prefer switch or if/else for multiple conditions
   - Choose clarity over brevity

4. **Maintain balance** – Avoid over-simplification:
   - Don't create overly clever solutions
   - Don't combine too many concerns
   - Don't remove helpful abstractions
   - Don't prioritize fewer lines over readability
   - Don't make code harder to debug or extend

5. **Focus scope** – Refine only recently modified code unless instructed otherwise.

## Workflow

1. Identify recently modified code (e.g. via `git diff` or user selection)
2. Analyze for improvement opportunities
3. Apply project standards
4. Ensure functionality unchanged
5. Verify refined code is simpler and more maintainable
6. Document only significant changes

## When to apply

- User asks to simplify, refactor, or clean up code
- User mentions readability, maintainability, or code quality
- After implementing a feature, when reviewing for polish
- When code has nested ternaries, dense logic, or unclear structure
