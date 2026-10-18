# Unified Releases

All WindCli desktop, web service and MCP GitHub Release assets are published to `CaineWind/WindCli`.

| Component | Tag | Asset convention | Latest |
| --- | --- | --- | --- |
| Desktop client | `v<version>` | Installer, updater metadata and matching server bundles | Desktop stable releases only |
| Standalone web service | `web-v<version>` | Platform-specific server bundle and SHA-256 checksums | No |
| WindBrowser MCP | `mcp-v<version>` | npm-installable tarball, Chrome extension ZIP and SHA256SUMS | No |

Desktop server bundles may also accompany the corresponding `v<version>` desktop release because the desktop installer requests that exact version tag. Preserve existing bundle names expected by the installer. MCP and web tags must not replace desktop latest-release metadata. A component release does not imply that other components have been built or released.

GitHub's `/releases/latest` endpoint is not a component filter: before the first desktop release exists it may return the only stable MCP release even when that release was created with `--latest=false`. Publish desktop stable releases with `--latest` and their required updater metadata, and verify the latest endpoint resolves to that desktop tag. MCP and web downloaders must select their explicit component tags rather than the generic latest endpoint.

The existing application source checkout remains separate. Its desktop updater and server bundle download URLs target this repository. When an application GitHub Actions workflow publishes here from another source repository, configure `RELEASE_REPOSITORY_TOKEN` in that source repository with contents-write access to `CaineWind/WindCli`; the source repository's built-in `GITHUB_TOKEN` cannot write to another repository. Release notes must link the original application source commit. This is not required by this repository's own MCP workflow.

## Application Publication

Build the application's version tag in `CaineWind/wacli` using its `Release` and
`Desktop Release` workflows. After both succeed, run this repository's
`Application Publication` workflow with the tag and the two source run IDs.
It verifies that both successful push runs match the annotated source tag,
downloads their artifacts, validates updater SHA-512 values, build SHA-256
checksums and server runtime versions, and publishes all assets together as
the latest stable desktop release. It uses this repository's GitHub token and
does not publish to npm or require a stored personal token.

The publisher refuses to modify public releases or overwrite existing assets.
Source commit and build links are retained in the release notes. Unsigned macOS
builds are available for manual installation; automatic installation requires
Apple code-signing credentials in the application's desktop build workflow.

## MCP Publication

The `MCP Release` workflow runs type checking, builds and all protocol/security tests on Windows and Linux. A pushed `mcp-v<version>` tag must match `packages/windbrowser-mcp/package.json`. Release publication waits for both operating systems to pass, rebuilds from the tagged source, packages the npm tarball and extension, and creates a GitHub Release with checksums.

```powershell
Set-Location packages/windbrowser-mcp
npm ci
npm run typecheck
npm run build
npm test
npm run release:assets -- ../../release/mcp
```

Commit reviewed source and version changes, push the main branch, then create and push an annotated `mcp-v<version>` tag. The workflow never publishes to the npm registry and refuses to overwrite an existing GitHub Release. Correct published content by releasing a new version.

Local packaging and the release workflow use the same `scripts/release.mjs`. The tarball contains compiled code, console assets, extension, packaged Agent instructions, README and AGPL license. It excludes tests, node_modules, credentials and runtime data. Install the downloaded tarball with `npm install --global ./windbrowser-mcp-<version>.tgz`; npm downloads its declared dependencies during installation.

Verify downloads by comparing their SHA-256 values with `SHA256SUMS` from the same release. These checksums detect mismatched or damaged files; they are not independent code-signing attestations.

## Licenses

The root Apache-2.0 license covers the original repository scaffold. The extracted WindBrowser source and distributable use the AGPL-3.0-or-later license in `packages/windbrowser-mcp/LICENSE`. Preserve this component license and upstream attribution.
