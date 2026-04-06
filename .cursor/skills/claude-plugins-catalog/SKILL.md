---
name: claude-plugins-catalog
description: >-
  References the official Claude Code plugins directory (anthropics/claude-plugins-official).
  Use when users ask about available Claude plugins, which plugin to use, plugin discovery,
  official plugin catalog, or when recommending plugins for specific tasks (LSP, code review,
  skill creation, security, etc.).
---

# Claude Plugins Official Catalog

Quick reference for the [official Claude Code plugins directory](https://github.com/anthropics/claude-plugins-official/tree/main/plugins).

## Source

- **Repository**: [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official)
- **Plugins path**: `plugins/`
- **Install**: `/plugin install {plugin-name}@claude-plugin-directory`

## Plugin categories

### LSP / Language support
| Plugin | Language |
|--------|----------|
| clangd-lsp | C/C++ |
| csharp-lsp | C# |
| gopls-lsp | Go |
| jdtls-lsp | Java |
| kotlin-lsp | Kotlin |
| lua-lsp | Lua |
| php-lsp | PHP |
| pyright-lsp | Python |
| ruby-lsp | Ruby |
| rust-analyzer-lsp | Rust |
| swift-lsp | Swift |
| typescript-lsp | TypeScript/JavaScript |

### Development workflows
| Plugin | Purpose |
|--------|---------|
| agent-sdk-dev | Agent SDK development |
| claude-code-setup | Claude Code environment setup |
| feature-dev | Feature development workflow |
| plugin-dev | Plugin development toolkit (hooks, MCP, structure) |
| skill-creator | Create and improve skills |

### Code quality
| Plugin | Purpose |
|--------|---------|
| code-review | Automated PR review with multi-agent scoring |
| code-simplifier | Code simplification |
| pr-review-toolkit | PR review toolkit |
| security-guidance | Security best practices |

### Output styles
| Plugin | Purpose |
|--------|---------|
| explanatory-output-style | Explanatory output format |
| learning-output-style | Learning-focused output format |

### Other
| Plugin | Purpose |
|--------|---------|
| claude-md-management | Markdown/CLAUDE.md management |
| commit-commands | Commit-related slash commands |
| example-plugin | Reference implementation |
| frontend-design | Frontend design guidance |
| hookify | Hooks and event handling |
| playground | Playground environment |
| ralph-loop | Ralph loop agent |

## When to recommend

- **LSP plugins**: User coding in a specific language (Python → pyright-lsp, Rust → rust-analyzer-lsp, etc.)
- **code-review / pr-review-toolkit**: PR review, code quality checks
- **plugin-dev**: Creating Claude Code plugins, hooks, MCP integration
- **skill-creator**: Creating or improving Cursor/Claude skills
- **security-guidance**: Security-focused code review or guidance
- **claude-md-management**: Managing CLAUDE.md, project memory
- **example-plugin**: Learning plugin structure, reference implementation

## Quick lookup

For full catalog with descriptions and links, see [reference.md](reference.md).

## Related

- Plugin structure and conventions: use `claude-plugins-official` skill
- Cursor skill creation: use `create-skill` or `skill-forge` skill
