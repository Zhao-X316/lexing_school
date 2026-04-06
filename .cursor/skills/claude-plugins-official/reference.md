# Claude Plugins Official – Reference

## Plugin manifest schema (plugin.json)

Full set of fields for `.claude-plugin/plugin.json`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique identifier; also the skill/command namespace (e.g. `/my-plugin:hello`) |
| `description` | string | Yes | Shown in plugin manager and discovery |
| `version` | string | Yes | Semantic versioning (e.g. `1.0.0`) |
| `author` | object | No | `name`, optional `email` |
| `homepage` | string | No | URL for plugin homepage |
| `repository` | string | No | URL for source repository |
| `license` | string | No | License identifier |

Version management: use semver for releases. See official docs for upgrade and compatibility behavior.

## Example plugin layout (from official repo)

```
example-plugin/
├── .claude-plugin/
│   └── plugin.json
├── .mcp.json
├── commands/
│   └── example-command.md
├── skills/
│   └── example-skill/
│       └── SKILL.md
└── README.md
```

## MCP config (`.mcp.json`) example

```json
{
  "example-server": {
    "type": "http",
    "url": "https://mcp.example.com/api"
  }
}
```

## Skill frontmatter (SKILL.md)

- `name`: skill name (folder name is used as skill id with plugin namespace).
- `description`: when the agent should use this skill (discovery).
- Optional: `version`, `disable-model-invocation: true`.

## Command frontmatter (commands/*.md)

- `description`: shown in `/help`.
- Optional: `argument-hint` (e.g. `<file>`), `allowed-tools` (list of tool names).

## Official links

- Repo: [github.com/anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official)
- Create plugins: [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins)
- Plugins reference: [code.claude.com/en/plugins-reference](https://code.claude.com/en/plugins-reference)
- Discover/install: [code.claude.com/en/discover-plugins](https://code.claude.com/en/discover-plugins)
- Submit to official marketplace: [platform.claude.com/plugins/submit](https://platform.claude.com/plugins/submit) or [claude.ai/settings/plugins/submit](https://claude.ai/settings/plugins/submit)
