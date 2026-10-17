# Repository Guidance

This is the unified public release repository for the WindCli desktop client, web service and MCP components. Publish all GitHub Release assets to `CaineWind/WindCli`.

Use PowerShell 7 (`pwsh`) for Windows commands. Keep source, credentials and user data separate. Never commit `.env`, tokens, databases, browser profiles, node_modules, logs or local runtime state.

MCP source lives in `packages/windbrowser-mcp/` and uses its own AGPL-3.0-or-later license. Do not replace its license with the scaffold's root license. Release conventions and validation are in `docs/development/releases.md`.

Use `mcp-v<version>` tags for MCP releases and `v<version>` for desktop releases. MCP releases must use `--latest=false` to avoid replacing desktop update feeds. Do not publish to npm automatically. Never overwrite a published release asset or reuse an existing version for changed content.

Keep documentation under `docs/`, generated release files under `release/`, retained screenshots under `artifacts/screenshots/` and disposable files under `.tmp/`.
