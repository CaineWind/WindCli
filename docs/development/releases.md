# Unified Releases

All WindCli desktop, web service and MCP GitHub Release assets are published to `CaineWind/WindCli`.

This is a distribution repository. Product development source, tests, declarations and source maps must not be tracked here. Application source remains in its separate source repository; MCP source is maintained in the private `WindBrowser` development checkout. Public product code must be a compiled/minified Release attachment. Documentation, component licenses and publication automation are permitted in this repository.

| Component | Tag | Asset convention | Latest |
| --- | --- | --- | --- |
| Desktop client | `v<version>` | Installer, updater metadata and matching server bundles | Desktop stable releases only |
| Standalone web service | `web-v<version>` | Platform-specific server bundle and SHA-256 checksums | No |
| WindBrowser MCP | `mcp-v<version>` | npm-installable tarball, Chrome extension ZIP and SHA256SUMS | No |

Desktop server bundles may also accompany the corresponding `v<version>` desktop release because the desktop installer requests that exact version tag. Preserve existing bundle names expected by the installer. MCP and web tags must not replace desktop latest-release metadata. A component release does not imply that other components have been built or released.

GitHub's `/releases/latest` endpoint is not a component filter: before the first desktop release exists it may return the only stable MCP release even when that release was created with `--latest=false`. Publish desktop stable releases with `--latest` and their required updater metadata, and verify the latest endpoint resolves to that desktop tag. MCP and web downloaders must select their explicit component tags rather than the generic latest endpoint.

The existing application source checkout remains separate. Its desktop updater and server bundle download URLs target this repository. When an application GitHub Actions workflow publishes here from another source repository, configure `RELEASE_REPOSITORY_TOKEN` in that source repository with contents-write access to `CaineWind/WindCli`; the source repository's built-in `GITHUB_TOKEN` cannot write to another repository. Release notes must link the original application source commit. This is not required by this repository's own MCP workflow.

## Application Publication

Build the application's version tag in `CaineWind/wind-agent` using its `Release` and
`Desktop Release` workflows. After both succeed, run this repository's
`Application Publication` workflow with the tag and the two source run IDs.
It verifies that both successful push runs match the annotated source tag,
downloads their artifacts, validates updater SHA-512 values, build SHA-256
checksums and server runtime versions, and publishes all assets together as
the latest stable desktop release. It uses this repository's GitHub token for
publication and does not publish to npm. When the source repository is private,
configure `SOURCE_REPOSITORY_READ_TOKEN` with read-only Contents and Actions access
to `CaineWind/wind-agent`. Do not store a broadly scoped local maintainer token.

Maintainers can instead run `scripts/publish-application.mjs` locally with their
existing GitHub CLI authentication, without exporting or uploading any credential.
Set `RELEASE_TAG`, `PACKAGE_RUN`, `DESKTOP_RUN` and `MANIFEST_PARSER_ROOT` (a directory
with `node_modules/js-yaml`) before running it. Local downloads remain under `release/`.
On Windows, PowerShell 7 and curl download artifacts in bounded parallel ranges,
retry failed transfers and retain completed segments for a later retry. The publisher
checks the assembled release files against the original build checksums before publication.

The publisher refuses to modify public releases or overwrite existing assets.
Future application publication also rejects first-party TypeScript, declarations,
source maps and unminified product JavaScript in the CLI/Web package and server
runtime archives. This validation can require changes in the private application's
build pipeline before a new version may be published; it must not be bypassed to
ship development source. Existing legacy releases are not changed automatically.

On 2026-10-18, the source-containing `v1.47.3` release and its tag were retired,
including installers, update metadata, CLI/Web package and desktop server bundles.
Old desktop first-start downloads and update checks may fail until a clean application
release is available. Do not restore the retired archives. The original repository
was moved to a private archive; the public repository at the same URL was recreated
with sanitized distribution history and the verified `mcp-v0.1.1` release only.
Repository identity, Actions run history and release asset IDs changed. Configure
repository-scoped publication tokens against the new repository before using them.

An interrupted draft can resume only when its source commit and every existing
asset's size and GitHub SHA-256 digest match the validated local files. Remaining
assets upload concurrently; remote digests are checked again before publishing.
Source commit and build links are retained in the release notes. Unsigned macOS
builds are available for manual installation; automatic installation requires
Apple code-signing credentials in the application's desktop build workflow.

## MCP Publication

Build and test MCP in the separate `WindBrowser` source directory. Its `release:assets` script bundles/minifies the Node backend, minifies the console and extension, removes development metadata and emits no TypeScript, declarations or source maps. Development source is never checked out by this repository's publication workflow.

```powershell
Set-Location ../WindBrowser
npm ci
npm run typecheck
npm run build
npm test
npm run release:assets
```

Run the actual Chrome extension acceptance against `WindBrowser/release/package` before publication. From the distribution repository, set `RELEASE_TAG=mcp-v<version>`, `MCP_RELEASE_DIR` to the private build output's `release/assets` directory and `MCP_VERIFIER_ROOT` to a directory containing `node_modules/jszip`. Run `node scripts/publish-mcp.mjs` with existing GitHub CLI authentication. `MCP_VALIDATE_ONLY=1` validates locally without publishing. `MCP_DRAFT_ONLY=1` stages a verified draft without publishing it.

The `MCP Publication` workflow can publish a pre-staged draft using its tag as input. It downloads only the draft's prebuilt tarball, extension ZIP and checksums. The publisher checks every checksum, rejects source/development files and non-minified JavaScript, and verifies uploaded GitHub asset digests before publishing. It refuses to overwrite an existing public release. Publish changed artifacts under a new component version. It does not publish to the npm registry.

The tarball contains minified runtime code, console assets, extension, packaged Agent instructions, README and AGPL license. Install it with `npm install --global ./windbrowser-mcp-<version>.tgz`; npm downloads its declared runtime dependencies during installation.

Verify downloads by comparing their SHA-256 values with `SHA256SUMS` from the same release. These checksums detect mismatched or damaged files; they are not independent code-signing attestations.

## Licenses

The root Apache-2.0 license covers the original repository scaffold. WindBrowser's distributable retains its AGPL-3.0-or-later LICENSE. Separating source storage and minifying a distribution do not change the component license or source provision requirements. Preserve component licenses and upstream attribution.
