import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { auditProductArchive } from './audit-product-archive.mjs';

const source = 'CaineWind/wind-agent';
const destination = 'CaineWind/WindCli';
const tag = process.env.RELEASE_TAG || '';
const packageRun = process.env.PACKAGE_RUN || '';
const desktopRun = process.env.DESKTOP_RUN || '';
assert(/^v\d+\.\d+\.\d+$/.test(tag), 'A stable vX.Y.Z tag is required');
assert(/^\d+$/.test(packageRun) && /^\d+$/.test(desktopRun), 'Numeric source workflow runs are required');
const version = tag.slice(1);
const root = path.resolve('release/application', tag);
fs.mkdirSync(root, { recursive: true });
const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
const sourceGh = (...args) => execFileSync('gh', args, {
  encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
  env: process.env.SOURCE_GH_TOKEN ? { ...process.env, GH_TOKEN: process.env.SOURCE_GH_TOKEN } : process.env,
});
const api = endpoint => JSON.parse(gh('api', endpoint));
const sourceApi = endpoint => JSON.parse(sourceGh('api', endpoint));
let reference = sourceApi(`repos/${source}/git/ref/tags/${tag}`).object;
if (reference.type === 'tag') reference = sourceApi(`repos/${source}/git/tags/${reference.sha}`).object;
assert.equal(reference.type, 'commit');
for (const [runId, workflow] of [[packageRun, 'Release'], [desktopRun, 'Desktop Release']]) {
  let run = sourceApi(`repos/${source}/actions/runs/${runId}`);
  const deadline = Date.now() + 10 * 60 * 1000;
  while (run.status !== 'completed' && Date.now() < deadline) {
    console.log(`Waiting for ${workflow} (${runId}) to complete...`);
    await new Promise(resolve => setTimeout(resolve, 30_000));
    run = sourceApi(`repos/${source}/actions/runs/${runId}`);
  }
  assert.equal(run.name, workflow, `Unexpected workflow for ${runId}`);
  assert.equal(run.head_sha, reference.sha, 'Build must match the annotated source tag');
  assert.equal(run.head_branch, tag, 'Build must use the version tag');
  assert.equal(run.event, 'push');
  assert.equal(run.conclusion, 'success', `Source build ${runId} must succeed first`);
}

for (const [run, name] of [[packageRun, 'application-package'], [desktopRun, 'desktop-macos'], [desktopRun, 'desktop-windows']]) {
  console.log(`Downloading verified ${name} from source run ${run}`);
  if (process.platform === 'win32') {
    execFileSync('pwsh', ['-NoProfile', '-File', 'scripts/download-artifact.ps1', '-Repository', source,
      '-Run', run, '-Name', name, '-Destination', path.join(root, name)], { stdio: 'inherit' });
  } else {
    sourceGh('run', 'download', run, '--repo', source, '--name', name, '--dir', path.join(root, name));
  }
}
const files = ['application-package', 'desktop-macos', 'desktop-windows'].flatMap(directory =>
  fs.readdirSync(path.join(root, directory), { recursive: true, withFileTypes: true }))
  .filter(item => item.isFile())
  .map(item => path.join(item.parentPath, item.name));
