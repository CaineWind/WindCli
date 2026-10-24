# Repository Guidance

This is the unified public release repository for the WindCli desktop client, web service and MCP components. Publish all GitHub Release assets to `CaineWind/WindCli`.

From v1.47.13 the desktop installer embeds its local Agent service. Publish desktop
installers, updater metadata and checksums only for application releases. Standalone
npm application packages and service bundles are retired. WindBrowser MCP retains
its independent mcp-v release convention and distribution.

Use PowerShell 7 (`pwsh`) for Windows commands. Keep source, credentials and user data separate. Never commit `.env`, tokens, databases, browser profiles, node_modules, logs or local runtime state.

This is a distribution repository, not a development source repository. MCP development source lives in the sibling `../WindBrowser` directory. Application source remains in `../wind-cli`. Never add application TypeScript, unminified browser/console code, tests, source maps or declarations here. Keep built/minified product code in Release attachments. Documentation, licenses and publication automation may be tracked here. Preserve component licenses. Release conventions and validation are in `docs/development/releases.md`.

Use `mcp-v<version>` tags for MCP releases and `v<version>` for desktop releases. MCP releases must use `--latest=false` to avoid replacing desktop update feeds. Do not publish to npm automatically. Never overwrite a published release asset or reuse an existing version for changed content.

Keep documentation under `docs/`, generated release files under `release/`, retained screenshots under `artifacts/screenshots/` and disposable files under `.tmp/`.
