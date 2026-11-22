import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'docs/test-case-manifest.json'), 'utf8'));
const expected = data.cases.filter((item) => item.method === 'VITEST-STORE' || item.method === 'PLAYWRIGHT-E2E');
const actual = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(?:test|spec)\.ts$/.test(entry.name)) {
      const text = fs.readFileSync(file, 'utf8');
      const pattern = /\b(?:TC|IT)-[A-Z0-9-]+-\d{3}\b/g;
      const ids = [...text.matchAll(pattern)].map((match) => match[0]);
      for (const id of ids) actual.push({ id, file: path.relative(root, file).replaceAll('\\', '/') });
    }
  }
}
walk(path.join(root, 'tests'));
const missing = expected.filter((item) => !actual.some((x) => x.id === item.id));
const extra = actual.filter((x) => !expected.some((item) => item.id === x.id));
const mismatch = expected.filter((item) => actual.some((x) => x.id === item.id && x.file !== item.file));
const duplicate = actual.filter((item, index) => actual.findIndex((x) => x.id === item.id) !== index);
const countBy = (arr, key) => arr.reduce((acc, item) => ((acc[item[key]] = (acc[item[key]] ?? 0) + 1), acc), {});
console.log('Case methods:', countBy(data.cases,'method'));
console.log(`Code: ${actual.length} defined tests; manifest: ${expected.length} automated cases`);
for (const [label, list] of [['missing', missing], ['extra', extra], ['wrong file', mismatch], ['duplicated', duplicate]]) {
  if (list.length) console.error(`${label}:`, list);
}
if (missing.length || extra.length || mismatch.length || duplicate.length || actual.length !== 53 || data.cases.length !== 68) process.exitCode = 1;
else console.log('PASS: 68 documented = 53 automated + 7 manual + 8 blocked; all automated IDs mapped correctly');