const byName = new Map();
for (const file of files) {
  const name = path.basename(file);
  assert(!byName.has(name), `Duplicate release asset ${name}`);
  byName.set(name, file);
}
const hash = (file, algorithm, encoding = 'hex') => new Promise((resolve, reject) => {
  const digest = crypto.createHash(algorithm);
  const stream = fs.createReadStream(file);
  stream.on('data', chunk => digest.update(chunk));
  stream.on('error', reject);
  stream.on('end', () => resolve(digest.digest(encoding)));
});
const require = createRequire(import.meta.url);
const yaml = require(path.join(process.env.MANIFEST_PARSER_ROOT, 'node_modules/js-yaml'));
for (const metadata of ['latest.yml', 'latest-mac.yml']) {
  assert(byName.has(metadata), `Missing ${metadata}`);
  const manifest = yaml.load(fs.readFileSync(byName.get(metadata), 'utf8'));
  assert.equal(manifest.version, version);
  assert(Array.isArray(manifest.files) && manifest.files.length > 0);
  for (const entry of manifest.files) {
    const name = decodeURIComponent(path.basename(entry.url));
    assert(byName.has(name), `Missing updater payload ${name}`);
    assert.equal(await hash(byName.get(name), 'sha512', 'base64'), entry.sha512, `Updater SHA512 mismatch: ${name}`);
    if (entry.size) assert.equal(fs.statSync(byName.get(name)).size, entry.size);
  }
}
assert(byName.has(`wind-agent-cli-${version}.tgz`), 'Missing standalone application package');
for (const suffix of ['.exe', '.dmg', '.zip']) {
  assert([...byName.keys()].some(name => name.endsWith(suffix)), `Missing ${suffix} installer`);
}
const bundles = [...byName.keys()].filter(name => name.startsWith(`cloudcli-local-server-${version}-`) && name.endsWith('.tar.gz'));
assert.equal(bundles.length, 2, 'Both desktop server runtimes are required');
for (const name of [`wind-agent-cli-${version}.tgz`, ...bundles]) auditProductArchive(byName.get(name));
for (const name of bundles) {
  assert(byName.has(`${name}.sha256`), `Missing checksum for ${name}`);
  const checksum = fs.readFileSync(byName.get(`${name}.sha256`), 'utf8').trim().split(/\s+/)[0];
  assert.equal(await hash(byName.get(name), 'sha256'), checksum);
  const metadata = JSON.parse(execFileSync('tar', ['-xOf', byName.get(name), './package.json'], { encoding: 'utf8' }));
  assert.equal(metadata.version, version, `Runtime version mismatch: ${name}`);
}
for (const checksumFile of ['SHA256SUMS-package.txt', 'SHASUMS256-windows.txt', 'SHASUMS256-macos.txt']) {
  assert(byName.has(checksumFile), `Missing build checksums: ${checksumFile}`);
  for (const line of fs.readFileSync(byName.get(checksumFile), 'utf8').trim().split('\n')) {
    const match = /^([a-f0-9]{64})\s+\*?(.+)$/.exec(line.trim());
    assert(match, `Invalid checksum record: ${checksumFile}`);
    const name = path.basename(match[2]);
    assert(byName.has(name), `Checksum refers to missing ${name}`);
    assert.equal(await hash(byName.get(name), 'sha256'), match[1]);
  }
}
const checksumPath = path.join(root, 'SHA256SUMS');
fs.writeFileSync(checksumPath, (await Promise.all([...byName].map(async ([name, file]) => `${await hash(file, 'sha256')}  ${name}`))).join('\n') + '\n');
byName.set('SHA256SUMS', checksumPath);
const changelogResponse = sourceApi(`repos/${source}/contents/CHANGELOG.md?ref=${reference.sha}`);
const changelog = Buffer.from(changelogResponse.content, 'base64').toString('utf8');
const section = changelog.split(/^## /m).find(value => value.startsWith(`${version} `));
assert(section, 'Source changelog must describe this release');
const notesPath = path.join(root, 'release-notes.md');
fs.writeFileSync(notesPath, `## ${section.trim()}\n\nApplication source: https://github.com/${source}/tree/${reference.sha}\n\nPackage validation: https://github.com/${source}/actions/runs/${packageRun}\n\nDesktop builds: https://github.com/${source}/actions/runs/${desktopRun}\n\nDownload the Windows EXE or macOS DMG to install. The standalone service package is wind-agent-cli-${version}.tgz. The local server archives are Electron runtimes downloaded by the matching desktop version. Verify downloads against SHA256SUMS.\n\nDesktop artifacts are unsigned; macOS artifacts are not notarized. macOS automatic installation requires signed releases; use the installer for this unsigned build. Existing installations using the previous release repository may need this installer once to migrate to the unified feed. Managed hosting retains control of deployments.\n`);
const releases = api(`repos/${destination}/releases?per_page=100`);
const existing = releases.find(release => release.tag_name === tag);
if (existing) {
  assert(existing.draft, 'Refusing to modify a published release');
  assert(existing.body.includes(reference.sha), 'Draft must reference this source commit');
  for (const asset of existing.assets) {
    assert(byName.has(asset.name), `Unexpected draft asset: ${asset.name}`);
    assert.equal(asset.state, 'uploaded', `Draft asset is incomplete: ${asset.name}`);
    assert.equal(asset.size, fs.statSync(byName.get(asset.name)).size);
    assert.equal(asset.digest, `sha256:${await hash(byName.get(asset.name), 'sha256')}`,
      `Refusing to overwrite mismatched draft asset: ${asset.name}`);
  }
} else {
  gh('release', 'create', tag, '--repo', destination, '--target', 'main', '--draft', '--title', `WindCli ${tag}`, '--notes-file', notesPath);
}
const uploaded = new Set(existing?.assets.map(asset => asset.name));
const pending = [...byName].filter(([name]) => !uploaded.has(name));
if (pending.length) {
  console.log(`Uploading ${pending.length} validated release assets concurrently`);
  execFileSync('gh', ['release', 'upload', tag, ...pending.map(([, file]) => file), '--repo', destination],
    { stdio: 'inherit' });
}
const draft = api(`repos/${destination}/releases?per_page=100`).find(release => release.tag_name === tag);
assert(draft?.draft && draft.assets.length === byName.size, 'Draft must contain every validated asset');
for (const asset of draft.assets) {
  assert(byName.has(asset.name) && asset.state === 'uploaded', `Unexpected uploaded asset: ${asset.name}`);
  assert.equal(asset.digest, `sha256:${await hash(byName.get(asset.name), 'sha256')}`);
}
gh('release', 'edit', tag, '--repo', destination, '--notes-file', notesPath, '--draft=false', '--latest');
assert.equal(api(`repos/${destination}/releases/latest`).tag_name, tag);
const result = `Published https://github.com/${destination}/releases/tag/${tag} with ${byName.size} validated assets.`;
console.log(result);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, result + '\n');
