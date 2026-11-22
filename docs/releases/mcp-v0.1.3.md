WindBrowser MCP v0.1.3

Standalone browser service, MCP server, Chrome extension (manifest 2.4.5) and packaged Agent instructions.

Changes since 0.1.2:

- Every tab the extension controls shows the agent cursor as its tab icon, so it is clear which tabs an Agent is operating. The page's own icon returns when debugging ends or idles out, and within 90 seconds when Chrome cancels debugging.
- Connection reliability: a replaced extension socket can no longer leave a binding reported as connected while Agents see it offline; extension status checks confirm the connection with the service; heartbeats reject offline sessions. The extension recovers after service restarts, extension upgrades and Chrome restarts without a new pairing code.
- The only paired Chrome becomes the default browser, and tool failures report the real error instead of a generic message.

Install with `npx -y windbrowser-mcp@0.1.3 mcp` or `npm install --global windbrowser-mcp@0.1.3`. The attached tarball can also be installed directly with `npm install --global ./windbrowser-mcp-0.1.3.tgz`. Verify downloads against the attached `SHA256SUMS` first. Extract the extension ZIP and load it in Chrome's extensions page, then connect using a one-time pairing code from the console.

Validation: typecheck, build, 35 protocol and session tests, 44 extension tests, and real Chromium extension acceptance against the minified distribution (controlled-tab icon, binary file upload, mobile emulation, authenticated remote support, desktop and mobile console layouts). The lifecycle acceptance (service restart, extension upgrade, Chrome restart, revocation and re-pair) passed; it intermittently fails one readiness check right after a service restart, also with the 0.1.2-era extension, which is tracked separately. The archive audit rejects development source, declarations, source maps and unminified JavaScript.

This component release is bundled by WindAgent 1.50.2. Component licensing remains AGPL-3.0-or-later; see the included LICENSE.
