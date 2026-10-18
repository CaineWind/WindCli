import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

export function auditProductArchive(archive) {
  const names = execFileSync('tar', ['-tf', archive], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).trim().split(/\r?\n/);
  for (const name of names) {
    const relative = name.replace(/^(?:\.\/|package\/)/, '');
    if (relative.startsWith('node_modules/')) continue;
    assert(!/\.(?:[cm]?tsx?|map)$/.test(relative), `Development source in product archive: ${relative}`);
    const productCode = /^(?:server|shared|src|electron|release\/dist-server|public\/browser-extension)\//.test(relative);
    if (productCode && relative.endsWith('.js')) {
      const code = execFileSync('tar', ['-xOf', archive, name], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
      assert(!code.includes('sourceMappingURL='), `Source map reference in ${relative}`);
      assert(code.split(/\r?\n/).length < 80, `Unminified product JavaScript: ${relative}`);
    }
  }
  console.log(`Product archive policy passed: ${path.basename(archive)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert(process.argv.length > 2, 'Provide at least one archive');
  for (const archive of process.argv.slice(2)) auditProductArchive(path.resolve(archive));
}
