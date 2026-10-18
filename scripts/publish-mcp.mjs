import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const repository = 'CaineWind/WindCli';
const tag = process.env.RELEASE_TAG || '';
assert(/^mcp-v\d+\.\d+\.\d+$/.test(tag), 'An mcp-vX.Y.Z tag is required');
const version = tag.slice(5);
const directory = path.resolve(process.env.MCP_RELEASE_DIR || 'release/mcp');
const names = [`windbrowser-mcp-${version}.tgz`, `windbrowser-extension-${version}.zip`, 'SHA256SUMS'];
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const manifest = fs.readFileSync(path.join(directory, 'SHA256SUMS'), 'utf8').trim().split(/\r?\n/);
assert.equal(manifest.length, 2);
for (const name of names.slice(0, 2)) {
  const lines = manifest.filter(line => line.endsWith(`  ${name}`));
  assert.equal(lines.length, 1);
  assert.equal(lines[0].slice(0, 64), hash(path.join(directory, name)), `Checksum mismatch: ${name}`);
}
const tarball = path.join(directory, names[0]);
const archiveFiles = execFileSync('tar', ['-tf', tarball], { encoding: 'utf8' }).trim().split(/\r?\n/);
const forbidden = /(^|\/)(src|tests|scripts|node_modules)(\/|$)|\.(?:[cm]?ts|map)$/;
for (const name of archiveFiles) assert(name.startsWith('package/') && !name.includes('..') && !forbidden.test(name), `Development file in package: ${name}`);
const read = name => execFileSync('tar', ['-xOf', tarball, `package/${name}`], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const metadata = JSON.parse(read('package.json'));
assert.equal(metadata.name, 'windbrowser-mcp');
assert.equal(metadata.version, version);
assert(!metadata.devDependencies && !metadata.scripts, 'Development metadata must be removed');
assert(archiveFiles.includes('package/LICENSE'));
const checkCode = (name, code) => {
  assert(!/sourceMappingURL=/.test(code), `Source map in ${name}`);
  assert(code.split(/\r?\n/).length < 80, `Unminified JavaScript: ${name}`);
};
for (const name of archiveFiles.filter(name => name.endsWith('.js'))) checkCode(name, read(name.slice(8)));
const require = createRequire(path.join(path.resolve(process.env.MCP_VERIFIER_ROOT || '../WindBrowser'), 'package.json'));
const JSZip = require('jszip');
const zip = await JSZip.loadAsync(fs.readFileSync(path.join(directory, names[1])));
assert(zip.file('manifest.json') && zip.file('background.js') && zip.file('file-transfer.js'));
for (const entry of Object.values(zip.files)) {
  assert(!entry.name.includes('..') && !forbidden.test(entry.name), `Development file in extension: ${entry.name}`);
  if (!entry.dir && entry.name.endsWith('.js')) checkCode(entry.name, await entry.async('string'));
}
console.log(`Validated minified ${tag}: no development source, declarations or source maps.`);
if (process.env.MCP_VALIDATE_ONLY === '1') process.exit(0);
const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
const releases = () => JSON.parse(gh('api', `repos/${repository}/releases?per_page=100`));
const existing = releases().find(release => release.tag_name === tag);
if (existing) {
  assert(existing.draft, 'Refusing to modify a published release');
  for (const asset of existing.assets) {
    assert(names.includes(asset.name) && asset.state === 'uploaded');
    assert.equal(asset.digest, `sha256:${hash(path.join(directory, asset.name))}`);
  }
} else {
  gh('release', 'create', tag, '--repo', repository, '--target', 'main', '--draft', '--title', `WindBrowser MCP v${version}`, '--notes', 'Verified prebuilt and minified distribution.');
}
const uploaded = new Set(existing?.assets.map(asset => asset.name));
const pending = names.filter(name => !uploaded.has(name));
if (pending.length) gh('release', 'upload', tag, ...pending.map(name => path.join(directory, name)), '--repo', repository);
const draft = releases().find(release => release.tag_name === tag);
assert(draft?.draft && draft.assets.length === names.length);
for (const asset of draft.assets) {
  assert(names.includes(asset.name) && asset.state === 'uploaded');
  assert.equal(asset.digest, `sha256:${hash(path.join(directory, asset.name))}`);
}
if (process.env.MCP_DRAFT_ONLY !== '1') gh('release', 'edit', tag, '--repo', repository, '--notes-file', `docs/releases/${tag}.md`, '--draft=false', '--latest=false');
console.log(`https://github.com/${repository}/releases/tag/${tag}`);
