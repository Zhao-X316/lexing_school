---
name: claude-plugins-official
description: >-
  Follows the structure and conventions of the Anthropic Claude Code Plugins
  directory (anthropics/claude-plugins-official). Use when creating or
  modifying Claude Code plugins, writing plugin.json manifests, adding
  skills/commands/agents/MCP config, contributing to the official directory,
  or when the user references Claude plugins, plugin marketplace, or
  claude-plugins-official.
---

# Claude Plugins Official

Guide for working with [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official): directory layout, plugin structure, manifest, and distribution.

## Official directory layout

- **`/plugins`** – Internal plugins by Anthropic. Reference: `plugins/example-plugin`.
- **`/external_plugins`** – Third-party plugins (community/partners). Must meet quality and security bar for approval.

Install from directory: `/plugin install {plugin-name}@claude-plugin-directory` or browse in `/plugin > Discover`.

## Plugin structure (required layout)

All plugin directories must follow this layout. Do not put `commands/`, `agents/`, `skills/`, or `hooks/` inside `.claude-plugin/`; only `plugin.json` lives there.

```
plugin-name/
├── .claude-plugin/
│   └── plugin.json      # Required – plugin metadata
├── .mcp.json            # Optional – MCP server config
├── .lsp.json            # Optional – LSP server config
├── commands/            # Optional – slash commands (markdown)
├── agents/              # Optional – agent definitions
├── skills/              # Optional – skills (SKILL.md per skill)
├── hooks/               # Optional – hooks.json
├── settings.json        # Optional – default settings when enabled
└── README.md            # Recommended – docs
```

## Plugin manifest (`.claude-plugin/plugin.json`)

Required fields:

| Field | Purpose |
|-------|--------|
| `name` | Unique id and skill namespace (e.g. skills become `/name:skill-name`) |
| `description` | Shown in plugin manager |
| `version` | Use semantic versioning for releases |

Optional: `author` (name, email), `homepage`, `repository`, `license`. See [reference.md](reference.md) for full schema.

Example (minimal):

```json
{
  "name": "example-plugin",
  "description": "Short description for the plugin manager",
  "version": "1.0.0",
  "author": { "name": "Your Name" }
}
```

## Components

- **Commands** (`commands/*.md`): User-invoked slash commands. Frontmatter: `description`, optional `argument-hint`, `allowed-tools`.
- **Skills** (`skills/<skill-name>/SKILL.md`): Model-invoked. Frontmatter: `name`, `description`; optional `version`, `disable-model-invocation`.
- **Agents** (`agents/`): Custom agent definitions.
- **MCP** (`.mcp.json`): Key per server; value has `type` (e.g. `http`) and `url` or command config.
- **Hooks** (`hooks/hooks.json`): Event handlers (e.g. PostToolUse) with matchers and commands.

## Trust and security

Anthropic does not control plugin contents (MCP servers, files, etc.). Before installing or using any plugin, ensure it is from a trusted source; see each plugin’s homepage and repo.

## Contributing

- **Internal (Anthropic)**: See `plugins/example-plugin` as the reference implementation.
- **External**: Submit via [plugin directory submission form](https://clau.de/plugin-directory-submission). Plugins must meet quality and security standards.

## Quick checks when editing a plugin

- [ ] `plugin.json` is under `.claude-plugin/` and has `name`, `description`, `version`.
- [ ] No `commands/`, `skills/`, `agents/`, or `hooks/` inside `.claude-plugin/`.
- [ ] Skill folders under `skills/` each contain a `SKILL.md` with `name` and `description` in frontmatter.
- [ ] README documents usage and installation when distributing.

## Additional resources

- Full manifest schema and plugin reference: [reference.md](reference.md)
- Official Claude Code plugin docs: [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins)
- Plugins reference (specs): [code.claude.com/en/plugins-reference](https://code.claude.com/en/plugins-reference)
