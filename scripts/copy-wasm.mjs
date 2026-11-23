import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const srcWasm = path.join(rootDir, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
const publicDir = path.join(rootDir, 'public');
const destWasm = path.join(publicDir, 'sql-wasm.wasm');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

if (fs.existsSync(srcWasm)) {
  fs.copyFileSync(srcWasm, destWasm);
  console.log('[copy-wasm] Berhasil menyalin sql-wasm.wasm ke folder public/');
} else {
  console.warn('[copy-wasm] File sql-wasm.wasm belum ditemukan di node_modules.');
}
