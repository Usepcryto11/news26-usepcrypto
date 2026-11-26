// news26 entry runner.
//
// Copies the infographic that sits next to this file (entry.png) into the
// output folder, after checking it is a genuine PNG inside the size limits.
// Node 22, standard library only.

import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_BYTES = 1048576;
const MAX_SIDE = 1024;

function die(reason) {
  console.error(`news26: ${reason}`);
  process.exit(1);
}

function here() {
  return dirname(fileURLToPath(import.meta.url));
}

function readHeader(buf) {
  // A PNG starts with its 8-byte magic, then the IHDR chunk: 4 bytes of
  // length, 4 bytes spelling IHDR, then width and height as big-endian u32.
  if (buf.length < 33) die("entry.png is too short to hold a PNG header");
  if (!buf.subarray(0, 8).equals(PNG_MAGIC)) {
    die("entry.png does not start with the PNG signature");
  }
  if (buf.toString("ascii", 12, 16) !== "IHDR") {
    die("entry.png has no IHDR chunk where the PNG header should be");
  }
  if (buf.readUInt32BE(8) !== 13) {
    die("entry.png has a malformed IHDR chunk (its data is not 13 bytes)");
  }
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function main() {
  const folder = here();
  const source = join(folder, "entry.png");

  let info;
  try {
    info = statSync(source);
  } catch {
    die("entry.png is missing next to main.ts");
  }
  if (info.size > MAX_BYTES) {
    die(`entry.png is ${info.size} bytes, over the ${MAX_BYTES} byte limit`);
  }

  const pixels = readFileSync(source);
  const size = readHeader(pixels);
  if (size.w > MAX_SIDE || size.h > MAX_SIDE) {
    die(`entry.png is ${size.w}x${size.h}, over the ${MAX_SIDE}x${MAX_SIDE} limit`);
  }

  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  mkdirSync(outDir, { recursive: true });
  const target = join(outDir, "entry.png");
  copyFileSync(source, target);

  const written = readFileSync(target);
  if (!written.equals(pixels)) {
    die(`${target} does not match entry.png byte for byte`);
  }

  console.log(
    `Wrote ${target} (${size.w}x${size.h}, ${info.size} bytes)`,
  );
}

main();
