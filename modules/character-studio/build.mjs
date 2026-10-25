import { build } from 'esbuild';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = import.meta.dirname;
const output = resolve(root, '../../public/character-studio');
await mkdir(output, { recursive: true });
const styles = await readFile(resolve(root, 'client/styles.css'), 'utf8');
const theme = await readFile(resolve(root, 'client/gugu-theme.css'), 'utf8');
await writeFile(resolve(output, 'studio.css'), styles.replace(/:root/g, ':host').replace(/\bbody\s*\{/g, ':host {') + '\n' + theme);
await build({ absWorkingDir: root, entryPoints: ['client/embedded.tsx'], bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true, outfile: resolve(output, 'studio.js'), loader: { '.css': 'text' }, define: { 'process.env.NODE_ENV': '"production"' }, legalComments: 'linked' });
await build({ absWorkingDir: root, entryPoints: ['server/embedded.ts'], bundle: true, format: 'cjs', platform: 'node', target: 'node22', outfile: resolve(root, '../../server/character-studio.cjs'), legalComments: 'linked' });
await copyFile(resolve(root, 'LICENSE'), resolve(output, 'LICENSE.txt'));
const licenses = [];
for (const name of ['react', 'react-dom', 'scheduler', 'hono', '@hono/node-server', 'fflate']) {
  for (const file of ['LICENSE', 'LICENSE.md', 'LICENSE.txt']) {
    try { licenses.push(name + '\n' + await readFile(resolve(root, 'node_modules', name, file), 'utf8')); break; } catch {}
  }
}
await writeFile(resolve(output, 'THIRD-PARTY-NOTICES.txt'), licenses.join('\n\n'));
console.log('Character Studio browser and server bundles built.');
