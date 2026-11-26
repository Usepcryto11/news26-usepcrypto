// news26 entrypoint (Node 22, standard library only): copies the infographic
// entry.png beside this file to /output/entry.png, after validating it is a
// real PNG within the contest limits. Outside the grader's container,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_BYTES = 1048576;
const MAX_SIDE = 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, 'entry.png');
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const target = join(outDir, 'entry.png');

if (!existsSync(source)) {
  throw new Error(`entry.png not found beside main.ts (${source})`);
}

const bytes = readFileSync(source);

if (bytes.length > MAX_BYTES) {
  throw new Error(`entry.png is ${bytes.length} bytes, over the 1 MiB limit`);
}
if (!bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
  throw new Error('entry.png is not a PNG file (bad signature)');
}
if (bytes.length < 33) {
  throw new Error('entry.png is too short to hold a PNG header');
}

const width = bytes.readUInt32BE(16); // IHDR width, big-endian per the PNG spec
const height = bytes.readUInt32BE(20); // IHDR height
if (width > MAX_SIDE || height > MAX_SIDE) {
  throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 limit`);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(target, bytes);

const copied = readFileSync(target);
if (!copied.equals(bytes)) {
  throw new Error('copied entry.png does not match the source byte for byte');
}

console.log(`wrote ${target} (${width}x${height}, ${bytes.length} bytes)`);
