# Agent Skills Integration for Supabase

## Installation Location

The `npx skills add supabase/agent-skills` CLI installs skills to **project-scoped `.agents/skills/`** — not to agent-specific config directories (e.g., `~/.hermes/profiles/webdev/skills/`). This is by design for portability across agents (Cursor, Cline, Codex, Amp, Hermes, etc.).

```bash
# Installs to .agents/skills/supabase/ and .agents/skills/supabase-postgres-best-practices/
npx skills add supabase/agent-skills --skill supabase
```

## Making Hermes Auto-Load Project Skills

Symlink from project skills to Hermes profile:

```bash
ln -sf $(pwd)/.agents/skills/supabase ~/.hermes/profiles/webdev/skills/supabase
ln -sf $(pwd)/.agents/skills/supabase-postgres-best-practices ~/.hermes/profiles/webdev/skills/supabase-postgres-best-practices
```

After this, `skill_view(name="supabase")` in Hermes will load the project's skill.

## MCP Connection in Agent Environments

When working inside an agent that exposes `manage_connections` (Hermes, etc.), use programmatic auth instead of `.mcp.json` + OAuth:

```python
# Via manage_connections tool
manage_connections(action="connect", connectors=["supabase"])
```

This opens a connection card the user completes in-browser. Once connected, MCP tools (e.g., `connectors__supabase__BETA_RUN_SQL_QUERY`) are available immediately.

**Prefer this over manual `.mcp.json` setup** when the agent provides `manage_connections`.

## Workflow Summary

1. `npx skills add supabase/agent-skills --skill supabase` (project root)
2. Symlink to agent profile if needed
3. `manage_connections` connect supabase
4. Use MCP `execute_sql` for DDL — REST API cannot run CREATE/ALTER TABLE
5. Verify with `information_schema.columns` and `pg_policies`