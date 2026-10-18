import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
for (const name of files) {
  const allowed = /^(?:\.github\/|docs\/|scripts\/|(?:README|AGENTS)\.md$|LICENSE$|\.gitignore$)/.test(name);
  assert(allowed && !/\.(?:[cm]?tsx?|map)$/.test(name), `Product development source is forbidden in this distribution repository: ${name}`);
}
console.log(`Distribution repository policy passed (${files.length} documentation/automation files).`);
